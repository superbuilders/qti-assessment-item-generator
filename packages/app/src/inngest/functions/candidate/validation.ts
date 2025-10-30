import * as errors from "@superbuilders/errors"
import type { Logger as SlogLogger } from "@superbuilders/slog"
import { eq } from "drizzle-orm"
import type { Logger } from "inngest"
import { typeCheckSource } from "@/templates/type-checker"
import type { TypeScriptDiagnostic } from "@/templates/types"
import {
	validateNoNonNullAssertions,
	validateNoTypeAssertions,
	validateTemplateWidgets
} from "@/templates/widget-validation"
import { db } from "../../../db/client"
import {
	candidateDiagnostics,
	templateCandidates,
	templates
} from "../../../db/schema"
import { inngest } from "../../client"

const MAX_RETRIES = 10

export const validateTemplateCandidate = inngest.createFunction(
	{
		id: "template-candidate-validation",
		name: "Template Generation - Step 3: Validate Candidate",
		idempotency: "event",
		concurrency: [{ scope: "fn", key: "event.data.templateId", limit: 1 }]
	},
	{ event: "template/candidate.validation.requested" },
	async ({ event, step, logger }) => {
		const { candidateId, templateId, iteration } = event.data
		logger.info("validating template candidate", { candidateId, iteration })

		const evaluationResult = await errors.try(
			performCandidateEvaluation({
				candidateId,
				templateId,
				logger
			})
		)

		if (evaluationResult.error) {
			const reason = evaluationResult.error.toString()
			logger.error("template candidate validation failed", {
				candidateId,
				templateId,
				iteration,
				reason,
				error: evaluationResult.error
			})

			const failureEventResult = await errors.try(
				step.sendEvent("template-candidate-validation-failed", {
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

		const diagnostics = evaluationResult.data

		await db
			.delete(candidateDiagnostics)
			.where(eq(candidateDiagnostics.candidateId, candidateId))

		if (diagnostics.length === 0) {
			logger.info("candidate validation succeeded", { candidateId })

			await step.sendEvent("notify-generation-complete", {
				name: "template/template.generation.completed",
				data: { templateId }
			})

			return { status: "validation-succeeded" as const }
		}

		logger.warn("candidate validation failed", {
			candidateId,
			diagnosticsCount: diagnostics.length
		})

		await db.insert(candidateDiagnostics).values(
			diagnostics.map((diagnostic) => ({
				candidateId,
				message: diagnostic.message,
				line: diagnostic.line,
				column: diagnostic.column,
				tsCode: diagnostic.tsCode
			}))
		)

		if (iteration >= MAX_RETRIES) {
			logger.error("candidate reached maximum retries", {
				candidateId,
				iteration
			})

			await step.sendEvent("notify-generation-failed", {
				name: "template/template.generation.failed",
				data: {
					templateId,
					reason: `Template generation failed after ${iteration} attempts. See candidate ${candidateId}.`
				}
			})

			return { status: "failed-max-retries" as const }
		}

		const nextIteration = iteration + 1
		logger.info("retrying candidate generation", {
			candidateId,
			iteration: nextIteration
		})

		await step.sendEvent("request-candidate-retry", {
			name: "template/candidate.generation.requested",
			data: {
				candidateId,
				templateId,
				iteration: nextIteration
			}
		})

		return {
			status: "retrying" as const,
			nextIteration
		}
	}
)

async function performCandidateEvaluation({
	candidateId,
	templateId,
	logger
}: {
	candidateId: string
	templateId: string
	logger: Logger
}): Promise<TypeScriptDiagnostic[]> {
	const candidateRecords = await db
		.select({
			source: templateCandidates.source,
			candidateTemplateId: templateCandidates.templateId,
			allowedWidgets: templates.allowedWidgets
		})
		.from(templateCandidates)
		.innerJoin(templates, eq(templates.id, templateCandidates.templateId))
		.where(eq(templateCandidates.id, candidateId))
		.limit(1)

	const candidateRecord = candidateRecords[0]
	if (!candidateRecord) {
		logger.error("candidate not found during validation", { candidateId })
		throw errors.new(`template candidate not found: ${candidateId}`)
	}

	if (candidateRecord.candidateTemplateId !== templateId) {
		logger.error("candidate template mismatch during validation", {
			candidateId,
			expectedTemplateId: templateId,
			actualTemplateId: candidateRecord.candidateTemplateId
		})
		throw errors.new(
			`candidate ${candidateId} belongs to template ${candidateRecord.candidateTemplateId}`
		)
	}

	if (!candidateRecord.source || candidateRecord.source.length === 0) {
		logger.error("candidate has no source to validate", { candidateId })
		throw errors.new(`candidate ${candidateId} has empty source`)
	}

	return collectDiagnostics(
		logger,
		candidateId,
		candidateRecord.source,
		candidateRecord.allowedWidgets
	)
}

async function collectDiagnostics(
	logger: SlogLogger,
	candidateId: string,
	source: string,
	allowedWidgets: readonly string[]
): Promise<TypeScriptDiagnostic[]> {
	const diagnostics = await typeCheckSource(
		logger,
		`/virtual/${candidateId}.ts`,
		source
	)
	if (diagnostics.length > 0) {
		return diagnostics
	}

	const widgetDiagnostic = validateTemplateWidgets(source, allowedWidgets)
	if (widgetDiagnostic) {
		return [widgetDiagnostic]
	}

	const nonNullDiagnostic = validateNoNonNullAssertions(source)
	if (nonNullDiagnostic) {
		return [nonNullDiagnostic]
	}

	const typeAssertionDiagnostic = validateNoTypeAssertions(source)
	if (typeAssertionDiagnostic) {
		return [typeAssertionDiagnostic]
	}

	return []
}
