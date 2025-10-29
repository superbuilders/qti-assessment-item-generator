import { createEnv } from "@t3-oss/env-core"
import * as dotenv from "dotenv"
import { z } from "zod"

dotenv.config({ path: ".env.local" })

export const env = createEnv({
	server: {
		AWS_RDS_RESOURCE_ARN: z.string().min(1),
		AWS_RDS_SECRET_ARN: z.string().min(1),
		OPENAI_API_KEY: z.string().min(1),
		INNGEST_EVENT_KEY: z.string().min(1).optional(),
		INNGEST_SIGNING_KEY: z.string().min(1).optional()
	},
	runtimeEnv: process.env,
	clientPrefix: "",
	client: {},
	emptyStringAsUndefined: true
})
