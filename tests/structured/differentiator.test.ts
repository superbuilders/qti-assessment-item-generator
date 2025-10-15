import { describe, expect, mock, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { AssessmentItemInput } from "../../src/core/item"
import { differentiateAssessmentItem } from "../../src/structured/differentiator"
import { allWidgetsCollection } from "../../src/widgets/collections/all"
import { MINIMAL_CORRECT_FEEDBACK, MINIMAL_INCORRECT_FEEDBACK } from "../helpers/feedback-fixtures"

// MODIFIED: Mock the OpenAI client for Responses API
mock.module("openai", () => {
	class MockOpenAI {
		responses = {
			create: async (params: { text?: { format?: { name?: string } } }) => {
				// Differentiate mock response based on the generator name
				if (params.text?.format?.name === "differentiation_planner") {
					// Mock response for Shot 1 (planContentDifferentiation)
					return {
						output_text: JSON.stringify({
							plans: [
								{
									title: "Differentiated Item",
									responseDeclarations: {
										__sb_idx__0: {
											identifier: "RESPONSE",
											cardinality: "single",
											baseType: "string",
											correct: "100"
										}
									},
									body: {
										__sb_idx__0: {
											type: "paragraph",
											content: {
												__sb_idx__0: {
													type: "text",
													content: "What is the new answer?"
												}
											}
										}
									},
									interactions: null,
									feedbackPlan: {
										mode: "fallback",
										dimensions: { __sb_empty_array__: true },
										combinations: {
											__sb_idx__0: { id: "CORRECT", path: { __sb_empty_array__: true } },
											__sb_idx__1: { id: "INCORRECT", path: { __sb_empty_array__: true } }
										}
									},
									feedback: {
										FEEDBACK__OVERALL: {
											CORRECT: {
												content: {
													preamble: {
														correctness: "correct",
														summary: { __sb_idx__0: { type: "text", content: "Correct!" } }
													},
													steps: {
														__sb_idx__0: {
															type: "step",
															title: { __sb_idx__0: { type: "text", content: "Step 1" } },
															content: {
																__sb_idx__0: {
																	type: "paragraph",
																	content: { __sb_idx__0: { type: "text", content: "Do this." } }
																}
															}
														},
														__sb_idx__1: {
															type: "step",
															title: { __sb_idx__0: { type: "text", content: "Step 2" } },
															content: {
																__sb_idx__0: {
																	type: "paragraph",
																	content: { __sb_idx__0: { type: "text", content: "Then this." } }
																}
															}
														}
													}
												}
											},
											INCORRECT: {
												content: {
													preamble: {
														correctness: "incorrect",
														summary: { __sb_idx__0: { type: "text", content: "Incorrect." } }
													},
													steps: {
														__sb_idx__0: {
															type: "step",
															title: { __sb_idx__0: { type: "text", content: "Hint" } },
															content: {
																__sb_idx__0: {
																	type: "paragraph",
																	content: { __sb_idx__0: { type: "text", content: "Review." } }
																}
															}
														},
														__sb_idx__1: {
															type: "step",
															title: { __sb_idx__0: { type: "text", content: "Example" } },
															content: {
																__sb_idx__0: {
																	type: "paragraph",
																	content: { __sb_idx__0: { type: "text", content: "Solve like this." } }
																}
															}
														}
													}
												}
											}
										}
									}
								}
							]
						})
					}
				}
				// Mock for Shot 2 (regenerateWidgetsViaLLM)
				if (params.text?.format?.name === "widgets_generator") {
					return {
						output_text: JSON.stringify({ widgets: {} })
					}
				}
				// Default empty response
				return { output_text: "{}" }
			}
		}
	}
	return {
		__esModule: true,
		default: MockOpenAI
	}
})

describe("Differentiation Pipeline", () => {
	test("should correctly transform AI response with array-like objects back into arrays", async () => {
		const OpenAI = (await import("openai")).default
		const mockOpenAI = new OpenAI()

		const originalItem: AssessmentItemInput<readonly []> = {
			identifier: "original-item",
			title: "Original Item",
			responseDeclarations: [
				{
					identifier: "RESPONSE",
					cardinality: "single",
					baseType: "string",
					correct: "42"
				}
			],
			body: [
				{
					type: "paragraph",
					content: [{ type: "text", content: "What is the answer?" }]
				}
			],
			widgets: null,
			interactions: null,
			feedbackPlan: {
				mode: "fallback",
				dimensions: [],
				combinations: [
					{ id: "CORRECT", path: [] },
					{ id: "INCORRECT", path: [] }
				]
			},
			feedback: {
				FEEDBACK__OVERALL: {
					CORRECT: { content: MINIMAL_CORRECT_FEEDBACK },
					INCORRECT: { content: MINIMAL_INCORRECT_FEEDBACK }
				}
			}
		}

		const result = await errors.try(
			differentiateAssessmentItem(mockOpenAI, logger, originalItem, 1, allWidgetsCollection)
		)
		expect(result.error).toBeFalsy()

		const differentiated = result.data
		expect(Array.isArray(differentiated)).toBe(true)
		expect(differentiated?.length).toBe(1)

		const item = differentiated?.[0]
		if (!item) {
			logger.error("differentiated item is undefined", { differentiated })
			throw errors.new("differentiated item is undefined")
		}

		// Verify that nested structures are correctly transformed back to arrays
		expect(Array.isArray(item.body)).toBe(true)
		if (item.body) {
			expect(item.body.length).toBe(1)
			const firstBodyBlock = item.body[0]
			if (firstBodyBlock?.type === "paragraph") {
				expect(Array.isArray(firstBodyBlock.content)).toBe(true)
			} else {
				logger.error("first body block validation failed", { type: firstBodyBlock?.type })
				throw errors.new("First body block is not a paragraph")
			}
		}
		expect(Array.isArray(item.responseDeclarations)).toBe(true)
		expect(item.responseDeclarations.length).toBe(1)
	})
})
