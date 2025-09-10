// tests/structured/ai-context-builder.test.ts
import { beforeAll, describe, expect, mock, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import { buildHtmlEnvelope, buildPerseusEnvelope } from "../../src/structured/ai-context-builder"

describe("AI Context Builders", () => {
	describe("buildHtmlEnvelope", () => {
		test("should create an envelope with only HTML content", () => {
			const html = "<h1>Hello World</h1><p>This is a test.</p>"
			const envelope = buildHtmlEnvelope(html)

			expect(envelope.context).toEqual([html])
			expect(envelope.imageUrls).toEqual([])
		})

		test("should create an envelope with HTML content and a screenshot URL", () => {
			const html = "<div>...</div>"
			const screenshotUrl = "https://example.com/screenshot.png"
			const envelope = buildHtmlEnvelope(html, screenshotUrl)

			expect(envelope.context).toEqual([html])
			expect(envelope.imageUrls).toEqual([screenshotUrl])
		})

		test("should throw an error for an invalid screenshot URL", () => {
			const html = "<div>...</div>"
			const invalidUrl = "not-a-valid-url"
			const action = () => buildHtmlEnvelope(html, invalidUrl)
			expect(action).toThrow()
		})
	})

	describe("buildPerseusEnvelope", () => {
		beforeAll(async () => {
			// Mock fetch to simulate a failed URL resolution
			mock.module("node-fetch", () => ({
				default: async (url: string) => {
					// Make all requests fail
					return {
						ok: false,
						status: 404,
						text: async () => "Not Found"
					}
				}
			}))
			global.fetch = (await import("node-fetch")).default as any
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
				throw errors.new("test setup failed")
			}
			const envelope = result.data

			// No image URLs should be found
			expect(envelope.imageUrls).toHaveLength(0)
			// The context should only contain the original JSON, not any fetched content.
			expect(envelope.context).toHaveLength(1)
		})
	})
})
