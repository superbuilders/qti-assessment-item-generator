import * as errors from "@superbuilders/errors"
import { eq } from "drizzle-orm"
import { db } from "../../../db/client"
import { templates } from "../../../db/schema"
import { inngest } from "../../client"

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

		const templateResult = await db
			.select({ id: templates.id })
			.from(templates)
			.where(eq(templates.id, templateId))
			.limit(1)

		if (!templateResult[0]) {
			logger.error("template not found for generation workflow", {
				templateId
			})
			const reason = `template not found: ${templateId}`

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

		const requestGenerationEventResult = await errors.try(
			step.sendEvent("request-candidate-generation", {
				name: "template/candidate.generation.requested",
				data: { templateId }
			})
		)
		if (requestGenerationEventResult.error) {
			logger.error("template generation request event emission failed", {
				templateId,
				error: requestGenerationEventResult.error
			})
			throw errors.wrap(
				requestGenerationEventResult.error,
				`template generation request event ${templateId}`
			)
		}

		logger.info("template generation workflow dispatched", { templateId })

		return {
			status: "dispatched" as const
		}
	}
)
