import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import {
	circleWithRectangleExample,
	compositeFromNestedExamples,
	compositeShapeExample
} from "../../examples/composite-shape-diagram"
import { type WidgetInput, WidgetSchema } from "../../src/widgets/registry"
import { generateWidgetLegacy } from "../../src/widgets/widget-generator"

function ensureWidgetInput(input: unknown): WidgetInput {
	const parsed = WidgetSchema.safeParse(input)
	if (!parsed.success) {
		logger.error("test input validation failed", { error: parsed.error })
		throw errors.wrap(parsed.error, "test input validation")
	}
	return parsed.data
}

describe("Widget: composite-shape-diagram", () => {
	// Test the examples from the examples file
	test("should produce consistent output for compositeShapeExample", async () => {
		const result = await errors.try(generateWidgetLegacy(ensureWidgetInput(compositeShapeExample)))
		if (result.error) {
			logger.error("widget generation failed", { error: result.error })
			throw result.error
		}
		expect(result.data).toMatchSnapshot()
	})

	test("should produce consistent output for circleWithRectangleExample", async () => {
		const result = await errors.try(generateWidgetLegacy(ensureWidgetInput(circleWithRectangleExample)))
		if (result.error) {
			logger.error("widget generation failed", { error: result.error })
			throw result.error
		}
		expect(result.data).toMatchSnapshot()
	})

	// Database regression tests
	test("composite-shape-diagram - [x9b74005f28d0b824] Area of a shaded region between a circle and a rectangle", async () => {
		const input = ensureWidgetInput({
			type: "compositeShapeDiagram",
			width: 300,
			height: 300,
			vertices: [
				{ x: 130, y: 130, id: "center" },
				{ x: 250, y: 130, id: "p0" },
				{ x: 240.866, y: 175.922, id: "p1" },
				{ x: 214.853, y: 214.853, id: "p2" },
				{ x: 175.922, y: 240.866, id: "p3" },
				{ x: 130, y: 250, id: "p4" },
				{ x: 84.078, y: 240.866, id: "p5" },
				{ x: 45.147, y: 214.853, id: "p6" },
				{ x: 19.134, y: 175.922, id: "p7" },
				{ x: 10, y: 130, id: "p8" },
				{ x: 19.134, y: 84.078, id: "p9" },
				{ x: 45.147, y: 45.147, id: "p10" },
				{ x: 84.078, y: 19.134, id: "p11" },
				{ x: 130, y: 10, id: "p12" },
				{ x: 175.922, y: 19.134, id: "p13" },
				{ x: 214.853, y: 45.147, id: "p14" },
				{ x: 240.866, y: 84.078, id: "p15" },
				{ x: 105, y: 75, id: "rectTopLeft" },
				{ x: 155, y: 75, id: "rectTopRight" },
				{ x: 155, y: 185, id: "rectBottomRight" },
				{ x: 105, y: 185, id: "rectBottomLeft" }
			],
			regionLabels: null,
			boundaryEdges: [
				{ to: "p1", from: "p0", type: "simple", label: null },
				{ to: "p2", from: "p1", type: "simple", label: null },
				{ to: "p3", from: "p2", type: "simple", label: null },
				{ to: "p4", from: "p3", type: "simple", label: null },
				{ to: "p5", from: "p4", type: "simple", label: null },
				{ to: "p6", from: "p5", type: "simple", label: null },
				{ to: "p7", from: "p6", type: "simple", label: null },
				{ to: "p8", from: "p7", type: "simple", label: null },
				{ to: "p9", from: "p8", type: "simple", label: null },
				{ to: "p10", from: "p9", type: "simple", label: null },
				{ to: "p11", from: "p10", type: "simple", label: null },
				{ to: "p12", from: "p11", type: "simple", label: null },
				{ to: "p13", from: "p12", type: "simple", label: null },
				{ to: "p14", from: "p13", type: "simple", label: null },
				{ to: "p15", from: "p14", type: "simple", label: null },
				{ to: "p0", from: "p15", type: "simple", label: null },
				{ to: "rectTopRight", from: "rectTopLeft", type: "simple", label: { unit: "cm", value: 5 } },
				{ to: "rectBottomRight", from: "rectTopRight", type: "simple", label: { unit: "cm", value: 11 } },
				{ to: "rectBottomLeft", from: "rectBottomRight", type: "simple", label: null },
				{ to: "rectTopLeft", from: "rectBottomLeft", type: "simple", label: null }
			],
			shadedRegions: [
				{
					fillColor: "#ccfaff80",
					vertexIds: [
						"p0",
						"p1",
						"p2",
						"p3",
						"p4",
						"p5",
						"p6",
						"p7",
						"p8",
						"p9",
						"p10",
						"p11",
						"p12",
						"p13",
						"p14",
						"p15"
					]
				},
				{
					fillColor: "#fdfdfd",
					vertexIds: ["rectTopLeft", "rectTopRight", "rectBottomRight", "rectBottomLeft"]
				}
			],
			internalSegments: [
				{ label: { unit: "cm", value: 12 }, style: "solid", toVertexId: "p0", fromVertexId: "center" }
			],
			rightAngleMarkers: null
		})

		const result = await errors.try(generateWidgetLegacy(input))
		if (result.error) {
			logger.error("widget generation failed for compositeShapeDiagram", { error: result.error, inputData: input })
			throw errors.wrap(result.error, "widget generation")
		}
		expect(result.data).toMatchSnapshot()
	})

	// Migrated examples from nested-shape-diagram → composite-shape-diagram (fit: "none")
	compositeFromNestedExamples.forEach((example, index) => {
		test(`composite-shape-diagram migrated example #${index + 1}`, async () => {
			const input = ensureWidgetInput(example)
			const result = await errors.try(generateWidgetLegacy(input))
			if (result.error) {
				logger.error("widget generation failed for migrated composite example", { error: result.error, index })
				throw errors.wrap(result.error, "widget generation")
			}
			expect(result.data).toMatchSnapshot()
		})
	})

	test("composite-shape-diagram - [xdd3424e759f98328] Area of a shaded region (circle and rectangle)", async () => {
		const input = ensureWidgetInput({
			type: "compositeShapeDiagram",
			width: 400,
			height: 400,
			vertices: [
				{ x: 0, y: 0, id: "O" },
				{ x: -20, y: -30, id: "R1" },
				{ x: 20, y: -30, id: "R2" },
				{ x: 20, y: 30, id: "R3" },
				{ x: -20, y: 30, id: "R4" },
				{ x: 110, y: 0, id: "C0" },
				{ x: 101.63, y: 42.1, id: "C1" },
				{ x: 77.78, y: 77.78, id: "C2" },
				{ x: 42.1, y: 101.63, id: "C3" },
				{ x: 0, y: 110, id: "C4" },
				{ x: -42.1, y: 101.63, id: "C5" },
				{ x: -77.78, y: 77.78, id: "C6" },
				{ x: -101.63, y: 42.1, id: "C7" },
				{ x: -110, y: 0, id: "C8" },
				{ x: -101.63, y: -42.1, id: "C9" },
				{ x: -77.78, y: -77.78, id: "C10" },
				{ x: -42.1, y: -101.63, id: "C11" },
				{ x: 0, y: -110, id: "C12" },
				{ x: 42.1, y: -101.63, id: "C13" },
				{ x: 77.78, y: -77.78, id: "C14" },
				{ x: 101.63, y: -42.1, id: "C15" }
			],
			regionLabels: null,
			boundaryEdges: [
				{
					path: [
						"C0",
						"C1",
						"C2",
						"C3",
						"C4",
						"C5",
						"C6",
						"C7",
						"C8",
						"C9",
						"C10",
						"C11",
						"C12",
						"C13",
						"C14",
						"C15",
						"C0"
					],
					type: "partitioned",
					segments: [
						{ label: null, style: "solid" },
						{ label: null, style: "solid" },
						{ label: null, style: "solid" },
						{ label: null, style: "solid" },
						{ label: null, style: "solid" },
						{ label: null, style: "solid" },
						{ label: null, style: "solid" },
						{ label: null, style: "solid" },
						{ label: null, style: "solid" },
						{ label: null, style: "solid" },
						{ label: null, style: "solid" },
						{ label: null, style: "solid" },
						{ label: null, style: "solid" },
						{ label: null, style: "solid" },
						{ label: null, style: "solid" },
						{ label: null, style: "solid" }
					]
				}
			],
			shadedRegions: [
				{
					fillColor: "#ccfaff80",
					vertexIds: [
						"C0",
						"C1",
						"C2",
						"C3",
						"C4",
						"C5",
						"C6",
						"C7",
						"C8",
						"C9",
						"C10",
						"C11",
						"C12",
						"C13",
						"C14",
						"C15"
					]
				},
				{ fillColor: "#ffffff", vertexIds: ["R1", "R2", "R3", "R4"] }
			],
			internalSegments: [
				{ label: { unit: "cm", value: 11 }, style: "solid", toVertexId: "C0", fromVertexId: "O" },
				{ label: { unit: "cm", value: 4 }, style: "solid", toVertexId: "R2", fromVertexId: "R1" },
				{ label: { unit: "cm", value: 6 }, style: "solid", toVertexId: "R3", fromVertexId: "R2" },
				{ label: null, style: "solid", toVertexId: "R4", fromVertexId: "R3" },
				{ label: null, style: "solid", toVertexId: "R1", fromVertexId: "R4" }
			],
			rightAngleMarkers: null
		})

		const result = await errors.try(generateWidgetLegacy(input))
		if (result.error) {
			logger.error("widget generation failed for compositeShapeDiagram", { error: result.error, inputData: input })
			throw errors.wrap(result.error, "widget generation")
		}
		expect(result.data).toMatchSnapshot()
	})

	test("composite-shape-diagram - [xd8c0fb6d8bfff96e] Area of a shaded region: circle minus rectangle", async () => {
		const input = ensureWidgetInput({
			type: "compositeShapeDiagram",
			width: 300,
			height: 300,
			vertices: [
				{ x: 260, y: 140, id: "C0" },
				{ x: 243.923, y: 80, id: "C1" },
				{ x: 200, y: 36.077, id: "C2" },
				{ x: 140, y: 20, id: "C3" },
				{ x: 80, y: 36.077, id: "C4" },
				{ x: 36.077, y: 80, id: "C5" },
				{ x: 20, y: 140, id: "C6" },
				{ x: 36.077, y: 200, id: "C7" },
				{ x: 80, y: 243.923, id: "C8" },
				{ x: 140, y: 260, id: "C9" },
				{ x: 200, y: 243.923, id: "C10" },
				{ x: 243.923, y: 200, id: "C11" },
				{ x: 70, y: 90, id: "R1" },
				{ x: 210, y: 90, id: "R2" },
				{ x: 210, y: 190, id: "R3" },
				{ x: 70, y: 190, id: "R4" },
				{ x: 140, y: 140, id: "center" }
			],
			regionLabels: null,
			boundaryEdges: [
				{ to: "C1", from: "C0", type: "simple", label: null },
				{ to: "C2", from: "C1", type: "simple", label: null },
				{ to: "C3", from: "C2", type: "simple", label: null },
				{ to: "C4", from: "C3", type: "simple", label: null },
				{ to: "C5", from: "C4", type: "simple", label: null },
				{ to: "C6", from: "C5", type: "simple", label: null },
				{ to: "C7", from: "C6", type: "simple", label: null },
				{ to: "C8", from: "C7", type: "simple", label: null },
				{ to: "C9", from: "C8", type: "simple", label: null },
				{ to: "C10", from: "C9", type: "simple", label: null },
				{ to: "C11", from: "C10", type: "simple", label: null },
				{ to: "C0", from: "C11", type: "simple", label: null }
			],
			shadedRegions: [
				{
					fillColor: "#ccfaff80",
					vertexIds: ["C0", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10", "C11"]
				},
				{ fillColor: "#ffffff", vertexIds: ["R1", "R2", "R3", "R4"] }
			],
			internalSegments: [
				{ label: { unit: "cm", value: 7 }, style: "solid", toVertexId: "R2", fromVertexId: "R1" },
				{ label: null, style: "solid", toVertexId: "R3", fromVertexId: "R2" },
				{ label: null, style: "solid", toVertexId: "R4", fromVertexId: "R3" },
				{ label: { unit: "cm", value: 5 }, style: "solid", toVertexId: "R1", fromVertexId: "R4" },
				{ label: { unit: "cm", value: 6 }, style: "solid", toVertexId: "C0", fromVertexId: "center" }
			],
			rightAngleMarkers: null
		})

		const result = await errors.try(generateWidgetLegacy(input))
		if (result.error) {
			logger.error("widget generation failed for compositeShapeDiagram", { error: result.error, inputData: input })
			throw errors.wrap(result.error, "widget generation")
		}
		expect(result.data).toMatchSnapshot()
	})

	test("composite-shape-diagram - [x3a68667079fdffdd] Area of a shaded region (circle and rectangle)", async () => {
		const input = ensureWidgetInput({
			type: "compositeShapeDiagram",
			width: 300,
			height: 300,
			vertices: [
				{ x: 100, y: 100, id: "O" },
				{ x: 70, y: 80, id: "R1" },
				{ x: 130, y: 80, id: "R2" },
				{ x: 130, y: 120, id: "R3" },
				{ x: 70, y: 120, id: "R4" },
				{ x: 180, y: 100, id: "C0" },
				{ x: 169.3, y: 140, id: "C1" },
				{ x: 140, y: 169.3, id: "C2" },
				{ x: 100, y: 180, id: "C3" },
				{ x: 60, y: 169.3, id: "C4" },
				{ x: 30.7, y: 140, id: "C5" },
				{ x: 20, y: 100, id: "C6" },
				{ x: 30.7, y: 60, id: "C7" },
				{ x: 60, y: 30.7, id: "C8" },
				{ x: 100, y: 20, id: "C9" },
				{ x: 140, y: 30.7, id: "C10" },
				{ x: 169.3, y: 60, id: "C11" }
			],
			regionLabels: null,
			boundaryEdges: [
				{ to: "C1", from: "C0", type: "simple", label: null },
				{ to: "C2", from: "C1", type: "simple", label: null },
				{ to: "C3", from: "C2", type: "simple", label: null },
				{ to: "C4", from: "C3", type: "simple", label: null },
				{ to: "C5", from: "C4", type: "simple", label: null },
				{ to: "C6", from: "C5", type: "simple", label: null },
				{ to: "C7", from: "C6", type: "simple", label: null },
				{ to: "C8", from: "C7", type: "simple", label: null },
				{ to: "C9", from: "C8", type: "simple", label: null },
				{ to: "C10", from: "C9", type: "simple", label: null },
				{ to: "C11", from: "C10", type: "simple", label: null },
				{ to: "C0", from: "C11", type: "simple", label: null },
				{ to: "R2", from: "R1", type: "simple", label: { unit: "cm", value: 3 } },
				{ to: "R3", from: "R2", type: "simple", label: { unit: "cm", value: 2 } },
				{ to: "R4", from: "R3", type: "simple", label: null },
				{ to: "R1", from: "R4", type: "simple", label: null }
			],
			shadedRegions: [
				{
					fillColor: "#ccfaff80",
					vertexIds: ["C0", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10", "C11"]
				},
				{ fillColor: "#ffffff", vertexIds: ["R1", "R2", "R3", "R4"] }
			],
			internalSegments: [{ label: { unit: "cm", value: 4 }, style: "solid", toVertexId: "C0", fromVertexId: "O" }],
			rightAngleMarkers: null
		})

		const result = await errors.try(generateWidgetLegacy(input))
		if (result.error) {
			logger.error("widget generation failed for compositeShapeDiagram", { error: result.error, inputData: input })
			throw errors.wrap(result.error, "widget generation")
		}
		expect(result.data).toMatchSnapshot()
	})

	test("composite-shape-diagram - [xaee2680b7bbe6277] Find the areas of two triangles and the whole figure", async () => {
		const input = ensureWidgetInput({
			type: "compositeShapeDiagram",
			width: 400,
			height: 320,
			vertices: [
				{ x: 0, y: 0, id: "top" },
				{ x: -6, y: 10, id: "left" },
				{ x: 6, y: 10, id: "right" },
				{ x: 0, y: 20, id: "bottom" },
				{ x: 0, y: 10, id: "mid" }
			],
			regionLabels: [
				{ text: "A", position: { x: 0, y: 16 } },
				{ text: "B", position: { x: 0, y: 4 } }
			],
			boundaryEdges: [
				{ to: "left", from: "bottom", type: "simple", label: null },
				{ to: "top", from: "left", type: "simple", label: null },
				{ to: "right", from: "top", type: "simple", label: null },
				{ to: "bottom", from: "right", type: "simple", label: null }
			],
			shadedRegions: null,
			internalSegments: [
				{ label: { unit: "units", value: 7 }, style: "dashed", toVertexId: "right", fromVertexId: "left" },
				{ label: { unit: "units", value: 9 }, style: "dashed", toVertexId: "bottom", fromVertexId: "mid" },
				{ label: { unit: "units", value: 5 }, style: "dashed", toVertexId: "top", fromVertexId: "mid" }
			],
			rightAngleMarkers: null
		})

		const result = await errors.try(generateWidgetLegacy(input))
		if (result.error) {
			logger.error("widget generation failed for compositeShapeDiagram", { error: result.error, inputData: input })
			throw errors.wrap(result.error, "widget generation")
		}
		expect(result.data).toMatchSnapshot()
	})

	test("composite-shape-diagram - [x317e33403062daa2] Find areas of parts of a composite figure", async () => {
		const input = ensureWidgetInput({
			type: "compositeShapeDiagram",
			width: 500,
			height: 340,
			vertices: [
				{ x: 28.829, y: 2.883, id: "T" },
				{ x: 28.829, y: 118.198, id: "L" },
				{ x: 86.487, y: 118.198, id: "H1" },
				{ x: 144.144, y: 118.198, id: "H2" },
				{ x: 86.487, y: 175.856, id: "BL" },
				{ x: 144.144, y: 175.856, id: "BR" },
				{ x: 317.117, y: 118.198, id: "R" }
			],
			regionLabels: [
				{ text: "A", position: { x: 110, y: 70 } },
				{ text: "B", position: { x: 55, y: 155 } },
				{ text: "C", position: { x: 115, y: 150 } },
				{ text: "D", position: { x: 220, y: 140 } }
			],
			boundaryEdges: [
				{ to: "L", from: "T", type: "simple", label: { unit: "units", value: 4 } },
				{ to: "BL", from: "L", type: "simple", label: null },
				{ to: "BR", from: "BL", type: "simple", label: null },
				{ to: "R", from: "BR", type: "simple", label: null },
				{ to: "T", from: "R", type: "simple", label: null }
			],
			shadedRegions: [
				{ fillColor: "#bc26124d", vertexIds: ["T", "L", "R"] },
				{ fillColor: "#e07d104d", vertexIds: ["L", "BL", "H1"] },
				{ fillColor: "#ca337c4d", vertexIds: ["H1", "BL", "BR", "H2"] },
				{ fillColor: "#01a9954d", vertexIds: ["H2", "BR", "R"] }
			],
			internalSegments: [
				{ label: { unit: "units", value: 2 }, style: "dashed", toVertexId: "H1", fromVertexId: "L" },
				{ label: { unit: "units", value: 2 }, style: "dashed", toVertexId: "H2", fromVertexId: "H1" },
				{ label: { unit: "units", value: 6 }, style: "dashed", toVertexId: "R", fromVertexId: "H2" },
				{ label: { unit: "units", value: 2 }, style: "dashed", toVertexId: "BL", fromVertexId: "H1" },
				{ label: { unit: "units", value: 2 }, style: "dashed", toVertexId: "BR", fromVertexId: "H2" }
			],
			rightAngleMarkers: [
				{ cornerVertexId: "L", adjacentVertex1Id: "T", adjacentVertex2Id: "H1" },
				{ cornerVertexId: "H1", adjacentVertex1Id: "L", adjacentVertex2Id: "BL" },
				{ cornerVertexId: "H2", adjacentVertex1Id: "R", adjacentVertex2Id: "BR" }
			]
		})

		const result = await errors.try(generateWidgetLegacy(input))
		if (result.error) {
			logger.error("widget generation failed for compositeShapeDiagram", { error: result.error, inputData: input })
			throw errors.wrap(result.error, "widget generation")
		}
		expect(result.data).toMatchSnapshot()
	})

	test("composite-shape-diagram - [xb0f43fd03d2eff7c] Find the area of a composite shape", async () => {
		const input = ensureWidgetInput({
			type: "compositeShapeDiagram",
			width: 480,
			height: 360,
			vertices: [
				{ x: 0, y: 9, id: "A" },
				{ x: 9, y: 9, id: "B" },
				{ x: 9, y: 3, id: "C" },
				{ x: 0, y: 3, id: "D" },
				{ x: 4.5, y: 0, id: "apex" },
				{ x: 4.5, y: 3, id: "midBase" }
			],
			regionLabels: null,
			boundaryEdges: [
				{ to: "B", from: "A", type: "simple", label: { unit: "units", value: 9 } },
				{ to: "C", from: "B", type: "simple", label: null },
				{ to: "apex", from: "C", type: "simple", label: null },
				{ to: "D", from: "apex", type: "simple", label: null },
				{ to: "A", from: "D", type: "simple", label: { unit: "units", value: 6 } }
			],
			shadedRegions: null,
			internalSegments: [
				{ label: null, style: "dashed", toVertexId: "C", fromVertexId: "D" },
				{ label: { unit: "units", value: 3 }, style: "dashed", toVertexId: "midBase", fromVertexId: "apex" }
			],
			rightAngleMarkers: [{ cornerVertexId: "midBase", adjacentVertex1Id: "apex", adjacentVertex2Id: "D" }]
		})

		const result = await errors.try(generateWidgetLegacy(input))
		if (result.error) {
			logger.error("widget generation failed for compositeShapeDiagram", { error: result.error, inputData: input })
			throw errors.wrap(result.error, "widget generation")
		}
		expect(result.data).toMatchSnapshot()
	})

	test("composite-shape-diagram - [x161673a7853ec0b5] Find the area of a composite shape", async () => {
		const input = ensureWidgetInput({
			type: "compositeShapeDiagram",
			width: 480,
			height: 360,
			vertices: [
				{ x: 0, y: 0, id: "A_topLeft" },
				{ x: 9, y: 0, id: "B_topRight" },
				{ x: 9, y: 4, id: "C_rightCut" },
				{ x: 5, y: 9, id: "D_bottomRightInner" },
				{ x: 3, y: 9, id: "E_bottomLeftInner" },
				{ x: 0, y: 5, id: "F_leftCut" },
				{ x: 0, y: 9, id: "G_bottomLeftRect" },
				{ x: 9, y: 9, id: "H_bottomRightRect" }
			],
			regionLabels: null,
			boundaryEdges: [
				{ to: "B_topRight", from: "A_topLeft", type: "simple", label: { unit: "units", value: 9 } },
				{ to: "C_rightCut", from: "B_topRight", type: "simple", label: { unit: "units", value: 4 } },
				{ to: "D_bottomRightInner", from: "C_rightCut", type: "simple", label: null },
				{ to: "E_bottomLeftInner", from: "D_bottomRightInner", type: "simple", label: null },
				{ to: "F_leftCut", from: "E_bottomLeftInner", type: "simple", label: null },
				{ to: "A_topLeft", from: "F_leftCut", type: "simple", label: { unit: "units", value: 5 } }
			],
			shadedRegions: null,
			internalSegments: [
				{
					label: { unit: "units", value: 3 },
					style: "dashed",
					toVertexId: "E_bottomLeftInner",
					fromVertexId: "G_bottomLeftRect"
				},
				{
					label: { unit: "units", value: 4 },
					style: "dashed",
					toVertexId: "F_leftCut",
					fromVertexId: "G_bottomLeftRect"
				},
				{
					label: { unit: "units", value: 4 },
					style: "dashed",
					toVertexId: "D_bottomRightInner",
					fromVertexId: "H_bottomRightRect"
				},
				{
					label: { unit: "units", value: 5 },
					style: "dashed",
					toVertexId: "C_rightCut",
					fromVertexId: "H_bottomRightRect"
				}
			],
			rightAngleMarkers: [
				{ cornerVertexId: "G_bottomLeftRect", adjacentVertex1Id: "F_leftCut", adjacentVertex2Id: "E_bottomLeftInner" },
				{
					cornerVertexId: "H_bottomRightRect",
					adjacentVertex1Id: "C_rightCut",
					adjacentVertex2Id: "D_bottomRightInner"
				}
			]
		})

		const result = await errors.try(generateWidgetLegacy(input))
		if (result.error) {
			logger.error("widget generation failed for compositeShapeDiagram", { error: result.error, inputData: input })
			throw errors.wrap(result.error, "widget generation")
		}
		expect(result.data).toMatchSnapshot()
	})

	test("composite-shape-diagram - [x08f3220a196255d1] Area of a composite shape with one pair of parallel sides", async () => {
		const input = ensureWidgetInput({
			type: "compositeShapeDiagram",
			width: 320,
			height: 300,
			vertices: [
				{ x: 1.975, y: 160, id: "A_leftBase" },
				{ x: 160, y: 1.975, id: "B_apex" },
				{ x: 160, y: 61.235, id: "C_step1" },
				{ x: 199.506, y: 61.235, id: "D_step2" },
				{ x: 318.025, y: 160, id: "E_rightBase" },
				{ x: 160, y: 160, id: "F_bottomAtC" },
				{ x: 199.506, y: 160, id: "G_bottomAtD" }
			],
			regionLabels: null,
			boundaryEdges: [
				{ to: "B_apex", from: "A_leftBase", type: "simple", label: null },
				{ to: "C_step1", from: "B_apex", type: "simple", label: null },
				{ to: "D_step2", from: "C_step1", type: "simple", label: null },
				{ to: "E_rightBase", from: "D_step2", type: "simple", label: null },
				{
					path: ["E_rightBase", "G_bottomAtD", "F_bottomAtC", "A_leftBase"],
					type: "partitioned",
					segments: [
						{ label: { unit: "units", value: 6 }, style: "solid" },
						{ label: { unit: "units", value: 2 }, style: "solid" },
						{ label: { unit: "units", value: 8 }, style: "solid" }
					]
				}
			],
			shadedRegions: null,
			internalSegments: [
				{ label: { unit: "units", value: 5 }, style: "dashed", toVertexId: "F_bottomAtC", fromVertexId: "C_step1" },
				{ label: { unit: "units", value: 5 }, style: "dashed", toVertexId: "G_bottomAtD", fromVertexId: "D_step2" },
				{ label: { unit: "units", value: 8 }, style: "dashed", toVertexId: "F_bottomAtC", fromVertexId: "B_apex" }
			],
			rightAngleMarkers: null
		})

		const result = await errors.try(generateWidgetLegacy(input))
		if (result.error) {
			logger.error("widget generation failed for compositeShapeDiagram", { error: result.error, inputData: input })
			throw errors.wrap(result.error, "widget generation")
		}
		expect(result.data).toMatchSnapshot()
	})
})
