import { CHOICE_IDENTIFIER_REGEX, SLOT_IDENTIFIER_REGEX } from "@/compiler/qti-constants"
import { z } from "zod"
import { MATHML_INNER_PATTERN } from "../../widgets/utils/mathml"
import type { BlockContent, BlockContentItem, InlineContent, InlineContentItem } from "./types"

// Banned characters validation for text content
const BannedCharsRegex = /[\^|]/
const SafeTextSchema = z.string().refine((val) => !BannedCharsRegex.test(val), {
	message: "Text content cannot contain '^' or '|' characters."
})

// LEVEL 2: INLINE CONTENT (for paragraphs, prompts, etc.)
// Factory functions to create fresh schema instances (avoids $ref in JSON Schema)
export function createInlineContentItemSchema<const E extends readonly string[]>(
	widgetTypeKeys: E
): z.ZodType<InlineContentItem<E>> {
	return z
		.discriminatedUnion("type", [
			z
				.object({
					type: z.literal("text").describe("Identifies this as plain text content"),
					content: SafeTextSchema.describe("The actual text content to display")
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
					widgetType: z.enum(widgetTypeKeys)
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

export function createInlineContentSchema<const E extends readonly string[]>(
	widgetTypeKeys: E
): z.ZodType<InlineContent<E>> {
	return z
		.array(createInlineContentItemSchema(widgetTypeKeys))
		.describe("Array of inline content items that can be rendered within a paragraph or prompt")
}

// LEVEL 1: BLOCK CONTENT (for body, feedback, choice content, etc.)
// Factory functions for block content
export function createBlockContentItemSchema<const E extends readonly string[]>(
	widgetTypeKeys: E
): z.ZodType<BlockContentItem<E>> {
	const InlineSchema = createInlineContentSchema(widgetTypeKeys)
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
					widgetType: z.enum(widgetTypeKeys)
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

export function createBlockContentSchema<const E extends readonly string[]>(
	widgetTypeKeys: E
): z.ZodType<BlockContent<E>> {
	return z
		.array(createBlockContentItemSchema(widgetTypeKeys))
		.describe("Array of block content items representing the document structure")
}
