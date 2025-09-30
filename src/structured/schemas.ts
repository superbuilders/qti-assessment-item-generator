import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"
import { CHOICE_IDENTIFIER_REGEX, RESPONSE_IDENTIFIER_REGEX } from "../compiler/qti-constants"
import {
	createAssessmentItemShellSchema,
	createBlockContentSchema,
	createDynamicAssessmentItemSchema,
	createInlineContentSchema,
	type FeedbackPlan
} from "../compiler/schemas"
import type { WidgetCollection } from "../widgets/collections/types"
import { typedSchemas } from "../widgets/registry"

/**
 * Helper to build a union of literals without unsafe type assertions.
 * This follows the PRD's requirement to avoid `as` casts for type safety.
 */
function buildLiteralUnion(values: readonly string[]) {
	const literals = values.map((v) => z.literal(v))
	if (literals.length === 0) {
		logger.error("literal union: empty array")
		throw errors.new("cannot build literal union from empty array")
	}
	if (literals.length === 1) {
		return literals[0]
	}
	// Safe because we've checked length >= 2 above
	const first = literals[0]
	const second = literals[1]
	const rest = literals.slice(2)
	const tuple: [z.ZodLiteral<string>, z.ZodLiteral<string>, ...z.ZodLiteral<string>[]] = [first, second, ...rest]
	return z.union(tuple)
}

export function createWidgetTypeEnumFromCollection(collection: WidgetCollection) {
	if (!collection.widgetTypeKeys || collection.widgetTypeKeys.length === 0) {
		logger.error("collection has no widgetTypeKeys", { collection: collection.name })
		throw errors.new(`collection has no widgetTypeKeys: ${collection.name}`)
	}
	return buildLiteralUnion(collection.widgetTypeKeys)
}

/**
 * Creates a dynamic, collection-scoped Zod schema for the AssessmentItemShell.
 */
export function createCollectionScopedShellSchema(collection: WidgetCollection) {
	const ScopedWidgetEnum = createWidgetTypeEnumFromCollection(collection)
	return createAssessmentItemShellSchema(ScopedWidgetEnum)
}

/**
 * Creates a dynamic, collection-scoped Zod schema for generating interaction content.
 *
 * NOTE FOR FUTURE DEVELOPERS:
 * If you add a new interaction type to `src/compiler/schemas.ts`, you MUST also
 * add its corresponding scoped definition here to ensure widgetType validation propagates.
 */
