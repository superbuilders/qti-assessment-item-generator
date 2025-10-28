import "dotenv/config"
import type { Config } from "drizzle-kit"
import { env } from "./env"

export default {
	schema: "./db/schema/index.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: env.DATABASE_URL
	},
	schemaFilter: ["template"],
	out: "./db/migrations"
} satisfies Config
