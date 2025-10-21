import { describe, expect, it } from "bun:test"
import { dataTableExamples } from "@/examples/data-table"
import { generateWidgetForTest } from "@/testing/helpers/generateWidgetForTest"

describe("Widget: data-table", () => {
	for (let i = 0; i < dataTableExamples.length; i++) {
		it(`should produce consistent output for example #${i + 1}`, async () => {
			const html = await generateWidgetForTest(dataTableExamples[i]!)
			expect(html).toMatchSnapshot()
		})
	}
})

