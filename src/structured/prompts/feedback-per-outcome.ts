import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"
import type { BlockContent } from "@/core/content"
import { createFeedbackContentSchema } from "@/core/content"
import type { FeedbackCombination, FeedbackPlan } from "@/core/feedback"
import type { AssessmentItemShell } from "@/core/item"
import type { WidgetCollection, WidgetDefinition, WidgetTypeTupleFrom } from "@/widgets/collections/types"
import type { AiContextEnvelope, ImageContext } from "../types"
import { createWidgetSelectionPromptSection, formatUnifiedContextSections } from "./shared"

// Strong types for the payload we expect the model to return
type Leaf<E extends readonly string[]> = { content: BlockContent<E> }
interface NestedNode<E extends readonly string[]> {
	[responseIdentifier: string]: {
		[key: string]: Leaf<E> | NestedNode<E>
	}
}
type Overall<E extends readonly string[]> = NestedNode<E> | { CORRECT: Leaf<E>; INCORRECT: Leaf<E> }
type FeedbackPayload<E extends readonly string[]> = { feedback: { FEEDBACK__OVERALL: Overall<E> } }

// For fallback shards: exactly one key is present per shard (CORRECT or INCORRECT)
type FallbackSinglePayload<E extends readonly string[]> = {
	feedback: { FEEDBACK__OVERALL: { CORRECT?: Leaf<E>; INCORRECT?: Leaf<E> } }
}

/**
 * Builds a single-path nested Zod schema for a specific feedback combination.
 * This schema ONLY includes the target keys at each level, completely avoiding enum explosion.
 * Always returns a schema for a NestedNode<E> (not the leaf).
 */
function buildSinglePathOverallSchema<E extends readonly string[]>(
	dimensions: readonly FeedbackPlan["dimensions"][number][],
	targetPath: readonly FeedbackCombination["path"][number][],
	leafSchema: z.ZodType<Leaf<E>>
): z.ZodType<NestedNode<E>> {
	if (dimensions.length === 0) {
		// This function is only called in combo mode where at least one dimension exists at entry.
		// If we reach here, the caller logic is inconsistent.
		logger.error("no dimensions for single-path builder")
		throw errors.new("no dimensions for single-path builder")
	}

	if (dimensions.length === 1) {
		const lastDim = dimensions[0]
		const seg = targetPath[0]
		if (!lastDim || !seg) {
			logger.error("invalid single-path parameters", {
				dimensionCount: dimensions.length,
				targetPathLength: targetPath.length
			})
			throw errors.new("invalid single-path parameters")
		}
		const branch = z.object({ [seg.key]: leafSchema }).strict()
		const response = z.object({ [lastDim.responseIdentifier]: branch }).strict()
		return response
	}

	const currentDim = dimensions[0]
	const targetSegment = targetPath[0]
	if (!currentDim || !targetSegment) {
		logger.error("invalid multi-segment parameters", {
			dimensionCount: dimensions.length,
			targetPathLength: targetPath.length
		})
		throw errors.new("invalid multi-segment parameters")
	}
	const inner = buildSinglePathOverallSchema<E>(dimensions.slice(1), targetPath.slice(1), leafSchema)
	const branch = z.object({ [targetSegment.key]: inner }).strict()
	const response = z.object({ [currentDim.responseIdentifier]: branch }).strict()
	return response
}

/**
 * Builds a JSON skeleton showing the exact single path for the prompt example.
 */
function buildSinglePathJsonSkeleton(
	targetPath: readonly FeedbackCombination["path"][number][]
): Record<string, unknown> {
	const result: Record<string, unknown> = {}
	let current: Record<string, unknown> = result

	for (const segment of targetPath) {
		const branch: Record<string, unknown> = {}
		current[segment.responseIdentifier] = branch
		const next: Record<string, unknown> = {}
		branch[segment.key] = next
		current = next
	}
	current.content = []

	return {
		feedback: {
			FEEDBACK__OVERALL: result
		}
	}
}

/**
 * Creates a feedback generation prompt for a single outcome. The dynamically-generated
 * Zod schema enforces a nested structure with only one valid path to a leaf node.
 */
export function createPerOutcomeNestedFeedbackPrompt<
	C extends WidgetCollection<Record<string, WidgetDefinition<unknown, unknown>>, readonly string[]>
