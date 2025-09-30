import { describe, expect, test } from "bun:test"
import { compileResponseProcessing } from "../../src/compiler/response-processor"
import type { AssessmentItem } from "../../src/compiler/schemas"

function baseItem(): AssessmentItem {
	return {
		identifier: "ITEM_1",
		title: "Test",
		responseDeclarations: [],
		body: null,
		widgets: null,
		interactions: null,
		feedbackPlan: {
			mode: "fallback",
			dimensions: [],
			combinations: []
		},
		feedbackBlocks: {}
	}
}

describe("compileResponseProcessing", () => {
	test("fallback mode emits CORRECT/INCORRECT outcome setting", () => {
		const item: AssessmentItem = {
			...baseItem(),
			responseDeclarations: [{ identifier: "RESPONSE", cardinality: "single", baseType: "string", correct: "42" }],
			interactions: {
				text: { type: "textEntryInteraction", responseIdentifier: "RESPONSE", expectedLength: null }
			},
			feedbackPlan: {
				mode: "fallback",
				dimensions: [{ responseIdentifier: "RESPONSE", kind: "binary" }],
				combinations: [
					{ id: "CORRECT", path: [] },
					{ id: "INCORRECT", path: [] }
				]
			},
			feedbackBlocks: {
				CORRECT: [],
				INCORRECT: []
			}
		}
		const xml = compileResponseProcessing(item)
		expect(xml).toContain('<qti-base-value base-type="identifier">CORRECT</qti-base-value>')
		expect(xml).toContain('<qti-base-value base-type="identifier">INCORRECT</qti-base-value>')
	})

	test("combo mode enumerated single-select branches on choices and derives FB__ id", () => {
		const item: AssessmentItem = {
			...baseItem(),
			responseDeclarations: [{ identifier: "RESPONSE", cardinality: "single", baseType: "identifier", correct: "A" }],
			interactions: {
				mc: {
					type: "choiceInteraction",
					responseIdentifier: "RESPONSE",
					prompt: [],
					choices: [
						{ identifier: "A", content: [] },
						{ identifier: "B", content: [] }
					],
					shuffle: true,
					minChoices: 1,
					maxChoices: 1
				}
			},
			feedbackPlan: {
				mode: "combo",
				dimensions: [{ responseIdentifier: "RESPONSE", kind: "enumerated", keys: ["A", "B"] }],
				combinations: [
					{ id: "FB__RESPONSE_A", path: [{ responseIdentifier: "RESPONSE", key: "A" }] },
					{ id: "FB__RESPONSE_B", path: [{ responseIdentifier: "RESPONSE", key: "B" }] }
				]
			},
			feedbackBlocks: {
				FB__RESPONSE_A: [],
				FB__RESPONSE_B: []
			}
		}
		const xml = compileResponseProcessing(item)
		expect(xml).toContain('<qti-base-value base-type="identifier">FB__RESPONSE_A</qti-base-value>')
		expect(xml).toContain('<qti-base-value base-type="identifier">FB__RESPONSE_B</qti-base-value>')
	})

	test("combo mode correctness branches for non-enumerated", () => {
		const item: AssessmentItem = {
			...baseItem(),
			responseDeclarations: [{ identifier: "RESPONSE", cardinality: "single", baseType: "string", correct: "42" }],
			interactions: {
				text: { type: "textEntryInteraction", responseIdentifier: "RESPONSE", expectedLength: null }
			},
			feedbackPlan: {
				mode: "combo",
				dimensions: [{ responseIdentifier: "RESPONSE", kind: "binary" }],
				combinations: [
					{ id: "FB__RESPONSE_CORRECT", path: [{ responseIdentifier: "RESPONSE", key: "CORRECT" }] },
					{ id: "FB__RESPONSE_INCORRECT", path: [{ responseIdentifier: "RESPONSE", key: "INCORRECT" }] }
				]
			},
			feedbackBlocks: {
				FB__RESPONSE_CORRECT: [],
				FB__RESPONSE_INCORRECT: []
			}
		}
		const xml = compileResponseProcessing(item)
		expect(xml).toContain('<qti-correct identifier="RESPONSE"/>')
		expect(xml).toContain('<qti-base-value base-type="identifier">FB__RESPONSE_CORRECT</qti-base-value>')
		expect(xml).toContain('<qti-base-value base-type="identifier">FB__RESPONSE_INCORRECT</qti-base-value>')
	})
})