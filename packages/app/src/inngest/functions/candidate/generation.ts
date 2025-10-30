import * as errors from "@superbuilders/errors"
import { eq } from "drizzle-orm"
import type { Logger } from "inngest"
import { createAi, TEMPLATE_GENERATION_MODEL } from "@/templates/ai"
import { runGenerationAttempt } from "@/templates/generation"
import { parseStructuredInput } from "@/templates/input"
import { composeInitialPrompt } from "@/templates/prompts/initial"
import { composeRetryPrompt } from "@/templates/prompts/retry"
import { db } from "../../../db/client"
import {
	candidateDiagnostics,
	templateCandidates,
	templates
} from "../../../db/schema"
import { env } from "../../../env"
import { inngest } from "../../client"

type CandidateGenerationResult = { iteration: number }

async function performCandidateGeneration({
	candidateId,
	templateId,
	iteration,
	logger
}: {
	candidateId: string
	templateId: string
	iteration: number
	logger: Logger
}): Promise<CandidateGenerationResult> {
	const contextRecords = await db
		.select({
			candidateSource: templateCandidates.source,
			candidateTemplateId: templateCandidates.templateId,
			templateAllowedWidgets: templates.allowedWidgets,
			templateExampleBody: templates.exampleAssessmentItemBody
		})
		.from(templateCandidates)
		.innerJoin(templates, eq(templates.id, templateCandidates.templateId))
		.where(eq(templateCandidates.id, candidateId))
		.limit(1)

	const contextRecord = contextRecords[0]
	if (!contextRecord) {
		logger.error("candidate record not found", { candidateId })
		throw errors.new(`template candidate not found: ${candidateId}`)
	}

	if (contextRecord.candidateTemplateId !== templateId) {
		logger.error("candidate template mismatch", {
			candidateId,
			expectedTemplateId: templateId,
			actualTemplateId: contextRecord.candidateTemplateId
		})
		throw errors.new(
			`candidate ${candidateId} belongs to template ${contextRecord.candidateTemplateId}`
		)
	}

	const structuredInput = parseStructuredInput(
		logger,
		JSON.stringify(contextRecord.templateExampleBody)
	)

	const diagnostics = await db
		.select({
			message: candidateDiagnostics.message,
			line: candidateDiagnostics.line,
			column: candidateDiagnostics.column,
			tsCode: candidateDiagnostics.tsCode
		})
		.from(candidateDiagnostics)
		.where(eq(candidateDiagnostics.candidateId, candidateId))

	const sourceContext = structuredInput.sourceContext
	const allowedWidgets = contextRecord.templateAllowedWidgets
	const lastCode = contextRecord.candidateSource
	const lastDiagnostics = diagnostics

	const ai = createAi(logger, env.OPENAI_API_KEY)
	const isRetry =
		lastCode.length > 0 &&
		Array.isArray(lastDiagnostics) &&
		lastDiagnostics.length > 0

	const prompt = isRetry
		? composeRetryPrompt(
				logger,
				allowedWidgets,
				sourceContext,
				lastCode,
				lastDiagnostics
			)
		: composeInitialPrompt(logger, allowedWidgets, sourceContext)

	const generatedCode = await runGenerationAttempt({
		logger,
		ai,
		model: TEMPLATE_GENERATION_MODEL,
		systemPrompt: prompt.systemPrompt,
		userPrompt: prompt.userPrompt
	})

	const updateResult = await errors.try(
		db
			.update(templateCandidates)
			.set({ source: generatedCode })
			.where(eq(templateCandidates.id, candidateId))
	)
	if (updateResult.error) {
		logger.error("failed to update candidate source", {
			candidateId,
			templateId,
			iteration,
			error: updateResult.error
		})
		throw errors.wrap(updateResult.error, "update candidate source")
	}

	return { iteration }
}

export const generateTemplateCandidate = inngest.createFunction(
	{
		id: "template-candidate-generation",
		name: "Template Generation - Step 2: Generate Candidate",
		idempotency: "event",
		concurrency: [
			{ scope: "fn", key: "event.data.templateId", limit: 1 },
			{ limit: 5 }
		]
	},
	{ event: "template/candidate.generation.requested" },
	async ({ event, step, logger }) => {
		const { candidateId, templateId, iteration } = event.data
		logger.info("generating template candidate", { candidateId, iteration })

		const generationResult = await errors.try<CandidateGenerationResult>(
			performCandidateGeneration({
				candidateId,
				templateId,
				iteration,
				logger
			})
		)

		if (generationResult.error) {
			const reason = generationResult.error.toString()
			logger.error("template candidate generation failed", {
				candidateId,
				templateId,
				iteration,
				reason,
				error: generationResult.error
			})

			const failureEventResult = await errors.try(
				step.sendEvent("template-candidate-generation-failed", {
					name: "template/template.generation.failed",
					data: { templateId, reason }
				})
			)
			if (failureEventResult.error) {
				logger.error("template generation failure event emission failed", {
					templateId,
					reason,
					error: failureEventResult.error
				})
				throw errors.wrap(
					failureEventResult.error,
					`template generation failure event ${templateId}`
				)
			}

			return { status: "failed" as const, reason }
		}

		logger.info("candidate generation completed", { candidateId, iteration })

		await step.sendEvent("request-candidate-validation", {
			name: "template/candidate.validation.requested",
			data: { candidateId, templateId, iteration }
		})

		return {
			status: "generation-complete" as const,
			candidateId,
			iteration: generationResult.data.iteration
		}
	}
)
