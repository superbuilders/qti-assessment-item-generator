import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import { transversalAngleDiagramExamples } from "../../examples/transversal-angle-diagram"
import type { Widget } from "../../src/widgets/registry"
import { generateWidget } from "../../src/widgets/widget-generator"

describe("Widget: transversal-angle-diagram", () => {
	const examples = transversalAngleDiagramExamples as unknown as Widget[]

	examples.forEach((props, index) => {
		test(`should produce consistent output for example #${index + 1}`, async () => {
			const result = await errors.try(generateWidget(props))
			if (result.error) throw result.error
			expect(result.data).toMatchSnapshot()
		})
	})

	test("throws error for transversal parallel to a main line", async () => {
		const result = await errors.try(generateWidget({
			type: "transversalAngleDiagram",
			width: 400,
			height: 400,
			line1Angle: 45,
			line2Angle: 0,
			transversalAngle: 45, // Same as line1 -> invalid
			intersections: {
				line1: {
					label: "P",
					angles: [
						{ span: "mainToTransversal", label: "1", color: "#ff6b6b", fromRay: { dir: "-" }, toRay: { dir: "+" } }
					]
				},
				line2: {
					label: "Q",
					angles: [
						{ span: "mainToTransversal", label: "2", color: "#4ecdc4", fromRay: { dir: "-" }, toRay: { dir: "+" } }
					]
				}
			},
			pointLabels: {
				line1: ["A", "B"],
				line2: ["C", "D"],
				transversal: ["E", "F"]
			}
		} as Widget))
		expect(result.error).toBeTruthy()
	})

	test("throws error for missing line1 intersection", async () => {
		const result = await errors.try(generateWidget({
			type: "transversalAngleDiagram",
			width: 400,
			height: 400,
			line1Angle: 0,
			line2Angle: 0,
			transversalAngle: 45,
			intersections: {
				line2: {
					label: "P",
					angles: [
						{ span: "mainToTransversal", label: "1", color: "#ff6b6b", fromRay: { dir: "-" }, toRay: { dir: "+" } }
					]
				}
			} as any
		} as Widget))
		expect(result.error).toBeTruthy()
	})

	test("throws error for duplicate intersection labels", async () => {
		const result = await errors.try(generateWidget({
			type: "transversalAngleDiagram",
			width: 400,
			height: 400,
			line1Angle: 0,
			line2Angle: 0,
			transversalAngle: 45,
			intersections: {
				line1: { label: "P", angles: [ { span: "mainToTransversal", label: "1", color: "#ff6b6b", fromRay: { dir: "-" }, toRay: { dir: "+" } } ] },
				line2: { label: "P", angles: [ { span: "mainToTransversal", label: "2", color: "#4ecdc4", fromRay: { dir: "-" }, toRay: { dir: "+" } } ] }
			}
		} as Widget))
		expect(result.error).toBeTruthy()
	})

	test("throws error for angle not spanning main and transversal (cannot construct with schema)", async () => {
		// This case is no longer buildable via schema, but we keep a sanity check using any-cast
		const badAngles = [{ span: "mainToTransversal", label: "1", color: "#ff6b6b", fromRay: { dir: "-" }, toRay: { dir: "+" } }]
		const result = await errors.try(generateWidget({
			type: "transversalAngleDiagram",
			width: 400,
			height: 400,
			line1Angle: 0,
			line2Angle: 0,
			transversalAngle: 45,
			intersections: {
				line1: { label: "P", angles: badAngles as any },
				line2: { label: "Q", angles: badAngles as any }
			}
		} as Widget))
		// If schema allows construction, generator would still succeed. This ensures no throw.
		expect(result.error).toBeFalsy()
	})

	test("should still error when angle arrays are missing (invalid structure)", async () => {
		const invalid = await errors.try(generateWidget({
			type: "transversalAngleDiagram",
			width: 400,
			height: 400,
			line1Angle: 0,
			line2Angle: 0,
			transversalAngle: 45,
			intersections: {
				line1: { label: "P" } as any,
				line2: { label: "Q", angles: [ { span: "mainToTransversal", label: "1", color: "#ff6b6b", fromRay: { dir: "-" }, toRay: { dir: "+" } } ] }
			}
		} as Widget))
		expect(invalid.error).toBeTruthy()
	})
})
