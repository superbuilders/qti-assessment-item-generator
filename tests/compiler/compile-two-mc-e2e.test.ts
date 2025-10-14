import { describe, expect, it } from "bun:test"
import { compile } from "../../src/compiler/compiler"
import type { AssessmentItem } from "../../src/core/item"
import { allWidgetsCollection } from "../../src/widgets/collections/all"
import { MINIMAL_INCORRECT_FEEDBACK } from "../helpers/feedback-fixtures"

describe("E2E compile: two MC with combo feedback", () => {
	it("produces valid QTI with response processing and feedback blocks", async () => {
		const item: AssessmentItem<[]> = {
			identifier: "ITEM_TWO_MC",
			title: "Two MC E2E",
			responseDeclarations: [
				{ identifier: "RESPONSE_1", cardinality: "single", baseType: "identifier", correct: "A" },
				{ identifier: "RESPONSE_2", cardinality: "single", baseType: "identifier", correct: "B" }
			],
			body: [
				{ type: "paragraph", content: [{ type: "text", content: "Question stem." }] },
				{ type: "interactionRef", interactionId: "int_1" },
				{ type: "interactionRef", interactionId: "int_2" }
			],
			widgets: null,
			interactions: {
				int_1: {
					type: "choiceInteraction",
					responseIdentifier: "RESPONSE_1",
					prompt: [{ type: "text", content: "Pick A or B" }],
					choices: [
						{ identifier: "A", content: [{ type: "paragraph", content: [{ type: "text", content: "A" }] }] },
						{ identifier: "B", content: [{ type: "paragraph", content: [{ type: "text", content: "B" }] }] }
					],
					shuffle: true,
					minChoices: 1,
					maxChoices: 1
				},
				int_2: {
					type: "choiceInteraction",
					responseIdentifier: "RESPONSE_2",
					prompt: [{ type: "text", content: "Pick A or B" }],
					choices: [
						{ identifier: "A", content: [{ type: "paragraph", content: [{ type: "text", content: "A" }] }] },
						{ identifier: "B", content: [{ type: "paragraph", content: [{ type: "text", content: "B" }] }] }
					],
					shuffle: true,
					minChoices: 1,
					maxChoices: 1
				}
			},
			feedbackPlan: {
				mode: "combo",
				dimensions: [
					{ responseIdentifier: "RESPONSE_1", kind: "enumerated", keys: ["A", "B"] },
					{ responseIdentifier: "RESPONSE_2", kind: "enumerated", keys: ["A", "B"] }
				],
				combinations: [
					{
						id: "FB__RESPONSE_1_A__RESPONSE_2_A",
						path: [
							{ responseIdentifier: "RESPONSE_1", key: "A" },
							{ responseIdentifier: "RESPONSE_2", key: "A" }
						]
					},
					{
						id: "FB__RESPONSE_1_A__RESPONSE_2_B",
						path: [
							{ responseIdentifier: "RESPONSE_1", key: "A" },
							{ responseIdentifier: "RESPONSE_2", key: "B" }
						]
					},
					{
						id: "FB__RESPONSE_1_B__RESPONSE_2_A",
						path: [
							{ responseIdentifier: "RESPONSE_1", key: "B" },
							{ responseIdentifier: "RESPONSE_2", key: "A" }
						]
					},
					{
						id: "FB__RESPONSE_1_B__RESPONSE_2_B",
						path: [
							{ responseIdentifier: "RESPONSE_1", key: "B" },
							{ responseIdentifier: "RESPONSE_2", key: "B" }
						]
					}
				]
			},
			feedback: {
				FEEDBACK__OVERALL: {
					RESPONSE_1: {
						A: {
							RESPONSE_2: {
								A: { content: MINIMAL_INCORRECT_FEEDBACK },
								B: { content: MINIMAL_INCORRECT_FEEDBACK }
							}
						},
						B: {
							RESPONSE_2: {
								A: { content: MINIMAL_INCORRECT_FEEDBACK },
								B: { content: MINIMAL_INCORRECT_FEEDBACK }
							}
						}
					}
				}
			}
		}

		const xml = await compile(item, allWidgetsCollection)

		expect(xml).toContain("<qti-assessment-item")
		expect(xml).toContain('identifier="ITEM_TWO_MC"')
		expect(xml).toContain("<qti-response-processing>")
		expect(xml).toContain(
			'<qti-feedback-block outcome-identifier="FEEDBACK__OVERALL" identifier="FB__RESPONSE_1_A__RESPONSE_2_A"'
		)
		expect(xml).toContain(
			'<qti-feedback-block outcome-identifier="FEEDBACK__OVERALL" identifier="FB__RESPONSE_1_A__RESPONSE_2_B"'
		)
		expect(xml).toContain(
			'<qti-feedback-block outcome-identifier="FEEDBACK__OVERALL" identifier="FB__RESPONSE_1_B__RESPONSE_2_A"'
		)
		expect(xml).toContain(
			'<qti-feedback-block outcome-identifier="FEEDBACK__OVERALL" identifier="FB__RESPONSE_1_B__RESPONSE_2_B"'
		)

		// Snapshot the full QTI for real renderer verification
		expect(xml).toMatchSnapshot()
	})
})
