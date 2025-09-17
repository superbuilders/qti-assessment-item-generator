import type { TapeDiagramProps } from "../src/widgets/generators/tape-diagram"

export const tapeDiagramExamples: TapeDiagramProps[] = [
	// Example 1: Classic additive model with proportional comparison
	{
		type: "tapeDiagram",
		width: 600,
		height: 250,
		referenceUnitsTotal: 35,
		topTape: {
			label: "Total",
			unitsTotal: 35,
			extent: null,
			grid: { show: false, strokeWidth: null },
			roundedCaps: null,
			defaultStroke: "#000000",
			defaultStrokeWidth: 1.5,
			fills: [
				{
					span: { by: "units", startUnit: 0, endUnit: 15 },
					style: { kind: "solid", fill: "#4285F4", fillOpacity: null },
					label: { text: "15", placement: "inside" }
				},
				{
					span: { by: "units", startUnit: 15, endUnit: 27 },
					style: { kind: "solid", fill: "#0F9D58", fillOpacity: null },
					label: { text: "12", placement: "inside" }
				},
				{
					span: { by: "units", startUnit: 27, endUnit: 35 },
					style: { kind: "solid", fill: "#F4B400", fillOpacity: null },
					label: { text: "8", placement: "inside" }
				}
			]
		},
		bottomTape: {
			label: "Parts",
			unitsTotal: 35,
			extent: null,
			grid: { show: false, strokeWidth: null },
			roundedCaps: null,
			defaultStroke: "#000000",
			defaultStrokeWidth: 1.5,
			fills: [
				{
					span: { by: "units", startUnit: 0, endUnit: 15 },
					style: { kind: "solid", fill: "#34A853", fillOpacity: null },
					label: { text: "Part A", placement: "inside" }
				},
				{
					span: { by: "units", startUnit: 15, endUnit: 27 },
					style: { kind: "solid", fill: "#34A853", fillOpacity: null },
					label: { text: "Part B", placement: "inside" }
				},
				{
					span: { by: "units", startUnit: 27, endUnit: 35 },
					style: { kind: "solid", fill: "#34A853", fillOpacity: null },
					label: { text: "Part C", placement: "inside" }
				}
			]
		},
		brackets: [
			{
				tape: "top",
				span: { by: "units", startUnit: 0, endUnit: 35 },
				labelTop: "35",
				labelBottom: null,
				style: { kind: "straight", stroke: null, strokeWidth: null }
			}
		]
	},
	// Example 2: Percentage representation with unit grid
	{
		type: "tapeDiagram",
		width: 500,
		height: 180,
		referenceUnitsTotal: null,
		topTape: {
			label: "Value",
			unitsTotal: 10,
			extent: null,
			grid: { show: true, strokeWidth: 1 },
			roundedCaps: null,
			defaultStroke: "#000000",
			defaultStrokeWidth: 2,
			fills: [
				{
					span: { by: "units", startUnit: 0, endUnit: 7 },
					style: { kind: "solid", fill: "#7854ab", fillOpacity: null },
					label: null
				}
			]
		},
		bottomTape: null,
		brackets: [
			{
				tape: "top",
				span: { by: "units", startUnit: 0, endUnit: 7 },
				labelTop: "91",
				labelBottom: "70%",
				style: { kind: "curly", stroke: null, strokeWidth: null }
			}
		]
	},
	// Example 3: Comparative quantities with different extents
	{
		type: "tapeDiagram",
		width: 400,
		height: 200,
		referenceUnitsTotal: 7,
		topTape: {
			label: "Sarah's Money",
			unitsTotal: 7,
			extent: { by: "units", startUnit: 0, endUnit: 7 },
			grid: { show: false, strokeWidth: null },
			roundedCaps: null,
			defaultStroke: "#000000",
			defaultStrokeWidth: 1.5,
			fills: [
				{
					span: { by: "units", startUnit: 0, endUnit: 4 },
					style: { kind: "solid", fill: "#FF6B6B", fillOpacity: null },
					label: { text: "$20", placement: "inside" }
				},
				{
					span: { by: "units", startUnit: 4, endUnit: 7 },
					style: { kind: "solid", fill: "#FF6B6B", fillOpacity: 0.7 },
					label: { text: "$15", placement: "inside" }
				}
			]
		},
		bottomTape: {
			label: "Tom's Money",
			unitsTotal: 2,
			extent: { by: "units", startUnit: 0, endUnit: 2 },
			grid: { show: false, strokeWidth: null },
			roundedCaps: null,
			defaultStroke: "#000000",
			defaultStrokeWidth: 1.5,
			fills: [
				{
					span: { by: "units", startUnit: 0, endUnit: 2 },
					style: { kind: "solid", fill: "#FFD93D", fillOpacity: null },
					label: { text: "?", placement: "inside" }
				}
			]
		},
		brackets: []
	},
	// Example 4: Mixed filled and unfilled regions
	{
		type: "tapeDiagram",
		width: 600,
		height: 150,
		referenceUnitsTotal: null,
		topTape: {
			label: "Container",
			unitsTotal: 12,
			extent: null,
			grid: { show: true, strokeWidth: 1 },
			roundedCaps: true,
			defaultStroke: "#000000",
			defaultStrokeWidth: 2,
			fills: [
				{
					span: { by: "units", startUnit: 0, endUnit: 8 },
					style: { kind: "solid", fill: "#2196F3", fillOpacity: null },
					label: { text: "Filled", placement: "above" }
				},
				{
					span: { by: "units", startUnit: 8, endUnit: 12 },
					style: { kind: "outline", stroke: "#666666", strokeWidth: 2 },
					label: { text: "Empty", placement: "above" }
				}
			]
		},
		bottomTape: null,
		brackets: [
			{
				tape: "top",
				span: { by: "percent", startPct: 0, endPct: 66.67 },
				labelTop: "8 L",
				labelBottom: "2/3",
				style: { kind: "straight", stroke: null, strokeWidth: null }
			}
		]
	}
,
	// Example 5: Canonical percent tape (10 units, first 7 shaded) with straight brackets
	{
		type: "tapeDiagram",
		width: 680,
		height: 180,
		referenceUnitsTotal: null,
		topTape: {
			label: null,
			unitsTotal: 10,
			extent: null,
			grid: { show: true, strokeWidth: 1 },
			roundedCaps: true,
			defaultStroke: "#000000",
			defaultStrokeWidth: 2,
			fills: [
				{
					span: { by: "units", startUnit: 0, endUnit: 7 },
					style: { kind: "solid", fill: "#7854ab", fillOpacity: null },
					label: null
				}
			]
		},
		bottomTape: null,
		brackets: [
			{
				tape: "top",
				span: { by: "units", startUnit: 0, endUnit: 7 },
				labelTop: "91",
				labelBottom: "70%",
				style: { kind: "straight", stroke: null, strokeWidth: null }
			}
		]
	}
]