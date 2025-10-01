import type { BlockContent } from "@/core/content"
import { createBlockContentSchema } from "@/core/content"
import type { AnyInteraction } from "@/core/interactions"
import type { ResponseDeclaration } from "@/core/item"
import { toJSONSchemaPromptSafe } from "@/core/json-schema"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { WidgetTypeTuple } from "@/widgets/collections/types"
import { z } from "zod"
import type { FeedbackPlan } from "../plan"
import { buildFeedbackPlanFromInteractions } from "../plan"

// --- Error Constants ---

export const ErrFeedbackMissingOverall = errors.new("feedback must contain FEEDBACK__OVERALL")
export const ErrFeedbackOverallNotObject = errors.new("FEEDBACK__OVERALL must be an object")
export const ErrFeedbackLeafAtRoot = errors.new("feedback leaf node cannot be at the root")
export const ErrFeedbackInvalidNode = errors.new("feedback tree contains non-object node")
export const ErrFeedbackNoCombinationForPath = errors.new("no combination found for path")
export const ErrFeedbackExtraKeys = errors.new("feedback contains extra keys")
export const ErrFeedbackMissingLeaves = errors.new("feedback is missing required leaves")
export const ErrFeedbackSchemaValidation = errors.new("feedback schema validation")

import type {
	AuthoringFeedbackOverall,
	AuthoringNestedLeaf,
	AuthoringNestedNode,
	NestedFeedbackAuthoring
} from "./types"

// --- Core Utilities ---

/**
 * Builds the nested exact-object Zod schema for feedback authoring strictly from a FeedbackPlan.
 */
export function createNestedFeedbackZodSchema<P extends FeedbackPlan, const E extends WidgetTypeTuple>(
	feedbackPlan: P,
	widgetTypeKeys: E
): z.ZodType<NestedFeedbackAuthoring<P, E>> {
	// Leaf schema is fully typed to AuthoringNestedLeaf<E>
	const ScopedBlockContentSchema: z.ZodType<BlockContent<E>> = createBlockContentSchema(widgetTypeKeys)
	const LeafNodeSchema: z.ZodType<AuthoringNestedLeaf<E>> = z.object({ content: ScopedBlockContentSchema }).strict()

	// Build overall feedback shape imperatively without z.lazy
	let OverallSchema: z.ZodType<AuthoringFeedbackOverall<P, E>>
	if (feedbackPlan.mode === "fallback") {
		OverallSchema = z
			.object({
				CORRECT: LeafNodeSchema,
				INCORRECT: LeafNodeSchema
			})
			.strict()
	} else {
		// Build nested node from innermost dimension outward
		type LeafT = AuthoringNestedLeaf<E>
		type NodeT = AuthoringNestedNode<P, E>
		if (feedbackPlan.dimensions.length === 0) {
			logger.error("combo feedback plan has no dimensions", { dimensionCount: 0 })
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
			const keys: readonly string[] = dimension.kind === "enumerated" ? dimension.keys : ["CORRECT", "INCORRECT"]

			const innerShape: Record<string, z.ZodType<LeafT | NodeT>> = {}
			for (const key of keys) {
				innerShape[key] = current
			}
			const inner = z.object(innerShape).strict()

			const branchShape: Record<string, typeof inner> = { [dimension.responseIdentifier]: inner }
			const branch = z.object(branchShape).strict()
			// current now narrows toward NodeT as outer dimensions are wrapped
			current = branch
		}
		// current is NodeT at this point by construction
		// biome-ignore lint: this is fine
		OverallSchema = current as z.ZodType<NodeT>
	}

	const FeedbackMapSchema = z.object({ FEEDBACK__OVERALL: OverallSchema }).strict()
	const Schema = z.object({ feedback: FeedbackMapSchema }).strict()
	return Schema
}

/**
 * Validates a nested feedback object against the dynamically generated schema.
 */
