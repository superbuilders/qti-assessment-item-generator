import { CHOICE_IDENTIFIER_REGEX, RESPONSE_IDENTIFIER_REGEX } from "@/compiler/qti-constants"
import { createBlockContentSchema } from "@/core/content"
import { FeedbackPlanSchema } from "@/core/feedback"
import { createAnyInteractionSchema } from "@/core/interactions"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"
import type { AssessmentItem, AssessmentItemShell, ResponseDeclaration } from "./types"
import type { Widget } from "@/widgets/registry"

// Response Declaration Schema (shared across all dynamic schemas)
function createResponseDeclarationSchema(): z.ZodType<ResponseDeclaration> {
	const BaseResponseDeclarationSchema = z.object({
		identifier: z
			.string()
			.regex(RESPONSE_IDENTIFIER_REGEX, "invalid response identifier: must start with RESPONSE")
			.describe("Unique ID linking an interaction to this response declaration."),
		cardinality: z
			.enum(["single", "multiple", "ordered"])
			.describe("Defines response structure: single value, multiple values, or ordered sequence.")
	})

	const TextualResponseDeclarationSchema = BaseResponseDeclarationSchema.extend({
		baseType: z.enum(["string", "integer", "float"]),
		correct: z.union([z.string(), z.number()]).describe("The single correct answer for a text or numeric entry.")
	}).strict()

	const IdentifierResponseDeclarationSchema = BaseResponseDeclarationSchema.extend({
		baseType: z.literal("identifier"),
		correct: z
			.union([z.string(), z.array(z.string())])
			.describe("The correct identifier(s). For multiple correct answers, provide an array of identifiers.")
	}).strict()

	const DirectedPairResponseDeclarationSchema = BaseResponseDeclarationSchema.extend({
		baseType: z.literal("directedPair"),
		cardinality: z.enum(["multiple", "ordered"]).describe("Gap match always uses multiple or ordered cardinality."),
		correct: z
			.array(
				z.object({
					source: z
						.string()
						.regex(CHOICE_IDENTIFIER_REGEX, "invalid source identifier: must be uppercase")
						.describe("The identifier of the gap-text (draggable item)."),
					target: z
						.string()
						.regex(CHOICE_IDENTIFIER_REGEX, "invalid target identifier: must be uppercase")
						.describe("The identifier of the gap where the item should be placed.")
				})
			)
			.describe("Array of correct source->target pairs for gap match."),
		allowEmpty: z.boolean().describe("If true, an empty response (no items placed) can be correct.")
	}).strict()

	return z
		.discriminatedUnion("baseType", [
			TextualResponseDeclarationSchema,
			IdentifierResponseDeclarationSchema,
			DirectedPairResponseDeclarationSchema
		])
		.describe(
			"Defines the correct answer for an interaction, with a structure that varies based on the response's baseType."
		)
}

export function createAssessmentItemShellSchema<const E extends readonly string[]>(
	widgetTypeKeys: E
): z.ZodType<AssessmentItemShell<E>> {
	const ResponseDeclarationSchema = createResponseDeclarationSchema()

	return z
		.object({
			identifier: z.string().describe("Unique identifier for this assessment item."),
			title: z.string().describe("Human-readable title of the assessment item."),
			responseDeclarations: z
				.array(ResponseDeclarationSchema)
				.describe("Defines correct answers and scoring for all interactions in this item."),
			body: createBlockContentSchema(widgetTypeKeys).nullable().describe("The main content with ref placeholders.")
		})
		.strict()
		.describe("Initial assessment item structure with ref placeholders from the first AI generation shot.")
}

export function createDynamicAssessmentItemSchema<
	const E extends readonly string[],
	T extends Record<E[number], z.ZodType<unknown, unknown>>
>(
	widgetMapping: Record<string, E[number]>,
	widgetTypeKeys: E,
	widgetSchemas: T
) {
	const widgetShape: Record<string, z.ZodType<unknown, unknown>> = {}
	for (const [slotName, widgetType] of Object.entries(widgetMapping)) {
		const schema = widgetSchemas[widgetType]
		if (!schema) {
			logger.error("unknown widget type in mapping", {
				slotName,
				widgetType,
				availableTypes: widgetTypeKeys
			})
			throw errors.new(`unknown widget type specified in mapping: ${widgetType}`)
		}
		widgetShape[slotName] = schema
	}

	const DynamicWidgetsSchema = z.object(widgetShape).describe("Map of widget slot IDs to their widget definitions") as z.ZodType<Record<string, Widget> | null>
	const BlockSchema = createBlockContentSchema(widgetTypeKeys)
	const AnyInteractionSchema = createAnyInteractionSchema(widgetTypeKeys)
	const ResponseDeclarationSchema = createResponseDeclarationSchema()

	const AssessmentItemSchema: z.ZodType<AssessmentItem<E>> = z
		.object({
			identifier: z.string().describe("Unique identifier for this assessment item."),
			title: z.string().describe("Human-readable title of the assessment item."),
			responseDeclarations: z
				.array(ResponseDeclarationSchema)
				.min(1)
				.describe("Defines correct answers and scoring for all interactions in this item."),
			body: BlockSchema.nullable().describe("The main content of the item as structured blocks."),
			widgets: DynamicWidgetsSchema.nullable().describe(
				"A map of widget identifiers to their full widget object definitions."
			),
			interactions: z
				.record(z.string(), AnyInteractionSchema)
				.nullable()
				.describe("A map of interaction identifiers to their full interaction object definitions."),
			feedbackPlan: FeedbackPlanSchema,
			feedbackBlocks: z
				.record(z.string().min(1), BlockSchema)
				.describe("A map of feedback identifiers to their rich content blocks.")
		})
		.strict()
		.describe("A complete QTI 3.0 assessment item with content, interactions, and scoring rules.")

	const AssessmentItemShellSchema = createAssessmentItemShellSchema(widgetTypeKeys)

	return {
		AssessmentItemSchema,
		AnyInteractionSchema,
		AssessmentItemShellSchema
	}
}
