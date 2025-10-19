import { describe, expect, test } from "bun:test"
import { buildStimulusFromHtml } from "@/stimulus/builder"

describe("whitespace normalization", () => {
	test("collapses indentation and redundant whitespace outside pre/code", () => {
		const result = buildStimulusFromHtml({
			html: `
				<div>
					<p>
						Hello      world
					</p>
				</div>
			`
		})

		expect(result.html).toBe("<article><div><p>Hello world</p></div></article>")
	})

	test("preserves content inside pre elements", () => {
		const preContent = `line 1
    line 2	with tabs
line 3`
		const result = buildStimulusFromHtml({
			html: `<pre>${preContent}</pre>`
		})

		expect(result.html).toBe(`<article><pre>${preContent}</pre></article>`)
	})

	test("preserves content inside code elements", () => {
		const codeContent = "function sum(a, b) {\n    return a + b;\n}"
		const result = buildStimulusFromHtml({
			html: `<code>${codeContent}</code>`
		})

		expect(result.html).toBe(`<article><code>${codeContent}</code></article>`)
	})
})
