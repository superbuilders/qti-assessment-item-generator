import { describe, expect, test } from "bun:test"
import { buildStimulusFromHtml } from "@/stimulus/builder"
import type { StyleObject } from "@/stimulus/types"

describe("inline style injection", () => {
	test("does not emit style attributes when inlineStyles option is absent", () => {
		const result = buildStimulusFromHtml({ html: "<p>Plain text</p>" })
		expect(result.html).toContain("<article>")
		expect(result.html).not.toContain('style="')
	})

	test("applies supplied inline styles to matching elements", () => {
		const inlineStyles: StyleObject = {
			p: {
				color: "#123456",
				marginBottom: 24
			}
		}

		const result = buildStimulusFromHtml(
			{ html: "<p>Styled paragraph</p>" },
			{ inlineStyles }
		)

		expect(result.html).toContain(
			'<p style="color: #123456; margin-bottom: 24px;">Styled paragraph</p>'
		)
	})

	test("removes author styles but applies curated inline styles", () => {
		const inlineStyles: StyleObject = {
			p: {
				fontWeight: 600
			}
		}

		const result = buildStimulusFromHtml(
			{ html: '<p style="color: blue;">Original style</p>' },
			{ inlineStyles }
		)

		expect(result.html).toContain(
			'<p style="font-weight: 600;">Original style</p>'
		)
		expect(result.html).not.toContain("color: blue")
	})
})
