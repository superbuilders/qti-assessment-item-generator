// tests/structured/ai-context-builder.test.ts
import { beforeAll, describe, expect, mock, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { buildMathacademyEnvelope, buildPerseusEnvelope } from "../../src/structured/ai-context-builder"

// NOTE: Additional comprehensive tests have been split into:
// - tests/structured/ai-context-builder/ai-context-builder.perseus.unit.test.ts
// - tests/structured/ai-context-builder/ai-context-builder.html.unit.test.ts
// - tests/structured/ai-context-builder/ai-context-builder.perseus-regressions.test.ts

describe("AI Context Builders", () => {
	describe("buildMathacademyEnvelope", () => {
		test("should create an envelope with only HTML content", async () => {
			const html = "<h1>Hello World</h1><p>This is a test.</p>"
			const envelope = await buildMathacademyEnvelope(html)

			expect(envelope.primaryContent).toEqual(html)
			expect(envelope.supplementaryContent).toEqual([])
			expect(envelope.multimodalImageUrls).toEqual([])
		})

		test("should create an envelope with HTML content and a screenshot URL", async () => {
			const html = "<div>...</div>"
			const screenshotUrl = "https://example.com/screenshot.png"
			const envelope = await buildMathacademyEnvelope(html, screenshotUrl)

			expect(envelope.primaryContent).toEqual(html)
			expect(envelope.supplementaryContent).toEqual([])
			expect(envelope.multimodalImageUrls).toEqual([screenshotUrl])
		})

		test("should throw an error for an invalid screenshot URL", async () => {
			const html = "<div>...</div>"
			const invalidUrl = "not-a-valid-url"
			return expect(buildMathacademyEnvelope(html, invalidUrl)).rejects.toThrow()
		})
	})

	describe("buildPerseusEnvelope", () => {
		beforeAll(async () => {
			// Mock fetch to simulate a failed URL resolution
			mock.module("node-fetch", () => ({
				default: async () => {
					// Make all requests fail
					return {
						ok: false,
						status: 404,
						text: async () => "Not Found"
					}
				}
			}))
			// @ts-expect-error - Mocking global fetch for testing
			global.fetch = (await import("node-fetch")).default
		})

		test("should handle failing web+graphie URLs gracefully", async () => {
			const perseusJsonWithBadUrl = {
				question: {
					content: "This item has a broken image link. [[☃ image 1]]",
					widgets: {
						"image 1": {
							type: "image",
							options: {
								backgroundImage: {
									url: "web+graphie://cdn.kastatic.org/ka-perseus-graphie/non-existent-hash"
								}
							}
						}
					}
				}
			}

			const result = await errors.try(buildPerseusEnvelope(perseusJsonWithBadUrl))

			// The most important thing is that it does NOT throw an error.
			expect(result.error).toBeFalsy()
			if (result.error) {
				logger.error("test setup failed", { error: result.error })
				throw errors.new("test setup failed")
			}
			const envelope = result.data

			// No image URLs should be found
			expect(envelope.multimodalImageUrls).toHaveLength(0)
			// The primaryContent should contain the original JSON, and supplementaryContent should be empty.
			expect(envelope.primaryContent).toBeTruthy()
			expect(envelope.supplementaryContent).toHaveLength(0)
		})
	})
})
