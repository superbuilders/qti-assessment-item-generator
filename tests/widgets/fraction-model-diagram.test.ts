import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { fractionModelDiagramExamples } from "../../examples/fraction-model-diagram"
import type { WidgetInput } from "../../src/widgets/registry"
import { generateWidget } from "../../src/widgets/widget-generator"

describe("Widget: fraction-model-diagram", () => {
	const examples: WidgetInput[] = fractionModelDiagramExamples

	examples.forEach((props, index) => {
		test(`should produce consistent output for example #${index + 1}`, async () => {
			const result = await errors.try(generateWidget(props))
			if (result.error) {
				logger.error("widget generation failed", { error: result.error, index })
				throw result.error
			}
			expect(result.data).toMatchSnapshot()
		})
	})
})
