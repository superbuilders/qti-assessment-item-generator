import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"
import { MATHML_INNER_PATTERN } from "../utils/mathml"
import { typedSchemas } from "../widgets/registry"
import {
	CHOICE_IDENTIFIER_REGEX,
	FEEDBACK_BLOCK_IDENTIFIER_REGEX,
	OUTCOME_IDENTIFIER_REGEX,
	RESPONSE_IDENTIFIER_REGEX,
	SLOT_IDENTIFIER_REGEX
} from "./qti-constants"

// LEVEL 2: INLINE CONTENT (for paragraphs, prompts, etc.)
// Factory functions to create fresh schema instances (avoids $ref in JSON Schema)
function createInlineContentItemSchema() {
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
						.describe("Unique identifier that matches a widget key")
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

export function createInlineContentSchema() {
	return z
		.array(createInlineContentItemSchema())
		.describe("Array of inline content items that can be rendered within a paragraph or prompt")
}

export const InlineContentSchema = createInlineContentSchema()
export type InlineContent = z.infer<typeof InlineContentSchema>

// LEVEL 1: BLOCK CONTENT (for body, feedback, choice content, etc.)
// Factory functions for block content
function createBlockContentItemSchema() {
	return z
		.discriminatedUnion("type", [
			z
				.object({
					type: z.literal("paragraph").describe("Identifies this as a paragraph block"),
					content: createInlineContentSchema().describe("The inline content contained within this paragraph")
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
					items: z.array(createInlineContentSchema()).min(1).describe("List items as arrays of inline content")
				})
				.strict()
				.describe("An unordered list with each item rendered as a list item containing a paragraph"),
			z
				.object({
					type: z.literal("table").describe("Identifies this as a simple data table"),
					className: z.string().nullable().describe("Optional CSS class name for table, e.g., 'grid'"),
					header: z.array(z.string()).describe("Header cells as plain text"),
					rows: z.array(z.array(z.string())).describe("Body rows (arrays of plain text cells)")
				})
				.strict()
				.describe("Simple HTML table with optional class and text-only cells"),
			z
				.object({
					type: z.literal("widgetRef"),
					widgetId: z
						.string()
						.regex(SLOT_IDENTIFIER_REGEX, "invalid slot identifier: must be lowercase with underscores")
						.describe("Unique identifier that matches a widget key")
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

export function createBlockContentSchema() {
	return z
		.array(createBlockContentItemSchema())
		.describe("Array of block content items representing the document structure")
}

export const BlockContentSchema = createBlockContentSchema()
export type BlockContent = z.infer<typeof BlockContentSchema>

export function createDynamicAssessmentItemSchema(widgetMapping: Record<string, keyof typeof typedSchemas>) {
	// Dynamically build the Zod shape for the 'widgets' property.
	const widgetShape: Record<string, z.ZodType> = {}
	for (const [slotName, widgetType] of Object.entries(widgetMapping)) {
		const schema = typedSchemas[widgetType]
		if (schema) {
			widgetShape[slotName] = schema
		} else {
			// Safeguard against invalid widget types.
			logger.error("unknown widget type in mapping", {
				slotName,
				widgetType,
				availableTypes: Object.keys(typedSchemas)
			})
			throw errors.new(`unknown widget type specified in mapping: ${widgetType}`)
		}
	}

	const DynamicWidgetsSchema = z.object(widgetShape).describe("Map of widget slot IDs to their widget definitions")

	const InlineChoiceSchema = z
		.object({
			identifier: z
				.string()
				.regex(CHOICE_IDENTIFIER_REGEX, "invalid identifier: must be uppercase")
				.describe("Unique identifier for this inline choice option."),
			content: createInlineContentSchema().describe("The inline content displayed in the dropdown menu.")
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
			prompt: createInlineContentSchema().describe("The question or instruction presented to the user."),
			choices: z
				.array(
					z
						.object({
							identifier: z
								.string()
								.regex(CHOICE_IDENTIFIER_REGEX, "invalid identifier: must be uppercase")
								.describe("Unique identifier for this choice option, used for response matching."),
							content: createBlockContentSchema().describe(
								"Rich content for this choice option, supporting text, math, and embedded widgets."
							)
							// REMOVED: The `feedback` field is no longer supported on choices.
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
			prompt: createInlineContentSchema().describe(
				"Explicit instructions for arranging items that MUST: (1) name the sort property (e.g., density, size, value), (2) state the sort direction using unambiguous phrases like 'least to greatest' or 'greatest to least', and (3) include the axis phrase '(top to bottom)' to match the enforced vertical orientation."
			),
			choices: z
				.array(
					z
						.object({
							identifier: z
								.string()
								.regex(CHOICE_IDENTIFIER_REGEX, "invalid identifier: must be uppercase")
								.describe("Unique identifier for this choice option, used for response matching."),
							content: createBlockContentSchema().describe("Rich content for this orderable item.")
							// REMOVED: The `feedback` field is no longer supported on choices.
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
			"An interaction where users arrange items in a specific sequence or order. Prompts must never be vague (e.g., 'Arrange the items in correct order'). They must specify the sort property, the direction (ascending/descending using 'least to greatest'/'greatest to least'), and include the axis phrase '(top to bottom)'."
		)

	const GapMatchInteractionSchema = z
		.object({
			type: z.literal("gapMatchInteraction").describe("Identifies this as a gap match (drag-and-drop) interaction."),
			responseIdentifier: z
				.string()
				.regex(RESPONSE_IDENTIFIER_REGEX, "invalid response identifier: must start with RESPONSE")
				.describe("Links this interaction to its response declaration for scoring."),
			shuffle: z.boolean().describe("Whether to shuffle the order of gap-text items (draggable tokens)."),
			content: createBlockContentSchema()
				.nullable()
				.describe(
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
							content: createInlineContentSchema().describe("The content of the draggable item (text or math).")
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

	// Base schema with common fields
	const BaseResponseDeclarationSchema = z.object({
		identifier: z
			.string()
			.regex(RESPONSE_IDENTIFIER_REGEX, "invalid response identifier: must start with RESPONSE")
			.describe("Unique ID linking an interaction to this response declaration."),
		cardinality: z
			.enum(["single", "multiple", "ordered"])
			.describe("Defines response structure: single value, multiple values, or ordered sequence.")
	})

	// Schema for text/numeric responses (like textEntryInteraction)
	const TextualResponseDeclarationSchema = BaseResponseDeclarationSchema.extend({
		baseType: z.enum(["string", "integer", "float"]),
		// CRITICAL: 'correct' CANNOT be an array here. This enforces the single-answer rule.
		correct: z.union([z.string(), z.number()]).describe("The single correct answer for a text or numeric entry.")
	}).strict()

	// Schema for identifier-based responses (like choiceInteraction, orderInteraction)
	const IdentifierResponseDeclarationSchema = BaseResponseDeclarationSchema.extend({
		baseType: z.literal("identifier"),
		// 'correct' CAN be an array here to support multiple correct choices.
		correct: z
			.union([z.string(), z.array(z.string())])
			.describe("The correct identifier(s). For multiple correct answers, provide an array of identifiers.")
	}).strict()

	// Schema for directedPair responses (like gapMatchInteraction)
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

	// The new ResponseDeclarationSchema is a discriminated union based on 'baseType'
	const ResponseDeclarationSchema = z
		.discriminatedUnion("baseType", [
			TextualResponseDeclarationSchema,
			IdentifierResponseDeclarationSchema,
			DirectedPairResponseDeclarationSchema
		])
		.describe(
			"Defines the correct answer for an interaction, with a structure that varies based on the response's baseType."
		)

	// NEW: Define the schema for a single feedback block.
	const FeedbackBlockSchema = z
		.object({
			identifier: z
				.string()
				.regex(FEEDBACK_BLOCK_IDENTIFIER_REGEX, "invalid feedback block identifier")
				.describe("Identifier for the feedback block, e.g., 'A', 'B', 'CORRECT'."),
			outcomeIdentifier: z
				.string()
				.regex(OUTCOME_IDENTIFIER_REGEX, "invalid outcome identifier")
				.describe("The outcome variable this feedback is tied to, e.g., 'FEEDBACK__RESPONSE'."),
			content: createBlockContentSchema().describe("The rich content of the feedback block.")
		})
		.strict()

	// The FINAL schema used by the compiler. It expects full widget/interaction objects.
	const AssessmentItemSchema = z
		.object({
			identifier: z.string().describe("Unique identifier for this assessment item."),
			title: z.string().describe("Human-readable title of the assessment item."),
			responseDeclarations: z
				.array(ResponseDeclarationSchema)
				.min(1)
				.describe("Defines correct answers and scoring for all interactions in this item."),
			body: createBlockContentSchema().nullable().describe("The main content of the item as structured blocks."),
			widgets: DynamicWidgetsSchema.nullable().describe(
				"A map of widget identifiers to their full widget object definitions."
			),
			interactions: z
				.record(AnyInteractionSchema)
				.nullable()
				.describe("A map of interaction identifiers to their full interaction object definitions."),
			// REMOVED: The old binary `feedback` object is gone.
			// NEW: Add the `feedbackBlocks` array, which must be non-empty.
			feedbackBlocks: z
				.array(FeedbackBlockSchema)
				.min(1)
				.describe("A list of feedback blocks to be displayed based on outcomes.")
		})
		.strict()
		.superRefine((data, ctx) => {
			// NEW: Cross-field validation for identifier consistency.
			const responseIdToChoices = new Map<string, Set<string>>()
			if (data.interactions) {
				for (const interaction of Object.values(data.interactions)) {
					if (interaction.type === "choiceInteraction" || interaction.type === "inlineChoiceInteraction") {
						const choiceIds = new Set(interaction.choices.map((c) => c.identifier))
						responseIdToChoices.set(interaction.responseIdentifier, choiceIds)
					}
				}
			}

			for (let i = 0; i < data.feedbackBlocks.length; i++) {
				const fb = data.feedbackBlocks[i]
				if (!fb) continue
				// Reserved names guard
				if (fb.outcomeIdentifier === "SCORE" || fb.outcomeIdentifier === "MAXSCORE") {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "outcomeIdentifier must not be SCORE or MAXSCORE",
						path: ["feedbackBlocks", i, "outcomeIdentifier"]
					})
				}

				if (fb.outcomeIdentifier === "FEEDBACK__GLOBAL") {
					if (!/^(CORRECT|INCORRECT)$/.test(fb.identifier)) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: "For a 'FEEDBACK__GLOBAL' outcome, block identifier must be 'CORRECT' or 'INCORRECT'.",
							path: ["feedbackBlocks", i, "identifier"]
						})
					}
					continue
				}

				const match = /^FEEDBACK__([A-Za-z0-9_]+)$/.exec(fb.outcomeIdentifier)
				if (match?.[1]) {
					const respId = match[1]
					const allowedChoices = responseIdToChoices.get(respId)
					if (!allowedChoices || !allowedChoices.has(fb.identifier)) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: `Feedback block identifier "${fb.identifier}" not found in choices for response "${respId}".`,
							path: ["feedbackBlocks", i, "identifier"]
						})
					}
				} else {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "Outcome identifier must be FEEDBACK__GLOBAL or FEEDBACK__<responseId>.",
						path: ["feedbackBlocks", i, "outcomeIdentifier"]
					})
				}
			}

			// Additional guards to ban invalid states
			// 1) Uniqueness: within an outcomeIdentifier group, identifiers must be unique
			const seen = new Set<string>()
			for (let i = 0; i < data.feedbackBlocks.length; i++) {
				const fb = data.feedbackBlocks[i]
				const key = `${fb.outcomeIdentifier}::${fb.identifier}`
				if (seen.has(key)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "duplicate feedback block identifier within outcome group",
						path: ["feedbackBlocks", i, "identifier"]
					})
				} else {
					seen.add(key)
				}
			}

			// 2) Outcome-to-response linkage: FEEDBACK__<respId> must have a responseDeclaration with baseType 'identifier'
			const declCardinality = new Map<string, { baseType: string; cardinality: string }>()
			for (const decl of data.responseDeclarations) {
				// All response declarations have baseType and cardinality due to the discriminated union
				declCardinality.set(decl.identifier, {
					baseType: decl.baseType,
					cardinality: decl.cardinality
				})
			}
			for (let i = 0; i < data.feedbackBlocks.length; i++) {
				const fb = data.feedbackBlocks[i]
				const m = /^FEEDBACK__([A-Za-z0-9_]+)$/.exec(fb.outcomeIdentifier)
				if (!m || m[1] === "GLOBAL") continue
				const rd = declCardinality.get(m[1])
				if (!rd) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: `no responseDeclaration found for outcome ${fb.outcomeIdentifier}`,
						path: ["feedbackBlocks", i, "outcomeIdentifier"]
					})
					continue
				}
				if (rd.baseType !== "identifier") {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: `outcome ${fb.outcomeIdentifier} must target baseType 'identifier' response`,
						path: ["feedbackBlocks", i, "outcomeIdentifier"]
					})
				}
			}

			// 3) FEEDBACK__GLOBAL presence requires at least one non-enumerated response (string|integer|float|directedPair)
			const hasGlobal = data.feedbackBlocks.some((b) => b.outcomeIdentifier === "FEEDBACK__GLOBAL")
			if (hasGlobal) {
				const hasNonEnumerated = data.responseDeclarations.some((d) => d.baseType !== "identifier")
				if (!hasNonEnumerated) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "FEEDBACK__GLOBAL requires at least one non-enumerated responseDeclaration",
						path: ["feedbackBlocks"]
					})
				}
			}
		})
		.describe("A complete QTI 3.0 assessment item with content, interactions, and scoring rules.")

	// The SHELL schema produced by Shot 1 of the AI pipeline.
	// It has a structured body with ref placeholders.
	const AssessmentItemShellSchema = z
		.object({
			identifier: z.string().describe("Unique identifier for this assessment item."),
			title: z.string().describe("Human-readable title of the assessment item."),
			responseDeclarations: z
				.array(ResponseDeclarationSchema)
				.describe("Defines correct answers and scoring for all interactions in this item."),
			body: createBlockContentSchema().nullable().describe("The main content with ref placeholders."),
			// REMOVED: 'widgets' and 'interactions' arrays are no longer part of the shell.
			feedbackBlocks: z
				.array(FeedbackBlockSchema)
				.min(1)
				.describe("A list of feedback blocks to be displayed based on outcomes.")
		})
		.strict()
		.describe("Initial assessment item structure with ref placeholders from the first AI generation shot.")

	return {
		AssessmentItemSchema,
		AnyInteractionSchema,
		AssessmentItemShellSchema
	}
}

const {
	AssessmentItemSchema: BaseAssessmentItemSchema,
	AnyInteractionSchema: BaseAnyInteractionSchema,
	AssessmentItemShellSchema: BaseAssessmentItemShellSchema
} = createDynamicAssessmentItemSchema({})

export const AssessmentItemSchema = BaseAssessmentItemSchema
export const AnyInteractionSchema = BaseAnyInteractionSchema
export const AssessmentItemShellSchema = BaseAssessmentItemShellSchema

export type AnyInteraction = z.infer<typeof AnyInteractionSchema>
export type AssessmentItem = z.infer<typeof AssessmentItemSchema>
export type AssessmentItemInput = z.input<typeof AssessmentItemSchema>
export type AssessmentItemShell = z.infer<typeof AssessmentItemShellSchema>
export type Widget = z.infer<(typeof typedSchemas)[keyof typeof typedSchemas]>
