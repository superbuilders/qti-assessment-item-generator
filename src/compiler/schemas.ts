import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"
import { MATHML_INNER_PATTERN } from "../utils/mathml"
import { typedSchemas } from "../widgets/registry"
import {
	CHOICE_IDENTIFIER_REGEX,
	FEEDBACK_BLOCK_IDENTIFIER_REGEX,
	RESPONSE_IDENTIFIER_REGEX,
	SLOT_IDENTIFIER_REGEX
} from "./qti-constants"

// LEVEL 2: INLINE CONTENT (for paragraphs, prompts, etc.)
// Factory functions to create fresh schema instances (avoids $ref in JSON Schema)
export function createInlineContentItemSchema(widgetTypeEnum: z.ZodType<string>) {
	return z
		.discriminatedUnion("type", [
			z
				.object({
					type: z.literal("text").describe("Identifies this as plain text content"),
					content: z.string().describe("The actual text content to display")
				})
				.strict()
				.describe("Plain text content that will be rendered as-is"),
			z
				.object({
					type: z.literal("math").describe("Identifies this as mathematical content"),
					mathml: z
						.string()
						.regex(MATHML_INNER_PATTERN, "invalid mathml snippet; must be inner MathML without outer <math> wrapper")
						.describe("Inner MathML markup (no outer <math> element)")
				})
				.strict()
				.describe("Mathematical content represented in MathML format"),
			z
				.object({
					type: z.literal("inlineWidgetRef"),
					widgetId: z
						.string()
						.regex(SLOT_IDENTIFIER_REGEX, "invalid slot identifier: must be lowercase with underscores")
						.describe("Unique identifier that matches a widget key"),
					widgetType: widgetTypeEnum
				})
				.strict()
				.describe("Reference to a generated widget by id, to be rendered inline"),
			z
				.object({
					type: z.literal("inlineInteractionRef"),
					interactionId: z
						.string()
						.regex(SLOT_IDENTIFIER_REGEX, "invalid slot identifier: must be lowercase with underscores")
						.describe("Unique identifier that matches an interaction key")
				})
				.strict()
				.describe("Reference to a compiled interaction by id, to be rendered inline"),
			z
				.object({
					type: z.literal("gap").describe("Identifies this as a gap for gap match interaction"),
					gapId: z
						.string()
						.regex(CHOICE_IDENTIFIER_REGEX, "invalid gap identifier: must be uppercase")
						.describe("References a gap defined in a gapMatchInteraction")
				})
				.strict()
				.describe("A gap placeholder that users can drag items into in a gap match interaction")
		])
		.describe("Union type representing any inline content element")
}

export function createInlineContentSchema(widgetTypeEnum: z.ZodType<string>): z.ZodType<InlineContent> {
    return z
        .array(createInlineContentItemSchema(widgetTypeEnum))
        .describe("Array of inline content items that can be rendered within a paragraph or prompt")
}

// LEVEL 1: BLOCK CONTENT (for body, feedback, choice content, etc.)
// Factory functions for block content
export function createBlockContentItemSchema(widgetTypeEnum: z.ZodType<string>): z.ZodType<BlockContentItem> {
	const InlineSchema = createInlineContentSchema(widgetTypeEnum)
	const TableRichCellSchema = InlineSchema.nullable()
	const TableRichRowSchema = z.array(TableRichCellSchema)

	return z
		.discriminatedUnion("type", [
			z
				.object({
					type: z.literal("paragraph").describe("Identifies this as a paragraph block"),
					content: InlineSchema.describe("The inline content contained within this paragraph")
				})
				.strict()
				.describe("A paragraph block containing inline content"),
			z
				.object({
					type: z.literal("codeBlock").describe("Identifies this as a preformatted code block"),
					code: z.string().describe("Raw code or pseudocode text. Preserve newlines exactly.")
				})
				.strict()
				.describe("A preformatted code block that must be rendered with <pre><code>"),
			z
				.object({
					type: z.literal("unorderedList").describe("Identifies this as an unordered list"),
					items: z.array(InlineSchema).min(1).describe("List items as arrays of inline content")
				})
				.strict()
				.describe("An unordered list with each item rendered as a list item containing a paragraph"),
			z
				.object({
					type: z.literal("orderedList").describe("Identifies this as an ordered list"),
					items: z.array(InlineSchema).min(1).describe("List items as arrays of inline content")
				})
				.strict()
				.describe("An ordered list with each item rendered as a numbered list item containing a paragraph"),
			z
				.object({
					type: z.literal("tableRich"),
					header: z.array(TableRichRowSchema).nullable(),
					rows: z.array(TableRichRowSchema)
				})
				.strict(),
			z
				.object({
					type: z.literal("widgetRef"),
					widgetId: z
						.string()
						.regex(SLOT_IDENTIFIER_REGEX, "invalid slot identifier: must be lowercase with underscores")
						.describe("Unique identifier that matches a widget key"),
					widgetType: widgetTypeEnum
				})
				.strict()
				.describe("Reference to a generated widget by id, to be rendered as a block"),
			z
				.object({
					type: z.literal("interactionRef"),
					interactionId: z
						.string()
						.regex(SLOT_IDENTIFIER_REGEX, "invalid slot identifier: must be lowercase with underscores")
						.describe("Unique identifier that matches an interaction key")
				})
				.strict()
				.describe("Reference to a compiled interaction by id, to be rendered as a block")
		])
        .describe("Union type representing any block-level content element")
}

