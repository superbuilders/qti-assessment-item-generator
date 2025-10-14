import { z } from "zod"
import { CHOICE_IDENTIFIER_REGEX, SLOT_IDENTIFIER_REGEX } from "@/compiler/qti-constants"
import { MATHML_INNER_PATTERN } from "@/widgets/utils/mathml"

// Banned characters validation for text content
const BannedCharsRegex = /[\^|]/
const SafeTextSchema = z.string().refine((val) => !BannedCharsRegex.test(val), {
	message: "Text content cannot contain '^' or '|' characters."
})

// ---[ MODULAR BUILDING BLOCKS (INLINE) ]---

const TextInlineSchema = z
	.object({
		type: z.literal("text").describe("Identifies this as plain text content"),
		content: SafeTextSchema.describe("The actual text content to display")
	})
	.strict()
	.describe("Plain text content that will be rendered as-is")

const MathInlineSchema = z
	.object({
		type: z.literal("math").describe("Identifies this as mathematical content"),
		mathml: z
			.string()
			.regex(MATHML_INNER_PATTERN, "invalid mathml snippet; must be inner MathML without outer <math> wrapper")
			.describe("Inner MathML markup (no outer <math> element)")
	})
	.strict()
	.describe("Mathematical content represented in MathML format")

const InlineInteractionRefSchema = z
	.object({
		type: z.literal("inlineInteractionRef"),
		interactionId: z
			.string()
			.regex(SLOT_IDENTIFIER_REGEX, "invalid slot identifier: must be lowercase with underscores")
			.describe("Unique identifier that matches an interaction key")
	})
	.strict()
	.describe("Reference to a compiled interaction by id, to be rendered inline")

const GapInlineSchema = z
	.object({
		type: z.literal("gap").describe("Identifies this as a gap for gap match interaction"),
		gapId: z
			.string()
			.regex(CHOICE_IDENTIFIER_REGEX, "invalid gap identifier: must be uppercase")
			.describe("References a gap defined in a gapMatchInteraction")
	})
	.strict()
	.describe("A gap placeholder that users can drag items into in a gap match interaction")

function createInlineWidgetRefSchema<const E extends readonly string[]>(widgetTypeKeys: E) {
	return z
		.object({
			type: z.literal("inlineWidgetRef"),
			widgetId: z
				.string()
				.regex(SLOT_IDENTIFIER_REGEX, "invalid slot identifier: must be lowercase with underscores")
				.describe("Unique identifier that matches a widget key"),
			widgetType: z.enum(widgetTypeKeys)
		})
		.strict()
}

// ---[ MODULAR BUILDING BLOCKS (BLOCK) ]---

function createWidgetRefBlockSchema<const E extends readonly string[]>(widgetTypeKeys: E) {
	return z
		.object({
			type: z.literal("widgetRef"),
			widgetId: z
				.string()
				.regex(SLOT_IDENTIFIER_REGEX, "invalid slot identifier: must be lowercase with underscores")
				.describe("Unique identifier that matches a widget key"),
			widgetType: z.enum(widgetTypeKeys)
		})
		.strict()
		.describe("Reference to a generated widget by id, to be rendered as a block")
}

const InteractionRefBlockSchema = z
	.object({
		type: z.literal("interactionRef"),
		interactionId: z
			.string()
			.regex(SLOT_IDENTIFIER_REGEX, "invalid slot identifier: must be lowercase with underscores")
			.describe("Unique identifier that matches an interaction key")
	})
	.strict()
	.describe("Reference to a compiled interaction by id, to be rendered as a block")

// Generic factory for paragraph blocks accepting a specific inline schema
function createParagraphBlockSchema<TInline extends z.ZodTypeAny>(allowedInlinesSchema: TInline) {
	return z
		.object({
			type: z.literal("paragraph").describe("Identifies this as a paragraph block"),
			content: z.array(allowedInlinesSchema).describe("The inline content contained within this paragraph")
		})
		.strict()
		.describe("A paragraph block containing inline content")
}

function createUnorderedListBlockSchema<TInline extends z.ZodTypeAny>(allowedInlinesSchema: TInline) {
	return z
		.object({
			type: z.literal("unorderedList").describe("Identifies this as an unordered list"),
			items: z.array(z.array(allowedInlinesSchema)).min(1).describe("List items as arrays of inline content")
		})
		.strict()
		.describe("An unordered list with each item rendered as a list item containing a paragraph")
}

function createOrderedListBlockSchema<TInline extends z.ZodTypeAny>(allowedInlinesSchema: TInline) {
	return z
		.object({
			type: z.literal("orderedList").describe("Identifies this as an ordered list"),
			items: z.array(z.array(allowedInlinesSchema)).min(1).describe("List items as arrays of inline content")
		})
		.strict()
		.describe("An ordered list with each item rendered as a numbered list item containing a paragraph")
}

