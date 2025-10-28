import * as logger from "@superbuilders/slog"
import { EventSchemas, Inngest, type Logger } from "inngest"
import { z } from "zod"
import { env } from "../env"

const helloWorldSchema = z.object({
	message: z.string().min(1)
})

const schema = {
	"template/hello": helloWorldSchema
}

export type HelloWorldEvent = z.infer<typeof helloWorldSchema>

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
