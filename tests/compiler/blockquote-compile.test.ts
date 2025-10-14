import { describe, expect, test } from "bun:test"
import { compile } from "@/compiler/compiler"
import type { AssessmentItemInput } from "@/core/item"
import { allWidgetsCollection } from "@/widgets/collections/all"
import { MINIMAL_CORRECT_FEEDBACK, MINIMAL_INCORRECT_FEEDBACK } from "../helpers/feedback-fixtures"

describe("Compiler: blockquote", () => {
	test("should render blockquote in body with escaped content", async () => {
		const item: AssessmentItemInput<[]> = {
			identifier: "blockquote-item",
			title: "Blockquote Support",
			responseDeclarations: [
				{
					identifier: "RESPONSE_TE",
					cardinality: "single",
					baseType: "string",
					correct: "ok"
				}
			],
			body: [
				{ type: "paragraph", content: [{ type: "text", content: "Consider this quote:" }] },
				{
					type: "blockquote",
					content: [{ type: "text", content: "To be or not to be, that is the question." }],
					attribution: [{ type: "text", content: "Shakespeare" }]
				}
			],
			widgets: null,
			interactions: {
				TE_INT: { type: "textEntryInteraction", responseIdentifier: "RESPONSE_TE", expectedLength: null }
			},
			feedbackPlan: {
				mode: "combo",
				dimensions: [{ responseIdentifier: "RESPONSE_TE", kind: "binary" }],
				combinations: [
					{ id: "FB__RESPONSE_TE_CORRECT", path: [{ responseIdentifier: "RESPONSE_TE", key: "CORRECT" }] },
					{ id: "FB__RESPONSE_TE_INCORRECT", path: [{ responseIdentifier: "RESPONSE_TE", key: "INCORRECT" }] }
				]
			},
			feedback: {
				FEEDBACK__OVERALL: {
					RESPONSE_TE: {
						CORRECT: { content: MINIMAL_CORRECT_FEEDBACK },
						INCORRECT: { content: MINIMAL_INCORRECT_FEEDBACK }
					}
				}
			}
		}
		const xml = await compile(item, allWidgetsCollection)
		expect(xml).toContain("<blockquote")
		expect(xml).toContain("To be or not to be")
		expect(xml).toContain("<footer")
		expect(xml).toContain("Shakespeare")
		expect(xml).toMatchSnapshot()
	})

	test("should render blockquote without attribution", async () => {
		const item: AssessmentItemInput<[]> = {
			identifier: "blockquote-no-attr",
			title: "Blockquote Without Attribution",
			responseDeclarations: [
				{
					identifier: "RESPONSE",
					cardinality: "single",
					baseType: "identifier",
					correct: "A"
				}
			],
				body: [
					{
						type: "blockquote",
						content: [{ type: "text", content: "Remember to find the common denominator first!" }],
						attribution: null
					}
				],
			widgets: null,
			interactions: {
				CI: {
					type: "choiceInteraction",
					responseIdentifier: "RESPONSE",
					prompt: [{ type: "text", content: "Choose:" }],
					choices: [
						{ identifier: "A", content: [{ type: "paragraph", content: [{ type: "text", content: "Option A" }] }] },
						{ identifier: "B", content: [{ type: "paragraph", content: [{ type: "text", content: "Option B" }] }] }
					],
					shuffle: true,
					minChoices: 1,
					maxChoices: 1
				}
			},
			feedbackPlan: {
				mode: "combo",
				dimensions: [{ responseIdentifier: "RESPONSE", kind: "binary" }],
				combinations: [
					{ id: "FB__RESPONSE_CORRECT", path: [{ responseIdentifier: "RESPONSE", key: "CORRECT" }] },
					{ id: "FB__RESPONSE_INCORRECT", path: [{ responseIdentifier: "RESPONSE", key: "INCORRECT" }] }
				]
			},
			feedback: {
				FEEDBACK__OVERALL: {
					RESPONSE: {
						CORRECT: { content: MINIMAL_CORRECT_FEEDBACK },
						INCORRECT: { content: MINIMAL_INCORRECT_FEEDBACK }
					}
				}
			}
		}
		const xml = await compile(item, allWidgetsCollection)
		expect(xml).toContain("<blockquote")
		expect(xml).toContain("common denominator")
		expect(xml).not.toContain("<footer")
		expect(xml).toMatchSnapshot()
	})
})

