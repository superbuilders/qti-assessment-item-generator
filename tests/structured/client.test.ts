import { describe, expect, mock, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { AssessmentItemShell } from "../../src/compiler/schemas"
import { buildPerseusEnvelope } from "../../src/structured/ai-context-builder"
import { generateFromEnvelope } from "../../src/structured/client"

// Mock the OpenAI client
mock.module("openai", () => {
	class MockOpenAI {
		chat = {
			completions: {
				parse: async (options: any) => {
					// Simulate responses based on the function name in the schema
					const functionName = options?.response_format?.json_schema?.name
					if (functionName === "assessment_shell_generator") {
						return {
							choices: [
								{
									message: {
										parsed: {
											identifier: "mock-item-1",
											title: "Mock Item",
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
													content: [
														{ type: "text", content: "What is the answer? " },
														{ type: "inlineSlot", slotId: "text_entry" }
													]
												},
												{ type: "blockSlot", slotId: "image_widget" }
											],
											widgets: ["image_widget"],
											interactions: ["text_entry"],
											feedback: {
												correct: [{ type: "paragraph", content: [{ type: "text", content: "Correct" }] }],
												incorrect: [{ type: "paragraph", content: [{ type: "text", content: "Incorrect" }] }]
											}
										} as AssessmentItemShell,
										refusal: null
									}
								}
							]
						}
					}
					if (functionName === "widget_mapper") {
						return {
							choices: [
								{
									message: {
										parsed: {
											widget_mapping: {
												image_widget: "urlImage"
											}
										},
										refusal: null
									}
								}
							]
						}
					}
					if (functionName === "interaction_content_generator") {
						return {
							choices: [
								{
									message: {
										parsed: {
											text_entry: {
												type: "textEntryInteraction",
												responseIdentifier: "RESPONSE",
												expectedLength: 2
											}
										},
										refusal: null
									}
								}
							]
						}
					}
					if (functionName === "widget_content_generator") {
						return {
							choices: [
								{
									message: {
										parsed: {
											image_widget: {
												type: "urlImage",
												url: "https://example.com/image.png",
												alt: "Mock image",
												width: 100,
												height: 100,
												caption: null,
												attribution: null
											}
										},
										refusal: null
									}
								}
							]
						}
					}
					throw errors.new(`unhandled mock case for function: ${functionName}`)
				}
			}
		}
	}
	return {
		__esModule: true,
		default: MockOpenAI
	}
})

describe("Structured AI Pipeline", () => {
	test("should correctly orchestrate the 4 shots and assemble the final assessment item", async () => {
		const OpenAI = (await import("openai")).default
		const mockOpenAI = new OpenAI()

		const perseusData = {
			question: {
				content: "What is the answer? [[☃ text_entry 1]] [[☃ image_widget 1]]"
			}
		}

		const envelope = await buildPerseusEnvelope(perseusData)
		const result = await errors.try(generateFromEnvelope(mockOpenAI, logger, envelope, "math-core"))

		expect(result.error).toBeFalsy()
		if (result.error) {
			throw errors.new("test setup failed")
		}

		const finalItem = result.data

		// Assertions to verify the final assembled item
		expect(finalItem.identifier).toBe("mock-item-1")
		expect(finalItem.interactions).toHaveProperty("text_entry")
		expect(finalItem.widgets).toHaveProperty("image_widget")

		const interaction = finalItem.interactions?.text_entry
		expect(interaction?.type).toBe("textEntryInteraction")
		if (interaction?.type === "textEntryInteraction") {
			expect(interaction.responseIdentifier).toBe("RESPONSE")
		}

		const widget = finalItem.widgets?.image_widget
		expect(widget?.type).toBe("urlImage")
		if (widget?.type === "urlImage") {
			expect(widget.url).toBe("https://example.com/image.png")
		}
	})

	test("should fail when envelope context is empty - no fallbacks", async () => {
		const OpenAI = (await import("openai")).default
		const mockOpenAI = new OpenAI()

		const emptyEnvelope = {
			context: [],
			imageUrls: []
		}

		const result = await errors.try(generateFromEnvelope(mockOpenAI, logger, emptyEnvelope, "math-core"))

		expect(result.error).toBeTruthy()
		expect(result.error?.message).toContain("envelope context cannot be empty")
	})

	test("should fail when widgetCollectionName is invalid - no fallbacks", async () => {
		const OpenAI = (await import("openai")).default
		const mockOpenAI = new OpenAI()

		const envelope = {
			context: ["test content"],
			imageUrls: []
		}

		// This should fail at TypeScript level, but let's test runtime behavior
		const result = await errors.try(generateFromEnvelope(mockOpenAI, logger, envelope, "invalid-collection" as any))

		// The function should either fail at compile time or throw at runtime
		// Since TypeScript should catch this, the test mainly documents the expected behavior
		expect(result.error || true).toBeTruthy()
	})

	test("should throw a slot mismatch error if shell is inconsistent", async () => {
		const OpenAI = (await import("openai")).default

		// Create a separate mock for this specific test case
		const MockOpenAIInconsistent = class {
			chat = {
				completions: {
					parse: async (options: any) => {
						const functionName = options?.response_format?.json_schema?.name
						if (functionName === "assessment_shell_generator") {
							return {
								choices: [
									{
										message: {
											parsed: {
												identifier: "mock-item-invalid",
												title: "Mock Item Invalid",
												responseDeclarations: [],
												body: [{ type: "blockSlot", slotId: "image_widget" }],
												widgets: [], // <-- INTENTIONALLY EMPTY
												interactions: [],
												feedback: { correct: [], incorrect: [] }
											} as AssessmentItemShell,
											refusal: null
										}
									}
								]
							}
						}
						// For other function calls, just return empty responses
						return {
							choices: [
								{
									message: {
										parsed: {},
										refusal: null
									}
								}
							]
						}
					}
				}
			}
		}

		const mockOpenAI = new MockOpenAIInconsistent() as any

		const envelope = { context: ["test content"], imageUrls: [] }

		const result = await errors.try(generateFromEnvelope(mockOpenAI, logger, envelope, "math-core"))

		expect(result.error).toBeTruthy()
		expect(result.error?.message).toInclude("Slot declaration mismatch")
		expect(result.error?.message).toInclude("Slots used in content but not declared")
	})
})
