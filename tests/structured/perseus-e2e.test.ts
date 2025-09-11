// tests/perseus-e2e.test.ts
import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import { buildPerseusEnvelope } from "../../src/structured/ai-context-builder"
import {
	interactiveGraphPlotting,
	numberLineMatcher,
	rectangularPrismVolume,
	soupVolumeEstimation
} from "../fixtures/perseus-regression-items"
import { PERSEUS_SVG_CACHE } from "../fixtures/perseus-svgs/cache"

// Mock fetch function that returns cached Perseus SVGs
const mockFetch: typeof fetch = async (url: string | Request | URL, init?: RequestInit) => {
	const urlString = url.toString()

	// Handle HEAD requests - check if we have the SVG in cache
	if (init?.method === "HEAD") {
		// Extract the web+graphie URL from the https URL
		const webGraphieUrl = urlString.replace("https://", "web+graphie://").replace(".svg", "")
		if (PERSEUS_SVG_CACHE[webGraphieUrl]) {
			return new Response(null, { status: 200, statusText: "OK" })
		}
		return new Response(null, { status: 404, statusText: "Not Found" })
	}

	// Handle GET requests - return cached SVG content
	const webGraphieUrl = urlString.replace("https://", "web+graphie://").replace(".svg", "")
	const cachedContent = PERSEUS_SVG_CACHE[webGraphieUrl]
	if (cachedContent) {
		return new Response(cachedContent, {
			status: 200,
			statusText: "OK",
			headers: { "Content-Type": "image/svg+xml" }
		})
	}

	return new Response(null, { status: 404, statusText: "Not Found" })
}

describe("Perseus E2E Regression Suite", () => {
	// Test Case 1: Direct HTTPS URL for an SVG
	// This test confirms that the envelope builder correctly IGNORES standard https URLs,
	// as its sole responsibility is to resolve the special `web+graphie://` protocol.
	test("should not resolve direct https SVG URLs", async () => {
		const result = await errors.try(buildPerseusEnvelope(soupVolumeEstimation, mockFetch))

		expect(result.error).toBeFalsy()
		const envelope = result.data

		// The URL is a standard https link, not `web+graphie`, so it should not be processed.
		// The AI is expected to see this URL within the main JSON context block.
		expect(envelope.imageUrls).toHaveLength(0)
		expect(envelope.context).toHaveLength(1) // Contains only the main stringified JSON.
	})

	// Test Case 2: web+graphie URLs that resolve to SVGs, found in hints
	// This test performs live network requests to ensure the probing and SVG fetching works.
	test("should resolve web+graphie URLs to SVGs and embed their content", async () => {
		const result = await errors.try(buildPerseusEnvelope(rectangularPrismVolume, mockFetch))

		expect(result.error).toBeFalsy()
		const envelope = result.data

		// These `web+graphie` URLs resolve to SVGs, so they should not be in `imageUrls`.
		expect(envelope.imageUrls).toHaveLength(0)

		// Context should contain the main JSON string PLUS the 4 unique SVG contents.
		expect(envelope.context).toHaveLength(5)
		expect(envelope.context[0]).toStartWith("{") // The main JSON
		expect(envelope.context[1]).toStartWith("<svg") // The first resolved SVG
		expect(envelope.context[2]).toStartWith("<svg")
		expect(envelope.context[3]).toStartWith("<svg")
		expect(envelope.context[4]).toStartWith("<svg")
	})

	// Test Case 3: More web+graphie URLs resolving to SVGs
	test("should correctly resolve and embed multiple unique SVGs", async () => {
		const result = await errors.try(buildPerseusEnvelope(numberLineMatcher, mockFetch))

		expect(result.error).toBeFalsy()
		const envelope = result.data

		expect(envelope.imageUrls).toHaveLength(0)

		// Context should contain the main JSON string PLUS the 3 unique SVG contents.
		expect(envelope.context).toHaveLength(4)
		expect(envelope.context[1]).toStartWith("<svg")
		expect(envelope.context[2]).toStartWith("<svg")
		expect(envelope.context[3]).toStartWith("<svg")
	})

	// Test Case 4: Unsupported interactive widget ('grapher')
	// This tests that the context builder still correctly processes any associated
	// `web+graphie` images from the hints, even if the main widget is unsupported by the AI.
	test("should resolve hint images even for an unsupported widget type", async () => {
		const result = await errors.try(buildPerseusEnvelope(interactiveGraphPlotting, mockFetch))

		expect(result.error).toBeFalsy()
		const envelope = result.data

		expect(envelope.imageUrls).toHaveLength(0)

		// Context should contain the main JSON and the 2 unique SVGs from the hints.
		expect(envelope.context).toHaveLength(3)
		expect(envelope.context[1]).toStartWith("<svg")
		expect(envelope.context[2]).toStartWith("<svg")
	})
})
