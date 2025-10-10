import { beforeEach, describe, expect, mock, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { AssessmentItemShell } from "@/core/item"
import { generateFromEnvelope } from "@/structured/client"
import type { AiContextEnvelope } from "@/structured/types"
import { allWidgetsCollection } from "@/widgets/collections/all"

// ---[ Mocks & Helpers ]---

interface MockOpenAIOptions {
	response_format: {
		json_schema: {
			name: string
		}
	}
}

// A flexible mock of the OpenAI client that can be configured for each test case.
// It simulates different responses based on the `name` of the JSON schema provided in the call.
const mockResponses: Record<string, () => object> = {}

function resetMockResponses(): void {
	for (const key of Object.keys(mockResponses)) {
		delete mockResponses[key]
	}
}
mock.module("openai", () => {
	class MockOpenAI {
		chat = {
			completions: {
				create: async (options: MockOpenAIOptions) => {
					const functionName = options.response_format.json_schema.name
					if (!mockResponses[functionName]) {
						logger.error("unhandled mock openai call", { functionName })
						throw errors.new(`unhandled mock openai call for function: ${functionName}`)
					}
					const responseData = mockResponses[functionName]()
					return {
						choices: [
							{
								message: {
									content: JSON.stringify(responseData),
									refusal: null
								}
							}
						]
					}
				}
			}
		}
	}
	return {
		__esModule: true,
		default: MockOpenAI
	}
})
beforeEach(() => resetMockResponses())

// A base envelope and shell for use in tests
const testEnvelope: AiContextEnvelope = {
	primaryContent: "Test content",
	supplementaryContent: [],
	multimodalImageUrls: [],
	multimodalImagePayloads: []
}

const baseShell: AssessmentItemShell<[]> = {
	identifier: "test-item",
	title: "Test Item",
	body: [],
	responseDeclarations: []
}

// ---[ Test Suite ]---

describe("Feedback Generation Sharding", () => {
	test("should handle 'fallback' mode correctly with 2 shards", async () => {
		const OpenAI = (await import("openai")).default
		const mockOpenAI = new OpenAI()

		// Configure mock responses for this test case
		mockResponses.assessment_shell_generator = () => ({
			...baseShell,
			responseDeclarations: [{ identifier: "RESPONSE_1", cardinality: "single", baseType: "string", correct: "ans" }]
		})
		mockResponses.interaction_content_generator = () => ({})
		mockResponses.feedback_correct = () => ({
			feedback: {
				FEEDBACK__OVERALL: {
					CORRECT: { content: [{ type: "paragraph", content: [{ type: "text", content: "Correct" }] }] }
				}
			}
		})
		mockResponses.feedback_incorrect = () => ({
			feedback: {
				FEEDBACK__OVERALL: {
					INCORRECT: { content: [{ type: "paragraph", content: [{ type: "text", content: "Incorrect" }] }] }
				}
			}
		})
		mockResponses.widget_content_generator = () => ({})

		const result = await errors.try(generateFromEnvelope(mockOpenAI, logger, testEnvelope, allWidgetsCollection))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test assertion failed", { error: result.error })
			throw result.error
		}

		const finalItem = result.data
		expect(finalItem.feedbackPlan.mode).toBe("fallback")
		expect(finalItem.feedbackPlan.combinations).toHaveLength(2)

		const overallFeedback = finalItem.feedback.FEEDBACK__OVERALL
		expect(overallFeedback).toHaveProperty("CORRECT")
		expect(overallFeedback).toHaveProperty("INCORRECT")
		// @ts-expect-error - testing property existence
		expect(overallFeedback.CORRECT.content[0].content[0].content).toBe("Correct")
		// @ts-expect-error - testing property existence
		expect(overallFeedback.INCORRECT.content[0].content[0].content).toBe("Incorrect")
	})

	test("should handle multi-dimension 'combo' mode and reassemble nested structure", async () => {
		const OpenAI = (await import("openai")).default
		const mockOpenAI = new OpenAI()

		// This shell will produce a 2x2 combo plan
		mockResponses.assessment_shell_generator = () => ({
			...baseShell,
			body: [
				{ type: "interactionRef", interactionId: "int_1" },
				{ type: "interactionRef", interactionId: "int_2" }
			],
			responseDeclarations: [
				{ identifier: "RESPONSE_1", cardinality: "single", baseType: "identifier", correct: "A" },
				{ identifier: "RESPONSE_2", cardinality: "single", baseType: "string", correct: "ans" }
			]
		})
		mockResponses.interaction_content_generator = () => ({
			int_1: {
				type: "choiceInteraction",
				responseIdentifier: "RESPONSE_1",
				prompt: [],
				choices: [
					{ identifier: "A", content: [] },
					{ identifier: "B", content: [] }
				],
				shuffle: true,
				minChoices: 1,
				maxChoices: 1
			},
			int_2: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_2", expectedLength: 3 }
		})
		mockResponses.widget_content_generator = () => ({})

		// Mock each of the 4 shards
		mockResponses.feedback_fb__response_1_a__response_2_correct = () => ({
			feedback: {
				FEEDBACK__OVERALL: {
					RESPONSE_1: {
						A: {
							RESPONSE_2: {
								CORRECT: { content: [{ type: "paragraph", content: [{ type: "text", content: "A-Correct" }] }] }
							}
						}
					}
				}
			}
		})
		mockResponses.feedback_fb__response_1_a__response_2_incorrect = () => ({
			feedback: {
				FEEDBACK__OVERALL: {
					RESPONSE_1: {
						A: {
							RESPONSE_2: {
								INCORRECT: { content: [{ type: "paragraph", content: [{ type: "text", content: "A-Incorrect" }] }] }
							}
						}
					}
				}
			}
		})
		mockResponses.feedback_fb__response_1_b__response_2_correct = () => ({
			feedback: {
				FEEDBACK__OVERALL: {
					RESPONSE_1: {
						B: {
							RESPONSE_2: {
								CORRECT: { content: [{ type: "paragraph", content: [{ type: "text", content: "B-Correct" }] }] }
							}
						}
					}
				}
			}
		})
		mockResponses.feedback_fb__response_1_b__response_2_incorrect = () => ({
			feedback: {
				FEEDBACK__OVERALL: {
					RESPONSE_1: {
						B: {
							RESPONSE_2: {
								INCORRECT: { content: [{ type: "paragraph", content: [{ type: "text", content: "B-Incorrect" }] }] }
							}
						}
					}
				}
			}
		})

		const result = await errors.try(generateFromEnvelope(mockOpenAI, logger, testEnvelope, allWidgetsCollection))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test assertion failed", { error: result.error })
			throw result.error
		}

		const finalItem = result.data
		expect(finalItem.feedbackPlan.mode).toBe("combo")
		expect(finalItem.feedbackPlan.combinations).toHaveLength(4)

		const overallFeedback = finalItem.feedback.FEEDBACK__OVERALL
		// @ts-expect-error - dynamic nested access for test validation
		expect(overallFeedback.RESPONSE_1.A.RESPONSE_2.CORRECT.content[0].content[0].content).toBe("A-Correct")
		// @ts-expect-error - dynamic nested access for test validation
		expect(overallFeedback.RESPONSE_1.A.RESPONSE_2.INCORRECT.content[0].content[0].content).toBe("A-Incorrect")
		// @ts-expect-error - dynamic nested access for test validation
		expect(overallFeedback.RESPONSE_1.B.RESPONSE_2.CORRECT.content[0].content[0].content).toBe("B-Correct")
		// @ts-expect-error - dynamic nested access for test validation
		expect(overallFeedback.RESPONSE_1.B.RESPONSE_2.INCORRECT.content[0].content[0].content).toBe("B-Incorrect")
	})

	test("should fail the entire process if one shard fails", async () => {
		const OpenAI = (await import("openai")).default
		const mockOpenAI = new OpenAI()

		mockResponses.assessment_shell_generator = () => ({
			...baseShell,
			body: [
				{ type: "interactionRef", interactionId: "int_1" },
				{ type: "interactionRef", interactionId: "int_2" }
			],
			responseDeclarations: [
				{ identifier: "RESPONSE_1", cardinality: "single", baseType: "identifier", correct: "A" },
				{ identifier: "RESPONSE_2", cardinality: "single", baseType: "string", correct: "ans" }
			]
		})
		mockResponses.interaction_content_generator = () => ({
			int_1: {
				type: "choiceInteraction",
				responseIdentifier: "RESPONSE_1",
				prompt: [],
				choices: [
					{ identifier: "A", content: [] },
					{ identifier: "B", content: [] }
				],
				shuffle: true,
				minChoices: 1,
				maxChoices: 1
			},
			int_2: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_2", expectedLength: 3 }
		})
		mockResponses.widget_content_generator = () => ({})

		// Mock 3 successful shards and 1 failing shard
		mockResponses.feedback_fb__response_1_a__response_2_correct = () => ({
			feedback: { FEEDBACK__OVERALL: { RESPONSE_1: { A: { RESPONSE_2: { CORRECT: { content: [] } } } } } }
		})
		mockResponses.feedback_fb__response_1_a__response_2_incorrect = () => {
			logger.error("simulated shard failure for test")
			throw errors.new("simulated shard failure")
		}
		mockResponses.feedback_fb__response_1_b__response_2_correct = () => ({
			feedback: { FEEDBACK__OVERALL: { RESPONSE_1: { B: { RESPONSE_2: { CORRECT: { content: [] } } } } } }
		})
		mockResponses.feedback_fb__response_1_b__response_2_incorrect = () => ({
			feedback: { FEEDBACK__OVERALL: { RESPONSE_1: { B: { RESPONSE_2: { INCORRECT: { content: [] } } } } } }
		})

		const result = await errors.try(generateFromEnvelope(mockOpenAI, logger, testEnvelope, allWidgetsCollection))
		expect(result.error).toBeTruthy()
		if (!result.error) {
			logger.error("test assertion failed: expected error but got none")
			throw errors.new("expected error but got none")
		}
		expect(result.error.message).toContain("sharded feedback generation")
	})

	test("should succeed if a shard returns empty content", async () => {
		const OpenAI = (await import("openai")).default
		const mockOpenAI = new OpenAI()

		mockResponses.assessment_shell_generator = () => ({
			...baseShell,
			responseDeclarations: [{ identifier: "RESPONSE_1", cardinality: "single", baseType: "string", correct: "ans" }]
		})
		mockResponses.interaction_content_generator = () => ({})
		mockResponses.widget_content_generator = () => ({})

		mockResponses.feedback_correct = () => ({
			feedback: {
				FEEDBACK__OVERALL: {
					CORRECT: { content: [{ type: "paragraph", content: [{ type: "text", content: "Correct" }] }] }
				}
			}
		})
		// This shard returns an empty content array, which is valid.
		mockResponses.feedback_incorrect = () => ({
			feedback: {
				FEEDBACK__OVERALL: {
					INCORRECT: { content: [] }
				}
			}
		})

		const result = await errors.try(generateFromEnvelope(mockOpenAI, logger, testEnvelope, allWidgetsCollection))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test assertion failed", { error: result.error })
			throw result.error
		}

		const finalItem = result.data
		const overallFeedback = finalItem.feedback.FEEDBACK__OVERALL
		expect(overallFeedback).toHaveProperty("INCORRECT")
		expect(overallFeedback.INCORRECT.content).toEqual([])
	})
})
