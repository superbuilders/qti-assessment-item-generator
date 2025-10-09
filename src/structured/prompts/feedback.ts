import type { FeedbackPlan } from "@/core/feedback"
import { createNestedFeedbackZodSchema } from "@/core/feedback"
import type { AssessmentItemShell } from "@/core/item"
import type { WidgetCollection, WidgetDefinition } from "@/widgets/collections/types"
import type { AiContextEnvelope, ImageContext } from "../types"
import { createWidgetSelectionPromptSection, formatUnifiedContextSections } from "./shared"

/**
 * Creates a feedback generation prompt with a dynamically-generated Zod schema
 * that enforces the overall feedback outcome with a nested, exact-key structure.
 */
export function createFeedbackPrompt<
	C extends WidgetCollection<Record<string, WidgetDefinition<unknown, unknown>>, readonly string[]>
>(
	envelope: AiContextEnvelope,
	assessmentShell: AssessmentItemShell<C["widgetTypeKeys"]>,
	feedbackPlan: FeedbackPlan,
	imageContext: ImageContext,
	widgetCollection: C
) {
	// Build the nested authoring schema inside the prompt helper, passing only the keys.
	const FeedbackSchema = createNestedFeedbackZodSchema(feedbackPlan, widgetCollection.widgetTypeKeys)

	// 2. Generate the Dimension Inventory section for the prompt.
	const dimensionInventory =
		feedbackPlan.dimensions.length > 0
			? `DIMENSIONS
${feedbackPlan.dimensions
	.map(
		(dim) =>
			`- ${dim.responseIdentifier}: ${dim.kind} → keys = [${(dim.kind === "enumerated" ? dim.keys : ["CORRECT", "INCORRECT"]).join(", ")}]`
	)
	.join("\n")}`
			: ""

	// 3. Generate the explicit Keys Mapping Table for the prompt.
	// The order MUST follow `feedbackPlan.combinations` for determinism.
	const keysMapping = `KEYS MAPPING
${feedbackPlan.combinations
	.map((combo) => {
		if (feedbackPlan.mode === "fallback") {
			return `- ${combo.id}: Overall outcome is ${combo.id.toLowerCase()}`
		}
		const pathDesc = combo.path.map((seg) => `${seg.responseIdentifier} → ${seg.key}`).join(", ")
		return `- ${combo.id}: ${pathDesc}`
	})
	.join("\n")}`

	// 4. Concrete non-fallback example for the prompt.
	const nestedExample = `Example nested output for a non-fallback item with two binary dimensions:
\`\`\`json
{
  "feedback": {
    "FEEDBACK__OVERALL": {
      "RESPONSE_1": {
        "CORRECT": {
          "RESPONSE_2": {
            "CORRECT": { "content": [ { "type": "paragraph", "content": [ { "type": "text", "content": "Both parts correct — excellent." } ] } ] },
            "INCORRECT": { "content": [ { "type": "paragraph", "content": [ { "type": "text", "content": "First is correct; review the second part." } ] } ] }
          }
        },
        "INCORRECT": {
          "RESPONSE_2": {
            "CORRECT": { "content": [ { "type": "paragraph", "content": [ { "type": "text", "content": "Second is correct; fix the first part." } ] } ] },
            "INCORRECT": { "content": [ { "type": "paragraph", "content": [ { "type": "text", "content": "Neither part is correct — start by checking definitions." } ] } ] }
          }
        }
      }
    }
  }
}
\`\`\``

	// 5. Assemble the system and user prompts.
	const systemInstruction = `You are an expert in educational content. Your task is to generate comprehensive feedback for all possible outcomes in an assessment item.

**⚠️ CRITICAL: GRAMMATICAL ERROR CORRECTION ⚠️**
WE MUST correct any grammatical errors found in the source Perseus content. This includes:
- Spelling mistakes in words and proper nouns
- Incorrect punctuation, capitalization, and sentence structure
- Subject-verb disagreement and other grammatical issues
- Awkward phrasing that impacts clarity
- Missing or incorrect articles (a, an, the)

The goal is to produce clean, professional educational content that maintains the original meaning while fixing any language errors present in the source material.

**FEEDBACK STRUCTURE**
- The structured output schema enforces a nested object under "feedback" → "FEEDBACK__OVERALL".
- For single-select multiple-choice: keys are choice identifiers (A, B, C, etc.).
- For all other questions (numeric, ordering, multi-select, etc.): keys are "CORRECT" and "INCORRECT".
- Each leaf node contains a "content" field with BlockContent.
- The schema enforces completeness—every required key must be present.

QUALITY RUBRIC (for each feedback entry):
1. Immediate Response: Acknowledge whether the student's answer combination was correct or incorrect.
2. Conceptual Explanation: Explain the 'why' behind the answer, referencing the core concepts being tested.
3. Remedial Guidance: If incorrect, identify the likely misconception and provide clear steps to correct it.
4. Learning Path: Suggest what the student should review or practice next.

**FEEDBACK CONTENT REQUIREMENTS**
1. **Educational Value**: Each feedback block must provide meaningful content that helps students learn.
2. **Specificity**: Explain why a particular combination of answers is correct or incorrect.
3. **Constructive Guidance**: For incorrect combinations, guide students toward understanding.
4. **Content Structure**: Use the BlockContent model (arrays of paragraphs, math, lists, etc.).
5. **No Interactions**: Feedback content must never contain interactive elements.`

	const widgetSelectionSection = createWidgetSelectionPromptSection(widgetCollection)

	const userContent = `Generate comprehensive feedback for this assessment item.

${formatUnifiedContextSections(envelope, imageContext)}

${widgetSelectionSection}

## Assessment Context
\`\`\`json
${JSON.stringify(assessmentShell, null, 2)}
\`\`\`

${dimensionInventory}

${keysMapping}

${nestedExample}

## Instructions:
1. **Analyze the Assessment**: Understand the learning objectives.
2. **Generate Complete Feedback**: The strict JSON schema will enforce the exact structure required.
3. **Follow Structure Rules**: Each leaf must contain a "content" key with a valid BlockContent array.
4. **Maintain Quality**: Provide educational, specific, and constructive feedback.

Your response must conform to the structured output schema.`

	return { systemInstruction, userContent, FeedbackSchema }
}
