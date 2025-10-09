import type { FeedbackPlan } from "@/core/feedback"
import { createFlatFeedbackZodSchema } from "@/core/feedback"
import type { AssessmentItemShell } from "@/core/item"
import type { WidgetCollection, WidgetDefinition } from "@/widgets/collections/types"
import type { AiContextEnvelope, ImageContext } from "../types"
import { createWidgetSelectionPromptSection, formatUnifiedContextSections } from "./shared"

/**
 * Creates a feedback generation prompt using the new flat-key schema architecture.
 * This prompt includes explicit dimension and key mapping tables to maximize clarity for the model.
 * Replaces the old createFeedbackPrompt function.
 */
export function createFlatFeedbackPrompt<
	C extends WidgetCollection<Record<string, WidgetDefinition<unknown, unknown>>, readonly string[]>
>(
	envelope: AiContextEnvelope,
	assessmentShell: AssessmentItemShell<C["widgetTypeKeys"]>,
	feedbackPlan: FeedbackPlan,
	imageContext: ImageContext,
	widgetCollection: C
) {
	// 1. Build the flat Zod schema for the AI's response format.
	const FeedbackSchema = createFlatFeedbackZodSchema(feedbackPlan, widgetCollection.widgetTypeKeys)

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
	const flatExample = `Example output for a non-fallback item with two binary dimensions:
\`\`\`json
{
  "feedback": {
    "FEEDBACK__OVERALL": {
      "FB__RESPONSE_1_CORRECT__RESPONSE_2_CORRECT":   { "content": [ { "type": "paragraph", "content": [ { "type": "text", "content": "Both parts correct — excellent." } ] } ] },
      "FB__RESPONSE_1_CORRECT__RESPONSE_2_INCORRECT": { "content": [ { "type": "paragraph", "content": [ { "type": "text", "content": "First is correct; review the second part." } ] } ] },
      "FB__RESPONSE_1_INCORRECT__RESPONSE_2_CORRECT": { "content": [ { "type": "paragraph", "content": [ { "type": "text", "content": "Second is correct; fix the first part." } ] } ] },
      "FB__RESPONSE_1_INCORRECT__RESPONSE_2_INCORRECT": { "content": [ { "type": "paragraph", "content": [ { "type": "text", "content": "Neither part is correct — start by checking definitions." } ] } ] }
    }
  }
}
\`\`\``

	// 5. Assemble the system and user prompts.
	const systemInstruction = `You are an expert in educational content. Generate comprehensive, high-quality feedback for ALL combinations provided. Your response MUST be a JSON object that strictly adheres to the provided schema.

**⚠️ CRITICAL: GRAMMATICAL ERROR CORRECTION ⚠️**
WE MUST correct any grammatical errors found in the source Perseus content. This includes:
- Spelling mistakes in words and proper nouns
- Incorrect punctuation, capitalization, and sentence structure
- Subject-verb disagreement and other grammatical issues
- Awkward phrasing that impacts clarity
- Missing or incorrect articles (a, an, the)

The goal is to produce clean, professional educational content that maintains the original meaning while fixing any language errors present in the source material.

STRUCTURE:
- Return a single JSON object with a 'feedback' key.
- Inside 'feedback', there must be a 'FEEDBACK__OVERALL' key.
- The value of 'FEEDBACK__OVERALL' must be an object whose keys EXACTLY match the list in the 'KEYS MAPPING' section.
- Each key must map to an object with a single 'content' property, which is an array of BlockContent items.

QUALITY RUBRIC (for each feedback entry):
1. Immediate Response: Acknowledge whether the student's answer combination was correct or incorrect.
2. Conceptual Explanation: Explain the 'why' behind the answer, referencing the core concepts being tested.
3. Remedial Guidance: If incorrect, identify the likely misconception and provide clear steps to correct it.
4. Learning Path: Suggest what the student should review or practice next.

STRICT CONTENT RULES:
- Use only the allowed BlockContent shapes for all 'content' fields (paragraph, math, lists, tableRich, widgetRef).
- NO interactions of any kind are allowed inside feedback content.
- NO LaTeX sequences (e.g., \\frac), no <mfenced> in MathML, and no CDATA sections.
- Currency ($) and percent (%) symbols MUST be in MathML tokens (e.g., <mo>$</mo>, <mo>%</mo>).
- The characters '^' and '|' are BANNED from all 'text' content. Use <msup> for exponents and tableRich for tables.`

	const widgetSelectionSection = createWidgetSelectionPromptSection(widgetCollection)

	const userContent = `Generate comprehensive feedback for every combination in this assessment item.

${formatUnifiedContextSections(envelope, imageContext)}

${widgetSelectionSection}

## Assessment Context
\`\`\`json
${JSON.stringify(assessmentShell, null, 2)}
\`\`\`

${dimensionInventory}

${keysMapping}

${flatExample}

## Instructions:
1.  **Analyze the Item**: Understand the learning objective and the different response combinations.
2.  **Generate Feedback**: Write feedback for EVERY key listed in the 'KEYS MAPPING' table.
3.  **Adhere to Schema**: Your JSON output must validate against the strict schema, including all required keys.
4.  **Follow Quality Rubric**: Ensure every feedback block is pedagogically valuable.

Your response must conform to the structured output schema.`

	return { systemInstruction, userContent, FeedbackSchema }
}
