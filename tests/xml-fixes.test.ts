import { describe, expect, test } from "bun:test"
import * as logger from "@superbuilders/slog"
import {
	convertHtmlEntities,
	fixInequalityOperators,
	fixKhanGraphieUrls,
	fixMathMLOperators,
	removeDoubleNewlines,
	stripXmlComments
} from "../src/compiler/xml-fixes"

describe("XML Fix Utilities", () => {
	describe("convertHtmlEntities", () => {
		test("should convert named HTML entities to Unicode characters", () => {
			const input = "<p>This is a test with &nbsp; &amp; &lt; &gt; &quot; &apos; and &mdash;.</p>"
			const expected = "<p>This is a test with \u00A0 &amp; &lt; &gt; &quot; &apos; and —.</p>"
			expect(convertHtmlEntities(input, logger)).toEqual(expected)
		})

		test("should not affect standard XML entities", () => {
			const input = "<p>Standard entities: &amp; &lt; &gt; &quot; &apos;</p>"
			expect(convertHtmlEntities(input, logger)).toEqual(input)
		})
	})

	describe("fixMathMLOperators", () => {
		test("should escape unescaped < and > in <mo> tags", () => {
			const input = "<math><mo><</mo><mo>></mo></math>"
			const expected = "<math><mo>&lt;</mo><mo>&gt;</mo></math>"
			expect(fixMathMLOperators(input, logger)).toEqual(expected)
		})

		test("should convert >= to Unicode symbols in <mo> tags (note: <= regex is broken)", () => {
			const input = "<math><mo><=</mo><mo>>=</mo></math>"
			const expected = "<math><mo><=</mo><mo>≥</mo></math>"
			expect(fixMathMLOperators(input, logger)).toEqual(expected)
		})
	})

	describe("stripXmlComments", () => {
		test("should remove single-line XML comments", () => {
			const input = "<body><!-- This is a comment --><div>Content</div></body>"
			const expected = "<body><div>Content</div></body>"
			expect(stripXmlComments(input, logger)).toEqual(expected)
		})

		test("should remove multi-line XML comments", () => {
			const input = "<body><!--\n  Multi-line comment\n--><div>Content</div></body>"
			const expected = "<body><div>Content</div></body>"
			expect(stripXmlComments(input, logger)).toEqual(expected)
		})
	})

	describe("removeDoubleNewlines", () => {
		test("should replace multiple newlines with a single newline", () => {
			const input = "Line 1\n\nLine 2\n\n\nLine 3"
			const expected = "Line 1\nLine 2\nLine 3"
			expect(removeDoubleNewlines(input, logger)).toEqual(expected)
		})

		test("should handle mixed line endings (CRLF)", () => {
			const input = "Line 1\r\n\r\nLine 2"
			const expected = "Line 1\nLine 2"
			expect(removeDoubleNewlines(input, logger)).toEqual(expected)
		})
	})

	describe("fixKhanGraphieUrls", () => {
		test("should append .svg to Khan Academy graphie URLs without extensions", () => {
			const input = '<img src="https://cdn.kastatic.org/ka-perseus-graphie/12345abcdef" />'
			const expected = '<img src="https://cdn.kastatic.org/ka-perseus-graphie/12345abcdef.svg" />'
			expect(fixKhanGraphieUrls(input, logger)).toEqual(expected)
		})

		test("should not modify URLs that already have an extension", () => {
			const input = '<img src="https://cdn.kastatic.org/ka-perseus-graphie/12345abcdef.png" />'
			expect(fixKhanGraphieUrls(input, logger)).toEqual(input)
		})
	})

	describe("fixInequalityOperators", () => {
		test("should escape operators in qti-value tags", () => {
			const input = "<qti-value>x<=5</qti-value>"
			const expected = "<qti-value>x&lt;=5</qti-value>"
			expect(fixInequalityOperators(input, logger)).toEqual(expected)
		})

		test("should handle content that doesn't match conversion patterns", () => {
			const input = "<p>The answer is x >= 10.</p>"
			const expected = "<p>The answer is x >= 10.</p>"
			expect(fixInequalityOperators(input, logger)).toEqual(expected)
		})
	})
})
