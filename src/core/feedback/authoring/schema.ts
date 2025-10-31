import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"
import type { FeedbackContent } from "@/core/content"
import { createFeedbackContentSchema } from "@/core/content/contextual-schemas"
import type {
	AuthoringFeedbackOverall,
	AuthoringNestedLeaf,
	AuthoringNestedNode
} from "@/core/feedback/authoring/types"
import type { FeedbackPlan } from "@/core/feedback/plan"
import { buildFeedbackPlanFromInteractions } from "@/core/feedback/plan"
import type { AnyInteraction } from "@/core/interactions"
import type { ResponseDeclaration } from "@/core/item"

// --- Error Constants ---

export const ErrFeedbackMissingOverall = errors.new(
	"feedback must contain FEEDBACK__OVERALL"
)
export const ErrFeedbackOverallNotObject = errors.new(
	"FEEDBACK__OVERALL must be an object"
)
export const ErrFeedbackLeafAtRoot = errors.new(
	"feedback leaf node cannot be at the root"
)
export const ErrFeedbackInvalidNode = errors.new(
	"feedback tree contains non-object node"
)
export const ErrFeedbackNoCombinationForPath = errors.new(
	"no combination found for path"
)
export const ErrFeedbackExtraKeys = errors.new("feedback contains extra keys")
export const ErrFeedbackMissingLeaves = errors.new(
	"feedback is missing required leaves"
)
export const ErrFeedbackSchemaValidation = errors.new(
	"feedback schema validation"
)

// --- Nested Schema Builder ---

export function createFeedbackObjectSchema<
	P extends FeedbackPlan,
	const E extends readonly string[]
>(
	feedbackPlan: P,
	widgetTypeKeys: E
): z.ZodType<{ FEEDBACK__OVERALL: AuthoringFeedbackOverall<P, E> }> {
	const FeedbackContentSchema: z.ZodType<FeedbackContent<E>> =
		createFeedbackContentSchema(widgetTypeKeys)
	const LeafNodeSchema: z.ZodType<AuthoringNestedLeaf<E>> = z
		.object({ content: FeedbackContentSchema })
		.strict()

	let OverallSchema: z.ZodType<AuthoringFeedbackOverall<P, E>>
	if (feedbackPlan.mode === "fallback") {
		OverallSchema = z
			.object({
				CORRECT: LeafNodeSchema,
				INCORRECT: LeafNodeSchema
			})
			.strict()
	} else {
		type LeafT = AuthoringNestedLeaf<E>
		type NodeT = AuthoringNestedNode<P, E>
		if (feedbackPlan.dimensions.length === 0) {
			logger.error("combo feedback plan has no dimensions", {
				dimensionCount: 0
			})
			throw errors.new("combo feedback plan has no dimensions")
		}
		let current: z.ZodType<LeafT | NodeT> = LeafNodeSchema
		for (let i = feedbackPlan.dimensions.length - 1; i >= 0; i--) {
			const dimension = feedbackPlan.dimensions[i]
			if (!dimension) {
				logger.error("undefined dimension in feedback plan", {
					index: i,
					dimensionCount: feedbackPlan.dimensions.length
				})
				throw errors.new("undefined dimension in feedback plan")
			}
			const keys: readonly string[] =
				dimension.kind === "enumerated"
					? dimension.keys
					: ["CORRECT", "INCORRECT"]

			const innerShape: Record<string, z.ZodType<LeafT | NodeT>> = {}
			for (const key of keys) {
				innerShape[key] = current
			}
			const inner = z.object(innerShape).strict()

			const branchShape: Record<string, typeof inner> = {
				[dimension.responseIdentifier]: inner
			}
			const branch = z.object(branchShape).strict()
			current = branch
		}
		// biome-ignore lint: intentional narrowing
		OverallSchema = current as z.ZodType<NodeT>
	}

	const FeedbackObjectSchema = z
		.object({ FEEDBACK__OVERALL: OverallSchema })
		.strict()
	return FeedbackObjectSchema
}

// --- Validation and Conversion ---

