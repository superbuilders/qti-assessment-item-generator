import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { z } from "zod"
import { compile } from "@/compiler/compiler"
import { FeedbackPlanSchema } from "@/core/feedback"
import type { AssessmentItemInput } from "@/core/item"
import { createDynamicAssessmentItemSchema } from "@/core/item/schema"
import { widgetCollections } from "@/widgets/collections"
import { db } from "../db/client"
import { templateCandidateExecutions, templateCandidates } from "../db/schema"

const executionRoutes = new Hono()
const ExecutionIdSchema = z.uuid()

const widgetCollection = widgetCollections.all
type WidgetKeyTuple = typeof widgetCollection.widgetTypeKeys

executionRoutes.get("/:executionId", async (c) => {
	const executionId = c.req.param("executionId")
	const parsedId = ExecutionIdSchema.safeParse(executionId)
	if (!parsedId.success) {
		logger.error("execution request received invalid id", {
			executionId
		})
		return c.json({ error: "invalid execution id" }, 400)
	}

	const record = await fetchExecutionRecord(parsedId.data)
	if (!record) {
		return c.json({ error: "execution not found" }, 404)
	}

	return c.json({
		id: record.id,
		templateCandidateId: record.templateCandidateId,
		templateId: record.templateId,
		seed: record.seed.toString(),
		createdAt: record.createdAt.toISOString(),
		body: record.body
	})
})

executionRoutes.get("/:executionId/qti", async (c) => {
	const executionId = c.req.param("executionId")
	const parsedId = ExecutionIdSchema.safeParse(executionId)
	if (!parsedId.success) {
		logger.error("execution qti request received invalid id", {
			executionId
		})
		return c.json({ error: "invalid execution id" }, 400)
	}

	const record = await fetchExecutionRecord(parsedId.data)
	if (!record) {
		return c.json({ error: "execution not found" }, 404)
	}

	const parsedItemResult = errors.trySync(() =>
		parseAssessmentItem(record.body, widgetCollection)
	)
	if (parsedItemResult.error) {
		logger.error("execution body failed assessment item validation", {
			executionId: record.id,
			error: parsedItemResult.error
		})
		return c.json({ error: "execution body invalid" }, 500)
	}

	const xmlResult = await errors.try(
		compile(parsedItemResult.data, widgetCollection)
	)
	if (xmlResult.error) {
		logger.error("execution compilation failed", {
			executionId: record.id,
			error: xmlResult.error,
			stack: xmlResult.error instanceof Error ? xmlResult.error.stack : null
		})
		return c.json({ error: "failed to compile assessment item" }, 500)
	}

	return c.newResponse(xmlResult.data, {
		status: 200,
		headers: {
			"Content-Type": "application/xml; charset=utf-8"
		}
	})
})

export { executionRoutes }

type ExecutionRecord = {
	id: string
	templateCandidateId: string
	templateId: string
	seed: bigint
	body: unknown
	createdAt: Date
}

async function fetchExecutionRecord(
	executionId: string
): Promise<ExecutionRecord | null> {
	const rows = await db
		.select({
			id: templateCandidateExecutions.id,
			templateCandidateId: templateCandidateExecutions.templateCandidateId,
			templateId: templateCandidates.templateId,
			seed: templateCandidateExecutions.seed,
			body: templateCandidateExecutions.body,
			createdAt: templateCandidateExecutions.createdAt
		})
		.from(templateCandidateExecutions)
		.innerJoin(
			templateCandidates,
			eq(templateCandidates.id, templateCandidateExecutions.templateCandidateId)
		)
		.where(eq(templateCandidateExecutions.id, executionId))
		.limit(1)

	return rows[0] ?? null
}

function parseAssessmentItem(
	body: unknown,
	collection: typeof widgetCollection
): AssessmentItemInput<WidgetKeyTuple> {
	if (!isPlainRecord(body)) {
		logger.error("execution body not plain record")
		throw errors.new("execution body is not an object")
	}

	if (!isPlainRecord(body.feedbackPlan)) {
		logger.error("execution body missing feedbackPlan", {
			bodyKeys: Object.keys(body)
		})
		throw errors.new("execution feedbackPlan missing")
	}

	const widgetSchemas: Record<string, z.ZodType<unknown>> = {}
	for (const key of collection.widgetTypeKeys) {
		widgetSchemas[key] = collection.widgets[key].schema
	}

	const feedbackPlanResult = FeedbackPlanSchema.safeParse(body.feedbackPlan)
	if (!feedbackPlanResult.success) {
		logger.error("execution feedbackPlan failed validation", {
			errors: feedbackPlanResult.error.flatten()
		})
		throw errors.wrap(
			feedbackPlanResult.error,
			"feedbackPlan validation failed"
		)
	}

	const widgetMapping = deriveWidgetMapping(
		body.widgets,
		collection.widgetTypeKeys
	)

	const schemaResult = errors.trySync(() =>
		createDynamicAssessmentItemSchema(
			widgetMapping,
			collection.widgetTypeKeys,
			widgetSchemas,
			feedbackPlanResult.data
		)
	)
	if (schemaResult.error) {
		logger.error("failed to create dynamic schema for execution body", {
			error: schemaResult.error
		})
		throw errors.wrap(schemaResult.error, "schema creation failure")
	}

	const parsed = schemaResult.data.AssessmentItemSchema.safeParse(body)
	if (!parsed.success) {
		logger.error("execution body failed schema validation", {
			errors: parsed.error.flatten()
		})
		throw errors.wrap(parsed.error, "assessment item validation failed")
	}

	return parsed.data
}

function deriveWidgetMapping(
	widgetsField: unknown,
	allowedWidgetTypes: WidgetKeyTuple
): Record<string, WidgetKeyTuple[number]> {
	if (widgetsField === null || widgetsField === undefined) {
		return {}
	}
	if (!isPlainRecord(widgetsField)) {
		logger.error("widgets field is not a record during mapping derivation")
		throw errors.new("widgets value malformed")
	}

	const mapping: Record<string, WidgetKeyTuple[number]> = {}

	for (const [widgetId, widgetValue] of Object.entries(widgetsField)) {
		if (!isPlainRecord(widgetValue)) {
			logger.error("widget entry missing object data", {
				widgetId
			})
			throw errors.new("widget entry malformed")
		}
		const widgetType = widgetValue.type
		if (typeof widgetType !== "string") {
			logger.error("widget entry missing type", {
				widgetId
			})
			throw errors.new("widget entry missing type")
		}
		if (!isAllowedWidgetType(widgetType, allowedWidgetTypes)) {
			logger.error("widget type not allowed for collection", {
				widgetId,
				widgetType,
				allowedWidgetTypes
			})
			throw errors.new(`widget type '${widgetType}' not allowed`)
		}
		mapping[widgetId] = widgetType
	}

	return mapping
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isAllowedWidgetType(
	value: string,
	allowed: WidgetKeyTuple
): value is WidgetKeyTuple[number] {
	return allowed.some((candidate) => candidate === value)
}
