import { describe, expect, mock, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { AssessmentItemInput } from "../../src/core/item"
import { differentiateAssessmentItem } from "../../src/structured/differentiator"
import { allWidgetsCollection } from "../../src/widgets/collections/all"

// Mock the OpenAI client
mock.module("openai", () => {
	class MockOpenAI {
		chat = {
			completions: {
				create: async () => {
					// Return a pre-defined differentiated item with array-like objects
					return {
						choices: [
							{
								message: {
									content: JSON.stringify({
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
												feedbackBlocks: {
													CORRECT: {
														__sb_idx__0: {
															type: "paragraph",
															content: { __sb_idx__0: { type: "text", content: "Correct!" } }
														}
													},
													INCORRECT: {
														__sb_idx__0: {
															type: "paragraph",
															content: { __sb_idx__0: { type: "text", content: "Incorrect." } }
														}
													}
												}
											}
										]
									}),
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
			feedbackBlocks: {
				CORRECT: [{ type: "paragraph", content: [{ type: "text", content: "Correct" }] }],
				INCORRECT: [{ type: "paragraph", content: [{ type: "text", content: "Incorrect" }] }]
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
				throw errors.new("First body block is not a paragraph")
			}
		}
		expect(Array.isArray(item.responseDeclarations)).toBe(true)
		expect(item.responseDeclarations.length).toBe(1)
	})
})
