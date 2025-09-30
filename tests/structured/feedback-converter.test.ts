import { describe, expect, test } from "bun:test"
import { convertNestedFeedbackToBlocks } from "../../src/structured/feedback-converter"
import type { FeedbackPlan } from "../../src/compiler/schemas"

describe("convertNestedFeedbackToBlocks", () => {
	test("fallback two-leaf correct/incorrect short-circuit", () => {
		const nested = {
			FEEDBACK__OVERALL: {
				CORRECT: { content: [] },
				INCORRECT: { content: [] }
			}
		}
		const feedbackPlan: FeedbackPlan = {
			mode: "fallback",
			dimensions: [{ responseIdentifier: "RESPONSE", kind: "binary" }],
			combinations: [
				{ id: "CORRECT", path: [] },
				{ id: "INCORRECT", path: [] }
			]
		}
		const blocks = convertNestedFeedbackToBlocks(nested, feedbackPlan)
		expect(blocks).toEqual({
			CORRECT: [],
			INCORRECT: []
		})
	})

	test("combo nested path derives FB__ identifiers", () => {
		const nested = {
			FEEDBACK__OVERALL: {
				RESPONSE_1: {
					A: {
						RESPONSE_2: {
							CORRECT: { content: [] },
							INCORRECT: { content: [] }
						}
					}
				}
			}
		}
		const feedbackPlan: FeedbackPlan = {
			mode: "combo",
			dimensions: [
				{ responseIdentifier: "RESPONSE_1", kind: "enumerated", keys: ["A"] },
				{ responseIdentifier: "RESPONSE_2", kind: "binary" }
			],
			combinations: [
				{
					id: "FB__RESPONSE_1_A__RESPONSE_2_CORRECT",
					path: [
						{ responseIdentifier: "RESPONSE_1", key: "A" },
						{ responseIdentifier: "RESPONSE_2", key: "CORRECT" }
					]
				},
				{
					id: "FB__RESPONSE_1_A__RESPONSE_2_INCORRECT",
					path: [
						{ responseIdentifier: "RESPONSE_1", key: "A" },
						{ responseIdentifier: "RESPONSE_2", key: "INCORRECT" }
					]
				}
			]
		}
		const blocks = convertNestedFeedbackToBlocks(nested, feedbackPlan)
		expect(blocks.FB__RESPONSE_1_A__RESPONSE_2_CORRECT).toEqual([])
		expect(blocks.FB__RESPONSE_1_A__RESPONSE_2_INCORRECT).toEqual([])
		expect(Object.keys(blocks).length).toBe(2)
	})
})