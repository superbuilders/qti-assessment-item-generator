import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { protractorAngleDiagramExamples } from "../../examples/protractor-angle-diagram"
import type { WidgetInput } from "../../src/widgets/registry"
import { generateWidgetForTest } from "../helpers/generateWidgetForTest"

describe("Widget: protractor-angle-diagram", () => {
	const examples: WidgetInput[] = protractorAngleDiagramExamples

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
