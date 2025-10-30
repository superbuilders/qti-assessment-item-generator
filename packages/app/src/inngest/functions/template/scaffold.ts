import { createHash } from "node:crypto"
import * as errors from "@superbuilders/errors"
import { eq } from "drizzle-orm"
import type { Logger } from "inngest"
import { parseStructuredInput } from "@/templates/input"
import { allWidgetSchemas } from "@/widgets/registry"
import { db } from "../../../db/client"
import { templates } from "../../../db/schema"
import { inngest } from "../../client"

type ScaffoldResult = { hash: string; allowedWidgets: readonly string[] }

const KNOWN_WIDGET_NAMES = new Set(Object.keys(allWidgetSchemas))

function normalizeAllowedWidgets(
	widgets: readonly string[]
): readonly string[] {
	return [...new Set(widgets)].sort((a, b) => a.localeCompare(b))
}

function validateAllowedWidgets({
	templateId,
	allowedWidgets,
	logger
}: {
	templateId: string
	allowedWidgets: readonly string[]
	logger: Logger
}): void {
	const unknownWidgets = allowedWidgets.filter(
		(widget) => !KNOWN_WIDGET_NAMES.has(widget)
	)
	if (unknownWidgets.length > 0) {
		logger.error("template scaffold rejected unknown widgets", {
			templateId,
			unknownWidgets
		})
		throw errors.new(
			`template ${templateId} references unknown widgets: ${unknownWidgets.join(", ")}`
		)
	}
}

async function performTemplateScaffold({
	templateId,
	exampleAssessmentItemBody,
	logger
}: {
	templateId: string
	exampleAssessmentItemBody: unknown
	logger: Logger
}): Promise<ScaffoldResult> {
	const existingTemplate = await db
		.select({ id: templates.id })
		.from(templates)
		.where(eq(templates.id, templateId))
		.limit(1)

	if (existingTemplate.length > 0) {
		logger.error("template scaffold attempted to overwrite existing template", {
			templateId
		})
		throw errors.new(`template ${templateId} already exists`)
	}

	const stringifiedBody = JSON.stringify(exampleAssessmentItemBody)
	const parsed = parseStructuredInput(logger, stringifiedBody)
	const normalizedWidgets = normalizeAllowedWidgets(parsed.allowedWidgets)

	validateAllowedWidgets({
		templateId,
		allowedWidgets: normalizedWidgets,
		logger
	})

	const hash = createHash("sha256").update(stringifiedBody).digest("hex")

	logger.debug("creating template scaffold", {
		templateId,
		hash,
		allowedWidgetsCount: normalizedWidgets.length
	})

	await db.insert(templates).values({
		id: templateId,
		allowedWidgets: Array.from(normalizedWidgets),
		exampleAssessmentItemBody,
		exampleAssessmentItemHash: hash
	})

	return { hash, allowedWidgets: normalizedWidgets }
}

export const scaffoldTemplateFunction = inngest.createFunction(
	{
		id: "template-scaffold-requested",
		name: "Template Scaffold Requested",
		idempotency: "event",
		concurrency: [{ scope: "fn", key: "event.data.templateId", limit: 1 }]
	},
	{ event: "template/template.scaffold.requested" },
	async ({ event, step, logger }) => {
		const { templateId, exampleAssessmentItemBody } = event.data
		logger.info("starting template scaffold", {
			templateId,
			payloadType: typeof exampleAssessmentItemBody
		})

		const scaffoldResult = await errors.try(
			performTemplateScaffold({
				templateId,
				exampleAssessmentItemBody,
				logger
			})
		)
		if (scaffoldResult.error) {
			const reason = scaffoldResult.error.toString()
			logger.error("template scaffold failed", {
				templateId,
				reason,
				error: scaffoldResult.error
			})

			const failureEventResult = await errors.try(
				step.sendEvent("send-template-scaffold-failed", {
					name: "template/template.scaffold.failed",
					data: { templateId, reason }
				})
			)
			if (failureEventResult.error) {
				logger.error("template scaffold failure event emission failed", {
					templateId,
					reason,
					error: failureEventResult.error
				})
				throw errors.wrap(
					failureEventResult.error,
					`template scaffold failure event ${templateId}`
				)
			}

			logger.error("template scaffold aborting after failure event", {
				templateId,
				reason
			})
			throw errors.wrap(
				scaffoldResult.error,
				`scaffolding template ${templateId}`
			)
		}

		const completionEventResult = await errors.try(
			step.sendEvent("send-template-scaffold-completed", {
				name: "template/template.scaffold.completed",
				data: { templateId }
			})
		)
		if (completionEventResult.error) {
			logger.error("template scaffold completion event emission failed", {
				templateId,
				error: completionEventResult.error
			})
			throw errors.wrap(
				completionEventResult.error,
				`template scaffold completion event ${templateId}`
			)
		}

		logger.info("template scaffold completed", {
			templateId,
			allowedWidgetsCount: scaffoldResult.data.allowedWidgets.length
		})

		return {
			templateId,
			hash: scaffoldResult.data.hash,
			status: "completed" as const
		}
	}
)
