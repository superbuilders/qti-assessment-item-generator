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
const mockFetch: typeof fetch = (async (url: string | Request | URL, init?: RequestInit): Promise<Response> => {
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
}) as any as typeof fetch

describe("Perseus E2E Regression Suite", () => {
	// Test Case 1: Direct HTTPS URL for an SVG
	// This test confirms that the envelope builder attempts to resolve direct https SVG URLs,
	// but when the fetch fails (404), they are not added to the envelope.
	test("should attempt to resolve direct https SVG URLs but handle failures gracefully", async () => {
		const result = await errors.try(buildPerseusEnvelope(soupVolumeEstimation, mockFetch))

		expect(result.error).toBeFalsy()
		if (result.error) {
			throw result.error
		}
		const envelope = result.data

		// Direct https SVG URLs are attempted but fail with mock fetch (404)
		expect(envelope.rasterImageUrls).toHaveLength(0)
		// Failed SVG fetches means no supplementary content
		expect(envelope.primaryContent).toBeTruthy()
		expect(envelope.supplementaryContent).toHaveLength(0) // No SVG content since fetch failed
	})

	// Test Case 2: web+graphie URLs that resolve to SVGs, found in hints
	// This test performs live network requests to ensure the probing and SVG fetching works.
	test("should resolve web+graphie URLs to SVGs and embed their content", async () => {
		const result = await errors.try(buildPerseusEnvelope(rectangularPrismVolume, mockFetch))

		expect(result.error).toBeFalsy()
		if (result.error) {
			throw result.error
		}
		const envelope = result.data

		// These `web+graphie` URLs resolve to SVGs, so they should not be in `rasterImageUrls`.
		expect(envelope.rasterImageUrls).toHaveLength(0)
		// SVG content should be in supplementaryContent when successfully fetched

		// primaryContent should contain the main JSON string, supplementaryContent should have 4 SVG contents.
		expect(envelope.primaryContent).toStartWith("{") // The main JSON
		expect(envelope.supplementaryContent).toHaveLength(4)
		expect(envelope.supplementaryContent[0]).toStartWith("<!-- URL:") // The first resolved SVG with URL comment
		expect(envelope.supplementaryContent[1]).toStartWith("<!-- URL:")
		expect(envelope.supplementaryContent[2]).toStartWith("<!-- URL:")
		expect(envelope.supplementaryContent[3]).toStartWith("<!-- URL:")
		// Verify the SVG content follows the comment
		expect(envelope.supplementaryContent[0]).toContain("<!-- URL:")
		expect(envelope.supplementaryContent[0]).toContain("<svg")
	})

	// Test Case 3: More web+graphie URLs resolving to SVGs
	test("should correctly resolve and embed multiple unique SVGs", async () => {
		const result = await errors.try(buildPerseusEnvelope(numberLineMatcher, mockFetch))

		expect(result.error).toBeFalsy()
		if (result.error) {
			throw result.error
		}
		const envelope = result.data

		expect(envelope.rasterImageUrls).toHaveLength(0)
		// SVG content should be in supplementaryContent when successfully fetched

		// primaryContent should contain the main JSON string, supplementaryContent should have 3 SVG contents.
		expect(envelope.primaryContent).toBeTruthy()
		expect(envelope.supplementaryContent).toHaveLength(3)
		expect(envelope.supplementaryContent[0]).toStartWith("<!-- URL:")
		expect(envelope.supplementaryContent[1]).toStartWith("<!-- URL:")
		expect(envelope.supplementaryContent[2]).toStartWith("<!-- URL:")
	})

	// Test Case 4: Unsupported interactive widget ('grapher')
	// This tests that the context builder still correctly processes any associated
	// `web+graphie` images from the hints, even if the main widget is unsupported by the AI.
	test("should resolve hint images even for an unsupported widget type", async () => {
		const result = await errors.try(buildPerseusEnvelope(interactiveGraphPlotting, mockFetch))

		expect(result.error).toBeFalsy()
		if (result.error) {
			throw result.error
		}
		const envelope = result.data

		expect(envelope.rasterImageUrls).toHaveLength(0)
		// SVG content should be in supplementaryContent when successfully fetched

		// primaryContent should contain the main JSON, supplementaryContent should have 2 SVG contents from the hints.
		expect(envelope.primaryContent).toBeTruthy()
		expect(envelope.supplementaryContent).toHaveLength(2)
		expect(envelope.supplementaryContent[0]).toStartWith("<!-- URL:")
		expect(envelope.supplementaryContent[1]).toStartWith("<!-- URL:")
	})
})