export function createCollectionScopedInteractionSchema(_interactionIds: string[], collection: WidgetCollection) {
	const ScopedWidgetEnum = createWidgetTypeEnumFromCollection(collection)
	const ScopedInlineContentSchema = createInlineContentSchema(ScopedWidgetEnum)
	const ScopedBlockContentSchema = createBlockContentSchema(ScopedWidgetEnum)

	// Rebuild all interaction types with scoped content schemas
	const InlineChoiceSchema = z
		.object({
			identifier: z
				.string()
				.regex(CHOICE_IDENTIFIER_REGEX, "invalid identifier: must be uppercase")
				.describe("Unique identifier for this inline choice option."),
			content: ScopedInlineContentSchema.describe("The inline content displayed in the dropdown menu.")
		})
		.strict()
		.describe("Represents a single option within an inline dropdown choice interaction.")

	const ChoiceInteractionSchema = z
		.object({
			type: z.literal("choiceInteraction").describe("Identifies this as a multiple choice interaction."),
			responseIdentifier: z
				.string()
				.regex(RESPONSE_IDENTIFIER_REGEX, "invalid response identifier: must start with RESPONSE")
				.describe("Links this interaction to its response declaration for scoring."),
			prompt: ScopedInlineContentSchema.describe("The question or instruction presented to the user."),
			choices: z
				.array(
					z
						.object({
							identifier: z
								.string()
								.regex(CHOICE_IDENTIFIER_REGEX, "invalid identifier: must be uppercase")
								.describe("Unique identifier for this choice option, used for response matching."),
							content: ScopedBlockContentSchema.describe(
								"Rich content for this choice option, supporting text, math, and embedded widgets."
							)
						})
						.strict()
						.describe("A single choice option with content")
				)
				.min(1)
				.describe("Array of selectable choice options."),
			shuffle: z.literal(true).describe("Whether to randomize the order of choices. Always true to ensure fairness."),
			minChoices: z.number().int().min(0).describe("The minimum number of choices the user must select."),
			maxChoices: z.number().int().min(1).describe("The maximum number of choices the user can select.")
		})
		.strict()
		.describe("A multiple choice question where users select one or more options from a list.")

	const InlineChoiceInteractionSchema = z
		.object({
			type: z.literal("inlineChoiceInteraction").describe("Identifies this as an inline dropdown interaction."),
			responseIdentifier: z
				.string()
				.regex(RESPONSE_IDENTIFIER_REGEX, "invalid response identifier: must start with RESPONSE")
				.describe("Links this interaction to its response declaration for scoring."),
			choices: z.array(InlineChoiceSchema).min(1).describe("Array of options available in the dropdown menu."),
			shuffle: z.literal(true).describe("Whether to randomize dropdown options. Always true to ensure fairness.")
		})
		.strict()
		.describe("An inline dropdown menu embedded within text, ideal for fill-in-the-blank questions.")

	const TextEntryInteractionSchema = z
		.object({
			type: z.literal("textEntryInteraction").describe("Identifies this as a text input interaction."),
			responseIdentifier: z
				.string()
				.regex(RESPONSE_IDENTIFIER_REGEX, "invalid response identifier: must start with RESPONSE")
				.describe("Links this interaction to its response declaration for scoring."),
			expectedLength: z.number().int().nullable().describe("Optional hint for expected answer length in characters.")
		})
		.strict()
		.describe("A text input field where users type their answer, supporting both short and long responses.")

	const OrderInteractionSchema = z
		.object({
			type: z.literal("orderInteraction").describe("Identifies this as an ordering/sequencing interaction."),
			responseIdentifier: z
				.string()
				.regex(RESPONSE_IDENTIFIER_REGEX, "invalid response identifier: must start with RESPONSE")
				.describe("Links this interaction to its response declaration for scoring."),
			prompt: ScopedInlineContentSchema.describe(
				"Explicit instructions for arranging items that MUST: (1) name the sort property (e.g., density, size, value), (2) state the sort direction using unambiguous phrases like 'least to greatest' or 'greatest to least'."
			),
			choices: z
				.array(
					z
						.object({
							identifier: z
								.string()
								.regex(CHOICE_IDENTIFIER_REGEX, "invalid identifier: must be uppercase")
								.describe("Unique identifier for this choice option, used for response matching."),
							content: ScopedBlockContentSchema.describe("Rich content for this orderable item.")
						})
						.strict()
						.describe("An orderable item with content")
				)
				.min(1)
				.describe("Array of items to be arranged in order."),
			shuffle: z
				.literal(true)
				.describe("Whether to randomize initial order. Always true to ensure varied starting points."),
			orientation: z
				.literal("vertical")
				.describe(
					"Visual layout direction for the orderable items. Only vertical orientation is supported. Prompts MUST include '(top to bottom)'."
				)
		})
		.strict()
		.describe(
			"An interaction where users arrange items in a specific sequence or order. Prompts must specify the sort property and direction."
		)

	const GapMatchInteractionSchema = z
		.object({
			type: z.literal("gapMatchInteraction").describe("Identifies this as a gap match (drag-and-drop) interaction."),
			responseIdentifier: z
				.string()
				.regex(RESPONSE_IDENTIFIER_REGEX, "invalid response identifier: must start with RESPONSE")
				.describe("Links this interaction to its response declaration for scoring."),
			shuffle: z.boolean().describe("Whether to shuffle the order of gap-text items (draggable tokens)."),
			content: ScopedBlockContentSchema.nullable().describe(
				"Optional block content (e.g., <ul>/<li>/<p>) containing sentences with gap placeholders to render inside the interaction."
			),
			gapTexts: z
				.array(
					z
						.object({
							identifier: z
								.string()
								.regex(CHOICE_IDENTIFIER_REGEX, "invalid identifier: must be uppercase")
								.describe("Unique identifier for this draggable item (e.g., WORD_SOLAR)."),
							matchMax: z
								.number()
								.int()
								.min(0)
								.describe("Maximum times this item can be used. 0 = unlimited, 1 = use once only."),
							content: ScopedInlineContentSchema.describe("The content of the draggable item (text or math).")
						})
						.strict()
						.describe("A draggable item that can be placed into gaps")
				)
				.min(1)
				.describe("Array of draggable items that can be placed into gaps."),
			gaps: z
				.array(
					z
						.object({
							identifier: z
								.string()
								.regex(CHOICE_IDENTIFIER_REGEX, "invalid identifier: must be uppercase")
								.describe("Unique identifier for this gap (e.g., GAP_1)."),
							required: z.boolean().nullable().describe("Whether this gap must be filled for a correct response.")
						})
						.strict()
						.describe("A gap definition that appears in the body content")
				)
				.min(1)
				.describe(
					"Array of gap definitions. The gaps themselves appear in body content using { type: 'gap', gapId: 'GAP_1' }."
				)
		})
		.strict()
		.describe(
			"A drag-and-drop interaction where users drag text/terms into gaps within sentences. Gaps are embedded in body content."
		)

	const UnsupportedInteractionSchema = z
		.object({
			type: z
				.literal("unsupportedInteraction")
				.describe("Identifies this as an interaction type that is not supported."),
			perseusType: z.string().describe("The original Perseus widget type that was identified as unsupported."),
			responseIdentifier: z.string().describe("Placeholder for the response identifier from the shell.")
		})
		.strict()
		.describe(
			"A placeholder for Perseus widgets that require interactive features not supported by the QTI schema, such as drawing or graphing."
		)

	const ScopedAnyInteractionSchema = z
		.discriminatedUnion("type", [
			ChoiceInteractionSchema,
			InlineChoiceInteractionSchema,
			TextEntryInteractionSchema,
			OrderInteractionSchema,
			GapMatchInteractionSchema,
			UnsupportedInteractionSchema
		])
		.describe("A discriminated union representing any possible QTI interaction type supported by the system.")

	// Use record to preserve value inference while we enforce required keys at call sites
	return z.record(z.string(), ScopedAnyInteractionSchema)
}

