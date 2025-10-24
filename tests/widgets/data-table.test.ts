import { describe, expect, it } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { dataTableExamples } from "@/examples/data-table"
import { generateWidgetForTest } from "@/testing/helpers/generateWidgetForTest"

describe("Widget: data-table", () => {
	for (let i = 0; i < dataTableExamples.length; i++) {
		it(`should produce consistent output for example #${i + 1}`, async () => {
			const example = dataTableExamples[i]
			if (!example) {
				logger.error("missing data table example", { index: i })
				throw errors.new("Missing data table example")
			}
			const html = await generateWidgetForTest(example)
			expect(html).toMatchSnapshot()
		})
	}
})
