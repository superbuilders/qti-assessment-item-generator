import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { buildHtmlEnvelope } from "../../../src/structured/ai-context-builder"
import { createPrdMockFetch } from "./helpers/mock-fetch"
import { expectSortedUrls } from "./helpers/assertions"

describe("buildHtmlEnvelope (unit)", () => {
	let previousFetch: typeof fetch
	beforeAll(() => {
		previousFetch = global.fetch
		global.fetch = createPrdMockFetch()
	})
	afterAll(() => {
		global.fetch = previousFetch
	})

	test("creates envelope with only HTML content", async () => {
		const html = "<h1>Hello World</h1><p>This is a test.</p>"
		const envelope = await buildHtmlEnvelope(html)
		expect(envelope.context).toEqual([html])
		expect(envelope.rasterImageUrls).toEqual([])
		expect(envelope.vectorImageUrls).toEqual([])
	})

	test("adds valid screenshot URL", async () => {
		const html = "<div>...</div>"
		const screenshotUrl = "https://example.com/screenshot.png"
		const envelope = await buildHtmlEnvelope(html, screenshotUrl)
		expect(envelope.context).toEqual([html])
		expect(envelope.rasterImageUrls).toEqual([screenshotUrl])
		expect(envelope.vectorImageUrls).toEqual([])
	})

	test("throws for invalid screenshot URL", async () => {
		const result = await errors.try(buildHtmlEnvelope("<div>...</div>", "not-a-valid-url"))
		expect(result.error).toBeTruthy()
	})

	test("throws for unsupported screenshot scheme", async () => {
		const result = await errors.try(buildHtmlEnvelope("<div>...</div>", "ftp://example.com/file.png"))
		expect(result.error).toBeTruthy()
	})

	test("extracts, fetches, and embeds external SVGs", async () => {
		const html = '<img src="https://example.com/diagram.svg" alt="diagram">'
		const result = await errors.try(buildHtmlEnvelope(html))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test failed", { error: result.error })
			throw result.error
		}
		const envelope = result.data
		expect(envelope.context).toHaveLength(2)
		expect(envelope.context[1]).toBe('<svg width="20" height="20"></svg>')
		expect(envelope.vectorImageUrls).toEqual(["https://example.com/diagram.svg"])
	})

	test("handles mixed-case SVG extensions and querystrings", async () => {
		const html = '<img src="https://example.com/Vector.SVG?cache=1" alt="diagram">'
		const result = await errors.try(buildHtmlEnvelope(html))
		expect(result.error).toBeFalsy()
		if (result.error) throw result.error
		const envelope = result.data
		expect(envelope.context).toHaveLength(2)
		expect(envelope.vectorImageUrls).toEqual(["https://example.com/Vector.SVG?cache=1"])
	})

	test("handles mix of raster, vector, and broken links", async () => {
		const html = `
				<img src="https://example.com/photo.png">
				<img src="https://example.com/diagram.svg">
				<img src="https://example.com/broken.svg">
				<img src="/relative/path.jpg">
			`
		const result = await errors.try(buildHtmlEnvelope(html, "https://example.com/screen.jpg"))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test failed", { error: result.error })
			throw result.error
		}
		const envelope = result.data
		expect(envelope.context).toHaveLength(2)
		expect(envelope.rasterImageUrls).toEqual(["https://example.com/photo.png", "https://example.com/screen.jpg"])
		expect(envelope.vectorImageUrls).toEqual(["https://example.com/diagram.svg"])
		expectSortedUrls(envelope)
	})

	test("does not extract inline SVG content", async () => {
		const html = '<p>Inline SVG: <svg><circle cx="10" cy="10" r="5" /></svg></p>'
		const result = await errors.try(buildHtmlEnvelope(html))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test failed", { error: result.error })
			throw result.error
		}
		const envelope = result.data
		expect(envelope.context).toHaveLength(1)
		expect(envelope.context[0]).toBe(html)
		expect(envelope.vectorImageUrls).toEqual([])
	})

	test("deduplicates duplicate image URLs (raster and vector)", async () => {
		const html = `
			<img src="https://example.com/photo.png">
			<img src="https://example.com/photo.png">
			<img src="https://example.com/diagram.svg">
			<img src="https://example.com/diagram.svg">
		`
		const result = await errors.try(buildHtmlEnvelope(html))
		expect(result.error).toBeFalsy()
		if (result.error) throw result.error
		const envelope = result.data
		// One HTML + one fetched SVG content
		expect(envelope.context).toHaveLength(2)
		expect(envelope.rasterImageUrls).toEqual(["https://example.com/photo.png"])
		expect(envelope.vectorImageUrls).toEqual(["https://example.com/diagram.svg"])
	})

	test("skips external SVG that times out/fails", async () => {
		const html = '<img src="https://example.com/times-out.svg" alt="diagram">'
		const result = await errors.try(buildHtmlEnvelope(html))
		expect(result.error).toBeFalsy()
		if (result.error) throw result.error
		const envelope = result.data
		// No SVG embedded, only original HTML
		expect(envelope.context).toHaveLength(1)
		expect(envelope.vectorImageUrls).toEqual([])
	})
})


