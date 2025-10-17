import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { lineDiagramExamples } from "@/examples/line-diagram"
import { generateWidgetForTest } from "@/testing/helpers/generateWidgetForTest"
import type { WidgetInput } from "@/widgets/registry"

describe("Widget: line-diagram", () => {
	const examples: WidgetInput[] = lineDiagramExamples

	examples.forEach((props, index) => {
		test(`should produce consistent output for example #${index + 1}`, async () => {
			const result = await errors.try(generateWidgetForTest(props))
			if (result.error) {
				logger.error("widget generation failed", { error: result.error, index })
				throw result.error
			}
			expect(result.data).toMatchSnapshot()
		})
	})
})
