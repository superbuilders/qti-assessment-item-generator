import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import { barChartExamples } from "../../examples/bar-chart"
import type { Widget } from "../../src/widgets/registry"
import { generateWidget } from "../../src/widgets/widget-generator"

describe("Widget: bar-chart", () => {
	const examples = barChartExamples as unknown as Widget[]

	examples.forEach((props, index) => {
		test(`should produce consistent output for example #${index + 1}`, async () => {
			const result = await errors.try(generateWidget(props))
			if (result.error) throw result.error
			expect(result.data).toMatchSnapshot()
		})
	})
})


