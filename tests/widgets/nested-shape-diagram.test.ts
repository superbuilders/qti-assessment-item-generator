import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { nestedShapeDiagramExamples } from "../../examples/nested-shape-diagram"
import { generateWidgetForTest } from "../helpers/generateWidgetForTest"

describe("nestedShapeDiagram widget tests", () => {
	// Test each example from the examples file
	nestedShapeDiagramExamples.forEach((example, index) => {
		// Extract question ID from the example if available (from comments in the source)
		const questionIds = [
			"xdd3424e759f98328",
			"x9b74005f28d0b824",
			"x70ade9874035cc08",
			"x7893c043131fd6d6",
			"xd8c0fb6d8bfff96e",
			"x3a68667079fdffdd",
			"x55061cb6ed4c4ee5",
			"xb9a2f2df68f7f278",
			"xc12b923ac5d6ad9e",
			"x9b473530bde85c53",
			"xf0438c2e9eb979cd",
			"x74eb96d7a07de3a4"
		]

		const descriptions = [
			"Area of a shaded region between a circle and a rectangle",
			"Area of a shaded region (circle minus rectangle)",
			"Area of a shaded region (square minus circle)",
			"Area of a shaded region between a circle and a rectangle",
			"Area of a shaded region (circle minus rectangle)",
			"Area of the shaded region (circle minus rectangle)",
			"Area of the shaded region between a rectangle and a circle",
			"Area of the shaded region: rectangle minus circle",
			"Area of a shaded region (rectangle with inscribed circle)",
			"Area of a shaded region: rectangle minus circle",
			"Area of the shaded region between a square and a circle",
			"Area of a shaded region between a circle and a square"
		]

		const testName = questionIds[index]
			? `nested-shape-diagram - [${questionIds[index]}] ${descriptions[index]}`
			: `nested-shape-diagram - Example ${index + 1}`

		test(testName, async () => {
			const result = await errors.try(generateWidgetForTest(example))
			if (result.error) {
				logger.error("widget generation failed for nestedShapeDiagram", {
					error: result.error,
					exampleIndex: index,
					inputData: example
				})
				throw errors.wrap(result.error, "widget generation")
			}

			const svg = result.data
			expect(svg).toMatchSnapshot()
		})
	})
})
