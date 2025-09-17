import type { GeometricSolidDiagramProps } from "../src/widgets/generators/geometric-solid-diagram"

export const geometricSolidDiagramExamples: GeometricSolidDiagramProps[] = [
	// Spheres
	{
		type: "geometricSolidDiagram",
		shape: { type: "sphere", radius: 9 },
		width: 300,
		height: 300,
		labels: [{ text: "9 units", target: "radius" }]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "sphere", radius: 4 },
		width: 300,
		height: 300,
		labels: [{ text: "4 units", target: "radius" }]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "sphere", radius: 0.5 },
		width: 300,
		height: 300,
		labels: [{ text: "r = 1/2 unit", target: "radius" }]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "sphere", radius: 10 },
		width: 300,
		height: 300,
		labels: [{ text: "10 units", target: "radius" }]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "sphere", radius: 0.25 },
		width: 300,
		height: 300,
		labels: [{ text: "r = 1/4 unit", target: "radius" }]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "sphere", radius: 3 },
		width: 300,
		height: 300,
		labels: [{ text: "3 units", target: "radius" }]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "sphere", radius: 2 },
		width: 300,
		height: 300,
		labels: [{ text: "2 units", target: "radius" }]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "sphere", radius: 7 },
		width: 300,
		height: 300,
		labels: [{ text: "7 units", target: "radius" }]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "sphere", radius: 1 },
		width: 300,
		height: 300,
		labels: [{ text: "1 unit", target: "radius" }]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "sphere", radius: 5 },
		width: 300,
		height: 300,
		labels: [{ text: "5 units", target: "radius" }]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "sphere", radius: 6 },
		width: 300,
		height: 300,
		labels: [{ text: "6 units", target: "radius" }]
	},

	// Cones
	{
		type: "geometricSolidDiagram",
		shape: { type: "cone", height: 6, radius: 10 },
		width: 300,
		height: 300,
		labels: [
			{ text: "10 units", target: "radius" },
			{ text: "6 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cone", height: 10, radius: 4 },
		width: 300,
		height: 300,
		labels: [
			{ text: "4 units", target: "radius" },
			{ text: "10 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cone", height: 9, radius: 2 },
		width: 300,
		height: 300,
		labels: [
			{ text: "2 units", target: "radius" },
			{ text: "9 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cone", height: 8, radius: 6 },
		width: 300,
		height: 300,
		labels: [
			{ text: "6 units", target: "radius" },
			{ text: "8 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cone", height: 6, radius: 5 },
		width: 300,
		height: 300,
		labels: [
			{ text: "5 units", target: "radius" },
			{ text: "6 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cone", height: 5, radius: 5 },
		width: 300,
		height: 300,
		labels: [
			{ text: "5 units", target: "radius" },
			{ text: "5 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cone", height: 3, radius: 5 },
		width: 300,
		height: 300,
		labels: [
			{ text: "5 units", target: "radius" },
			{ text: "3 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cone", height: 7, radius: 7 },
		width: 300,
		height: 300,
		labels: [
			{ text: "7 units", target: "radius" },
			{ text: "7 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cone", height: 5, radius: 2 },
		width: 300,
		height: 300,
		labels: [
			{ text: "2 units", target: "radius" },
			{ text: "5 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cone", height: 4, radius: 6 },
		width: 300,
		height: 300,
		labels: [
			{ text: "6 units", target: "radius" },
			{ text: "4 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cone", height: 2, radius: 3 },
		width: 300,
		height: 300,
		labels: [
			{ text: "3 units", target: "radius" },
			{ text: "2 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cone", height: 4, radius: 3 },
		width: 300,
		height: 300,
		labels: [
			{ text: "3 units", target: "radius" },
			{ text: "4 units", target: "height" }
		]
	},

	// Cylinders
	{
		type: "geometricSolidDiagram",
		shape: { type: "cylinder", height: 6, radius: 8 },
		width: 300,
		height: 300,
		labels: [
			{ text: "8 units", target: "radius" },
			{ text: "6 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cylinder", height: 2, radius: 3 },
		width: 300,
		height: 300,
		labels: [
			{ text: "3 units", target: "radius" },
			{ text: "2 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cylinder", height: 8, radius: 4 },
		width: 300,
		height: 300,
		labels: [
			{ text: "4 units", target: "radius" },
			{ text: "8 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cylinder", height: 4, radius: 6 },
		width: 300,
		height: 300,
		labels: [
			{ text: "6 units", target: "radius" },
			{ text: "4 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cylinder", height: 3, radius: 5 },
		width: 300,
		height: 300,
		labels: [
			{ text: "5 units", target: "radius" },
			{ text: "3 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cylinder", height: 8, radius: 2 },
		width: 300,
		height: 300,
		labels: [
			{ text: "2 units", target: "radius" },
			{ text: "8 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cylinder", height: 10, radius: 4 },
		width: 300,
		height: 300,
		labels: [
			{ text: "4 units", target: "radius" },
			{ text: "10 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cylinder", height: 6, radius: 3 },
		width: 300,
		height: 300,
		labels: [
			{ text: "3 units", target: "radius" },
			{ text: "6 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cylinder", height: 5, radius: 2 },
		width: 300,
		height: 300,
		labels: [
			{ text: "2 units", target: "radius" },
			{ text: "5 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cylinder", height: 10, radius: 4 },
		width: 300,
		height: 300,
		labels: [
			{ text: "4 units", target: "radius" },
			{ text: "10 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cylinder", height: 6, radius: 5 },
		width: 300,
		height: 300,
		labels: [
			{ text: "5 units", target: "radius" },
			{ text: "6 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cylinder", height: 3, radius: 4 },
		width: 300,
		height: 300,
		labels: [
			{ text: "4 units", target: "radius" },
			{ text: "3 units", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cylinder", height: 20, radius: 4 },
		width: 300,
		height: 300,
		labels: [
			{ text: "4 cm", target: "radius" },
			{ text: "20 cm", target: "height" }
		]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cylinder", height: 20, radius: 10 },
		width: 300,
		height: 300,
		labels: [
			{ text: "10 inches", target: "radius" },
			{ text: "20 inches", target: "height" }
		]
	},

	// Additional extracted-like coverage: unlabeled identification and varied sizes
	// Spheres (unlabeled and varied canvas sizes)
	{
		type: "geometricSolidDiagram",
		shape: { type: "sphere", radius: 8 },
		width: 300,
		height: 300,
		labels: [{ text: "8 units", target: "radius" }]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "sphere", radius: 15 },
		width: 300,
		height: 300,
		labels: [{ text: "15 cm", target: "radius" }]
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "sphere", radius: 5 },
		width: 300,
		height: 300,
		labels: []
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "sphere", radius: 5 },
		width: 300,
		height: 300,
		labels: []
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "sphere", radius: 45.455 },
		width: 300,
		height: 300,
		labels: []
	},

	// Cones (unlabeled identification)
	{
		type: "geometricSolidDiagram",
		shape: { type: "cone", height: 15, radius: 6 },
		width: 300,
		height: 300,
		labels: []
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cone", height: 5, radius: 8 },
		width: 300,
		height: 300,
		labels: []
	},

	// Cylinders (unlabeled identification and special sizes)
	{
		type: "geometricSolidDiagram",
		shape: { type: "cylinder", height: 12, radius: 4 },
		width: 300,
		height: 300,
		labels: []
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cylinder", height: 24, radius: 8 },
		width: 300,
		height: 300,
		labels: []
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cylinder", height: 3, radius: 6 },
		width: 300,
		height: 300,
		labels: []
	},
	{
		type: "geometricSolidDiagram",
		shape: { type: "cylinder", height: 2, radius: 4 },
		width: 300,
		height: 300,
		labels: [
			{ text: "4 feet", target: "radius" },
			{ text: "2 feet", target: "height" }
		]
	}
	]
