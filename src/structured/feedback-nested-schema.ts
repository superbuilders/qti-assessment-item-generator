import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"
import type { AnyInteraction, BlockContent, FeedbackPlan, ResponseDeclaration } from "../compiler/schemas"
import type { WidgetCollection } from "../widgets/collections/types"
import { createBlockContentSchema } from "./block-content-schema"
import { buildFeedbackPlanFromInteractions } from "./feedback-plan-builder"
import { toJSONSchemaPromptSafe } from "./json-schema"

// --- Error Constants ---

export const ErrFeedbackMissingOverall = errors.new("feedback must contain FEEDBACK__OVERALL")
export const ErrFeedbackOverallNotObject = errors.new("FEEDBACK__OVERALL must be an object")
export const ErrFeedbackLeafAtRoot = errors.new("feedback leaf node cannot be at the root")
export const ErrFeedbackInvalidNode = errors.new("feedback tree contains non-object node")
export const ErrFeedbackNoCombinationForPath = errors.new("no combination found for path")
export const ErrFeedbackExtraKeys = errors.new("feedback contains extra keys")
export const ErrFeedbackMissingLeaves = errors.new("feedback is missing required leaves")
export const ErrFeedbackSchemaValidation = errors.new("feedback schema validation")

// --- Strict Authoring Types (no `unknown`), parameterized by plan and content ---
// NOTE: BlockContent is validated collection-scoped at runtime via Zod.
// For static types, we keep ContentT defaulting to BlockContent.
export type ResponseIdentifierLiteral<P extends FeedbackPlan> = P["dimensions"][number]["responseIdentifier"]
export type AuthoringNestedLeaf<ContentT = BlockContent> = { content: ContentT }
export type AuthoringNestedNode<P extends FeedbackPlan, ContentT = BlockContent> = {
	[R in ResponseIdentifierLiteral<P>]: {
		[key: string]: AuthoringNestedLeaf<ContentT> | AuthoringNestedNode<P, ContentT>
	}
}
export type AuthoringFeedbackOverall<P extends FeedbackPlan, ContentT = BlockContent> =
	| { CORRECT: AuthoringNestedLeaf<ContentT>; INCORRECT: AuthoringNestedLeaf<ContentT> }
	| AuthoringNestedNode<P, ContentT>
export type NestedFeedbackAuthoring<P extends FeedbackPlan, ContentT = BlockContent> = {
	feedback: { FEEDBACK__OVERALL: AuthoringFeedbackOverall<P, ContentT> }
}

// --- Core Utilities ---

/**
 * Builds the nested exact-object Zod schema for feedback authoring strictly from a FeedbackPlan.
 */
export function createNestedFeedbackZodSchema<P extends FeedbackPlan>(
    feedbackPlan: P,
    collection: WidgetCollection
): z.ZodType<NestedFeedbackAuthoring<FeedbackPlan>> {
	const ScopedBlockContentSchema = createBlockContentSchema(collection)
	const LeafNodeSchema = z.object({ content: ScopedBlockContentSchema }).strict()

    // Use ZodTypeAny internally; exported function type constrains the outer object
    let overallFeedbackShape: z.ZodType
	if (feedbackPlan.mode === "fallback") {
		overallFeedbackShape = z
			.object({
				CORRECT: LeafNodeSchema,
				INCORRECT: LeafNodeSchema
			})
			.strict()
	} else {
		// Recursively build the nested shape from the inside out.
        let current: z.ZodType = LeafNodeSchema
		for (let i = feedbackPlan.dimensions.length - 1; i >= 0; i--) {
			const dimension = feedbackPlan.dimensions[i]
			if (!dimension) {
				logger.error("undefined dimension in feedback plan", { index: i, dimensionCount: feedbackPlan.dimensions.length })
				throw errors.new("undefined dimension in feedback plan")
			}
            const shapeEntries: Record<string, z.ZodType> = {}
			const keys = dimension.kind === "enumerated" ? dimension.keys : ["CORRECT", "INCORRECT"]

			for (const key of keys) {
				shapeEntries[key] = current
			}

            const inner = z.object(shapeEntries).strict()
            current = z.object({ [dimension.responseIdentifier]: inner }).strict()
		}
		overallFeedbackShape = current
	}

    const FeedbackMapSchema = z.object({ FEEDBACK__OVERALL: overallFeedbackShape }).strict()
    return z.object({ feedback: FeedbackMapSchema }).strict()
}

/**
 * Validates a nested feedback object against the dynamically generated schema.
 */
function isNestedFeedbackAuthoring(
    val: unknown
): val is NestedFeedbackAuthoring<FeedbackPlan> {
    if (typeof val !== "object" || val === null) return false
    const v = val as Record<string, unknown>
    if (!("feedback" in v) || typeof v.feedback !== "object" || v.feedback === null) return false
    const f = v.feedback as Record<string, unknown>
    return "FEEDBACK__OVERALL" in f && typeof f.FEEDBACK__OVERALL === "object" && f.FEEDBACK__OVERALL !== null
}

