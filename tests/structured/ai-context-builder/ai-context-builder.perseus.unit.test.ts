import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { buildPerseusEnvelope } from "../../../src/structured/ai-context-builder"
import {
	expectEmptyPayloads,
	expectSortedUrls,
	expectSupplementaryContentCount
} from "./helpers/assertions"
import { createAlwaysFailFetch, createPrdMockFetch } from "./helpers/mock-fetch"

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
		expect(result.data.primaryContent).toEqual("{}")
		expect(result.data.supplementaryContent).toEqual([])
		expect(result.data.multimodalImageUrls).toEqual([])
		expectEmptyPayloads(result.data)
	})

	test("resolves web+graphie SVG URLs and embeds content", async () => {
		const perseusJson = {
			content: "An image: [[☃ image 1]]",
			widgets: {
				"image 1": {
					type: "image",
					options: {
						backgroundImage: {
							url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/resolves-to"
						}
					}
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
		expect(envelope.primaryContent).toBeTruthy()
		expectSupplementaryContentCount(envelope, 1)
		expect(envelope.supplementaryContent[0]).toBe(
			'<!-- URL: https://cdn.kastatic.org/ka-perseus-graphie/resolves-to.svg -->\n<svg width="10" height="10"></svg>'
		)
		expect(envelope.multimodalImageUrls).toEqual([])
	})

	test("falls back to raster when SVG GET fails after HEAD ok", async () => {
		const perseusJson = {
			widgets: {
				"image 1": {
					type: "image",
					options: {
						backgroundImage: {
							url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/svg-head-ok-get-fail"
						}
					}
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
		// Since SVG GET fails, and png/jpg heads succeed in our mock, it should be raster
		expect(envelope.multimodalImageUrls).toEqual([
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
		expect(envelope.primaryContent).toBeTruthy()
		expectSupplementaryContentCount(envelope, 1)
	})

	test("handles failing web+graphie URLs gracefully", async () => {
		const perseusJson = {
			widgets: {
				"image 1": {
					options: {
						backgroundImage: {
							url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/fails-to-resolve"
						}
					}
				}
			}
		}
		const result = await errors.try(buildPerseusEnvelope(perseusJson))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test failed", { error: result.error })
			throw result.error
		}
		expect(result.data.primaryContent).toBeTruthy()
		expectSupplementaryContentCount(result.data, 0)
		expect(result.data.multimodalImageUrls).toEqual([])
	})

	test("extracts direct https raster and vector URLs", async () => {
		const perseusJson = {
			content:
				"Here is a raster image: https://example.com/foo.png and a vector image: https://example.com/diagram.svg"
		}
		const result = await errors.try(buildPerseusEnvelope(perseusJson))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test failed", { error: result.error })
			throw result.error
		}
		const envelope = result.data
		expect(envelope.primaryContent).toBeTruthy()
		expectSupplementaryContentCount(envelope, 1)
		expect(envelope.multimodalImageUrls).toEqual(["https://example.com/foo.png"])
		expectSortedUrls(envelope)
	})

	test("deduplicates discovered URLs across content and widgets", async () => {
		const perseusJson = {
			content: "https://example.com/diagram.svg https://example.com/diagram.svg",
			widgets: {
				"image 1": {
					type: "image",
					options: {
						backgroundImage: {
							url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/resolves-to"
						}
					}
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
		// one from KA resolves-to + one external
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
						options: {
							backgroundImage: {
								url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/some-hash"
							}
						}
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
		expect(envelope.primaryContent).toBeTruthy()
		expectSupplementaryContentCount(envelope, 0)
		expect(envelope.multimodalImageUrls).toEqual(["https://cdn.example.com/chart.png"])
	})

	test("handles Perseus JSON with no URLs gracefully", async () => {
		const simplePerseusJson = {
			question: {
				content: "What is 2 + 2?",
				widgets: {
					"numeric-input 1": {
						type: "numeric-input",
						options: { answers: [{ value: 4, correct: true }] }
					}
				}
			}
		}
		const result = await errors.try(buildPerseusEnvelope(simplePerseusJson))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test failed", { error: result.error })
			throw result.error
		}
		const envelope = result.data
		expect(envelope.primaryContent).toBeTruthy()
		expectSupplementaryContentCount(envelope, 0)
		expect(envelope.multimodalImageUrls).toHaveLength(0)
	})

	test("builds envelope for marble probability item", async () => {
		const perseusJson = {
			hints: [
				{
					images: {},
					content:
						"$\\text{Probability} = \\dfrac{\\text{Number of favorable outcomes}}{\\text{Number of possible outcomes}}$",
					replace: false,
					widgets: {}
				},
				{
					images: {},
					content:
						"There are $16$ favorable outcomes (the $8 + 8 = 16$ marbles that are either blue or red).\n\nThere are $21$ possible outcomes (the $8 + 5 + 8 = 21$ total marbles).",
					replace: false,
					widgets: {}
				},
				{
					images: {},
					content: "$\\qquad \\text{P(draw a blue or red marble}) = \\dfrac{16}{21}\\approx0.76$",
					replace: false,
					widgets: {}
				}
			],
			question: {
				images: {},
				content:
					"You randomly draw a marble from a bag of marbles that contains $8$ blue marbles, $5$ green marbles, and $8$ red marbles.\n\n**What is $\\text{P(draw a blue or red marble})$?**  \n*If necessary, round your answer to $2$ decimal places.*  \n[[☃ input-number 1]]\n\n[[☃ image 1]]\n\n",
				widgets: {
					"image 1": {
						type: "image",
						graded: true,
						static: false,
						options: {
							alt: "An image of 8 red marbles, 5 green marbles, and 8 blue marbles mixed up.",
							box: [480, 160],
							range: [
								[0, 10],
								[0, 10]
							],
							title: "",
							labels: [],
							static: false,
							caption: "",
							backgroundImage: {
								url: "https://cdn.kastatic.org/ka-perseus-graphie/64430f539a7bd1d4c56f957779c43a4a184c09bd.png",
								width: 480,
								height: 160
							}
						},
						version: {
							major: 0,
							minor: 0
						},
						alignment: "block"
					},
					"input-number 1": {
						type: "input-number",
						graded: true,
						static: false,
						options: {
							size: "normal",
							value: 0.7619047619047619,
							inexact: true,
							maxError: 0.005,
							simplify: "optional",
							answerType: "percent",
							rightAlign: false
						},
						version: {
							major: 0,
							minor: 0
						},
						alignment: "default"
					}
				}
			},
			answerArea: {
				tTable: false,
				zTable: false,
				chi2Table: false,
				calculator: true,
				periodicTable: false
			},
			itemDataVersion: {
				major: 0,
				minor: 1
			}
		}

		const result = await errors.try(buildPerseusEnvelope(perseusJson))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test failed", { error: result.error })
			throw result.error
		}
		const envelope = result.data
		expect(envelope.primaryContent).toBeTruthy()
		expectSupplementaryContentCount(envelope, 0)
		expect(envelope.multimodalImageUrls).toEqual([
			"https://cdn.kastatic.org/ka-perseus-graphie/64430f539a7bd1d4c56f957779c43a4a184c09bd.png"
		])
	})

	test("extracts multiple markdown links without adding to context", async () => {
		const perseusJsonWithMultipleLinks = {
			question: {
				content:
					"Check [source A](https://example.com/a) and [source B](https://example.com/b) for more information."
			}
		}
		const result = await errors.try(buildPerseusEnvelope(perseusJsonWithMultipleLinks))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test failed", { error: result.error })
			throw result.error
		}
		const envelope = result.data
		expect(envelope.primaryContent).toBeTruthy()
		expectSupplementaryContentCount(envelope, 0)
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
								{
									content: "Choice with [embedded link](https://example.com/choice1)",
									clue: "This references [another source](https://example.com/clue1)"
								},
								{ content: "Regular choice", clue: "Regular clue" }
							]
						}
					}
				}
			},
			hints: [
				{
					content: "Hint with [helpful link](https://example.com/hint1)",
					widgets: {
						"image 1": {
							type: "image",
							options: {
								backgroundImage: {
									url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/hint-image"
								}
							}
						}
					}
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
		expect(envelope.primaryContent).toBeTruthy()
		expectSupplementaryContentCount(envelope, 0)
	})

	test("uses failing fetch mock when provided", async () => {
		const failing = createAlwaysFailFetch()
		const perseusJsonWithSvg = {
			question: { content: "Here is an SVG: https://example.com/diagram.svg" }
		}
		const result = await errors.try(buildPerseusEnvelope(perseusJsonWithSvg, failing))
		expect(result.error).toBeFalsy()
		if (result.error) {
			logger.error("test failed", { error: result.error })
			throw result.error
		}
		const envelope = result.data
		expect(envelope.primaryContent).toBeTruthy()
		expectSupplementaryContentCount(envelope, 0)
	})
})
