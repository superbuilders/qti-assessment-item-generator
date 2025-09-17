import type { CompositeShapeDiagramProps } from "../src/widgets/generators/composite-shape-diagram"

/**
 * Example of a composite shape diagram showing a complex polygon with:
 * - Multiple shaded regions
 * - Internal segments with labels
 * - Right angle markers
 * - Partitioned edges
 *
 * This creates a composite figure that can be used for area calculations
 * where students need to find areas of component parts.
 */
export const compositeShapeExample: CompositeShapeDiagramProps = {
	type: "compositeShapeDiagram",
	width: 520,
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
		{
			type: "simple",
			from: "T",
			to: "L",
			label: { value: 4, unit: "units" }
		},
		{
			type: "simple",
			from: "L",
			to: "BL",
			label: null
		},
		{
			type: "simple",
			from: "BL",
			to: "BR",
			label: null
		},
		{
			type: "simple",
			from: "BR",
			to: "R",
			label: null
		},
		{
			type: "simple",
			from: "R",
			to: "T",
			label: null
		}
	],
	shadedRegions: [
		{
			vertexIds: ["T", "L", "R"],
			fillColor: "#bc26124d"
		},
		{
			vertexIds: ["L", "BL", "H1"],
			fillColor: "#e07d104d"
		},
		{
			vertexIds: ["H1", "BL", "BR", "H2"],
			fillColor: "#ca337c4d"
		},
		{
			vertexIds: ["H2", "BR", "R"],
			fillColor: "#01a9954d"
		}
	],
	internalSegments: [
		{
			fromVertexId: "L",
			toVertexId: "H1",
			style: "dashed",
			label: { value: 2, unit: "units" }
		},
		{
			fromVertexId: "H1",
			toVertexId: "H2",
			style: "dashed",
			label: { value: 2, unit: "units" }
		},
		{
			fromVertexId: "H2",
			toVertexId: "R",
			style: "dashed",
			label: { value: 6, unit: "units" }
		},
		{
			fromVertexId: "H1",
			toVertexId: "BL",
			style: "dashed",
			label: { value: 2, unit: "units" }
		},
		{
			fromVertexId: "H2",
			toVertexId: "BR",
			style: "dashed",
			label: { value: 2, unit: "units" }
		}
	],
	rightAngleMarkers: [
		{
			cornerVertexId: "L",
			adjacentVertex1Id: "T",
			adjacentVertex2Id: "H1"
		},
		{
			cornerVertexId: "H1",
			adjacentVertex1Id: "L",
			adjacentVertex2Id: "BL"
		},
		{
			cornerVertexId: "H2",
			adjacentVertex1Id: "R",
			adjacentVertex2Id: "BR"
		}
	]
}

/**
 * Example of a circle with an inscribed rectangle showing shaded regions
 * Demonstrates how to approximate circular shapes using many vertices
 */
export const circleWithRectangleExample: CompositeShapeDiagramProps = {
	type: "compositeShapeDiagram",
	width: 400,
	height: 400,
	vertices: [
		// Center and rectangle vertices
		{ x: 0, y: 0, id: "O" },
		{ x: -20, y: -30, id: "R1" },
		{ x: 20, y: -30, id: "R2" },
		{ x: 20, y: 30, id: "R3" },
		{ x: -20, y: 30, id: "R4" },
		// Circle approximation vertices
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
	boundaryEdges: [
		{
			type: "partitioned",
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
			segments: [
				{ style: "solid", label: null },
				{ style: "solid", label: null },
				{ style: "solid", label: null },
				{ style: "solid", label: null },
				{ style: "solid", label: null },
				{ style: "solid", label: null },
				{ style: "solid", label: null },
				{ style: "solid", label: null },
				{ style: "solid", label: null },
				{ style: "solid", label: null },
				{ style: "solid", label: null },
				{ style: "solid", label: null },
				{ style: "solid", label: null },
				{ style: "solid", label: null },
				{ style: "solid", label: null },
				{ style: "solid", label: null }
			]
		}
	],
	shadedRegions: [
		{
			vertexIds: ["C0", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10", "C11", "C12", "C13", "C14", "C15"],
			fillColor: "#ccfaff80"
		},
		{
			vertexIds: ["R1", "R2", "R3", "R4"],
			fillColor: "#ffffff"
		}
	],
	internalSegments: [
		{
			fromVertexId: "O",
			toVertexId: "C0",
			style: "solid",
			label: { value: 11, unit: "cm" }
		},
		{
			fromVertexId: "R1",
			toVertexId: "R2",
			style: "solid",
			label: { value: 4, unit: "cm" }
		},
		{
			fromVertexId: "R2",
			toVertexId: "R3",
			style: "solid",
			label: { value: 6, unit: "cm" }
		},
		{
			fromVertexId: "R3",
			toVertexId: "R4",
			style: "solid",
			label: null
		},
		{
			fromVertexId: "R4",
			toVertexId: "R1",
			style: "solid",
			label: null
		}
	],
	rightAngleMarkers: null,
	regionLabels: null
}
