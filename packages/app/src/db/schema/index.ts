import { sql } from "drizzle-orm"
import {
	check,
	foreignKey,
	index,
	integer,
	jsonb,
	bigint as pgBigint,
	pgSchema,
	text,
	timestamp,
	uniqueIndex,
	uuid
} from "drizzle-orm/pg-core"

/**
 * Drizzle schema for the template generation service.
 *
 * The schema currently models the template catalog that powers the generator
 * service. Tables live under the `generator` Postgres schema to keep the
 * application footprint isolated.
 */
export const generatorSchema = pgSchema("template")

export const authoredAssessmentItems = generatorSchema.table(
	"authored_assessment_items",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		hash: text("hash").notNull(),
		body: jsonb("body").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow()
	},
	(table) => [
		uniqueIndex("authored_assessment_items_hash_idx").on(table.hash),
		uniqueIndex("authored_assessment_items_body_idx").on(table.body)
	]
)

export const templates = generatorSchema.table(
	"templates",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		sourceItemId: uuid("source_item_id").notNull(),
		allowedWidgets: text("allowed_widgets").array().notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow()
	},
	(table) => [
		uniqueIndex("templates_source_item_idx").on(table.sourceItemId),
		foreignKey({
			name: "templates_source_item_fk",
			columns: [table.sourceItemId],
			foreignColumns: [authoredAssessmentItems.id]
		})
	]
)

export const templateCandidates = generatorSchema.table(
	"template_candidates",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		templateId: uuid("template_id").notNull(),
		version: integer("version").notNull(),
		source: text("source").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow()
	},
	(table) => [
		uniqueIndex("template_candidates_template_version_idx").on(
			table.templateId,
			table.version
		),
		index("template_candidates_template_created_idx").on(
			table.templateId,
			table.createdAt
		),
		foreignKey({
			name: "template_candidates_template_fk",
			columns: [table.templateId],
			foreignColumns: [templates.id]
		}),
		check("template_candidates_version_positive", sql`${table.version} >= 1`)
	]
)

export const generatedAssessmentItems = generatorSchema.table(
	"generated_assessment_items",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		templateCandidateId: uuid("template_candidate_id").notNull(),
		seed: pgBigint("seed", { mode: "bigint" }).notNull(),
		body: jsonb("body").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow()
	},
	(table) => [
		index("generated_assessment_items_candidate_idx").on(
			table.templateCandidateId
		),
		uniqueIndex("generated_assessment_items_candidate_seed_idx").on(
			table.templateCandidateId,
			table.seed
		),
		foreignKey({
			name: "generated_assessment_items_candidate_fk",
			columns: [table.templateCandidateId],
			foreignColumns: [templateCandidates.id]
		}),
		check(
			"generated_assessment_items_seed_nonnegative",
			sql`${table.seed} >= 0`
		)
	]
)

export const candidateDiagnostics = generatorSchema.table(
	"template_candidate_diagnostics",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		candidateId: uuid("candidate_id").notNull(),
		message: text("message").notNull(),
		line: integer("line").notNull(),
		column: integer("column").notNull(),
		tsCode: integer("ts_code").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow()
	},
	(table) => [
		index("template_candidate_diagnostics_candidate_idx").on(table.candidateId),
		foreignKey({
			name: "template_candidate_diagnostics_candidate_fk",
			columns: [table.candidateId],
			foreignColumns: [templateCandidates.id]
		}),
		check(
			"template_candidate_diagnostics_line_positive",
			sql`${table.line} >= 1`
		),
		check(
			"template_candidate_diagnostics_column_positive",
			sql`${table.column} >= 1`
		),
		check(
			"template_candidate_diagnostics_ts_code_nonnegative",
			sql`${table.tsCode} >= 0`
		)
	]
)

export type AuthoredAssessmentItemRecord =
	typeof authoredAssessmentItems.$inferSelect
export type GeneratedAssessmentItemRecord =
	typeof generatedAssessmentItems.$inferSelect
export type TemplateRecord = typeof templates.$inferSelect
export type TemplateCandidateRecord = typeof templateCandidates.$inferSelect
export type CandidateDiagnosticRecord = typeof candidateDiagnostics.$inferSelect
