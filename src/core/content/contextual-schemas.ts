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
	const WidgetRefBlockSchema = createWidgetRefBlockSchema(widgetTypeKeys)

	const AllowedBodyBlocks = z.discriminatedUnion("type", [
		ParagraphBlockSchema,
		UnorderedListBlockSchema,
		OrderedListBlockSchema,
		TableRichBlockSchema,
		WidgetRefBlockSchema,
		InteractionRefBlockSchema
	])

	return z.array(AllowedBodyBlocks)
}

export function createFeedbackContentSchema<const E extends readonly string[]>(widgetTypeKeys: E) {
	const InlineWidgetRefSchema = createInlineWidgetRefSchema(widgetTypeKeys)

	const AllowedFeedbackInlines = z.discriminatedUnion("type", [
		TextInlineSchema,
		MathInlineSchema,
		InlineWidgetRefSchema
		// InlineInteractionRefSchema and GapInlineSchema are BANNED
	])

	const ParagraphBlockSchema = createParagraphBlockSchema(AllowedFeedbackInlines)
	const UnorderedListBlockSchema = createUnorderedListBlockSchema(AllowedFeedbackInlines)
	const OrderedListBlockSchema = createOrderedListBlockSchema(AllowedFeedbackInlines)
	const TableRichBlockSchema = createTableRichBlockSchema(AllowedFeedbackInlines)
	const WidgetRefBlockSchema = createWidgetRefBlockSchema(widgetTypeKeys)

	const AllowedFeedbackBlocks = z.discriminatedUnion("type", [
		ParagraphBlockSchema,
		UnorderedListBlockSchema,
		OrderedListBlockSchema,
		TableRichBlockSchema,
		WidgetRefBlockSchema
		// InteractionRefBlockSchema is BANNED
	])

	return z.array(AllowedFeedbackBlocks)
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
	const WidgetRefBlockSchema = createWidgetRefBlockSchema(widgetTypeKeys)

	const AllowedChoiceBlocks = z.discriminatedUnion("type", [
		ParagraphBlockSchema,
		UnorderedListBlockSchema,
		OrderedListBlockSchema,
		TableRichBlockSchema,
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

	const AllowedGapMatchBlocks = z.discriminatedUnion("type", [
		ParagraphBlockSchema,
		UnorderedListBlockSchema,
		OrderedListBlockSchema,
		TableRichBlockSchema
		// WidgetRefBlockSchema and InteractionRefBlockSchema are BANNED
	])

	return z.array(AllowedGapMatchBlocks).min(1)
}
