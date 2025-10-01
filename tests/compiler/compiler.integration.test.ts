import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { compile, ErrDuplicateChoiceIdentifier, ErrDuplicateResponseIdentifier } from "@/compiler/compiler"
import type { AssessmentItemInput } from "@/core/item"
import { allWidgetsCollection } from "@/widgets/collections/all"

describe("Compiler Identifier Validation Integration Tests", () => {
	test("should throw ErrDuplicateResponseIdentifier for duplicates across interactions", async () => {
		const itemWithDuplicate: AssessmentItemInput<readonly []> = {
			identifier: "test-duplicate-response",
			title: "Test Duplicate Response",
			body: [],
			feedbackPlan: {
				mode: "fallback",
				dimensions: [{ responseIdentifier: "RESPONSE_1", kind: "binary" }],
				combinations: [
					{ id: "CORRECT", path: [{ responseIdentifier: "RESPONSE_1", key: "CORRECT" }] },
					{ id: "INCORRECT", path: [{ responseIdentifier: "RESPONSE_1", key: "INCORRECT" }] }
				]
			},
			feedbackBlocks: {
				CORRECT: [{ type: "paragraph", content: [{ type: "text", content: "Correct" }] }],
				INCORRECT: [{ type: "paragraph", content: [{ type: "text", content: "Incorrect" }] }]
			},
			interactions: {
				interaction_1: {
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
				interaction_2: {
					type: "inlineChoiceInteraction",
					responseIdentifier: "RESPONSE_1", // DUPLICATE
					choices: [
						{ identifier: "X", content: [] },
						{ identifier: "Y", content: [] }
					],
					shuffle: true
				},
				text_entry: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_TEXT", expectedLength: 10 }
			},
			widgets: {},
			responseDeclarations: [
				{ identifier: "RESPONSE_1", cardinality: "single", baseType: "identifier", correct: "A" },
				{ identifier: "RESPONSE_TEXT", cardinality: "single", baseType: "string", correct: "test" }
			]
		}
		return expect(compile(itemWithDuplicate, allWidgetsCollection)).rejects.toThrow(ErrDuplicateResponseIdentifier)
	})

	test("should throw ErrDuplicateChoiceIdentifier for duplicates within a choiceInteraction", async () => {
		const itemWithDuplicate: AssessmentItemInput<readonly []> = {
			identifier: "test-choice-duplicate",
			title: "Test Choice Duplicate",
			body: [],
			feedbackPlan: {
				mode: "combo",
				dimensions: [{ responseIdentifier: "RESPONSE_1", kind: "enumerated", keys: ["A", "A"] }],
				combinations: [
					{ id: "FB__RESPONSE_1_A", path: [{ responseIdentifier: "RESPONSE_1", key: "A" }] },
					{ id: "FB__RESPONSE_1_A", path: [{ responseIdentifier: "RESPONSE_1", key: "A" }] }
				]
			},
			feedbackBlocks: {
				FB__RESPONSE_1_A: [{ type: "paragraph", content: [{ type: "text", content: "Choice A" }] }]
			},
			interactions: {
				interaction_1: {
					type: "choiceInteraction",
					responseIdentifier: "RESPONSE_1",
					prompt: [],
					choices: [
						{ identifier: "A", content: [] },
						{ identifier: "A", content: [] } // DUPLICATE
					],
					shuffle: true,
					minChoices: 1,
					maxChoices: 1
				}
			},
			widgets: {},
			responseDeclarations: [{ identifier: "RESPONSE_1", cardinality: "single", baseType: "identifier", correct: "A" }]
		}
		return expect(compile(itemWithDuplicate, allWidgetsCollection)).rejects.toThrow(ErrDuplicateChoiceIdentifier)
	})

	test("should compile successfully with complex valid identifiers", async () => {
		const validItem: AssessmentItemInput<readonly []> = {
			identifier: "test-valid-complex",
			title: "Test Valid Complex",
			body: [],
			feedbackPlan: {
				mode: "combo",
				dimensions: [
					{ responseIdentifier: "RESPONSE_1", kind: "enumerated", keys: ["A", "B"] },
					{ responseIdentifier: "RESPONSE_TEXT", kind: "binary" }
				],
				combinations: [
					{
						id: "FB__RESPONSE_1_A__RESPONSE_TEXT_CORRECT",
						path: [
							{ responseIdentifier: "RESPONSE_1", key: "A" },
							{ responseIdentifier: "RESPONSE_TEXT", key: "CORRECT" }
						]
					},
					{
						id: "FB__RESPONSE_1_A__RESPONSE_TEXT_INCORRECT",
						path: [
							{ responseIdentifier: "RESPONSE_1", key: "A" },
							{ responseIdentifier: "RESPONSE_TEXT", key: "INCORRECT" }
						]
					},
					{
						id: "FB__RESPONSE_1_B__RESPONSE_TEXT_CORRECT",
						path: [
							{ responseIdentifier: "RESPONSE_1", key: "B" },
							{ responseIdentifier: "RESPONSE_TEXT", key: "CORRECT" }
						]
					},
					{
						id: "FB__RESPONSE_1_B__RESPONSE_TEXT_INCORRECT",
						path: [
							{ responseIdentifier: "RESPONSE_1", key: "B" },
							{ responseIdentifier: "RESPONSE_TEXT", key: "INCORRECT" }
						]
					}
				]
			},
			feedbackBlocks: {
				FB__RESPONSE_1_A__RESPONSE_TEXT_CORRECT: [
					{ type: "paragraph", content: [{ type: "text", content: "A + Correct" }] }
				],
				FB__RESPONSE_1_A__RESPONSE_TEXT_INCORRECT: [
					{ type: "paragraph", content: [{ type: "text", content: "A + Incorrect" }] }
				],
				FB__RESPONSE_1_B__RESPONSE_TEXT_CORRECT: [
					{ type: "paragraph", content: [{ type: "text", content: "B + Correct" }] }
				],
				FB__RESPONSE_1_B__RESPONSE_TEXT_INCORRECT: [
					{ type: "paragraph", content: [{ type: "text", content: "B + Incorrect" }] }
				]
			},
			interactions: {
				interaction_1: {
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
				text_entry: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_TEXT", expectedLength: 10 }
			},
			widgets: {},
			responseDeclarations: [
				{ identifier: "RESPONSE_1", cardinality: "single", baseType: "identifier", correct: "A" },
				{ identifier: "RESPONSE_TEXT", cardinality: "single", baseType: "string", correct: "test" }
			]
		}

		const result = await errors.try(compile(validItem, allWidgetsCollection))
		if (result.error) {
			logger.error("valid item failed compilation unexpectedly", { error: result.error })
		}
		expect(result.error).toBeUndefined()
	})
})