// Type guards are unnecessary when Zod schemas are precisely typed.

function isNestedFeedbackAuthoring<E extends WidgetTypeTuple>(
	val: unknown
): val is NestedFeedbackAuthoring<FeedbackPlan, E> {
	if (typeof val !== "object" || val === null) return false
	const feedback = Reflect.get(val, "feedback")
	if (typeof feedback !== "object" || feedback === null) return false
	const overall = Reflect.get(feedback, "FEEDBACK__OVERALL")
	return typeof overall === "object" && overall !== null
}

export function validateNestedFeedback<P extends FeedbackPlan, const E extends WidgetTypeTuple>(
	nested: unknown,
	feedbackPlan: P,
	widgetTypeKeys: E
): NestedFeedbackAuthoring<P, E> {
	const schema = createNestedFeedbackZodSchema(feedbackPlan, widgetTypeKeys)
	const result = schema.safeParse(nested)

	if (!result.success) {
		logger.error("feedback schema validation", { error: result.error })
		throw errors.wrap(result.error, "feedback schema validation")
	}

	const data = result.data
	if (!isNestedFeedbackAuthoring<E>(data)) {
		logger.error("feedback schema validation type guard failed")
		throw errors.new("feedback schema validation type guard failed")
	}
	return data
}

/**
 * Deterministically flattens a validated nested feedback object into the compiler's canonical block map.
 */
export function convertNestedFeedbackToBlocks<P extends FeedbackPlan, E extends WidgetTypeTuple>(
	nested: NestedFeedbackAuthoring<FeedbackPlan, E>,
	feedbackPlan: P
): Record<string, BlockContent<E>> {
	const blocks: Record<string, BlockContent<E>> = {}
	const overallFeedback = nested.feedback.FEEDBACK__OVERALL

	if (!overallFeedback || typeof overallFeedback !== "object") {
		logger.error("FEEDBACK__OVERALL is not an object during conversion", { overallFeedback })
		throw ErrFeedbackOverallNotObject
	}

	// Local type helpers (no assertions; structural checks only)
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

	// Fallback mode: FEEDBACK__OVERALL holds CORRECT/INCORRECT leaves directly
	if (feedbackPlan.mode === "fallback") {
		if (!isFallbackOverall(overallFeedback)) {
			logger.error("invalid overall feedback shape for fallback", { overallFeedback })
			throw errors.new("invalid overall fallback feedback shape")
		}
		blocks.CORRECT = overallFeedback.CORRECT.content
		blocks.INCORRECT = overallFeedback.INCORRECT.content
		return blocks
	}

	// Nested mode: recursively walk the object graph
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
						(seg: FeedbackPlan["combinations"][number]["path"][number], i: number) =>
							path[i] !== undefined && seg.responseIdentifier === path[i].responseIdentifier && seg.key === path[i].key
					)
			)
			if (!combination) {
				logger.error("no combination found for path", { pathSegments: path })
				throw ErrFeedbackNoCombinationForPath
			}
			blocks[combination.id] = node.content
			return
		}

		// Otherwise treat as branch: responseIdentifier -> keys -> child
		const branch = node
		for (const [responseIdentifier, keyed] of Object.entries(branch)) {
			// keyed must be a record of key -> child nodes
			if (typeof keyed !== "object" || keyed === null) {
				logger.error("invalid child node in feedback tree", { keyed, pathSegments: path })
				throw ErrFeedbackInvalidNode
			}
			for (const [subKey, subChild] of Object.entries(keyed)) {
				walk(subChild, [...path, { responseIdentifier, key: subKey }])
			}
		}
	}

	// Narrow from AuthoringFeedbackOverall to AuthoringNestedNode
	if (!isNestedNode(overallFeedback)) {
		logger.error("expected nested node in combo mode but got fallback shape")
		throw errors.new("expected nested node in combo mode")
	}
	walk(overallFeedback, [])

	const producedIds = new Set(Object.keys(blocks))
	const expectedIds = new Set(feedbackPlan.combinations.map((c: FeedbackPlan["combinations"][number]) => c.id))

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
		const missingKeys = [...expectedIds].filter((id: string) => !producedIds.has(id))
		logger.error("feedback is missing required leaves", {
			dimensionCount: feedbackPlan.dimensions.length,
			combinationCount: feedbackPlan.combinations.length,
			missingKeys: missingKeys.slice(0, 5)
		})
		throw ErrFeedbackMissingLeaves
	}

	return blocks
}

