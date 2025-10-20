import { describe, expect, test } from "bun:test"
import { HtmlValidate } from "html-validate"
import { buildStimulusFromPageData } from "@/stimulus/builder"
import { VOID_ELEMENTS } from "@/stimulus/constants"
import { collectStimulusFixtures } from "./fixtures"

const stimulusFixtures = collectStimulusFixtures()
const htmlvalidate = new HtmlValidate({
	extends: ["html-validate:recommended"],
	root: true,
	rules: {
		// Allow rich text coming from source content while still catching structural issues
		"long-title": "off",
		"no-inline-style": "off",
		"no-trailing-whitespace": "off",
		"require-sri": "off",
		"no-unknown-elements": "off",
		"void-style": "off"
	}
})

describe("Canvas stimulus HTML generation", () => {
	test("discovered stimulus page-data fixtures", () => {
		expect(stimulusFixtures.length).toBeGreaterThan(0)
	})

	for (const fixture of stimulusFixtures) {
		test(`renders HTML for ${fixture.slugPath}`, async () => {
			const result = buildStimulusFromPageData(fixture.page)
			expect(result).toBeDefined()
			if (!result) return

			expect(Array.isArray(result.videos)).toBeTrue()

			const fatalIssues = result.issues.filter(
				(issue) => issue.severity === "error"
			)
			expect(fatalIssues).toHaveLength(0)

			const warnings = result.issues.filter(
				(issue) => issue.severity === "warning"
			)
			expect(warnings).toHaveLength(0)

			expect(result.html.trim().length).toBeGreaterThan(0)
			expect(result.html).toMatchSnapshot()
			expect(result.html.includes("<iframe")).toBeFalse()
			expect(
				result.html.toLowerCase().includes("watch the following videos")
			).toBeFalse()

			for (const video of result.videos) {
				expect(video.order).toBeGreaterThan(0)
				expect(video.youtubeId.length).toBe(11)
			}

			const htmlDocument = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>stimulus</title></head><body>${result.html}</body></html>`
			const report = await htmlvalidate.validateString(
				htmlDocument,
				`${fixture.slugPath}.html`
			)
			const messages = report.results
				.flatMap((resultItem) => {
					const file = resultItem.filePath ?? `${fixture.slugPath}.html`
					return resultItem.messages.map((msg) => {
						const line = msg.line ?? 0
						const column = msg.column ?? 0
						return `${file}:${line}:${column} [${msg.ruleId}] ${msg.message}`
					})
				})
				.join("\n")
			expect(
				report.valid,
				messages.length > 0
					? `HTML validation errors:\n${messages}`
					: "HTML validation failed with unknown error"
			).toBeTrue()

			for (const tag of VOID_ELEMENTS) {
				const pattern = new RegExp(`<${tag}\\b[^>]*>`, "gi")
				for (const match of result.html.matchAll(pattern)) {
					const snippet = match[0]
					expect(
						snippet.trim().endsWith("/>"),
						`void element <${tag}> must be self-closing; found "${snippet}" in ${fixture.slugPath}`
					).toBeTrue()
				}
			}

			const disallowedNamed = result.html.match(/&[a-zA-Z][a-zA-Z0-9]+;/g) ?? []
			const allowedNamed = new Set([
				"&amp;",
				"&lt;",
				"&gt;",
				"&quot;",
				"&apos;"
			])
			for (const entity of disallowedNamed) {
				expect(
					allowedNamed.has(entity),
					`disallowed named entity ${entity} in ${fixture.slugPath}`
				).toBeTrue()
			}

			const numericEntities =
				result.html.match(/&#(?:\d+|x[0-9a-fA-F]+);/gi) ?? []
			expect(
				numericEntities.length,
				`numeric entities not permitted in ${fixture.slugPath}: ${numericEntities.join(", ")}`
			).toBe(0)
		})
	}
})
