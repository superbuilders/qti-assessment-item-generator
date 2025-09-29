import type { AnyInteraction, AssessmentItemShell } from "../../compiler/schemas"
import type { WidgetCollection } from "../../widgets/collections/types"
import type { enumerateFeedbackTargets } from "../feedback-targets"
import type { AiContextEnvelope, ImageContext } from "../types"
import { createCollectionScopedFeedbackSchema } from "../schemas"
import { formatUnifiedContextSections, createWidgetSelectionPromptSection } from "./shared"

/**
 * Creates a feedback generation prompt with a dynamically-generated Zod schema
 * that enforces the unified per-response feedback rule.
 */
export function createFeedbackPrompt(
	envelope: AiContextEnvelope,
	assessmentShell: AssessmentItemShell,
	interactions: Record<string, AnyInteraction>,
	feedbackTargets: ReturnType<typeof enumerateFeedbackTargets>,
	imageContext: ImageContext,
	widgetCollection: WidgetCollection
) {
	const FeedbackSchema = createCollectionScopedFeedbackSchema(feedbackTargets, widgetCollection)

	const systemInstruction = `You are an expert in educational content and QTI standards. Your task is to generate comprehensive, high-quality feedback for all possible outcomes in an assessment item.

**⚠️ CRITICAL: GRAMMATICAL ERROR CORRECTION ⚠️**
WE MUST correct any grammatical errors found in the source Perseus content. This includes:
- Spelling mistakes in words and proper nouns
- Incorrect punctuation, capitalization, and sentence structure
- Subject-verb disagreement and other grammatical issues
- Awkward phrasing that impacts clarity
- Missing or incorrect articles (a, an, the)

The goal is to produce clean, professional educational content that maintains the original meaning while fixing any language errors present in the source material.

**UNIFIED PER-RESPONSE FEEDBACK RULE (MANDATORY)**

This is the single source of truth for feedback structure:

**For Enumerated Responses (baseType: 'identifier')**:
- Applies to: choiceInteraction, inlineChoiceInteraction
- Feedback MUST be generated on a per-choice basis
- The outcome identifier MUST be FEEDBACK__<responseIdentifier>
- This outcome MUST contain one feedback block for each choiceIdentifier
- It MUST NOT contain CORRECT or INCORRECT blocks

**For Non-Enumerated Responses (baseType: string, integer, float, ordered, directedPair)**:
- Applies to: textEntryInteraction, orderInteraction, gapMatchInteraction
- Feedback MUST be generated on a correct/incorrect basis for the entire response
- The outcome identifier MUST be FEEDBACK__<responseIdentifier>
- This outcome MUST contain exactly two feedback blocks: one with identifier "CORRECT" and one with identifier "INCORRECT"
- It MUST NOT contain blocks matching choice identifiers

**FEEDBACK CONTENT REQUIREMENTS**

1. **Educational Value**: Each feedback block must provide meaningful educational content that helps students understand the concept, not just "correct" or "incorrect"

2. **Specificity**: For choice-specific feedback, explain why that particular choice is correct or incorrect, referencing specific aspects of the choice content

3. **Constructive Guidance**: For incorrect responses, provide hints or explanations that guide students toward the correct understanding without giving away the answer

4. **Content Structure**: Use the same BlockContent model as the assessment body - paragraphs, math, lists, etc. are all supported

5. **No Interactions**: Feedback content must never contain interactive elements - only presentational content and widgets

**CRITICAL CONSTRAINTS**

- You MUST generate feedback for every target specified in the requirements
- You MUST use the exact outcome and block identifiers provided
- You MUST follow the content structure rules (BlockContent arrays)
- You MUST NOT include any interactive elements in feedback content
- You MUST maintain consistency with the assessment's educational context and difficulty level

**QUALITY STANDARDS**

- Feedback should be appropriate for the grade level and subject matter
- Use clear, concise language that students can understand
- Provide specific explanations rather than generic responses
- For mathematical content, use proper MathML formatting
- Maintain educational tone throughout`

	const widgetSelectionSection = createWidgetSelectionPromptSection(widgetCollection)

	const userContent = `Generate comprehensive feedback for this assessment item based on the provided context and requirements.

${formatUnifiedContextSections(envelope, imageContext)}

${widgetSelectionSection}

## Assessment Shell (for context):
\`\`\`json
${JSON.stringify(assessmentShell, null, 2)}
\`\`\`

## Generated Interactions (for context):
\`\`\`json
${JSON.stringify(interactions, null, 2)}
\`\`\`

## Required Feedback Targets:
You MUST generate feedback for exactly these targets:

${feedbackTargets.map((t) => `- Outcome: ${t.outcomeIdentifier}, Block: ${t.blockIdentifier}`).join("\n")}

## Instructions:

1. **Analyze the Assessment**: Understand the learning objectives, content, and difficulty level from the context provided

2. **Generate Complete Feedback**: Create feedback content for every required target listed above

3. **Follow Structure Rules**: Each feedback block must use the BlockContent structure (arrays of paragraph, math, list, etc. objects)

4. **Maintain Quality**: Provide educational, specific, and constructive feedback that helps students learn

5. **Verify Completeness**: Ensure your response includes every required outcome identifier and block identifier

Your response must be a JSON object with a single "feedback" key containing the complete feedback structure as specified by the schema.`

	return { systemInstruction, userContent, FeedbackSchema }
}
