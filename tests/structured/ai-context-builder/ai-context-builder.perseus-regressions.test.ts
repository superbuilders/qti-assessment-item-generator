import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { buildPerseusEnvelope } from "../../../src/structured/ai-context-builder"
import {
	interactiveGraphPlotting,
	numberLineMatcher,
	rectangularPrismVolume,
	soupVolumeEstimation
} from "../../fixtures/perseus-regression-items"
import { expectSortedUrls } from "./helpers/assertions"
import { createPrdMockFetch } from "./helpers/mock-fetch"

describe("buildPerseusEnvelope (regressions)", () => {
	let previousFetch: typeof fetch
	beforeAll(() => {
		previousFetch = global.fetch
		global.fetch = createPrdMockFetch()
	})
	afterAll(() => {
		global.fetch = previousFetch
	})

	const fixtures = [soupVolumeEstimation, rectangularPrismVolume, numberLineMatcher, interactiveGraphPlotting]

	for (const fixture of fixtures) {
		test(`fixture: ${fixture.question?.content?.slice(0, 32) ?? "unnamed"}`, async () => {
			const result = await errors.try(buildPerseusEnvelope(fixture))
			expect(result.error).toBeFalsy()
			if (result.error) {
				logger.error("test failed", { error: result.error })
				throw result.error
			}
			expect(typeof result.data.primaryContent).toBe("string")
			expect(Array.isArray(result.data.supplementaryContent)).toBeTruthy()
			expect(Array.isArray(result.data.rasterImageUrls)).toBeTruthy()
			expectSortedUrls(result.data)
		})
	}
})