function createTableRichBlockSchema<TInline extends z.ZodTypeAny>(allowedInlinesSchema: TInline) {
	const TableRichCellSchema = z.array(allowedInlinesSchema).nullable()
	const TableRichRowSchema = z.array(TableRichCellSchema)

	return z
		.object({
			type: z.literal("tableRich"),
			header: z.array(TableRichRowSchema).nullable(),
			rows: z.array(TableRichRowSchema)
		})
		.strict()
}

function createBlockQuoteBlockSchema<TInline extends z.ZodTypeAny>(allowedInlinesSchema: TInline) {
	return z
		.object({
			type: z.literal("blockquote").describe("Identifies a quoted callout area"),
			content: z.array(allowedInlinesSchema).describe("The main quoted content"),
			attribution: z
				.array(allowedInlinesSchema)
				.nullable()
				.optional()
				.describe("Optional attribution for the quote")
		})
		.strict()
		.describe("A blockquote for semantic quoting with optional attribution")
}

// ---[ CONTEXT-SPECIFIC SCHEMA FACTORIES ]---

export function createBodyContentSchema<const E extends readonly string[]>(widgetTypeKeys: E) {
	const InlineWidgetRefSchema = createInlineWidgetRefSchema(widgetTypeKeys)

	const AllowedBodyInlines = z.discriminatedUnion("type", [
		TextInlineSchema,
		MathInlineSchema,
		InlineWidgetRefSchema,
		InlineInteractionRefSchema
		// GapInlineSchema is intentionally BANNED from BodyContent
	])

	const ParagraphBlockSchema = createParagraphBlockSchema(AllowedBodyInlines)
	const UnorderedListBlockSchema = createUnorderedListBlockSchema(AllowedBodyInlines)
	const OrderedListBlockSchema = createOrderedListBlockSchema(AllowedBodyInlines)
	const TableRichBlockSchema = createTableRichBlockSchema(AllowedBodyInlines)
	const BlockQuoteBlockSchema = createBlockQuoteBlockSchema(AllowedBodyInlines)
	const WidgetRefBlockSchema = createWidgetRefBlockSchema(widgetTypeKeys)

	const AllowedBodyBlocks = z.discriminatedUnion("type", [
		ParagraphBlockSchema,
		UnorderedListBlockSchema,
		OrderedListBlockSchema,
		TableRichBlockSchema,
		BlockQuoteBlockSchema,
		WidgetRefBlockSchema,
		InteractionRefBlockSchema
	])

	return z.array(AllowedBodyBlocks)
}

export function createFeedbackContentSchema<const E extends readonly string[]>(widgetTypeKeys: E) {
	const InlineWidgetRefSchema = createInlineWidgetRefSchema(widgetTypeKeys)

	const AllowedFeedbackInlines = z
		.discriminatedUnion("type", [TextInlineSchema, MathInlineSchema, InlineWidgetRefSchema])
		.describe("Inline items permitted in feedback (text, math, inline widget references). Interactions are banned.")

	const ParagraphBlockSchema = createParagraphBlockSchema(AllowedFeedbackInlines).describe(
		"Paragraph of inline content within feedback steps. Use for sentences and brief explanations."
	)
	const UnorderedListBlockSchema = createUnorderedListBlockSchema(AllowedFeedbackInlines).describe(
		"Bulleted list used to organize hints, tips, or self-check items in a step."
	)
	const OrderedListBlockSchema = createOrderedListBlockSchema(AllowedFeedbackInlines).describe(
		"Numbered list used to present sequenced sub-steps inside a step."
	)
	const TableRichBlockSchema = createTableRichBlockSchema(AllowedFeedbackInlines).describe(
		"Table for structured information in a step (no interactions)."
	)
	const WidgetRefBlockSchema = createWidgetRefBlockSchema(widgetTypeKeys).describe(
		"Embedded widget block used for diagrams or visuals that support the step."
	)

	const BlockQuoteBlockSchema = z
		.object({
			type: z.literal("blockquote").describe("Identifies a quoted callout area in the step content."),
			content: z
				.array(AllowedFeedbackInlines)
				.describe("Quoted inline content that emphasizes a key idea or reminder."),
			attribution: z
				.array(AllowedFeedbackInlines)
				.nullable()
				.optional()
				.describe("Optional attribution for the quote, e.g., 'Teacher's tip'.")
		})
		.strict()
		.describe("A quoted callout to emphasize a key idea, hint, or reminder within a step.")

	const AllowedFeedbackBlocks = z
		.discriminatedUnion("type", [
			ParagraphBlockSchema,
			UnorderedListBlockSchema,
			OrderedListBlockSchema,
			TableRichBlockSchema,
			WidgetRefBlockSchema,
			BlockQuoteBlockSchema
		])
		.describe("Blocks permitted inside feedback steps.")

	const StepBlockSchema = z
		.object({
			type: z.literal("step").describe("Identifies a pedagogical step in the feedback sequence."),
			title: z
				.array(AllowedFeedbackInlines)
				.min(1)
				.describe("Short, imperative title for the step (e.g., 'Find the value of the box')."),
			content: z
				.array(AllowedFeedbackBlocks)
				.describe(
					"The body of the step: paragraphs, lists, tables, widgets, and blockquotes that teach or demonstrate."
				)
		})
		.strict()
		.describe("A single feedback step with a concise title and explanatory body.")

	const PreambleSchema = z
		.object({
			correctness: z
				.enum(["correct", "incorrect"])
				.describe("Verdict for this feedback block. Must match the outcome path (correct vs incorrect)."),
			summary: z
				.array(AllowedFeedbackInlines)
				.min(1)
				.describe("A short 1–2 sentence explanation stating why the answer is right/wrong before showing steps.")
		})
		.strict()
		.describe("A mandatory preamble that communicates the verdict and a succinct rationale.")

	return z
		.object({
			preamble: PreambleSchema,
			steps: z
				.array(StepBlockSchema)
				.min(2)
				.describe("Ordered list of teaching steps. Minimum two required; three recommended (identify, compute/derive, conclude).")
		})
		.strict()
		.describe(
			"Structured feedback containing a preamble (verdict + summary) followed by a sequenced set of pedagogy-first steps."
		)
}

