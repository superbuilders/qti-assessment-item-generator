import type { AssessmentItemInput } from "../compiler/schemas"

/**
 * Converts the AI's structured feedback map into the flat array of feedback blocks
 * required by the compiler schema.
 *
 * The AI returns feedback structured as:
 * {
 *   "FEEDBACK__RESPONSE_1": {
 *     "A": { content: [...] },
 *     "B": { content: [...] }
 *   },
 *   "FEEDBACK__RESPONSE_2": {
 *     "CORRECT": { content: [...] },
 *     "INCORRECT": { content: [...] }
 *   }
 * }
 *
 * This function flattens it to:
 * [
 *   { identifier: "A", outcomeIdentifier: "FEEDBACK__RESPONSE_1", content: [...] },
 *   { identifier: "B", outcomeIdentifier: "FEEDBACK__RESPONSE_1", content: [...] },
 *   { identifier: "CORRECT", outcomeIdentifier: "FEEDBACK__RESPONSE_2", content: [...] },
 *   { identifier: "INCORRECT", outcomeIdentifier: "FEEDBACK__RESPONSE_2", content: [...] }
 * ]
 */
export function feedbackMapToBlocks(
	feedbackMap: Record<string, Record<string, { content: any }>>
): AssessmentItemInput["feedbackBlocks"] {
	const blocks: AssessmentItemInput["feedbackBlocks"] = []

	for (const [outcomeIdentifier, group] of Object.entries(feedbackMap)) {
		for (const [blockIdentifier, blockData] of Object.entries(group)) {
			blocks.push({
				identifier: blockIdentifier,
				outcomeIdentifier,
				content: blockData.content
			})
		}
	}

	return blocks
}
