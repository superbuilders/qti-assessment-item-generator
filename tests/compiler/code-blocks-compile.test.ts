import { describe, expect, test } from "bun:test"
import { compile } from "../../src/compiler/compiler"
import type { AssessmentItemInput } from "../../src/compiler/schemas"

describe("Compiler: code blocks", () => {
	test("should render code blocks in body and escape correctly", async () => {
		const item: AssessmentItemInput = {
			identifier: "code-block-item",
			title: "Code Block Support",
			responseDeclarations: [
				{
					identifier: "TE",
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
				TE_INT: { type: "textEntryInteraction", responseIdentifier: "TE", expectedLength: null }
			},
			feedback: { correct: [], incorrect: [] }
		}
		const xml = await compile(item)
		expect(xml).toContain("<pre><code>")
		expect(xml).toContain("print(i &lt; 5)")
		expect(xml).toMatchSnapshot()
	})
})
