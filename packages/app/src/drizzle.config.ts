import "dotenv/config"
import type { Config } from "drizzle-kit"
import { env } from "./env"

export default {
	schema: "./db/schema/index.ts",
	dialect: "postgresql",
	driver: "aws-data-api",
	dbCredentials: {
		database: "postgres",
		resourceArn: env.AWS_RDS_RESOURCE_ARN,
		secretArn: env.AWS_RDS_SECRET_ARN
	},
	schemaFilter: ["template"],
	out: "./db/migrations"
} satisfies Config
