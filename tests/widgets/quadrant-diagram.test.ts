import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { quadrantDiagramExamples } from "@/examples/quadrant-diagram"
import { generateWidgetForTest } from "@/testing/helpers/generateWidgetForTest"
import type { WidgetInput } from "@/widgets/registry"

describe("Widget: quadrant-diagram", () => {
	const examples: WidgetInput[] = quadrantDiagramExamples

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
