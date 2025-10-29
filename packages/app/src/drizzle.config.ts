import "dotenv/config"
import type { Config } from "drizzle-kit"
import { env } from "./env"

export default {
	schema: "./db/schema/index.ts",
	dialect: "postgresql",
	driver: "aws-data-api",
	dbCredentials: {
		database: env.AWS_RDS_DATABASE,
		resourceArn: env.AWS_RDS_RESOURCE_ARN,
		secretArn: env.AWS_RDS_SECRET_ARN
	},
	schemaFilter: ["template"],
	out: "./db/migrations"
} satisfies Config
