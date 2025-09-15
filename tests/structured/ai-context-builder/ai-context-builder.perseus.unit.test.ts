import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { buildPerseusEnvelope } from "../../../src/structured/ai-context-builder"
import { createAlwaysFailFetch, createPrdMockFetch } from "./helpers/mock-fetch"
import { expectSortedUrls } from "./helpers/assertions"

describe("buildPerseusEnvelope (unit)", () => {
	let previousFetch: typeof fetch
	beforeAll(() => {
		previousFetch = global.fetch
		global.fetch = createPrdMockFetch()
	})
	afterAll(() => {
		global.fetch = previousFetch
	})

	test("handles empty Perseus JSON", async () => {
		const result = await errors.try(buildPerseusEnvelope({}))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test failed", { error: result.error })
			throw result.error
		}
		expect(result.data.context).toEqual(["{}"])
		expect(result.data.rasterImageUrls).toEqual([])
		expect(result.data.vectorImageUrls).toEqual([])
	})

	test("resolves web+graphie SVG URLs and embeds content", async () => {
		const perseusJson = {
			content: "An image: [[☃ image 1]]",
			widgets: {
				"image 1": {
					type: "image",
					options: { backgroundImage: { url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/resolves-to" } }
				}
			}
		}
		const result = await errors.try(buildPerseusEnvelope(perseusJson))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test failed", { error: result.error })
			throw result.error
		}
		const envelope = result.data
		expect(envelope.context).toHaveLength(2)
		expect(envelope.context[1]).toBe('<svg width="10" height="10"></svg>')
		expect(envelope.vectorImageUrls).toEqual(["https://cdn.kastatic.org/ka-perseus-graphie/resolves-to.svg"])
		expect(envelope.rasterImageUrls).toEqual([])
	})

	test("falls back to raster when SVG GET fails after HEAD ok", async () => {
		const perseusJson = {
			widgets: {
				"image 1": {
					type: "image",
					options: { backgroundImage: { url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/svg-head-ok-get-fail" } }
				}
			}
		}
		const result = await errors.try(buildPerseusEnvelope(perseusJson))
		expect(result.error).toBeFalsy()
		if (result.error) throw result.error
		const envelope = result.data
		// Since SVG GET fails, and png/jpg heads succeed in our mock, it should be raster
		expect(envelope.vectorImageUrls).toEqual([])
		expect(envelope.rasterImageUrls).toEqual([
			"https://cdn.kastatic.org/ka-perseus-graphie/svg-head-ok-get-fail.png"
		])
	})

	test("ignores markdown links that do not point to supported images", async () => {
		const perseusJsonWithMixedLinks = {
			question: {
				content:
					"Examine the chart: ![Chart](https://cdn.kastatic.org/ka-perseus-images/082e6068e0c842e2b09e2a8520bd22817d55a134.svg). Source: [Census Data](https://www.census.gov/prod/2002pubs/p23-206.pdf)"
			}
		}
		const result = await errors.try(buildPerseusEnvelope(perseusJsonWithMixedLinks))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test failed", { error: result.error })
			throw result.error
		}
		const envelope = result.data
		expect(envelope.context).toHaveLength(2)
		expect(envelope.vectorImageUrls).toEqual([
			"https://cdn.kastatic.org/ka-perseus-images/082e6068e0c842e2b09e2a8520bd22817d55a134.svg"
		])
	})

	test("handles failing web+graphie URLs gracefully", async () => {
		const perseusJson = { widgets: { "image 1": { options: { backgroundImage: { url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/fails-to-resolve" } } } } }
		const result = await errors.try(buildPerseusEnvelope(perseusJson))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test failed", { error: result.error })
			throw result.error
		}
		expect(result.data.context).toHaveLength(1)
		expect(result.data.rasterImageUrls).toEqual([])
		expect(result.data.vectorImageUrls).toEqual([])
	})

	test("extracts direct https raster and vector URLs", async () => {
		const perseusJson = {
			content: "Here is a raster image: https://example.com/foo.png and a vector image: https://example.com/diagram.svg"
		}
		const result = await errors.try(buildPerseusEnvelope(perseusJson))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test failed", { error: result.error })
			throw result.error
		}
		const envelope = result.data
		expect(envelope.context).toHaveLength(2)
		expect(envelope.rasterImageUrls).toEqual(["https://example.com/foo.png"])
		expect(envelope.vectorImageUrls).toEqual(["https://example.com/diagram.svg"])
		expectSortedUrls(envelope)
	})

	test("deduplicates discovered URLs across content and widgets", async () => {
		const perseusJson = {
			content: "https://example.com/diagram.svg https://example.com/diagram.svg",
			widgets: {
				"image 1": { type: "image", options: { backgroundImage: { url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/resolves-to" } } }
			}
		}
		const result = await errors.try(buildPerseusEnvelope(perseusJson))
		expect(result.error).toBeFalsy()
		if (result.error) throw result.error
		const envelope = result.data
		// one from KA resolves-to + one external
		expect(envelope.vectorImageUrls).toEqual([
			"https://cdn.kastatic.org/ka-perseus-graphie/resolves-to.svg",
			"https://example.com/diagram.svg"
		])
		expectSortedUrls(envelope)
	})

	test("handles mixed URL types in single Perseus JSON", async () => {
		const complexPerseusJson = {
			question: {
				content:
					"Check out this [source document](https://www.example.com/source.pdf) and this direct image: https://cdn.example.com/chart.png",
				widgets: {
					"image 1": {
						type: "image",
						options: { backgroundImage: { url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/some-hash" } }
					}
				}
			},
			hints: [{ content: "See [this reference](https://www.reference.com/page) for more info." }]
		}
		const result = await errors.try(buildPerseusEnvelope(complexPerseusJson))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test failed", { error: result.error })
			throw result.error
		}
		const envelope = result.data
		expect(envelope.context).toHaveLength(1)
		expect(envelope.rasterImageUrls).toEqual(["https://cdn.example.com/chart.png"])
		expect(envelope.vectorImageUrls).toHaveLength(0)
	})

	test("handles Perseus JSON with no URLs gracefully", async () => {
		const simplePerseusJson = {
			question: {
				content: "What is 2 + 2?",
				widgets: { "numeric-input 1": { type: "numeric-input", options: { answers: [{ value: 4, correct: true }] } } }
			}
		}
		const result = await errors.try(buildPerseusEnvelope(simplePerseusJson))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test failed", { error: result.error })
			throw result.error
		}
		const envelope = result.data
		expect(envelope.context).toHaveLength(1)
		expect(envelope.rasterImageUrls).toHaveLength(0)
		expect(envelope.vectorImageUrls).toHaveLength(0)
	})

	test("extracts multiple markdown links without adding to context", async () => {
		const perseusJsonWithMultipleLinks = {
			question: { content: "Check [source A](https://example.com/a) and [source B](https://example.com/b) for more information." }
		}
		const result = await errors.try(buildPerseusEnvelope(perseusJsonWithMultipleLinks))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test failed", { error: result.error })
			throw result.error
		}
		const envelope = result.data
		expect(envelope.context).toHaveLength(1)
	})

	test("handles deeply nested Perseus JSON structures", async () => {
		const deeplyNestedJson = {
			question: {
				content: "Main question content",
				widgets: {
					"radio 1": {
						type: "radio",
						options: {
							choices: [
								{ content: "Choice with [embedded link](https://example.com/choice1)", clue: "This references [another source](https://example.com/clue1)" },
								{ content: "Regular choice", clue: "Regular clue" }
							]
						}
					}
				}
			},
			hints: [
				{
					content: "Hint with [helpful link](https://example.com/hint1)",
					widgets: { "image 1": { type: "image", options: { backgroundImage: { url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/hint-image" } } } }
				}
			]
		}
		const result = await errors.try(buildPerseusEnvelope(deeplyNestedJson))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test failed", { error: result.error })
			throw result.error
		}
		const envelope = result.data
		expect(envelope.context).toHaveLength(1)
	})

	test("uses failing fetch mock when provided", async () => {
		const failing = createAlwaysFailFetch()
		const perseusJsonWithSvg = { question: { content: "Here is an SVG: https://example.com/diagram.svg" } }
		const result = await errors.try(buildPerseusEnvelope(perseusJsonWithSvg, failing))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test failed", { error: result.error })
			throw result.error
		}
		const envelope = result.data
		expect(envelope.context).toHaveLength(1)
		expect(envelope.vectorImageUrls).toEqual([])
	})
})


