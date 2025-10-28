import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
	server: {
		DATABASE_URL: z.url(),
		OPENAI_API_KEY: z.string().min(1),
		INNGEST_EVENT_KEY: z.string().min(1),
		INNGEST_SIGNING_KEY: z.string().min(1).optional()
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true
})
