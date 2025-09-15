import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import {
	divisionAreaDiagramExamples_28_div_2,
	divisionAreaDiagramExamples_51_div_3,
	divisionAreaDiagramExamples_62_div_4,
	divisionAreaDiagramExamples_99_div_6,
	divisionAreaDiagramExamples_809_div_4,
	divisionAreaDiagramExamples_954_div_9
} from "../../examples/division-area-diagram"
import type { WidgetInput } from "../../src/widgets/registry"
import { generateWidget } from "../../src/widgets/widget-generator"

describe("Widget: division-area-diagram", () => {
	const examples: WidgetInput[] = [
		...divisionAreaDiagramExamples_51_div_3,
		...divisionAreaDiagramExamples_28_div_2,
		...divisionAreaDiagramExamples_62_div_4,
		...divisionAreaDiagramExamples_99_div_6,
		...divisionAreaDiagramExamples_954_div_9,
		...divisionAreaDiagramExamples_809_div_4
	]

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