export function validateNestedFeedback<P extends FeedbackPlan>(
    nested: unknown,
    feedbackPlan: P,
    collection: WidgetCollection
): NestedFeedbackAuthoring<FeedbackPlan> {
    const schema = createNestedFeedbackZodSchema(feedbackPlan, collection)
	const result = schema.safeParse(nested)

    if (!result.success) {
        logger.error("feedback schema validation", { error: result.error })
        throw errors.wrap(result.error, "feedback schema validation")
    }

    const data = result.data
    if (!isNestedFeedbackAuthoring(data)) {
        logger.error("feedback schema validation type guard failed")
        throw errors.new("feedback schema validation type guard failed")
    }
    return data
}

/**
 * Deterministically flattens a validated nested feedback object into the compiler's canonical block map.
 */
export function convertNestedFeedbackToBlocks<P extends FeedbackPlan>(
    nested: NestedFeedbackAuthoring<FeedbackPlan>,
    feedbackPlan: P
): Record<string, BlockContent> {
	const blocks: Record<string, BlockContent> = {}
	const overallFeedback = nested.feedback.FEEDBACK__OVERALL

	if (!overallFeedback || typeof overallFeedback !== "object") {
		logger.error("FEEDBACK__OVERALL is not an object during conversion", { overallFeedback })
		throw ErrFeedbackOverallNotObject
	}

	const isLeafNode = (node: unknown): node is AuthoringNestedLeaf =>
		typeof node === "object" &&
		node !== null &&
		"content" in (node as Record<string, unknown>) &&
		Array.isArray((node as Record<string, unknown>).content as unknown[])

	const walk = (node: unknown, path: Array<{ responseIdentifier: string; key: string }>): void => {
		if (typeof node !== "object" || node === null) {
			logger.error("invalid node in feedback tree", { node, pathSegments: path })
			throw ErrFeedbackInvalidNode
		}

		if (isLeafNode(node)) {
			if (path.length === 0) {
				logger.error("leaf node found at root of feedback object", { node })
				throw ErrFeedbackLeafAtRoot
			}
			const combination = feedbackPlan.combinations.find(
				(c) =>
					c.path.length === path.length &&
					c.path.every(
						(seg, i) =>
							path[i] && seg.responseIdentifier === path[i].responseIdentifier && seg.key === path[i].key
					)
			)
			if (!combination) {
				logger.error("no combination found for path", { pathSegments: path })
				throw ErrFeedbackNoCombinationForPath
			}
			blocks[combination.id] = node.content
			return
		}

		for (const [key, child] of Object.entries(node)) {
			// In our nested structure, the key is the responseIdentifier, and its value is an object of keys.
			const responseIdentifier = key
			if (typeof child !== "object" || child === null) {
				logger.error("invalid child node in feedback tree", { child, pathSegments: path })
				throw ErrFeedbackInvalidNode
			}
			for (const [subKey, subChild] of Object.entries(child)) {
				walk(subChild, [...path, { responseIdentifier, key: subKey }])
			}
		}
	}

	walk(overallFeedback, [])

	const producedIds = new Set(Object.keys(blocks))
	const expectedIds = new Set(feedbackPlan.combinations.map((c) => c.id))

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
		const missingKeys = [...expectedIds].filter((id) => !producedIds.has(id))
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
export function buildEmptyNestedFeedback<P extends FeedbackPlan>(
    feedbackPlan: P
): NestedFeedbackAuthoring<FeedbackPlan> {
    function buildNode(
        dims: readonly FeedbackPlan["dimensions"][number][]
    ): AuthoringNestedNode<FeedbackPlan> {
        if (dims.length === 0) {
            // Should never happen for combo mode; guarded by caller
            logger.error("no dimensions to build nested node")
            throw errors.new("no dimensions to build nested node")
        }
        const [currentDim, ...restDims] = dims
        const keys = currentDim.kind === "enumerated" ? currentDim.keys : ["CORRECT", "INCORRECT"]
        const childIsLeaf = restDims.length === 0
        const child: AuthoringNestedLeaf | AuthoringNestedNode<FeedbackPlan> = childIsLeaf
            ? { content: [] }
            : buildNode(restDims)
        const branch: Record<string, typeof child> = {}
        for (const key of keys) {
            branch[key] = child
        }
        return { [currentDim.responseIdentifier]: branch }
    }

    const overallFeedback: AuthoringFeedbackOverall<FeedbackPlan> =
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
export function createNestedFeedbackPromptArtifacts<P extends FeedbackPlan>(
    feedbackPlan: P,
    collection: WidgetCollection
): { FeedbackSchema: z.ZodType; jsonSchema: unknown } {
	const FeedbackSchema = createNestedFeedbackZodSchema(feedbackPlan, collection)
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
export function buildFeedbackFromNestedForTemplate(
	interactions: Record<string, AnyInteraction>,
	responseDeclarations: ResponseDeclaration[],
	nested: NestedFeedbackAuthoring<FeedbackPlan>,
	collection: WidgetCollection
): { feedbackPlan: FeedbackPlan; feedbackBlocks: Record<string, BlockContent> } {
	const plan = buildFeedbackPlanFromInteractions(interactions, responseDeclarations)
	validateNestedFeedback(nested, plan, collection) // Throws on failure
	const blocks = convertNestedFeedbackToBlocks(nested, plan)

	return { feedbackPlan: plan, feedbackBlocks: blocks }
}
