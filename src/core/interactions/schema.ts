import { CHOICE_IDENTIFIER_REGEX, RESPONSE_IDENTIFIER_REGEX } from "@/compiler/qti-constants"
import { createBlockContentSchema, createInlineContentSchema } from "@/core/content"
import { z } from "zod"
import type { AnyInteraction } from "./types"

// Returns the discriminated union of all interactions scoped to E
export function createAnyInteractionSchema<const E extends readonly string[]>(
	widgetTypeKeys: E
): z.ZodType<AnyInteraction<E>> {
	const InlineSchema = createInlineContentSchema(widgetTypeKeys)
	const BlockSchema = createBlockContentSchema(widgetTypeKeys)

	const InlineChoiceSchema = z
		.object({
			identifier: z
				.string()
				.regex(CHOICE_IDENTIFIER_REGEX, "invalid identifier: must be uppercase")
				.describe("Unique identifier for this inline choice option."),
			content: InlineSchema.describe("The inline content displayed in the dropdown menu.")
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
			prompt: InlineSchema.describe("The question or instruction presented to the user."),
			choices: z
				.array(
					z
						.object({
							identifier: z
								.string()
								.regex(CHOICE_IDENTIFIER_REGEX, "invalid identifier: must be uppercase")
								.describe("Unique identifier for this choice option, used for response matching."),
							content: BlockSchema.describe(
								"Rich content for this choice option, supporting text, math, and embedded widgets."
							)
						})
						.strict()
						.describe("A single choice option with content and optional feedback")
				)
				// Enforce a minimum of 2 choices at the schema level.
				.min(2)
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
			prompt: InlineSchema.describe(
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
							content: BlockSchema.describe("Rich content for this orderable item.")
						})
						.strict()
						.describe("An orderable item with content and optional feedback")
				)
				// Enforce a minimum of 2 choices at the schema level.
				.min(2)
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
			"An interaction where users arrange items in a specific sequence or order. Prompts must specify the sort property and the direction (ascending/descending using 'least to greatest'/'greatest to least')."
		)

	const GapMatchInteractionSchema = z
		.object({
			type: z.literal("gapMatchInteraction").describe("Identifies this as a gap match (drag-and-drop) interaction."),
			responseIdentifier: z
				.string()
				.regex(RESPONSE_IDENTIFIER_REGEX, "invalid response identifier: must start with RESPONSE")
				.describe("Links this interaction to its response declaration for scoring."),
			shuffle: z.boolean().describe("Whether to shuffle the order of gap-text items (draggable tokens)."),
			content: BlockSchema.nullable().describe(
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
							content: InlineSchema.describe("The content of the draggable item (text or math).")
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

	return z
		.discriminatedUnion("type", [
			ChoiceInteractionSchema,
			InlineChoiceInteractionSchema,
			TextEntryInteractionSchema,
			OrderInteractionSchema,
			GapMatchInteractionSchema,
			UnsupportedInteractionSchema
		])
		.describe("A discriminated union representing any possible QTI interaction type supported by the system.")
}
