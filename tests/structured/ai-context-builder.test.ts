// tests/structured/ai-context-builder.test.ts
import { beforeAll, describe, expect, mock, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
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
			expect(envelope.imageUrls).toHaveLength(0)
			// The context should only contain the original JSON, not any fetched content.
			expect(envelope.context).toHaveLength(1)
		})

		test("should extract markdown links from content and add them to context", async () => {
			// Using the census data example with markdown link
			const perseusJsonWithMarkdownLink = {
				question: {
					content: "Examine the chart and answer the question below.\n\n![Chart showing immigrant share](https://cdn.kastatic.org/ka-perseus-images/082e6068e0c842e2b09e2a8520bd22817d55a134.svg)\n\n>Source: U.S. Census Bureau, \"[Historical Census Statistics on the Foreign-Born Population of the United States: 1850-2000](https://www.census.gov/prod/2002pubs/p23-206.pdf),\" 2002"
				}
			}

			const result = await errors.try(buildPerseusEnvelope(perseusJsonWithMarkdownLink))
			expect(result.error).toBeFalsy()
			if (result.error) {
				logger.error("test failed", { error: result.error })
				throw result.error
			}
			const envelope = result.data

			// Should have original JSON plus markdown link context
			expect(envelope.context.length).toBeGreaterThan(1)
			
			// Should extract the markdown link and add it as context
			const markdownLinkContext = envelope.context.find(ctx => 
				ctx.includes("Contextual Link Found: [Historical Census Statistics")
			)
			expect(markdownLinkContext).toBeDefined()
			expect(markdownLinkContext).toContain("https://www.census.gov/prod/2002pubs/p23-206.pdf")
		})

		test("should find and process direct https raster image URLs", async () => {
			const perseusJsonWithDirectImageUrl = {
				question: {
					content: "Here is a direct PNG image: https://cdn.example.com/chart.png"
				}
			}

			const result = await errors.try(buildPerseusEnvelope(perseusJsonWithDirectImageUrl))
			expect(result.error).toBeFalsy()
			if (result.error) {
				logger.error("test failed", { error: result.error })
				throw result.error
			}
			const envelope = result.data

			// Should have original JSON context only (PNG URLs go to imageUrls, not context)
			expect(envelope.context).toHaveLength(1)
			// Should have 1 image URL for the PNG (raster images don't need fetch)
			expect(envelope.imageUrls).toHaveLength(1)
			expect(envelope.imageUrls[0]).toBe("https://cdn.example.com/chart.png")
		})

		test("should find and process direct https SVG URLs", async () => {
			const perseusJsonWithDirectSvgUrl = {
				question: {
					content: "Here is a direct SVG: https://cdn.example.com/diagram.svg"
				}
			}

			const result = await errors.try(buildPerseusEnvelope(perseusJsonWithDirectSvgUrl))
			expect(result.error).toBeFalsy()
			if (result.error) {
				logger.error("test failed", { error: result.error })
				throw result.error
			}
			const envelope = result.data

			// Should have original JSON context only (SVG fetch failed, so not embedded)
			expect(envelope.context).toHaveLength(1)
			// Should have no image URLs since SVG fetch failed
			expect(envelope.imageUrls).toHaveLength(0)
		})

		test("should handle mixed URL types in single Perseus JSON", async () => {
			const complexPerseusJson = {
				question: {
					content: "Check out this [source document](https://www.example.com/source.pdf) and this direct image: https://cdn.example.com/chart.png",
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
				hints: [
					{
						content: "See [this reference](https://www.reference.com/page) for more info."
					}
				]
			}

			const result = await errors.try(buildPerseusEnvelope(complexPerseusJson))
			expect(result.error).toBeFalsy()
			if (result.error) {
				logger.error("test failed", { error: result.error })
				throw result.error
			}
			const envelope = result.data

			// Should have original JSON plus 2 markdown link contexts
			expect(envelope.context.length).toBe(3) // JSON + 2 markdown links
			
			// Should extract both markdown links
			const sourceDocContext = envelope.context.find(ctx => 
				ctx.includes("Contextual Link Found: [source document](https://www.example.com/source.pdf)")
			)
			const referenceContext = envelope.context.find(ctx => 
				ctx.includes("Contextual Link Found: [this reference](https://www.reference.com/page)")
			)
			
			expect(sourceDocContext).toBeDefined()
			expect(referenceContext).toBeDefined()
			
			// Should have 1 image URL for the PNG (raster images don't need fetch, just URL detection)
			expect(envelope.imageUrls).toHaveLength(1)
			expect(envelope.imageUrls[0]).toBe("https://cdn.example.com/chart.png")
		})

		test("should handle Perseus JSON with no URLs gracefully", async () => {
			const simplePerseusJson = {
				question: {
					content: "What is 2 + 2?",
					widgets: {
						"numeric-input 1": {
							type: "numeric-input",
							options: {
								answers: [{ value: 4, correct: true }]
							}
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

			// Should only have the original JSON context
			expect(envelope.context).toHaveLength(1)
			expect(envelope.imageUrls).toHaveLength(0)
		})

		test("should extract multiple markdown links from same content string", async () => {
			const perseusJsonWithMultipleLinks = {
				question: {
					content: "Check [source A](https://example.com/a) and [source B](https://example.com/b) for more information."
				}
			}

			const result = await errors.try(buildPerseusEnvelope(perseusJsonWithMultipleLinks))
			expect(result.error).toBeFalsy()
			if (result.error) {
				logger.error("test failed", { error: result.error })
				throw result.error
			}
			const envelope = result.data

			// Should have original JSON plus 2 markdown link contexts
			expect(envelope.context).toHaveLength(3)
			
			const sourceAContext = envelope.context.find(ctx => 
				ctx.includes("Contextual Link Found: [source A](https://example.com/a)")
			)
			const sourceBContext = envelope.context.find(ctx => 
				ctx.includes("Contextual Link Found: [source B](https://example.com/b)")
			)
			
			expect(sourceAContext).toBeDefined()
			expect(sourceBContext).toBeDefined()
		})

		test("should handle deeply nested Perseus JSON structures", async () => {
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
									{
										content: "Regular choice",
										clue: "Regular clue"
									}
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

			// Should have original JSON plus 3 markdown link contexts
			expect(envelope.context).toHaveLength(4)
			
			// Verify all markdown links were found
			const embeddedLinkContext = envelope.context.find(ctx => 
				ctx.includes("Contextual Link Found: [embedded link](https://example.com/choice1)")
			)
			const anotherSourceContext = envelope.context.find(ctx => 
				ctx.includes("Contextual Link Found: [another source](https://example.com/clue1)")
			)
			const helpfulLinkContext = envelope.context.find(ctx => 
				ctx.includes("Contextual Link Found: [helpful link](https://example.com/hint1)")
			)
			
			expect(embeddedLinkContext).toBeDefined()
			expect(anotherSourceContext).toBeDefined()
			expect(helpfulLinkContext).toBeDefined()
		})

		test("should successfully embed SVG content when fetch succeeds", async () => {
			// Create a mock fetch that succeeds for SVG
			const mockSvgContent = '<svg><rect width="100" height="100" fill="blue"/></svg>'
			const successfulFetch = async (url: string, options?: any) => {
				if (url.includes("test-svg")) {
					return {
						ok: true,
						text: async () => mockSvgContent
					}
				}
				return { ok: false }
			}

			const perseusJsonWithSvg = {
				question: {
					content: "Here is an SVG: https://example.com/test-svg.svg"
				}
			}

			const result = await errors.try(buildPerseusEnvelope(perseusJsonWithSvg, successfulFetch as any))
			expect(result.error).toBeFalsy()
			if (result.error) {
				logger.error("test failed", { error: result.error })
				throw result.error
			}
			const envelope = result.data

			// Should have original JSON plus embedded SVG content
			expect(envelope.context).toHaveLength(2)
			expect(envelope.context[1]).toBe(mockSvgContent)
			// No image URLs since SVG content was embedded in context
			expect(envelope.imageUrls).toHaveLength(0)
		})
	})
})
