import type { FeedbackContent } from "@/core/content"

/**
 * Helper to create minimal valid feedback content for tests
 */
export function createMinimalFeedbackContent<E extends readonly string[]>(
	correctness: "correct" | "incorrect",
	summaryText: string,
	step1Title: string,
	step1Text: string,
	step2Title: string,
	step2Text: string
): FeedbackContent<E> {
	return {
		preamble: {
			correctness,
			summary: [{ type: "text", content: summaryText }]
		},
		steps: [
			{
				type: "step",
				title: [{ type: "text", content: step1Title }],
				content: [{ type: "paragraph", content: [{ type: "text", content: step1Text }] }]
			},
			{
				type: "step",
				title: [{ type: "text", content: step2Title }],
				content: [{ type: "paragraph", content: [{ type: "text", content: step2Text }] }]
			}
		]
	}
}

export const MINIMAL_CORRECT_FEEDBACK = createMinimalFeedbackContent<[]>(
	"correct",
	"Your answer is correct.",
	"Confirmation",
	"You have demonstrated understanding.",
	"Next Steps",
	"Continue to the next question."
)

export const MINIMAL_INCORRECT_FEEDBACK = createMinimalFeedbackContent<[]>(
	"incorrect",
	"Your answer is incorrect.",
	"Identify Misconception",
	"Let's review the concept.",
	"Worked Example",
	"Here is how to solve it."
)

