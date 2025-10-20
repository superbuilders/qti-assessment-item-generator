import { describe, expect, test } from "bun:test"
import { buildStimulusFromPageData } from "@/stimulus/builder"
import { collectStimulusFixtures } from "./fixtures"

const fixtures = collectStimulusFixtures()

describe("Stimulus video extraction", () => {
	test("discovered fixtures", () => {
		expect(fixtures.length).toBeGreaterThan(0)
	})

	for (const fixture of fixtures) {
		test(`videos for ${fixture.slugPath}`, () => {
			const result = buildStimulusFromPageData(fixture.page)
			expect(result).toBeDefined()
			if (!result) return

			const orders = result.videos.map((video) => video.order)
			const sortedOrders = [...orders].sort((a, b) => a - b)
			expect(orders).toEqual(sortedOrders)

			if (result.videos.length > 0) {
				expect(result.html.includes("<iframe")).toBeFalse()
				expect(
					result.html.toLowerCase().includes("watch the following videos")
				).toBeFalse()
			}

			expect(result.videos).toMatchSnapshot()
		})
	}
})