export function createChoiceInteractionPromptSchema<const E extends readonly string[]>(widgetTypeKeys: E) {
	const InlineWidgetRefSchema = createInlineWidgetRefSchema(widgetTypeKeys)

	const AllowedPromptInlines = z.discriminatedUnion("type", [
		TextInlineSchema,
		MathInlineSchema,
		InlineWidgetRefSchema
		// InlineInteractionRefSchema and GapInlineSchema are BANNED
	])

	return z.array(AllowedPromptInlines)
}

export function createChoiceInteractionChoiceContentSchema<const E extends readonly string[]>(widgetTypeKeys: E) {
	const InlineWidgetRefSchema = createInlineWidgetRefSchema(widgetTypeKeys)

	const AllowedChoiceInlines = z.discriminatedUnion("type", [
		TextInlineSchema,
		MathInlineSchema,
		InlineWidgetRefSchema
		// InlineInteractionRefSchema and GapInlineSchema are BANNED
	])

	const ParagraphBlockSchema = createParagraphBlockSchema(AllowedChoiceInlines)
	const UnorderedListBlockSchema = createUnorderedListBlockSchema(AllowedChoiceInlines)
	const OrderedListBlockSchema = createOrderedListBlockSchema(AllowedChoiceInlines)
	const TableRichBlockSchema = createTableRichBlockSchema(AllowedChoiceInlines)
	const BlockQuoteBlockSchema = createBlockQuoteBlockSchema(AllowedChoiceInlines)
	const WidgetRefBlockSchema = createWidgetRefBlockSchema(widgetTypeKeys)

	const AllowedChoiceBlocks = z.discriminatedUnion("type", [
		ParagraphBlockSchema,
		UnorderedListBlockSchema,
		OrderedListBlockSchema,
		TableRichBlockSchema,
		BlockQuoteBlockSchema,
		WidgetRefBlockSchema
		// InteractionRefBlockSchema is BANNED
	])

	return z.array(AllowedChoiceBlocks)
}

export function createInlineChoiceContentSchema<const E extends readonly string[]>(widgetTypeKeys: E) {
	const InlineWidgetRefSchema = createInlineWidgetRefSchema(widgetTypeKeys)

	const AllowedInlineChoiceInlines = z.discriminatedUnion("type", [
		TextInlineSchema,
		MathInlineSchema,
		InlineWidgetRefSchema
		// InlineInteractionRefSchema and GapInlineSchema are BANNED
	])

	return z.array(AllowedInlineChoiceInlines)
}

export function createGapMatchContentSchema<const E extends readonly string[]>(_widgetTypeKeys: E) {
	// Gap match content MUST allow gaps inline
	const AllowedGapMatchInlines = z.discriminatedUnion("type", [
		TextInlineSchema,
		MathInlineSchema,
		GapInlineSchema
		// InlineWidgetRefSchema, InlineInteractionRefSchema are BANNED
	])

	const ParagraphBlockSchema = createParagraphBlockSchema(AllowedGapMatchInlines)
	const UnorderedListBlockSchema = createUnorderedListBlockSchema(AllowedGapMatchInlines)
	const OrderedListBlockSchema = createOrderedListBlockSchema(AllowedGapMatchInlines)
	const TableRichBlockSchema = createTableRichBlockSchema(AllowedGapMatchInlines)
	const BlockQuoteBlockSchema = createBlockQuoteBlockSchema(AllowedGapMatchInlines)

	const AllowedGapMatchBlocks = z.discriminatedUnion("type", [
		ParagraphBlockSchema,
		UnorderedListBlockSchema,
		OrderedListBlockSchema,
		TableRichBlockSchema,
		BlockQuoteBlockSchema
		// WidgetRefBlockSchema and InteractionRefBlockSchema are BANNED
	])

	return z.array(AllowedGapMatchBlocks).min(1)
}
