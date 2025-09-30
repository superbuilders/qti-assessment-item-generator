import { describe, expect, test } from "bun:test"
import { compile } from "../../src/compiler/compiler"
import type { AssessmentItemInput } from "../../src/compiler/schemas"
import { allWidgetsCollection } from "../../src/widgets/collections/all"

describe("Compiler: code blocks", () => {
	test("should render code blocks in body and escape correctly", async () => {
		const item: AssessmentItemInput = {
			identifier: "code-block-item",
			title: "Code Block Support",
			responseDeclarations: [
				{
					identifier: "RESPONSE_TE",
					cardinality: "single",
					baseType: "string",
					correct: "ok"
				}
			],
			body: [
				{ type: "paragraph", content: [{ type: "text", content: "Below is code:" }] },
				{ type: "codeBlock", code: "for i in range(3):\n  print(i < 5)" }
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
			feedbackBlocks: {
				FB__RESPONSE_TE_CORRECT: [{ type: "paragraph", content: [{ type: "text", content: "Correct" }] }],
				FB__RESPONSE_TE_INCORRECT: [{ type: "paragraph", content: [{ type: "text", content: "Incorrect" }] }]
			}
		}
		const xml = await compile(item, allWidgetsCollection)
		expect(xml).toContain("<pre><code>")
		expect(xml).toContain("print(i &lt; 5)")
		expect(xml).toMatchSnapshot()
	})
})