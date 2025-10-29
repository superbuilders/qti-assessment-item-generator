import { RDSDataClient } from "@aws-sdk/client-rds-data"
import { drizzle } from "drizzle-orm/aws-data-api/pg"
import { env } from "../env"

const rdsClient = new RDSDataClient({
	region: "us-east-2"
})

export const db = drizzle(rdsClient, {
	database: "postgres",
	resourceArn: env.AWS_RDS_RESOURCE_ARN,
	secretArn: env.AWS_RDS_SECRET_ARN
})
