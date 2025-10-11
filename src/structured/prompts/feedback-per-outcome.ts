import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"
import type { BlockContent } from "@/core/content"
import { createFeedbackContentSchema } from "@/core/content"
import type { FeedbackCombination, FeedbackPlan } from "@/core/feedback"
import type { AnyInteraction } from "@/core/interactions"
import type { AssessmentItemShell } from "@/core/item"
import type { WidgetCollection, WidgetDefinition, WidgetTypeTupleFrom } from "@/widgets/collections/types"
import type { AiContextEnvelope, ImageContext } from "../types"
import { createWidgetSelectionPromptSection, formatUnifiedContextSections } from "./shared"

type ShallowFeedbackPayload<E extends readonly string[]> = {
	content: BlockContent<E>
}

/**
 * Creates a feedback generation prompt for a single outcome with a shallow schema.
 * The schema is now a simple `{ content: BlockContent }` object, and all contextual
 * information about the outcome is encoded directly into the prompt text.
 */
export function createPerOutcomeNestedFeedbackPrompt<
	C extends WidgetCollection<Record<string, WidgetDefinition<unknown, unknown>>, readonly string[]>
>(
	envelope: AiContextEnvelope,
	assessmentShell: AssessmentItemShell<WidgetTypeTupleFrom<C>>,
	feedbackPlan: FeedbackPlan,
	combination: FeedbackCombination,
	widgetCollection: C,
	imageContext: ImageContext,
	interactions: Record<string, AnyInteraction<WidgetTypeTupleFrom<C>>>
): {
	systemInstruction: string
	userContent: string
	ShallowSchema: z.ZodType<ShallowFeedbackPayload<WidgetTypeTupleFrom<C>>>
} {
	const ContentSchema: z.ZodType<BlockContent<WidgetTypeTupleFrom<C>>> = createFeedbackContentSchema(
		widgetCollection.widgetTypeKeys
	)

	const ShallowSchema = z.object({ content: ContentSchema }).strict()

	const outcomePathText =
		combination.path.length > 0
			? combination.path
					.map(
						(seg, i) =>
							`  ${i + 1}. Interaction '${seg.responseIdentifier}': Student chose '${seg.key}'`
					)
					.join("\n")
			: "N/A (Fallback Mode)"

	const getCorrectnessSummary = (): string => {
		if (feedbackPlan.mode === "fallback") {
			return `Overall outcome: ${combination.id}`
		}
		for (const seg of combination.path) {
			const decl = assessmentShell.responseDeclarations.find((d) => d.identifier === seg.responseIdentifier)
			if (decl?.baseType === "identifier" && decl.cardinality === "single" && typeof decl.correct === "string") {
				if (decl.correct !== seg.key) {
					return "Overall outcome for this path: INCORRECT"
				}
			} else {
				return "Overall outcome for this path: Mixed/Complex"
			}
		}
		return "Overall outcome for this path: CORRECT"
	}
	const correctnessSummary = getCorrectnessSummary()

	const interactionDetailsResult = errors.trySync(() => JSON.stringify({ interactions }))
	if (interactionDetailsResult.error) {
		logger.error("json stringify interactions", { error: interactionDetailsResult.error })
		throw errors.wrap(interactionDetailsResult.error, "json stringify interactions")
	}
	const interactionDetailsText = interactionDetailsResult.data

	const jsonSkeleton = JSON.stringify({ content: [] })

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
- Your entire output MUST be a single JSON object that conforms to the provided shallow schema: \`{ "content": BlockContent[] }\`.
- **DO NOT** include any extra keys.
- **DO NOT** add any explanations outside the JSON.
- **DO NOT** use any nested structures within the top-level object.
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

	const userContent = `Generate feedback ONLY for the single student outcome specified below. Your response MUST be a single JSON object matching the shallow schema exactly.

${formatUnifiedContextSections(envelope, imageContext)}

${widgetSelectionSection}

## Assessment Context
\`\`\`json
${JSON.stringify(assessmentShell)}
\`\`\`

## TARGET OUTCOME
This feedback is for the specific outcome where the student's choices resulted in the following path:

### Selected Outcome Path (in order):
${outcomePathText}

### Outcome Correctness Summary:
${correctnessSummary}

### Interactions (Raw JSON):
${interactionDetailsText}


## REQUIRED OUTPUT STRUCTURE (shallow schema)
Your response must be a single JSON object matching this exact structure. No extra keys.
\`\`\`json
${jsonSkeleton}
\`\`\`

## Instructions:
1.  **Analyze the student's path and the detailed interaction info.**
2.  **Generate High-Quality Feedback:** Write the feedback content as a \`BlockContent\` array.
3.  **Construct Final JSON:** Place the content into the "content" field of the shallow JSON object.`

	return { systemInstruction, userContent, ShallowSchema }
}