>(
	envelope: AiContextEnvelope,
	assessmentShell: AssessmentItemShell<WidgetTypeTupleFrom<C>>,
	feedbackPlan: FeedbackPlan,
	combination: FeedbackCombination,
	widgetCollection: C,
	imageContext: ImageContext
): {
	systemInstruction: string
	userContent: string
	SinglePathSchema: z.ZodType<FeedbackPayload<WidgetTypeTupleFrom<C>> | FallbackSinglePayload<WidgetTypeTupleFrom<C>>>
} {
	const ContentSchema: z.ZodType<BlockContent<WidgetTypeTupleFrom<C>>> = createFeedbackContentSchema(
		widgetCollection.widgetTypeKeys
	)

	let SinglePathSchema: z.ZodType<
		FeedbackPayload<WidgetTypeTupleFrom<C>> | FallbackSinglePayload<WidgetTypeTupleFrom<C>>
	>
	if (feedbackPlan.mode === "fallback") {
		const LeafSchema: z.ZodType<Leaf<WidgetTypeTupleFrom<C>>> = z.object({ content: ContentSchema }).strict()
		// Single-key schema: only the targeted key (CORRECT or INCORRECT) is required per shard
		const TargetedOverall = z.object({ [combination.id]: LeafSchema }).strict()
		SinglePathSchema = z.object({ feedback: z.object({ FEEDBACK__OVERALL: TargetedOverall }).strict() }).strict()
	} else {
		const LeafSchema: z.ZodType<Leaf<WidgetTypeTupleFrom<C>>> = z.object({ content: ContentSchema }).strict()
		const SinglePathOverall: z.ZodType<NestedNode<WidgetTypeTupleFrom<C>>> = buildSinglePathOverallSchema<
			WidgetTypeTupleFrom<C>
		>(feedbackPlan.dimensions, combination.path, LeafSchema)
		SinglePathSchema = z.object({ feedback: z.object({ FEEDBACK__OVERALL: SinglePathOverall }).strict() }).strict()
	}

	const nestedPathStr =
		feedbackPlan.mode === "fallback"
			? `Overall outcome: ${combination.id}`
			: combination.path.map((seg) => `${seg.responseIdentifier} → ${seg.key}`).join(", ")

	const jsonSkeleton =
		feedbackPlan.mode === "fallback"
			? JSON.stringify(
					{
						feedback: {
							FEEDBACK__OVERALL: {
								[combination.id]: {
									content: []
								}
							}
						}
					},
					null,
					2
				)
			: JSON.stringify(buildSinglePathJsonSkeleton(combination.path), null, 2)

	const systemInstruction = `You are an expert in educational content. Your task is to generate specific, high-quality feedback for a single student outcome in an assessment item.

**⚠️ CRITICAL: GRAMMATICAL ERROR CORRECTION ⚠️**
WE MUST correct any grammatical errors found in the source Perseus content. This includes:
- Spelling mistakes in words and proper nouns
- Incorrect punctuation, capitalization, and sentence structure
- Subject-verb disagreement and other grammatical issues
- Awkward phrasing that impacts clarity
- Missing or incorrect articles (a, an, the)

The goal is to produce clean, professional educational content that maintains the original meaning while fixing any language errors present in the source material.

QUALITY RUBRIC:
1. Immediate Response: Acknowledge the specific combination of answers.
2. Conceptual Explanation: Explain the 'why' behind the answer for this specific path.
3. Remedial Guidance: If incorrect, identify the likely misconception for this path and provide clear corrective steps.
4. Learning Path: Suggest what the student should review next based on this outcome.

**CRITICAL**: You are writing feedback for ONLY ONE outcome. Focus all your explanation and guidance on the specific combination of answers provided. Your output must conform to a strict, single-path nested JSON schema.`

	const widgetSelectionSection = createWidgetSelectionPromptSection(widgetCollection)

	const userContent = `Generate feedback for ONLY the outcome specified below.

${formatUnifiedContextSections(envelope, imageContext)}

${widgetSelectionSection}

## Assessment Context
\`\`\`json
${JSON.stringify(assessmentShell, null, 2)}
\`\`\`

## TARGET OUTCOME NESTED PATH
- ${nestedPathStr}

## REQUIRED OUTPUT STRUCTURE (fill content at the exact nested location)
\`\`\`json
${jsonSkeleton}
\`\`\`

## Instructions:
1. Analyze the assessment and the specific answer path for this outcome.
2. Generate a specific, high-quality feedback message for this single case.
3. Place the generated feedback (as a BlockContent array) into the "content" field at the exact nested path shown in the structure above.
4. Your response must conform strictly to the provided JSON schema.`

	return { systemInstruction, userContent, SinglePathSchema }
}