// Import the centralized feedback schema builder
import { createNestedFeedbackZodSchema } from "./feedback-nested-schema"

/**
 * Creates a dynamic, collection-scoped Zod schema for generating feedback content.
 * @deprecated Use createNestedFeedbackZodSchema from feedback-nested-schema.ts instead.
 */
export function createCollectionScopedFeedbackSchema(feedbackPlan: FeedbackPlan, collection: WidgetCollection) {
	// This function now just wraps the new centralized utility.
	return createNestedFeedbackZodSchema(feedbackPlan, collection)
}

/**
 * Creates a collection-scoped schema for the complete AssessmentItemInput
 * to be used for compiler validation
 */
export function createCollectionScopedItemSchema(collection: WidgetCollection) {
	const ScopedWidgetEnum = createWidgetTypeEnumFromCollection(collection)

	// Build a widget mapping that includes all widgets from the collection
	// This is used for the dynamic schema creation
	const widgetMapping: Record<string, keyof typeof typedSchemas> = {}
	for (const key of collection.widgetTypeKeys) {
		if (!(key in typedSchemas)) {
			logger.error("widget type not in registry", { key, collection: collection.name })
			throw errors.new(`widget type '${key}' not found in typedSchemas`)
		}
		// Safe assertion: we verified key exists in typedSchemas above
		widgetMapping[`_placeholder_${key}`] = key as keyof typeof typedSchemas
	}

	const { AssessmentItemSchema } = createDynamicAssessmentItemSchema(widgetMapping, ScopedWidgetEnum)
	return AssessmentItemSchema
}
