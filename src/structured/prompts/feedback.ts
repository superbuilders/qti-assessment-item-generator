import type { AssessmentItemShell } from "@core/item"
import type { FeedbackPlan } from "@core/feedback"
import type { WidgetCollection, WidgetTypeTuple } from "@widgets/collections/types"
import { createNestedFeedbackZodSchema } from "@core/feedback"
import type { AiContextEnvelope, ImageContext } from "../types"
import { createWidgetSelectionPromptSection, formatUnifiedContextSections } from "./shared"

/**
 * Creates a feedback generation prompt with a dynamically-generated Zod schema
 * that enforces the overall feedback outcome with a nested, exact-key structure.
 */
export function createFeedbackPrompt<E extends WidgetTypeTuple>(
	envelope: AiContextEnvelope,
	assessmentShell: AssessmentItemShell<E>,
	feedbackPlan: FeedbackPlan,
	imageContext: ImageContext,
	widgetCollection: WidgetCollection<E>
) {
	// Build the nested authoring schema inside the prompt helper, passing only the keys.
	const FeedbackSchema = createNestedFeedbackZodSchema(feedbackPlan, widgetCollection.widgetTypeKeys)

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
- For **single-select** multiple-choice: keys are choice identifiers (A, B, C, etc.).
- For **all other questions** (numeric, ordering, multi-select, etc.): keys are "CORRECT" and "INCORRECT".
- Each leaf node contains a "content" field with BlockContent.
- The schema enforces completeness—every required key must be present.

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

## Assessment Shell & Feedback Plan (for context):
\`\`\`json
${JSON.stringify({ ...assessmentShell, feedbackPlan }, null, 2)}
\`\`\`

## Instructions:
1. **Analyze the Assessment**: Understand the learning objectives.
2. **Generate Complete Feedback**: The strict JSON schema will enforce the exact structure required.
3. **Follow Structure Rules**: Each leaf must contain a "content" key with a valid BlockContent array.
4. **Maintain Quality**: Provide educational, specific, and constructive feedback.

Your response must conform to the structured output schema.`

	return { systemInstruction, userContent, FeedbackSchema }
}
