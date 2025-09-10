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

describe("Perseus E2E Regression Suite", () => {
	// Test Case 1: Direct HTTPS URL for an SVG
	// This test confirms that the envelope builder correctly IGNORES standard https URLs,
	// as its sole responsibility is to resolve the special `web+graphie://` protocol.
	test("should not resolve direct https SVG URLs", async () => {
		const result = await errors.try(buildPerseusEnvelope(soupVolumeEstimation))

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
		const result = await errors.try(buildPerseusEnvelope(rectangularPrismVolume))

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
	}, 20000) // Increase timeout to allow for network requests

	// Test Case 3: More web+graphie URLs resolving to SVGs
	test("should correctly resolve and embed multiple unique SVGs", async () => {
		const result = await errors.try(buildPerseusEnvelope(numberLineMatcher))

		expect(result.error).toBeFalsy()
		const envelope = result.data

		expect(envelope.imageUrls).toHaveLength(0)

		// Context should contain the main JSON string PLUS the 3 unique SVG contents.
		expect(envelope.context).toHaveLength(4)
		expect(envelope.context[1]).toStartWith("<svg")
		expect(envelope.context[2]).toStartWith("<svg")
		expect(envelope.context[3]).toStartWith("<svg")
	}, 20000)

	// Test Case 4: Unsupported interactive widget ('grapher')
	// This tests that the context builder still correctly processes any associated
	// `web+graphie` images from the hints, even if the main widget is unsupported by the AI.
	test("should resolve hint images even for an unsupported widget type", async () => {
		const result = await errors.try(buildPerseusEnvelope(interactiveGraphPlotting))

		expect(result.error).toBeFalsy()
		const envelope = result.data

		expect(envelope.imageUrls).toHaveLength(0)

		// Context should contain the main JSON and the 2 unique SVGs from the hints.
		expect(envelope.context).toHaveLength(3)
		expect(envelope.context[1]).toStartWith("<svg")
		expect(envelope.context[2]).toStartWith("<svg")
	}, 20000)
})
