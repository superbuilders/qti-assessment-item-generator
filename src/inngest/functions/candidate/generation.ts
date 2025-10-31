import * as errors from "@superbuilders/errors"
import { desc, eq, sql } from "drizzle-orm"
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

type GeneratedResult = {
	status: "generated"
	candidateId: string
	attempt: number
	diagnosticsUsed: number
}

type SkippedResult = {
	status: "skipped"
	reason: string
	candidateId?: string
}

type CandidateGenerationResult = GeneratedResult | SkippedResult

async function performCandidateGeneration({
	logger,
	templateId
}: {
	logger: Logger
	templateId: string
}): Promise<CandidateGenerationResult> {
	const templateRecord = await db
		.select({
			allowedWidgets: templates.allowedWidgets,
			exampleAssessmentItemBody: templates.exampleAssessmentItemBody
		})
		.from(templates)
		.where(eq(templates.id, templateId))
		.limit(1)
		.then((rows) => rows[0])

	if (!templateRecord) {
		logger.error("template not found for candidate generation", { templateId })
		throw errors.new(`template not found: ${templateId}`)
	}

	const latestCandidate = await db
		.select({
			id: templateCandidates.id,
			source: templateCandidates.source,
			createdAt: templateCandidates.createdAt,
			validatedAt: templateCandidates.validatedAt
		})
		.from(templateCandidates)
		.where(eq(templateCandidates.templateId, templateId))
		.orderBy(desc(templateCandidates.createdAt))
		.limit(1)
		.then((rows) => rows[0])

	const previousDiagnostics = latestCandidate
		? await db
				.select({
					message: candidateDiagnostics.message,
					line: candidateDiagnostics.line,
					column: candidateDiagnostics.column,
					tsCode: candidateDiagnostics.tsCode
				})
				.from(candidateDiagnostics)
				.where(eq(candidateDiagnostics.candidateId, latestCandidate.id))
				.orderBy(candidateDiagnostics.createdAt)
		: []

	if (latestCandidate?.validatedAt) {
		return {
			status: "skipped",
			reason: "latest candidate already validated; generation not required",
			candidateId: latestCandidate.id
		}
	}

	const attemptResult = await db
		.select({
			total: sql<number>`count(*)`
		})
		.from(templateCandidates)
		.where(eq(templateCandidates.templateId, templateId))
	const attempt = Number(attemptResult[0]?.total ?? 0) + 1

	const structuredInput = parseStructuredInput(
		logger,
		JSON.stringify(templateRecord.exampleAssessmentItemBody)
	)
	const allowedWidgets = templateRecord.allowedWidgets
	const sourceContext = structuredInput.sourceContext

	const ai = createAi(logger, env.OPENAI_API_KEY)
	const isRetry = Boolean(latestCandidate && previousDiagnostics.length > 0)
	const lastSource = latestCandidate?.source ?? ""

	const prompt = isRetry
		? composeRetryPrompt(
				logger,
				allowedWidgets,
				sourceContext,
				lastSource,
				previousDiagnostics
			)
		: composeInitialPrompt(logger, allowedWidgets, sourceContext)

	const generatedCode = await runGenerationAttempt({
		logger,
		ai,
		model: TEMPLATE_GENERATION_MODEL,
		systemPrompt: prompt.systemPrompt,
		userPrompt: prompt.userPrompt
	})

	const insertResult = await errors.try(
		db
			.insert(templateCandidates)
			.values({
				templateId,
				source: generatedCode
			})
			.returning({ id: templateCandidates.id })
	)
	if (insertResult.error) {
		logger.error("failed to insert template candidate", {
			templateId,
			error: insertResult.error
		})
		throw errors.wrap(insertResult.error, "insert template candidate")
	}

	const inserted = insertResult.data[0]
	if (!inserted) {
		logger.error("inserted template candidate missing from result", {
			templateId
		})
		throw errors.new("failed to insert template candidate")
	}

	return {
		status: "generated",
		candidateId: inserted.id,
		attempt,
		diagnosticsUsed: previousDiagnostics.length
	}
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
		const { templateId } = event.data
		logger.info("generating template candidate", { templateId })

		const generationResult = await errors.try(
			performCandidateGeneration({ logger, templateId })
		)

		if (generationResult.error) {
			const reason = generationResult.error.toString()
			logger.error("template candidate generation failed", {
				templateId,
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

		if (generationResult.data.status === "skipped") {
			logger.info("candidate generation skipped", {
				templateId,
				reason: generationResult.data.reason,
				candidateId: generationResult.data.candidateId
			})

			return {
				status: "skipped" as const,
				reason: generationResult.data.reason
			}
		}

		logger.info("candidate generation completed", {
			candidateId: generationResult.data.candidateId,
			templateId,
			attempt: generationResult.data.attempt,
			diagnosticsUsed: generationResult.data.diagnosticsUsed
		})

		await step.sendEvent("request-candidate-validation", {
			name: "template/candidate.validation.requested",
			data: {
				candidateId: generationResult.data.candidateId,
				templateId
			}
		})

		return {
			status: "generation-complete" as const,
			candidateId: generationResult.data.candidateId,
			attempt: generationResult.data.attempt
		}
	}
)
