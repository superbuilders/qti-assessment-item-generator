import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import {
	compile,
	ErrDuplicateChoiceIdentifier,
	ErrDuplicateResponseIdentifier,
	ErrInvalidRowHeaderKey
} from "../../src/compiler/compiler"
import type { AssessmentItemInput } from "../../src/compiler/schemas"

describe("Compiler Identifier Validation Integration Tests", () => {
	const baseItem: AssessmentItemInput = {
		identifier: "base-item-for-validation",
		title: "Base Item for Validation",
		body: [],
		feedback: {
			correct: [],
			incorrect: []
		},
		interactions: {},
		widgets: {},
		responseDeclarations: [
			{ identifier: "RESPONSE_1", cardinality: "single", baseType: "identifier", correct: "A" },
			{ identifier: "RESPONSE_2", cardinality: "single", baseType: "identifier", correct: "X" }
		]
	}

	test("should throw ErrDuplicateResponseIdentifier for duplicates across interactions", async () => {
		const itemWithDuplicate: AssessmentItemInput = {
			...baseItem,
			interactions: {
				interaction_1: {
					type: "choiceInteraction",
					responseIdentifier: "RESPONSE_1",
					prompt: [],
					choices: [
						{ identifier: "A", content: [], feedback: null },
						{ identifier: "B", content: [], feedback: null }
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
				}
			},
			responseDeclarations: [
				{ identifier: "RESPONSE_1", cardinality: "single", baseType: "identifier", correct: "A" }
			]
		}
		await expect(compile(itemWithDuplicate)).rejects.toThrow(ErrDuplicateResponseIdentifier)
	})

	test("should throw ErrDuplicateResponseIdentifier for duplicates between an interaction and a widget", async () => {
		const itemWithDuplicate: AssessmentItemInput = {
			...baseItem,
			interactions: {
				interaction_1: {
					type: "choiceInteraction",
					responseIdentifier: "RESPONSE_1",
					prompt: [],
					choices: [
						{ identifier: "A", content: [], feedback: null },
						{ identifier: "B", content: [], feedback: null }
					],
					shuffle: true,
					minChoices: 1,
					maxChoices: 1
				}
			},
			widgets: {
				table_1: {
					type: "dataTable",
					title: null,
					columns: [{ key: "col1", label: [], isNumeric: false }],
					rowHeaderKey: null,
					data: [
						[
							{
								type: "dropdown",
								responseIdentifier: "RESPONSE_1", // DUPLICATE
								shuffle: true,
								choices: [
									{ identifier: "X", content: [] },
									{ identifier: "Y", content: [] }
								]
							}
						]
					],
					footer: []
				}
			},
			responseDeclarations: [
				{ identifier: "RESPONSE_1", cardinality: "single", baseType: "identifier", correct: "A" }
			]
		}
		await expect(compile(itemWithDuplicate)).rejects.toThrow(ErrDuplicateResponseIdentifier)
	})

	test("should throw ErrDuplicateChoiceIdentifier for duplicates within a choiceInteraction", async () => {
		const itemWithDuplicate: AssessmentItemInput = {
			...baseItem,
			interactions: {
				interaction_1: {
					type: "choiceInteraction",
					responseIdentifier: "RESPONSE_1",
					prompt: [],
					choices: [
						{ identifier: "A", content: [], feedback: null },
						{ identifier: "A", content: [], feedback: null } // DUPLICATE
					],
					shuffle: true,
					minChoices: 1,
					maxChoices: 1
				}
			},
			responseDeclarations: [
				{ identifier: "RESPONSE_1", cardinality: "single", baseType: "identifier", correct: "A" }
			]
		}
		await expect(compile(itemWithDuplicate)).rejects.toThrow(ErrDuplicateChoiceIdentifier)
	})

	test("should throw ErrDuplicateChoiceIdentifier for duplicates within a dataTable dropdown", async () => {
		const itemWithDuplicate: AssessmentItemInput = {
			...baseItem,
			widgets: {
				table_1: {
					type: "dataTable",
					title: null,
					columns: [{ key: "col1", label: [], isNumeric: false }],
					rowHeaderKey: null,
					data: [
						[
							{
								type: "dropdown",
								responseIdentifier: "RESPONSE_1",
								shuffle: true,
								choices: [
									{ identifier: "A", content: [] },
									{ identifier: "A", content: [] } // DUPLICATE
								]
							}
						]
					],
					footer: []
				}
			},
			responseDeclarations: [
				{ identifier: "RESPONSE_1", cardinality: "single", baseType: "identifier", correct: "A" }
			]
		}
		await expect(compile(itemWithDuplicate)).rejects.toThrow(ErrDuplicateChoiceIdentifier)
	})

	test("should throw ErrInvalidRowHeaderKey for a non-existent rowHeaderKey", async () => {
		const itemWithInvalidKey: AssessmentItemInput = {
			...baseItem,
			interactions: {
				interaction_1: {
					type: "choiceInteraction",
					responseIdentifier: "RESPONSE_1",
					prompt: [],
					choices: [
						{ identifier: "A", content: [], feedback: null },
						{ identifier: "B", content: [], feedback: null }
					],
					shuffle: true,
					minChoices: 1,
					maxChoices: 1
				}
			},
			widgets: {
				table_1: {
					type: "dataTable",
					title: null,
					columns: [
						{ key: "col1", label: [], isNumeric: false },
						{ key: "col2", label: [], isNumeric: false }
					],
					rowHeaderKey: "non_existent_key", // INVALID
					data: [
						[
							{ type: "inline", content: [] },
							{ type: "inline", content: [] }
						]
					],
					footer: []
				}
			},
			responseDeclarations: [
				{ identifier: "RESPONSE_1", cardinality: "single", baseType: "identifier", correct: "A" }
			]
		}
		await expect(compile(itemWithInvalidKey)).rejects.toThrow(ErrInvalidRowHeaderKey)
	})

	test("should compile successfully with complex valid identifiers", async () => {
		const validItem: AssessmentItemInput = {
			...baseItem,
			interactions: {
				interaction_1: {
					type: "choiceInteraction",
					responseIdentifier: "RESPONSE_1",
					prompt: [],
					choices: [
						{ identifier: "A", content: [], feedback: null },
						{ identifier: "B", content: [], feedback: null }
					],
					shuffle: true,
					minChoices: 1,
					maxChoices: 1
				}
			},
			widgets: {
				table_1: {
					type: "dataTable",
					title: null,
					columns: [{ key: "header", label: [], isNumeric: false }],
					rowHeaderKey: "header",
					data: [
						[
							{
								type: "dropdown",
								responseIdentifier: "RESPONSE_2",
								shuffle: true,
								choices: [
									{ identifier: "X", content: [] },
									{ identifier: "Y", content: [] }
								]
							}
						]
					],
					footer: []
				}
			},
			responseDeclarations: [
				{ identifier: "RESPONSE_1", cardinality: "single", baseType: "identifier", correct: "A" },
				{ identifier: "RESPONSE_2", cardinality: "single", baseType: "identifier", correct: "X" }
			]
		}

		const result = await errors.try(compile(validItem))
		if (result.error) {
			logger.error("valid item failed compilation unexpectedly", { error: result.error })
		}
		expect(result.error).toBeUndefined()
	})
})