export function createBlockContentSchema(widgetTypeEnum: z.ZodType<string>): z.ZodType<BlockContent> {
    return z
        .array(createBlockContentItemSchema(widgetTypeEnum))
        .describe("Array of block content items representing the document structure")
}

export function createAssessmentItemShellSchema(widgetTypeEnum: z.ZodType<string>) {
	const ResponseDeclarationSchema = createResponseDeclarationSchema()

	return z
		.object({
			identifier: z.string().describe("Unique identifier for this assessment item."),
			title: z.string().describe("Human-readable title of the assessment item."),
			responseDeclarations: z
				.array(ResponseDeclarationSchema)
				.describe("Defines correct answers and scoring for all interactions in this item."),
			body: createBlockContentSchema(widgetTypeEnum).nullable().describe("The main content with ref placeholders.")
		})
		.strict()
		.describe("Initial assessment item structure with ref placeholders from the first AI generation shot.")
}

// Feedback Plan Schemas (NEW)
export const FeedbackDimensionSchema = z
	.union([
		z
			.object({
				responseIdentifier: z
					.string()
					.regex(RESPONSE_IDENTIFIER_REGEX, "invalid response identifier: must start with RESPONSE"),
				kind: z.literal("enumerated"),
				keys: z.array(z.string()).min(1)
			})
			.strict(),
		z
			.object({
				responseIdentifier: z
					.string()
					.regex(RESPONSE_IDENTIFIER_REGEX, "invalid response identifier: must start with RESPONSE"),
				kind: z.literal("binary")
			})
			.strict()
	])
	.describe("Defines a single dimension for feedback evaluation, linked to a response.")

export const FeedbackCombinationSchema = z
	.object({
		id: z.string().regex(FEEDBACK_BLOCK_IDENTIFIER_REGEX),
		path: z
			.array(
				z
					.object({
						responseIdentifier: z.string().regex(RESPONSE_IDENTIFIER_REGEX),
						key: z.union([
							z.literal("CORRECT"),
							z.literal("INCORRECT"),
							z.string().regex(CHOICE_IDENTIFIER_REGEX)
						])
					})
					.strict()
			)
			.min(1)
	})
	.strict()

export const FeedbackPlanSchema = z
	.object({
		mode: z.union([z.literal("combo"), z.literal("fallback")]).describe("The evaluation mode for feedback."),
		dimensions: z.array(FeedbackDimensionSchema).min(1).describe("Ordered list of dimensions for feedback evaluation."),
		combinations: z.array(FeedbackCombinationSchema).min(1).describe("Explicit mapping from paths to FB identifiers.")
	})
	.strict()
	.describe("The explicit contract for feedback evaluation.")

