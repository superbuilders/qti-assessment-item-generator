import { describe, expect, mock, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { buildPerseusEnvelope } from "../../src/structured/ai-context-builder"
import { generateFromEnvelope } from "../../src/structured/client"
import { allWidgetsCollection } from "../../src/widgets/collections/all"

// Define the minimal interface we need for testing
interface MockOpenAIInterface {
	chat: {
		completions: {
			create: (options: unknown) => Promise<{
				choices: Array<{
					message: {
						content: string | null
						refusal: null
					}
				}>
			}>
		}
	}
}

// Mock the OpenAI client
mock.module("openai", () => {
	class MockOpenAI implements MockOpenAIInterface {
		chat = {
			completions: {
				create: async (options: unknown) => {
					// Simulate responses based on the function name in the schema
					const functionName =
						typeof options === "object" &&
						options !== null &&
						"response_format" in options &&
						typeof options.response_format === "object" &&
						options.response_format !== null &&
						"json_schema" in options.response_format &&
						typeof options.response_format.json_schema === "object" &&
						options.response_format.json_schema !== null &&
						"name" in options.response_format.json_schema
							? options.response_format.json_schema.name
							: undefined
					if (functionName === "assessment_shell_generator") {
						const shellData = {
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
										{ type: "inlineInteractionRef", interactionId: "text_entry" }
									]
								},
								{ type: "widgetRef", widgetId: "image_widget", widgetType: "urlImage" }
							]
						}
						return {
							choices: [
								{
									message: {
										content: JSON.stringify(shellData),
										refusal: null
									}
								}
							]
						}
					}
					if (functionName === "interaction_content_generator") {
						const interactionData = {
							text_entry: {
								type: "textEntryInteraction",
								responseIdentifier: "RESPONSE",
								expectedLength: 2
							}
						}
						return {
							choices: [
								{
									message: {
										content: JSON.stringify(interactionData),
										refusal: null
									}
								}
							]
						}
					}
					if (functionName === "feedback_generator") {
						const feedbackData = {
							feedback: {
								FEEDBACK__OVERALL: {
									RESPONSE: {
										CORRECT: {
											content: [
												{
													type: "paragraph",
													content: [{ type: "text", content: "Correct! Well done." }]
												}
											]
										},
										INCORRECT: {
											content: [
												{
													type: "paragraph",
													content: [{ type: "text", content: "Not quite. Try again." }]
												}
											]
										}
									}
								}
							}
						}
						return {
							choices: [
								{
									message: {
										content: JSON.stringify(feedbackData),
										refusal: null
									}
								}
							]
						}
					}
					if (functionName === "widget_content_generator") {
						const widgetData = {
							image_widget: {
								type: "urlImage",
								url: "https://example.com/image.png",
								alt: "Mock image",
								width: 300,
								height: 300,
								caption: null,
								attribution: null
							}
						}
						return {
							choices: [
								{
									message: {
										content: JSON.stringify(widgetData),
										refusal: null
									}
								}
							]
						}
					}
					logger.error("unhandled mock case for function", { functionName })
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
		const result = await errors.try(generateFromEnvelope(mockOpenAI, logger, envelope, allWidgetsCollection))

		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test setup failed", { error: result.error })
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
			primaryContent: "",
			supplementaryContent: [],
			multimodalImageUrls: [],
			multimodalImagePayloads: []
		}

		const result = await errors.try(generateFromEnvelope(mockOpenAI, logger, emptyEnvelope, allWidgetsCollection))

		expect(result.error).toBeTruthy()
		expect(result.error?.message).toContain("primaryContent cannot be empty")
	})
})