export function validateFeedbackObject<
	P extends FeedbackPlan,
	const E extends readonly string[]
>(
	feedbackObject: unknown,
	feedbackPlan: P,
	widgetTypeKeys: E
): { FEEDBACK__OVERALL: AuthoringFeedbackOverall<P, E> } {
	const schema = createFeedbackObjectSchema(feedbackPlan, widgetTypeKeys)
	const result = schema.safeParse(feedbackObject)

	if (!result.success) {
		logger.error("feedback object validation", { error: result.error })
		throw errors.wrap(result.error, "feedback object validation")
	}

	return result.data
}

export function convertFeedbackObjectToBlocks<
	P extends FeedbackPlan,
	E extends readonly string[]
>(
	feedbackObject: {
		FEEDBACK__OVERALL: AuthoringFeedbackOverall<FeedbackPlan, E>
	},
	feedbackPlan: P
): Record<string, FeedbackContent<E>> {
	const blocks: Record<string, FeedbackContent<E>> = {}
	const overallFeedback = feedbackObject.FEEDBACK__OVERALL

	if (!overallFeedback || typeof overallFeedback !== "object") {
		logger.error("FEEDBACK__OVERALL is not an object during conversion", {
			overallFeedback
		})
		throw ErrFeedbackOverallNotObject
	}

	type FallbackOverall = {
		CORRECT: AuthoringNestedLeaf<E>
		INCORRECT: AuthoringNestedLeaf<E>
	}
	const isLeaf = (node: unknown): node is AuthoringNestedLeaf<E> => {
		if (typeof node !== "object" || node === null) return false
		return Object.hasOwn(node, "content")
	}
	const isFallbackOverall = (node: unknown): node is FallbackOverall => {
		if (typeof node !== "object" || node === null) return false
		const c = Reflect.get(node, "CORRECT")
		const i = Reflect.get(node, "INCORRECT")
		return isLeaf(c) && isLeaf(i)
	}
	const isNestedNode = (
		node: AuthoringFeedbackOverall<FeedbackPlan, E>
	): node is AuthoringNestedNode<FeedbackPlan, E> => {
		return !("CORRECT" in node && "INCORRECT" in node)
	}

	if (feedbackPlan.mode === "fallback") {
		if (!isFallbackOverall(overallFeedback)) {
			logger.error("invalid overall feedback shape for fallback", {
				overallFeedback
			})
			throw errors.new("invalid overall fallback feedback shape")
		}
		blocks.CORRECT = overallFeedback.CORRECT.content
		blocks.INCORRECT = overallFeedback.INCORRECT.content
		return blocks
	}

	const walk = (
		node: AuthoringNestedNode<FeedbackPlan, E> | AuthoringNestedLeaf<E>,
		path: Array<{ responseIdentifier: string; key: string }>
	): void => {
		if (isLeaf(node)) {
			if (path.length === 0) {
				logger.error("leaf node found at root of feedback object", { node })
				throw ErrFeedbackLeafAtRoot
			}
			const combination = feedbackPlan.combinations.find(
				(c: FeedbackPlan["combinations"][number]) =>
					c.path.length === path.length &&
					c.path.every(
						(
							seg: FeedbackPlan["combinations"][number]["path"][number],
							i: number
						) =>
							path[i] !== undefined &&
							seg.responseIdentifier === path[i].responseIdentifier &&
							seg.key === path[i].key
					)
			)
			if (!combination) {
				logger.error("no combination found for path", { pathSegments: path })
				throw ErrFeedbackNoCombinationForPath
			}
			blocks[combination.id] = node.content
			return
		}

		const branch = node
		for (const [responseIdentifier, keyed] of Object.entries(branch)) {
			if (typeof keyed !== "object" || keyed === null) {
				logger.error("invalid child node in feedback tree", {
					keyed,
					pathSegments: path
				})
				throw ErrFeedbackInvalidNode
			}
			for (const [subKey, subChild] of Object.entries(keyed)) {
				walk(subChild, [...path, { responseIdentifier, key: subKey }])
			}
		}
	}

	if (!isNestedNode(overallFeedback)) {
		logger.error("expected nested node in combo mode but got fallback shape")
		throw errors.new("expected nested node in combo mode")
	}
	walk(overallFeedback, [])

	const producedIds = new Set(Object.keys(blocks))
	const expectedIds = new Set(
		feedbackPlan.combinations.map(
			(c: FeedbackPlan["combinations"][number]) => c.id
		)
	)

	if (producedIds.size > expectedIds.size) {
		const extraKeys = [...producedIds].filter((id) => !expectedIds.has(id))
		logger.error("feedback contains extra keys", {
			dimensionCount: feedbackPlan.dimensions.length,
			combinationCount: feedbackPlan.combinations.length,
			extraKeys: extraKeys.slice(0, 5)
		})
		throw ErrFeedbackExtraKeys
	}

	if (producedIds.size < expectedIds.size) {
		const missingKeys = [...expectedIds].filter(
			(id: string) => !producedIds.has(id)
		)
		logger.error("feedback is missing required leaves", {
			dimensionCount: feedbackPlan.dimensions.length,
			combinationCount: feedbackPlan.combinations.length,
			missingKeys: missingKeys.slice(0, 5)
		})
		throw ErrFeedbackMissingLeaves
	}

	return blocks
}