// Response Declaration Schema (shared across all dynamic schemas)
function createResponseDeclarationSchema() {
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

export function createDynamicAssessmentItemSchema(
	widgetMapping: Record<string, keyof typeof typedSchemas>,
	widgetTypeEnum: z.ZodType<string>
) {
	type WidgetSchema = (typeof typedSchemas)[keyof typeof typedSchemas]
	const widgetShape: Record<string, WidgetSchema> = {}
	for (const [slotName, widgetType] of Object.entries(widgetMapping)) {
		const schema = typedSchemas[widgetType]
		if (schema) {
			widgetShape[slotName] = schema
		} else {
			logger.error("unknown widget type in mapping", {
				slotName,
				widgetType,
				availableTypes: Object.keys(typedSchemas)
			})
			throw errors.new(`unknown widget type specified in mapping: ${widgetType}`)
		}
	}

	const DynamicWidgetsSchema = z.object(widgetShape).describe("Map of widget slot IDs to their widget definitions")
	const InlineSchema = createInlineContentSchema(widgetTypeEnum)
	const BlockSchema = createBlockContentSchema(widgetTypeEnum)

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

	const AnyInteractionSchema = z
		.discriminatedUnion("type", [
			ChoiceInteractionSchema,
			InlineChoiceInteractionSchema,
			TextEntryInteractionSchema,
			OrderInteractionSchema,
			GapMatchInteractionSchema,
			UnsupportedInteractionSchema
		])
		.describe("A discriminated union representing any possible QTI interaction type supported by the system.")

	const ResponseDeclarationSchema = createResponseDeclarationSchema()

	const AssessmentItemSchema = z
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
				.record(
					z.string().regex(FEEDBACK_BLOCK_IDENTIFIER_REGEX, "invalid feedback block identifier"),
					BlockSchema
				)
				.describe("A map of feedback identifiers to their rich content blocks.")
		})
		.strict()
		.describe("A complete QTI 3.0 assessment item with content, interactions, and scoring rules.")

	const AssessmentItemShellSchema = createAssessmentItemShellSchema(widgetTypeEnum)

	return {
		AssessmentItemSchema,
		AnyInteractionSchema,
		AssessmentItemShellSchema
	}
}

// Export only the Widget type and simplified structural types
export type Widget = z.infer<(typeof typedSchemas)[keyof typeof typedSchemas]>

export type InlineContentItem =
	| { type: "text"; content: string }
	| { type: "math"; mathml: string }
	| { type: "inlineWidgetRef"; widgetId: string; widgetType: string }
	| { type: "inlineInteractionRef"; interactionId: string }
	| { type: "gap"; gapId: string }

export type InlineContent = InlineContentItem[]

export type BlockContentItem =
	| { type: "paragraph"; content: InlineContent }
	| { type: "codeBlock"; code: string }
	| { type: "unorderedList"; items: InlineContent[] }
	| { type: "orderedList"; items: InlineContent[] }
	| { type: "tableRich"; header: (InlineContent | null)[][] | null; rows: (InlineContent | null)[][] }
	| { type: "widgetRef"; widgetId: string; widgetType: string }
	| { type: "interactionRef"; interactionId: string }

export type BlockContent = BlockContentItem[]

export type ResponseDeclaration =
	| {
			identifier: string
			cardinality: "single" | "multiple" | "ordered"
			baseType: "string" | "integer" | "float"
			correct: string | number
	  }
	| {
			identifier: string
			cardinality: "single" | "multiple" | "ordered"
			baseType: "identifier"
			correct: string | string[]
	  }
	| {
			identifier: string
			cardinality: "multiple" | "ordered"
			baseType: "directedPair"
			correct: Array<{ source: string; target: string }>
			allowEmpty: boolean
	  }

export type AnyInteraction =
	| {
			type: "choiceInteraction"
			responseIdentifier: string
			prompt: InlineContent
			choices: Array<{ identifier: string; content: BlockContent }>
			shuffle: true
			minChoices: number
			maxChoices: number
	  }
	| {
			type: "inlineChoiceInteraction"
			responseIdentifier: string
			choices: Array<{ identifier: string; content: InlineContent }>
			shuffle: true
	  }
	| { type: "textEntryInteraction"; responseIdentifier: string; expectedLength: number | null }
	| {
			type: "orderInteraction"
			responseIdentifier: string
			prompt: InlineContent
			choices: Array<{ identifier: string; content: BlockContent }>
			shuffle: true
			orientation: "vertical"
	  }
	| {
			type: "gapMatchInteraction"
			responseIdentifier: string
			shuffle: boolean
			content: BlockContent | null
			gapTexts: Array<{ identifier: string; matchMax: number; content: InlineContent }>
			gaps: Array<{ identifier: string; required: boolean | null }>
	  }
	| { type: "unsupportedInteraction"; perseusType: string; responseIdentifier: string }

export type AssessmentItemShell = {
	identifier: string
	title: string
	responseDeclarations: ResponseDeclaration[]
	body: BlockContent | null
}

export type FeedbackDimension = z.infer<typeof FeedbackDimensionSchema>
export type FeedbackCombination = z.infer<typeof FeedbackCombinationSchema>
export type FeedbackPlan = z.infer<typeof FeedbackPlanSchema>

export type AssessmentItem = {
	identifier: string
	title: string
	responseDeclarations: ResponseDeclaration[]
	body: BlockContent | null
	widgets: Record<string, Widget> | null
	interactions: Record<string, AnyInteraction> | null
	feedbackPlan: FeedbackPlan
	feedbackBlocks: Record<string, BlockContent>
}

export type AssessmentItemInput = AssessmentItem
