import * as errors from "@superbuilders/errors"
import { desc, eq } from "drizzle-orm"
import type { Logger } from "inngest"
import { db } from "../../../db/client"
import { templateCandidates, templates } from "../../../db/schema"
import { inngest } from "../../client"

type StartGenerationResult = { candidateId: string; version: number }

async function performTemplateGenerationStart({
	templateId,
	logger
}: {
	templateId: string
	logger: Logger
}): Promise<StartGenerationResult> {
	const templateResult = await db
		.select({
			id: templates.id
		})
		.from(templates)
		.where(eq(templates.id, templateId))
		.limit(1)
	const template = templateResult[0]
	if (!template) {
		logger.error("template not found for generation workflow", {
			templateId
		})
		throw errors.new(`template not found: ${templateId}`)
	}

	const latestCandidate = await db
		.select({
			version: templateCandidates.version
		})
		.from(templateCandidates)
		.where(eq(templateCandidates.templateId, templateId))
		.orderBy(desc(templateCandidates.version))
		.limit(1)

	const nextVersion = (latestCandidate[0]?.version ?? 0) + 1

	const insertResult = await errors.try(
		db
			.insert(templateCandidates)
			.values({
				templateId,
				version: nextVersion,
				source: ""
			})
			.returning({ id: templateCandidates.id })
	)
	if (insertResult.error) {
		logger.error("failed to create template candidate", {
			templateId,
			version: nextVersion,
			error: insertResult.error
		})
		throw errors.wrap(insertResult.error, "create template candidate")
	}

	const inserted = insertResult.data[0]
	if (!inserted) {
		logger.error("inserted template candidate missing from result", {
			templateId,
			version: nextVersion
		})
		throw errors.new("failed to create template candidate")
	}

	return { candidateId: inserted.id, version: nextVersion }
}

export const startTemplateGeneration = inngest.createFunction(
	{
		id: "template-generation-start",
		name: "Template Generation - Step 1: Start",
		idempotency: "event",
		concurrency: [{ scope: "fn", key: "event.data.templateId", limit: 1 }]
	},
	{ event: "template/template.generation.requested" },
	async ({ event, step, logger }) => {
		const { templateId } = event.data
		logger.info("starting template generation workflow", { templateId })

		const setupResult = await errors.try<StartGenerationResult>(
			performTemplateGenerationStart({
				templateId,
				logger
			})
		)

		if (setupResult.error) {
			const reason = setupResult.error.toString()
			logger.error("template generation start failed", {
				templateId,
				reason,
				error: setupResult.error
			})

			const failureEventResult = await errors.try(
				step.sendEvent("template-generation-start-failed", {
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

		logger.info("template generation workflow started", {
			templateId,
			candidateId: setupResult.data.candidateId,
			version: setupResult.data.version
		})

		await step.sendEvent("request-candidate-generation", {
			name: "template/candidate.generation.requested",
			data: {
				candidateId: setupResult.data.candidateId,
				templateId,
				iteration: 1
			}
		})

		return {
			status: "workflow-started" as const,
			candidateId: setupResult.data.candidateId,
			version: setupResult.data.version
		}
	}
)
