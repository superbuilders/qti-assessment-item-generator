import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { barChartExamples } from "../../examples/bar-chart"
import type { WidgetInput } from "../../src/widgets/registry"
import { generateWidgetLegacy } from "../../src/widgets/widget-generator"

describe("Widget: bar-chart", () => {
	const examples: WidgetInput[] = barChartExamples

	examples.forEach((props, index) => {
		test(`should produce consistent output for example #${index + 1}`, async () => {
			const result = await errors.try(generateWidgetLegacy(props))
			if (result.error) {
				logger.error("widget generation failed", { error: result.error, index })
				throw result.error
			}
			expect(result.data).toMatchSnapshot()
		})
	})
})
