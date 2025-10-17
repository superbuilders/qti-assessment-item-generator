import { describe, expect, mock, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type OpenAI from "openai"
import { generateFromEnvelope } from "../../src/structured/client"
import { allWidgetsCollection } from "../../src/widgets/collections/all"

// Mock OpenAI Responses API
mock.module("openai", () => {
	class MockOpenAI {
		responses = {
			create: async (params: { text?: { format?: { name?: string } } }) => {
				const name = params.text?.format?.name
				if (name === "assessment_shell_generator") {
					return {
						output_text: JSON.stringify({
							identifier: "item_1",
							title: "title",
							body: [{ type: "interactionRef", interactionId: "choice_interaction" }],
							responseDeclarations: [
								{
									identifier: "RESPONSE",
									cardinality: "single",
									baseType: "identifier",
									correct: "A"
								}
							]
						})
					}
				}
				if (name === "interaction_content_generator") {
					return {
						output_text: JSON.stringify({
							choice_interaction: {
								type: "choiceInteraction",
								responseIdentifier: "RESPONSE",
								prompt: [{ type: "text", content: "Select one." }],
								choices: [
									{
										identifier: "A",
										content: [{ type: "paragraph", content: [{ type: "text", content: "A" }] }]
									},
									{
										identifier: "B",
										content: [{ type: "paragraph", content: [{ type: "text", content: "B" }] }]
									}
								],
								shuffle: true,
								minChoices: 1,
								maxChoices: 1
							}
						})
					}
				}
				if (name === "widget_content_generator") {
					return { output_text: JSON.stringify({}) }
				}
				if (name === "feedback") {
					return {
						output_text: JSON.stringify({
							content: {
								preamble: {
									correctness: "correct",
									summary: [{ type: "text", content: "ok" }]
								},
								steps: [
									{
										type: "step",
										title: [{ type: "text", content: "Step 1" }],
										content: [
											{ type: "paragraph", content: [{ type: "text", content: "Do this." }] }
										]
									},
									{
										type: "step",
										title: [{ type: "text", content: "Step 2" }],
										content: [
											{ type: "paragraph", content: [{ type: "text", content: "Then this." }] }
										]
									}
								]
							}
						})
					}
				}
				return { output_text: "{}" }
			}
		}
	}
	return { __esModule: true, default: MockOpenAI }
})

describe("Responses shots wiring", () => {
	test("builds multi-part input and validates schemas across shots", async () => {
		const OpenAIModule = await import("openai")
		const OpenAICtor: new () => OpenAI = OpenAIModule.default
		const openai = new OpenAICtor()
		const envelope = {
			primaryContent: "<html>hello</html>",
			supplementaryContent: ["s1"],
			multimodalImageUrls: ["data:image/png;base64,AAAA"],
			multimodalImagePayloads: [
				{ data: new Uint8Array([1, 2, 3]).buffer, mimeType: "image/png" as const }
			],
			pdfPayloads: [{ name: "doc", data: new Uint8Array([9, 9]).buffer }]
		}

		const itemResult = await errors.try(
			generateFromEnvelope(openai, logger, envelope, allWidgetsCollection)
		)
		expect(itemResult.error).toBeFalsy()
		const item = itemResult.data
		expect(item?.identifier).toBe("item_1")
		expect(item?.responseDeclarations?.length).toBe(1)
	})
})
