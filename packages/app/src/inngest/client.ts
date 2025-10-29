import * as logger from "@superbuilders/slog"
import { EventSchemas, Inngest, type Logger } from "inngest"
import { z } from "zod"
import { env } from "../env"

const authoredAssessmentItemUpsertRequestedSchema = z.object({
	authoredItemId: z.uuid(),
	structuredItem: z.json()
})

const authoredAssessmentItemUpsertCompletedSchema = z.object({
	authoredItemId: z.uuid()
})

const authoredAssessmentItemUpsertFailedSchema = z.object({
	authoredItemId: z.uuid(),
	reason: z.string().min(1)
})

const helloWorldSchema = z.object({
	message: z.string().min(1)
})

const templateGenerationRequestedSchema = z.object({
	templateId: z.uuid(),
	authoredItemId: z.uuid()
})

const templateGenerationCompletedSchema = z.object({
	templateId: z.uuid()
})

const templateGenerationFailedSchema = z.object({
	templateId: z.uuid(),
	reason: z.string().min(1)
})

const questionBatchRequestedSchema = z.object({
	jobId: z.uuid(),
	templateId: z.uuid(),
	desiredCount: z.number().int().min(1)
})

const questionBatchCompletedSchema = z.object({
	jobId: z.uuid(),
	templateId: z.uuid(),
	fulfilledCount: z.number().int().min(0)
})

const questionBatchFailedSchema = z.object({
	jobId: z.uuid(),
	templateId: z.uuid(),
	reason: z.string().min(1)
})

const schema = {
	"template/authored.assessment.item.upsert.requested":
		authoredAssessmentItemUpsertRequestedSchema,
	"template/authored.assessment.item.upsert.completed":
		authoredAssessmentItemUpsertCompletedSchema,
	"template/authored.assessment.item.upsert.failed":
		authoredAssessmentItemUpsertFailedSchema,
	"template/template.generation.requested":
		templateGenerationRequestedSchema,
	"template/template.generation.completed":
		templateGenerationCompletedSchema,
	"template/template.generation.failed":
		templateGenerationFailedSchema,
	"template/question.batch.requested": questionBatchRequestedSchema,
	"template/question.batch.completed": questionBatchCompletedSchema,
	"template/question.batch.failed": questionBatchFailedSchema,
	"template/hello": helloWorldSchema
}

const inngestLogger: Logger = {
	info: logger.info,
	warn: logger.warn,
	error: logger.error,
	debug: logger.debug
}

export const inngest = new Inngest({
	id: "template",
	schemas: new EventSchemas().fromSchema(schema),
	logger: inngestLogger,
	eventKey: env.INNGEST_EVENT_KEY,
	signingKey: env.INNGEST_SIGNING_KEY
})
