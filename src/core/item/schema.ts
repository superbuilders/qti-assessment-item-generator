import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"
import {
	CHOICE_IDENTIFIER_REGEX,
	RESPONSE_IDENTIFIER_REGEX
} from "@/compiler/qti-constants"
import { createBodyContentSchema } from "@/core/content/contextual-schemas"
import { createFeedbackObjectSchema, FeedbackPlanSchema } from "@/core/feedback"
import { createAnyInteractionSchema } from "@/core/interactions"
import type {
	AssessmentItemShell,
	ResponseDeclaration
} from "@/core/item/types"
import { WidgetSchema } from "@/widgets/registry"

// Response Declaration Schema (shared across all dynamic schemas)
function createResponseDeclarationSchema(): z.ZodType<ResponseDeclaration> {
	const BaseResponseDeclarationSchema = z.object({
		identifier: z
			.string()
			.regex(
				RESPONSE_IDENTIFIER_REGEX,
				"invalid response identifier: must start with RESPONSE"
			)
			.describe(
				"Unique ID linking an interaction to this response declaration."
			),
		cardinality: z
			.enum(["single", "multiple", "ordered"])
			.describe(
				"Defines response structure: single value, multiple values, or ordered sequence."
			)
	})

	const TextualResponseDeclarationSchema = BaseResponseDeclarationSchema.extend(
		{
			baseType: z.enum(["string", "integer", "float"]),
			correct: z
				.union([z.string(), z.number()])
				.describe("The single correct answer for a text or numeric entry.")
		}
	).strict()

	const IdentifierResponseDeclarationSchema =
		BaseResponseDeclarationSchema.extend({
			baseType: z.literal("identifier"),
			correct: z
				.union([z.string(), z.array(z.string())])
				.describe(
					"The correct identifier(s). For multiple correct answers, provide an array of identifiers."
				)
		}).strict()

	const DirectedPairResponseDeclarationSchema =
		BaseResponseDeclarationSchema.extend({
			baseType: z.literal("directedPair"),
			cardinality: z
				.enum(["multiple", "ordered"])
				.describe("Gap match always uses multiple or ordered cardinality."),
			correct: z
				.array(
					z.object({
						source: z
							.string()
							.regex(
								CHOICE_IDENTIFIER_REGEX,
								"invalid source identifier: must be uppercase"
							)
							.describe("The identifier of the gap-text (draggable item)."),
						target: z
							.string()
							.regex(
								CHOICE_IDENTIFIER_REGEX,
								"invalid target identifier: must be uppercase"
							)
							.describe(
								"The identifier of the gap where the item should be placed."
							)
					})
				)
				.describe("Array of correct source->target pairs for gap match."),
			allowEmpty: z
				.boolean()
				.describe(
					"If true, an empty response (no items placed) can be correct."
				)
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

export function createAssessmentItemShellSchema<
	const E extends readonly string[]
>(widgetTypeKeys: E): z.ZodType<AssessmentItemShell<E>> {
	const ResponseDeclarationSchema = createResponseDeclarationSchema()
	const BodySchema = createBodyContentSchema(widgetTypeKeys)

	return z
		.object({
			identifier: z
				.string()
				.describe("Unique identifier for this assessment item."),
			title: z
				.string()
				.describe("Human-readable title of the assessment item."),
			responseDeclarations: z
				.array(ResponseDeclarationSchema)
				.describe(
					"Defines correct answers and scoring for all interactions in this item."
				),
			body: BodySchema.nullable().describe(
				"The main content with ref placeholders."
			)
		})
		.strict()
		.describe(
			"Initial assessment item structure with ref placeholders from the first AI generation shot."
		)
}

export function createDynamicAssessmentItemSchema<
	const E extends readonly string[]
>(
	widgetMapping: Record<string, E[number]>,
	widgetTypeKeys: E,
	widgetSchemas: Record<E[number], z.ZodType<unknown, unknown>>,
	feedbackPlan: z.infer<typeof FeedbackPlanSchema>
) {
	for (const [slotName, widgetType] of Object.entries(widgetMapping)) {
		const schema = widgetSchemas[widgetType]
		if (!schema) {
			logger.error("unknown widget type in mapping", {
				slotName,
				widgetType,
				availableTypes: widgetTypeKeys
			})
			throw errors.new(
				`unknown widget type specified in mapping: ${widgetType}`
			)
		}
	}

	// Narrow to only allowed widget schemas for this collection
	const allowedTypeNames = new Set<string>(Object.keys(widgetSchemas))
	const AllowedWidgetSchema = WidgetSchema.superRefine((val, ctx) => {
		if (!allowedTypeNames.has(val.type)) {
			ctx.addIssue({
				code: "custom",
				message: `widget type '${val.type}' is not allowed in this collection`,
				path: ["type"]
			})
		}
	})

	const DynamicWidgetsSchema = z
		.record(z.string(), AllowedWidgetSchema)
		.describe("Map of widget slot IDs to their widget definitions")
	const BodySchema = createBodyContentSchema(widgetTypeKeys)
	const AnyInteractionSchema = createAnyInteractionSchema(widgetTypeKeys)
	const ResponseDeclarationSchema = createResponseDeclarationSchema()

	// Create feedback object schema tied to the feedbackPlan
	const FeedbackObjectSchema = createFeedbackObjectSchema(
		feedbackPlan,
		widgetTypeKeys
	)

	// Compose the full AssessmentItem schema with direct object property composition
	const AssessmentItemSchema = z
		.object({
			identifier: z
				.string()
				.describe("Unique identifier for this assessment item."),
			title: z
				.string()
				.describe("Human-readable title of the assessment item."),
			responseDeclarations: z
				.array(ResponseDeclarationSchema)
				.min(1)
				.describe(
					"Defines correct answers and scoring for all interactions in this item."
				),
			body: BodySchema.nullable().describe(
				"The main content of the item as structured blocks."
			),
			widgets: DynamicWidgetsSchema.nullable().describe(
				"A map of widget identifiers to their full widget object definitions."
			),
			interactions: z
				.record(z.string(), AnyInteractionSchema)
				.nullable()
				.describe(
					"A map of interaction identifiers to their full interaction object definitions."
				),
			feedbackPlan: FeedbackPlanSchema,
			feedback: FeedbackObjectSchema.describe(
				"Nested feedback structure with dimensional paths for all response combinations."
			)
		})
		.strict()
		.superRefine((data, ctx) => {
			// Cross-field validation for gapMatchInteraction
			if (!data.interactions) return

			for (const [interactionKey, interaction] of Object.entries(
				data.interactions
			)) {
				if (interaction.type !== "gapMatchInteraction") continue

				const decl = data.responseDeclarations.find(
					(d) => d.identifier === interaction.responseIdentifier
				)
				if (!decl) continue
				if (decl.baseType !== "directedPair") continue

				const gapTextIds = new Set(
					interaction.gapTexts.map((gt) => gt.identifier)
				)
				const declaredGapIds = new Set(
					interaction.gaps.map((g) => g.identifier)
				)

				// Validate correct response pairs
				if (Array.isArray(decl.correct)) {
					for (const pair of decl.correct) {
						if (typeof pair === "object" && pair !== null) {
							const sourceDesc = Object.getOwnPropertyDescriptor(pair, "source")
							const targetDesc = Object.getOwnPropertyDescriptor(pair, "target")
							if (!sourceDesc || !targetDesc) continue
							const source = String(sourceDesc.value)
							const target = String(targetDesc.value)

							if (!gapTextIds.has(source)) {
								ctx.addIssue({
									code: z.ZodIssueCode.custom,
									message: `gap match validation: correct pair source '${source}' not in gapTexts`,
									path: ["interactions", interactionKey, "gapTexts"]
								})
							}
							if (!declaredGapIds.has(target)) {
								ctx.addIssue({
									code: z.ZodIssueCode.custom,
									message: `gap match validation: correct pair target '${target}' not in gaps`,
									path: ["interactions", interactionKey, "gaps"]
								})
							}
						}
					}

					// Validate matchMax multiplicity and duplicate pairs
					const usageBySource = new Map<string, number>()
					const seenPairs = new Set<string>()

					for (const pair of decl.correct) {
						if (typeof pair === "object" && pair !== null) {
							const sourceDesc = Object.getOwnPropertyDescriptor(pair, "source")
							const targetDesc = Object.getOwnPropertyDescriptor(pair, "target")
							if (!sourceDesc || !targetDesc) continue
							const source = String(sourceDesc.value)
							const target = String(targetDesc.value)

							// Check for duplicate pairs
							const pairKey = `${source}→${target}`
							if (seenPairs.has(pairKey)) {
								ctx.addIssue({
									code: z.ZodIssueCode.custom,
									message: `gap match validation: duplicate correct pair '${pairKey}'`,
									path: ["responseDeclarations"]
								})
							}
							seenPairs.add(pairKey)

							// Count usage
							usageBySource.set(source, (usageBySource.get(source) ?? 0) + 1)
						}
					}

					// Validate matchMax constraints
					for (const [source, count] of usageBySource) {
						const gapText = interaction.gapTexts.find(
							(gt) => gt.identifier === source
						)
						const matchMax = gapText?.matchMax ?? 1
						if (matchMax !== 0 && count > matchMax) {
							ctx.addIssue({
								code: z.ZodIssueCode.custom,
								message: `gap match validation: source '${source}' used ${count} times, exceeds matchMax ${matchMax}`,
								path: ["responseDeclarations"]
							})
						}
					}
				}

				// Validate cardinality policy for gap match
				if (decl.cardinality !== "multiple") {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: `gap match validation: cardinality must be 'multiple', not '${decl.cardinality}'`,
						path: ["responseDeclarations"]
					})
				}
			}

			// Validate no gaps in body or feedback (placement ban)
			// biome-ignore lint: any needed for recursive traversal
			const checkForGaps = (nodes: any, contextPath: string[]): void => {
				if (!nodes || !Array.isArray(nodes)) return
				for (const node of nodes) {
					if (!node) continue
					if (node.type === "gap") {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message:
								"gap placeholders are only allowed inside gapMatchInteraction content",
							path: contextPath
						})
					} else if (node.type === "paragraph") {
						checkForGaps(node.content, contextPath)
					} else if (
						node.type === "unorderedList" ||
						node.type === "orderedList"
					) {
						if (Array.isArray(node.items)) {
							for (const item of node.items) checkForGaps(item, contextPath)
						}
					} else if (node.type === "tableRich") {
						const scanRows = (rows: unknown) => {
							if (!rows || !Array.isArray(rows)) return
							for (const row of rows) {
								if (!Array.isArray(row)) continue
								for (const cell of row) checkForGaps(cell, contextPath)
							}
						}
						scanRows(node.header)
						scanRows(node.rows)
					}
				}
			}

			if (data.body) {
				checkForGaps(data.body, ["body"])
			}
		})
		.describe(
			"A complete QTI 3.0 assessment item with content, interactions, and scoring rules."
		)

	const AssessmentItemShellSchema =
		createAssessmentItemShellSchema(widgetTypeKeys)

	return {
		AssessmentItemSchema,
		AnyInteractionSchema,
		AssessmentItemShellSchema
	}
}
