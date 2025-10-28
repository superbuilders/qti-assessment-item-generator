import "dotenv/config"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { Config } from "drizzle-kit"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
	logger.error("DATABASE_URL environment variable is required for Drizzle")
	throw errors.new("DATABASE_URL environment variable is required for Drizzle")
}

export default {
	schema: "./db/schema/index.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: databaseUrl
	},
	schemaFilter: ["template"],
	out: "./db/migrations"
} satisfies Config
