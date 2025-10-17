import { describe, expect, it } from "bun:test"
import { compileResponseProcessing } from "@/compiler/response-processor"
import type { FeedbackPlan } from "@/core/feedback"
import type { AssessmentItem } from "@/core/item"
import { MINIMAL_INCORRECT_FEEDBACK } from "@/testing/helpers/feedback-fixtures"

describe("Response Processing - two MC combo plan", () => {
	it("emits FEEDBACK__OVERALL for all combinations", () => {
		const widgetTypeKeys = [] as const

		const feedbackPlan: FeedbackPlan = {
			mode: "combo",
			dimensions: [
				{
					responseIdentifier: "RESPONSE_1",
					kind: "enumerated",
					keys: ["A", "B"]
				},
				{
					responseIdentifier: "RESPONSE_2",
					kind: "enumerated",
					keys: ["A", "B"]
				}
			],
			combinations: [
				{
					id: "FB_R1_A__R2_A",
					path: [
						{ responseIdentifier: "RESPONSE_1", key: "A" },
						{ responseIdentifier: "RESPONSE_2", key: "A" }
					]
				},
				{
					id: "FB_R1_A__R2_B",
					path: [
						{ responseIdentifier: "RESPONSE_1", key: "A" },
						{ responseIdentifier: "RESPONSE_2", key: "B" }
					]
				},
				{
					id: "FB_R1_B__R2_A",
					path: [
						{ responseIdentifier: "RESPONSE_1", key: "B" },
						{ responseIdentifier: "RESPONSE_2", key: "A" }
					]
				},
				{
					id: "FB_R1_B__R2_B",
					path: [
						{ responseIdentifier: "RESPONSE_1", key: "B" },
						{ responseIdentifier: "RESPONSE_2", key: "B" }
					]
				}
			]
		}

		const item: AssessmentItem<typeof widgetTypeKeys> = {
			identifier: "ITEM_1",
			title: "Two MC Test",
			responseDeclarations: [
				{
					identifier: "RESPONSE_1",
					cardinality: "single",
					baseType: "identifier",
					correct: "A"
				},
				{
					identifier: "RESPONSE_2",
					cardinality: "single",
					baseType: "identifier",
					correct: "A"
				}
			],
			body: null,
			widgets: null,
			interactions: null,
			feedbackPlan,
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

		// Create internal flat representation for response processor
		const itemWithBlocks = { ...item, feedbackBlocks: {} }
		const xml = compileResponseProcessing(itemWithBlocks)

		// Ensure all combinations appear in FEEDBACK__OVERALL assignments
		expect(xml).toContain(
			'<qti-base-value base-type="identifier">FB_R1_A__R2_A</qti-base-value>'
		)
		expect(xml).toContain(
			'<qti-base-value base-type="identifier">FB_R1_A__R2_B</qti-base-value>'
		)
		expect(xml).toContain(
			'<qti-base-value base-type="identifier">FB_R1_B__R2_A</qti-base-value>'
		)
		expect(xml).toContain(
			'<qti-base-value base-type="identifier">FB_R1_B__R2_B</qti-base-value>'
		)

		// Sanity: branch conditions reference both responses and both keys
		expect(xml).toContain('<qti-variable identifier="RESPONSE_1"/>')
		expect(xml).toContain('<qti-variable identifier="RESPONSE_2"/>')
		expect(xml).toContain(
			'<qti-base-value base-type="identifier">A</qti-base-value>'
		)
		expect(xml).toContain(
			'<qti-base-value base-type="identifier">B</qti-base-value>'
		)
	})
})