export function buildEmptyNestedFeedback<
	P extends FeedbackPlan,
	E extends readonly string[] = readonly string[]
>(
	feedbackPlan: P
): { FEEDBACK__OVERALL: AuthoringFeedbackOverall<FeedbackPlan, E> } {
	function buildNode(
		dims: readonly FeedbackPlan["dimensions"][number][]
	): AuthoringNestedNode<FeedbackPlan, E> {
		if (dims.length === 0) {
			logger.error("no dimensions to build nested node")
			throw errors.new("no dimensions to build nested node")
		}
		const [currentDim, ...restDims] = dims
		const keys =
			currentDim.kind === "enumerated"
				? currentDim.keys
				: ["CORRECT", "INCORRECT"]
		const childIsLeaf = restDims.length === 0
		const child: AuthoringNestedLeaf<E> | AuthoringNestedNode<FeedbackPlan, E> =
			childIsLeaf
				? {
						content: {
							preamble: { correctness: "incorrect", summary: [] },
							steps: []
						}
					}
				: buildNode(restDims)
		const branch: Record<string, typeof child> = {}
		for (const key of keys) {
			branch[key] = child
		}
		return { [currentDim.responseIdentifier]: branch }
	}

	const overallFeedback: AuthoringFeedbackOverall<FeedbackPlan, E> =
		feedbackPlan.mode === "fallback"
			? {
					CORRECT: {
						content: {
							preamble: { correctness: "correct", summary: [] },
							steps: []
						}
					},
					INCORRECT: {
						content: {
							preamble: { correctness: "incorrect", summary: [] },
							steps: []
						}
					}
				}
			: buildNode(feedbackPlan.dimensions)

	return {
		FEEDBACK__OVERALL: overallFeedback
	}
}

export function buildFeedbackFromNestedForTemplate<
	const E extends readonly string[]
>(
	interactions: Record<string, AnyInteraction<E>>,
	responseDeclarations: ResponseDeclaration[],
	feedbackObject: {
		FEEDBACK__OVERALL: AuthoringFeedbackOverall<FeedbackPlan, E>
	},
	widgetTypeKeys: E
): {
	feedbackPlan: FeedbackPlan
	feedbackBlocks: Record<string, FeedbackContent<E>>
} {
	const plan = buildFeedbackPlanFromInteractions(
		interactions,
		responseDeclarations
	)
	validateFeedbackObject(feedbackObject, plan, widgetTypeKeys)
	const blocks = convertFeedbackObjectToBlocks(feedbackObject, plan)

	return { feedbackPlan: plan, feedbackBlocks: blocks }
}

// Flat schema and types DEPRECATED and removed from public exports
// Nested-only feedback authoring is the single canonical representation
