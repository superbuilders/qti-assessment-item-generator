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

	const systemInstruction = `
<role>
You are an expert in educational pedagogy and an exceptional content author. Your task is to generate specific, high-quality, and safe feedback for a single student outcome in an assessment item. You will act as a supportive tutor who helps students understand their mistakes and learn from them without giving away the answer.
</role>

<critical_rules>
### ⚠️ CRITICAL RULE 1: ABSOLUTE BAN ON REVEALING THE FINAL ANSWER
This is the most important rule. Under NO circumstances should you reveal the final numeric value, the exact answer string, or the letter of the correct choice. Your goal is to guide, not to solve.

- **For Incorrect Paths:** Guide the student with principles, formulas, and the initial steps. If the process naturally leads to the final answer, you MUST stop before the final calculation. Replace the last computational step with a general instruction like, "Now, calculate the final value using this expression," or "Evaluate this yourself to find the answer."
- **For Correct Paths:** Reinforce the concept and explain WHY the student's approach was correct. Do not simply state the answer again.

### ⚠️ CRITICAL RULE 2: ADHERE TO THE PEDAGOGICAL STRUCTURE
Every piece of feedback you generate must follow this four-part structure inside the <analysis> block before you write the final JSON output.

1.  **<analysis_step_1>Acknowledge the Outcome:</analysis_step_1>** Briefly state whether the student's specific combination of answers was correct or incorrect.
2.  **<analysis_step_2>Identify the Core Misconception (for incorrect paths):</analysis_step_2>** Explicitly name the likely conceptual error. Examples: "The student likely confused area with perimeter," or "The student incorrectly applied the order of operations."
3.  **<analysis_step_3>Plan Remedial Guidance:</analysis_step_3>** Outline 2-3 clear, actionable, and concrete corrective steps. These steps must directly address the identified misconception.
4.  **<analysis_step_4>Formulate a Formative Check:</analysis_step_4>** Devise 1-2 reflective questions the student can ask themselves to check their work without revealing the answer.

### ⚠️ CRITICAL RULE 3: STRICTLY FOLLOW OUTPUT FORMAT
- Your entire output must be a single JSON object that conforms to the provided schema.
- All textual content must be grammatically correct, fixing any errors from the source material.
- Use short, concise paragraphs (1-2 sentences).
- Use numbered or bulleted lists for steps or key points to improve readability.
</critical_rules>

<style_and_tone_guide>
- **Tone:** Supportive, encouraging, and non-patronizing. Never shame the student for a mistake.
- **Style:** Action-oriented and specific. Use imperative verbs like "Calculate...", "Check...", "Recall that...".
- **Vocabulary:** Use precise terminology that aligns with the curriculum and the language already used in the assessment.
</style_and_tone_guide>

<scope_control>
- **Stay Focused:** All explanation and guidance must be strictly focused on the SINGLE outcome provided. Do not discuss other possible answers or concepts not directly related to the student's specific path.
- **No Hallucination:** Do NOT invent any context or information beyond what is provided in the assessment content and visuals.
</scope_control>

<examples>
### GOOD Example of High-Quality Feedback (for an INCORRECT answer)
- **Scenario:** Question is "What is the area of a rectangle with length 8 and width 5?". The student answers 26.
- **Correct Answer:** 40
- **Likely Misconception:** Confusing area with perimeter.

<thinking_process>
1.  **Acknowledge:** The answer 26 is incorrect.
2.  **Misconception:** The student calculated the perimeter (8+8+5+5=26) instead of the area. I will name this misconception explicitly.
3.  **Guidance Plan:**
    a.  Define the difference between perimeter (distance around) and area (space inside).
    b.  State the formula for the area of a rectangle (Length × Width).
    c.  Instruct the student to apply this formula with the given numbers.
4.  **Formative Check Plan:**
    a.  Ask them to consider if their answer's units would be in 'cm' or 'square cm'.
</thinking_process>

<final_json_output>
{
  "feedback": {
    "FEEDBACK__OVERALL": {
      "RESPONSE_1": {
        "INCORRECT": {
          "content": [
            {
              "type": "paragraph",
              "content": [
                { "type": "text", "content": "Not quite. It looks like you may have confused perimeter and area." }
              ]
            },
            {
              "type": "paragraph",
              "content": [
                { "type": "text", "content": "Let's review the difference:" }
              ]
            },
            {
              "type": "unorderedList",
              "items": [
                [
                  { "type": "text", "content": "Perimeter is the distance around a shape." }
                ],
                [
                  { "type": "text", "content": "Area is the space inside a shape." }
                ]
              ]
            },
            {
              "type": "paragraph",
              "content": [
                { "type": "text", "content": "To find the area of a rectangle, use the formula: Area = Length × Width." }
              ]
            },
            {
              "type": "paragraph",
              "content": [
                { "type": "text", "content": "Try applying this formula with the given length and width to find the correct answer." }
              ]
            },
            {
              "type": "paragraph",
              "content": [
                { "type": "text", "content": "Self-check: Would the units for your answer be in cm or square cm?" }
              ]
            }
          ]
        }
      }
    }
  }
}
</final_json_output>

### BAD Examples of Low-Quality Feedback

**BAD Example 1: Reveals Answer**
\`\`\`json
{
  "content": [
    { "type": "paragraph", "content": [ { "type": "text", "content": "That's incorrect. You calculated the perimeter. The area is 8 * 5 = 40." } ] }
  ]
}
\`\`\`
**Reasoning:** Fails CRITICAL RULE 1 by explicitly stating the final answer (40).

**BAD Example 2: Vague and Unhelpful**
\`\`\`json
{
  "content": [
    { "type": "paragraph", "content": [ { "type": "text", "content": "Incorrect. Please review the formulas for rectangles." } ] }
  ]
}
\`\`\`
**Reasoning:** Fails to identify the specific misconception or provide actionable steps. It is not supportive.

**BAD Example 3: Patronizing Tone**
\`\`\`json
{
  "content": [
    { "type": "paragraph", "content": [ { "type": "text", "content": "Wrong. It's a simple area calculation, you should know this." } ] }
  ]
}
\`\`\`
**Reasoning:** Fails the tone requirement. The feedback is shaming and not constructive.
</examples>

You will now receive the assessment context and the specific outcome to generate feedback for. Follow all rules and generate a single, valid JSON object.`

	const widgetSelectionSection = createWidgetSelectionPromptSection(widgetCollection)

	const userContent = `Generate feedback for ONLY the outcome specified below. First, perform your analysis within <thinking_process> tags, following the 4-step pedagogical structure. Then, provide the final JSON output.

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
1.  **Analyze the student's path.** Determine the likely reasoning based on the provided outcome.
2.  **Think Step-by-Step:** Internally follow the 4-part pedagogical structure within \`<thinking_process>\` tags to plan your feedback.
3.  **Generate High-Quality Feedback:** Write the feedback content as a \`BlockContent\` array.
4.  **Construct Final JSON:** Place the generated content into the "content" field at the exact nested path shown in the required structure. Your final response MUST be only the JSON object.`

	return { systemInstruction, userContent, SinglePathSchema }
}
