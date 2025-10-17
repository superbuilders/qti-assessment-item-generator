import { describe, expect, test } from "bun:test"
import { compileResponseDeclarations } from "@/compiler/response-processor"
import type { AssessmentItem } from "@/core/item"

describe("compileResponseDeclarations", () => {
	test("emits directedPair correct-response and mapping", () => {
		const decls: AssessmentItem<[]>["responseDeclarations"] = [
			{
				identifier: "RESPONSE",
				cardinality: "multiple",
				baseType: "directedPair",
				correct: [
					{ source: "WORD_A", target: "GAP_1" },
					{ source: "WORD_B", target: "GAP_2" }
				],
				allowEmpty: false
			}
		]
		const xml = compileResponseDeclarations(decls)
		expect(xml).toContain('<qti-response-declaration identifier="RESPONSE"')
		expect(xml).toContain("<qti-correct-response>")
		expect(xml).toContain("<qti-value>WORD_A GAP_1</qti-value>")
		expect(xml).toContain("<qti-mapping")
		expect(xml).toContain('<qti-map-entry map-key="WORD_B GAP_2"')
	})

	test("emits single textual mapping for string", () => {
		const decls: AssessmentItem<[]>["responseDeclarations"] = [
			{
				identifier: "RESPONSE",
				cardinality: "single",
				baseType: "string",
				correct: "42"
			}
		]
		const xml = compileResponseDeclarations(decls)
		expect(xml).toContain('base-type="string"')
		expect(xml).toContain("<qti-correct-response>")
		expect(xml).toContain("<qti-value>42</qti-value>")
		expect(xml).toContain("<qti-mapping")
		expect(xml).toContain('mapped-value="1"')
	})

	test("emits identifier list without mapping when cardinality multiple", () => {
		const decls: AssessmentItem<[]>["responseDeclarations"] = [
			{
				identifier: "RESPONSE",
				cardinality: "multiple",
				baseType: "identifier",
				correct: ["A", "C"]
			}
		]
		const xml = compileResponseDeclarations(decls)
		expect(xml).toContain('base-type="identifier"')
		expect(xml).toContain("<qti-correct-response>")
		expect(xml).toContain("<qti-value>A</qti-value>")
		expect(xml).toContain("<qti-value>C</qti-value>")
		// no mapping tag for identifier/multiple in our current implementation
		expect(xml).not.toContain("<qti-mapping")
	})
})
