import { sql } from "drizzle-orm"
import {
	boolean,
	index,
	integer,
	jsonb,
	bigint as pgBigint,
	pgSchema,
	text,
	timestamp,
	uuid
} from "drizzle-orm/pg-core"

/**
 * Drizzle schema for the template generation service.
 *
 * The schema captures request state, per-iteration execution details,
 * persisted artifacts, and an append-only event log. Tables live under the
 * `generator` Postgres schema to keep the application footprint isolated.
 */
export const generatorSchema = pgSchema("template")

export const generationStatusEnum = generatorSchema.enum("generation_status", [
	"queued",
	"running",
	"succeeded",
	"failed"
])

export const iterationStatusEnum = generatorSchema.enum(
	"generation_iteration_status",
	["success", "typecheck_failed", "validation_failed"]
)

export const generationRequests = generatorSchema.table(
	"generation_requests",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		sourceContext: jsonb("source_context").notNull(),
		allowedWidgets: text("allowed_widgets")
			.array()
			.notNull()
			.default(sql`ARRAY[]::text[]`),
		seed: pgBigint("seed", { mode: "bigint" }).notNull(),
		status: generationStatusEnum("status").notNull().default("queued"),
		debugArtifacts: boolean("debug_artifacts").notNull().default(false),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
	},
	(table) => ({
		statusIdx: index("generation_requests_status_idx").on(table.status),
		createdIdx: index("generation_requests_created_at_idx").on(table.createdAt)
	})
)

export const generationIterations = generatorSchema.table(
	"generation_iterations",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		requestId: uuid("request_id")
			.notNull()
			.references(() => generationRequests.id, { onDelete: "cascade" }),
		iteration: integer("iteration").notNull(),
		prompt: text("prompt"),
		response: text("response"),
		status: iterationStatusEnum("status").notNull(),
		diagnostics: jsonb("diagnostics").notNull().default(sql`'[]'::jsonb`),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow()
	},
	(table) => ({
		requestIterationIdx: index("generation_iterations_request_idx").on(
			table.requestId,
			table.iteration
		)
	})
)

export const templates = generatorSchema.table(
	"templates",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		requestId: uuid("request_id").references(() => generationRequests.id, {
			onDelete: "set null"
		}),
		version: integer("version").notNull().default(1),
		label: text("label"),
		typescript: text("typescript").notNull(),
		widgetTuple: text("widget_tuple")
			.array()
			.notNull()
			.default(sql`ARRAY[]::text[]`),
		metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
	},
	(table) => ({
		requestVersionIdx: index("templates_request_version_idx").on(
			table.requestId,
			table.version
		)
	})
)

export const generationEvents = generatorSchema.table(
	"generation_events",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		requestId: uuid("request_id")
			.notNull()
			.references(() => generationRequests.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		payload: jsonb("payload").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow()
	},
	(table) => ({
		requestIdx: index("generation_events_request_idx").on(
			table.requestId,
			table.createdAt
		)
	})
)

export type GenerationRequest = typeof generationRequests.$inferSelect
export type GenerationIteration = typeof generationIterations.$inferSelect
export type TemplateRecord = typeof templates.$inferSelect
export type GenerationEvent = typeof generationEvents.$inferSelect
