import { describe, expect, test, mock } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { generateStructuredQtiItem } from "../src/structured/client"
import type { AssessmentItemShell } from "../src/compiler/schemas"

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

		const result = await errors.try(generateStructuredQtiItem(mockOpenAI, logger, perseusData))

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
})
