import * as errors from "@superbuilders/errors"
import { eq } from "drizzle-orm"
import type { Logger } from "inngest"
import { db } from "../../db/client"
import { authoredAssessmentItems, templates } from "../../db/schema/index"
import { inngest } from "../client"

function isPlainRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function arraysEqual(a: string[], b: string[]): boolean {
	if (a.length !== b.length) {
		return false
	}
	return a.every((value, index) => value === b[index])
}

type TemplateGenerationResult = {
	status: "already-exists" | "created"
	allowedWidgets: string[]
}

async function performTemplateGeneration({
	templateId,
	authoredItemId,
	logger
}: {
	templateId: string
	authoredItemId: string
	logger: Logger
}): Promise<TemplateGenerationResult> {
	const authoredItemResult = await db
		.select()
		.from(authoredAssessmentItems)
		.where(eq(authoredAssessmentItems.id, authoredItemId))
		.limit(1)

	const authoredItem = authoredItemResult[0]
	if (!authoredItem) {
		logger.error("missing authored item for template generation", {
			templateId,
			authoredItemId
		})
		throw errors.new(`authored item not found: ${authoredItemId}`)
	}

	const rawBody = authoredItem.body
	if (!isPlainRecord(rawBody)) {
		logger.error("structured item body invalid", {
			templateId,
			authoredItemId
		})
		throw errors.new("structured item body must be a JSON object")
	}

	const allowedWidgetsSet = new Set<string>()
	if (isPlainRecord(rawBody.widgets)) {
		for (const rawEntry of Object.values(rawBody.widgets)) {
			if (isPlainRecord(rawEntry) && typeof rawEntry.type === "string") {
				allowedWidgetsSet.add(rawEntry.type)
			}
		}
	}

	const allowedWidgets = Array.from(allowedWidgetsSet).sort()
	logger.debug("extracted allowed widgets", {
		templateId,
		authoredItemId,
		allowedWidgets
	})

	const templateResult = await db
		.select()
		.from(templates)
		.where(eq(templates.id, templateId))
		.limit(1)

	const existingTemplate = templateResult[0]
	if (existingTemplate) {
		if (existingTemplate.sourceItemId !== authoredItemId) {
			logger.error("template source mismatch", {
				templateId,
				authoredItemId,
				existingSourceItemId: existingTemplate.sourceItemId
			})
			throw errors.new(
				`template ${templateId} exists but belongs to a different authored item`
			)
		}

		const existingAllowed = [...existingTemplate.allowedWidgets].sort()
		if (!arraysEqual(existingAllowed, allowedWidgets)) {
			logger.error("template allowed widgets mismatch", {
				templateId,
				authoredItemId,
				existingAllowed,
				allowedWidgets
			})
			throw errors.new(
				`template ${templateId} exists but allowed widgets have changed`
			)
		}

		logger.info("template already exists and is up to date", { templateId })
		return { status: "already-exists", allowedWidgets }
	}

	logger.debug("creating new template record", {
		templateId,
		authoredItemId
	})
	await db.insert(templates).values({
		id: templateId,
		sourceItemId: authoredItemId,
		allowedWidgets
	})

	return { status: "created", allowedWidgets }
}

export const templateGenerationRequestedFunction = inngest.createFunction(
	{
		id: "template-generation-requested",
		name: "Template Generation Requested",
		idempotency: "event"
	},
	{ event: "template/template.generation.requested" },
	async ({ event, step, logger }) => {
		const { templateId, authoredItemId } = event.data
		logger.info("starting template generation", { templateId, authoredItemId })

		const operationResult = await errors.try(
			performTemplateGeneration({ templateId, authoredItemId, logger })
		)
		if (operationResult.error) {
			const reason = operationResult.error.toString()
			if (reason.trim().length === 0) {
				logger.error("template generation failure missing reason", {
					templateId,
					authoredItemId,
					error: operationResult.error
				})
				throw errors.wrap(
					operationResult.error,
					`template generation ${templateId}: missing reason`
				)
			}
			logger.error("template generation failed", {
				templateId,
				authoredItemId,
				reason,
				error: operationResult.error
			})

			const failureEventResult = await errors.try(
				step.sendEvent("send-failure-event", {
					name: "template/template.generation.failed",
					data: { templateId, reason }
				})
			)
			if (failureEventResult.error) {
				logger.error(
					"template generation failure event emission failed; aborting",
					{
						templateId,
						authoredItemId,
						reason,
						error: failureEventResult.error
					}
				)
				throw errors.wrap(
					failureEventResult.error,
					`template generation failure event ${templateId}`
				)
			}

			logger.error("template generation error; aborting", {
				templateId,
				authoredItemId,
				reason
			})
			throw errors.wrap(
				operationResult.error,
				`generating template ${templateId}`
			)
		}

		const completionEventResult = await errors.try(
			step.sendEvent("send-completion-event", {
				name: "template/template.generation.completed",
				data: { templateId }
			})
		)
		if (completionEventResult.error) {
			logger.error(
				"template generation completion event emission failed; aborting",
				{
					templateId,
					authoredItemId,
					error: completionEventResult.error
				}
			)
			throw errors.wrap(
				completionEventResult.error,
				`template generation completion event ${templateId}`
			)
		}

		logger.info("template generation completed", {
			templateId,
			status: operationResult.data.status
		})
		return {
			templateId,
			status: operationResult.data.status,
			allowedWidgets: operationResult.data.allowedWidgets
		}
	}
)
