import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import { radiallyConstrainedAngleDiagramExamples } from "../../examples/radially-constrained-angle-diagram"
import type { Widget } from "../../src/widgets/registry"
import { generateWidget } from "../../src/widgets/widget-generator"

describe("Widget: radially-constrained-angle-diagram", () => {
	const examples = radiallyConstrainedAngleDiagramExamples as unknown as Widget[]

	examples.forEach((props, index) => {
		test(`should produce consistent output for example #${index + 1}`, async () => {
			const result = await errors.try(generateWidget(props))
			if (result.error) throw result.error
			expect(result.data).toMatchSnapshot()
		})
	})

	test("throws error for invalid ray label reference", async () => {
		const result = await errors.try(generateWidget({
			type: "radiallyConstrainedAngleDiagram",
			width: 400,
			height: 400,
			centerLabel: "O",
			rayLabels: ["A", "B"],
			angles: [
				{ fromRayLabel: "A", toRayLabel: "C", value: 60, color: "#ff6b6b" } // "C" doesn't exist
			]
		} as Widget))
		expect(result.error).toBeTruthy()
	})

	test("throws error for angles exceeding 360 degrees", async () => {
		const result = await errors.try(generateWidget({
			type: "radiallyConstrainedAngleDiagram",
			width: 400,
			height: 400,
			centerLabel: "O",
			rayLabels: ["A", "B", "C"],
			angles: [
				{ fromRayLabel: "A", toRayLabel: "B", value: 200, color: "#ff6b6b" },
				{ fromRayLabel: "B", toRayLabel: "C", value: 200, color: "#4ecdc4" }
			]
		} as Widget))
		expect(result.error).toBeTruthy()
	})

	test("throws error for invalid ray order", async () => {
		const result = await errors.try(generateWidget({
			type: "radiallyConstrainedAngleDiagram",
			width: 400,
			height: 400,
			centerLabel: "O",
			rayLabels: ["A", "B", "C"],
			angles: [
				{ fromRayLabel: "C", toRayLabel: "A", value: 60, color: "#ff6b6b" } // C comes after A in array
			]
		} as Widget))
		expect(result.error).toBeTruthy()
	})
})