/**
 * Produces an empty, structurally complete nested object for templating or UI initialization.
 */
export function buildEmptyNestedFeedback<P extends FeedbackPlan, E extends WidgetTypeTuple = WidgetTypeTuple>(
	feedbackPlan: P
): NestedFeedbackAuthoring<FeedbackPlan, E> {
	function buildNode(dims: readonly FeedbackPlan["dimensions"][number][]): AuthoringNestedNode<FeedbackPlan, E> {
		if (dims.length === 0) {
			// Should never happen for combo mode; guarded by caller
			logger.error("no dimensions to build nested node")
			throw errors.new("no dimensions to build nested node")
		}
		const [currentDim, ...restDims] = dims
		const keys = currentDim.kind === "enumerated" ? currentDim.keys : ["CORRECT", "INCORRECT"]
		const childIsLeaf = restDims.length === 0
		const child: AuthoringNestedLeaf<E> | AuthoringNestedNode<FeedbackPlan, E> = childIsLeaf
			? { content: [] }
			: buildNode(restDims)
		const branch: Record<string, typeof child> = {}
		for (const key of keys) {
			branch[key] = child
		}
		return { [currentDim.responseIdentifier]: branch }
	}

	const overallFeedback: AuthoringFeedbackOverall<FeedbackPlan, E> =
		feedbackPlan.mode === "fallback"
			? { CORRECT: { content: [] }, INCORRECT: { content: [] } }
			: buildNode(feedbackPlan.dimensions)

	return {
		feedback: {
			FEEDBACK__OVERALL: overallFeedback
		}
	}
}

/**
 * Returns both the Zod schema and a prompt-safe JSON Schema for use in LLM calls.
 */
export function createNestedFeedbackPromptArtifacts<P extends FeedbackPlan, const E extends WidgetTypeTuple>(
	feedbackPlan: P,
	widgetTypeKeys: E
): { FeedbackSchema: z.ZodType; jsonSchema: unknown } {
	const FeedbackSchema = createNestedFeedbackZodSchema(feedbackPlan, widgetTypeKeys)
	const jsonSchemaResult = errors.trySync(() => toJSONSchemaPromptSafe(FeedbackSchema))

	if (jsonSchemaResult.error) {
		logger.error("failed to create JSON schema for feedback prompt", {
			error: jsonSchemaResult.error
		})
		throw errors.wrap(jsonSchemaResult.error, "json schema generation")
	}

	return {
		FeedbackSchema,
		jsonSchema: jsonSchemaResult.data
	}
}

/**
 * Optional helper for templates: builds a complete feedback plan and block map from a nested object.
 */
export function buildFeedbackFromNestedForTemplate<const E extends WidgetTypeTuple>(
	interactions: Record<string, AnyInteraction<E>>,
	responseDeclarations: ResponseDeclaration[],
	nested: NestedFeedbackAuthoring<FeedbackPlan, E>,
	widgetTypeKeys: E
): { feedbackPlan: FeedbackPlan; feedbackBlocks: Record<string, BlockContent<E>> } {
	const plan = buildFeedbackPlanFromInteractions(interactions, responseDeclarations)
	validateNestedFeedback(nested, plan, widgetTypeKeys) // Throws on failure
	const blocks = convertNestedFeedbackToBlocks(nested, plan)

	return { feedbackPlan: plan, feedbackBlocks: blocks }
}
