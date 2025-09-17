import type { NumberLineProps } from "../src/widgets/generators/number-line"

export const numberLineExamples: NumberLineProps[] = [
	{
		type: "numberLine",
		width: 500,
		height: 120,
		orientation: "horizontal",
		min: 0,
		max: 10,
		tickInterval: { type: "whole", interval: 1 },
		secondaryTickInterval: null,
		showTickLabels: true,
		highlightedPoints: [
			{
				type: "whole",
				position: 3,
				color: "#4285F4",
				style: "dot",
				value: 3,
				sign: "+"
			},
			{
				type: "mixed",
				position: 7.5,
				color: "#FF6B6B",
				style: "dot",
				whole: 7,
				numerator: 1,
				denominator: 2,
				sign: "+"
			}
		],
		segments: null,
		model: null
	},
	{
		type: "numberLine",
		width: 400,
		height: 100,
		orientation: "horizontal",
		min: -5,
		max: 5,
		tickInterval: { type: "whole", interval: 1 },
		secondaryTickInterval: null,
		showTickLabels: true,
		highlightedPoints: [
			{
				type: "whole",
				position: -2,
				color: "#34A853",
				style: "dot",
				value: 2,
				sign: "-"
			},
			{
				type: "whole",
				position: 4,
				color: "#FF6B6B",
				style: "dot",
				value: 4,
				sign: "+"
			}
		],
		segments: null,
		model: null
	},
	// Example mirroring the provided diagram: two blue dots and an unknown box, label 125 on right dot
	{
		type: "numberLine",
		width: 520,
		height: 120,
		orientation: "horizontal",
		min: 0,
		max: 200,
		tickInterval: { type: "whole", interval: 25 },
		secondaryTickInterval: { type: "whole", interval: 5 },
		showTickLabels: false,
		highlightedPoints: [
			{ type: "whole", position: 80, color: "#1E40AF", style: "dot", value: 80, sign: "+" },
			{ type: "whole", position: 125, color: "#1E40AF", style: "dot", value: 125, sign: "+" },
			{ type: "mathml", position: 60, color: "#111111", style: "dot", mathml: "<mo>?</mo>" }
		],
		segments: null,
		model: null
	},
	// Example: labeled variables s, t, u at -8.5, -6.5, -5 respectively with halves as minor ticks
	{
		type: "numberLine",
		width: 800,
		height: 140,
		orientation: "horizontal",
		min: -9,
		max: -4,
		tickInterval: { type: "whole", interval: 1 },
		secondaryTickInterval: { type: "fraction", denominator: 2 },
		showTickLabels: true,
		highlightedPoints: [
			{ type: "mathml", position: -8.5, color: "#5B8FF9", style: "dot", mathml: "<mi>s</mi>" },
			{ type: "mathml", position: -6.5, color: "#5B8FF9", style: "dot", mathml: "<mi>t</mi>" },
			{ type: "mathml", position: -5, color: "#5B8FF9", style: "dot", mathml: "<mi>u</mi>" }
		],
		segments: null,
		model: null
	},
	// Example: single variable a to the left of 0 (variant 1)
	{
		type: "numberLine",
		width: 900,
		height: 140,
		orientation: "horizontal",
		min: -6,
		max: 6,
		tickInterval: { type: "whole", interval: 1 },
		secondaryTickInterval: null,
		showTickLabels: true,
		highlightedPoints: [
			{ type: "mathml", position: -3, color: "#5B8FF9", style: "dot", mathml: "<mi>a</mi>" }
		],
		segments: null,
		model: null
	},
	// Example: single variable a to the left of 0 (variant 2)
	{
		type: "numberLine",
		width: 900,
		height: 180,
		orientation: "horizontal",
		min: -6,
		max: 6,
		tickInterval: { type: "whole", interval: 1 },
		secondaryTickInterval: null,
		showTickLabels: true,
		highlightedPoints: [
			{ type: "mathml", position: -2, color: "#5B8FF9", style: "dot", mathml: "<mi>a</mi>" }
		],
		segments: null,
		model: null
	},
	// Example: fractional points -5/2 and 2/3 with distinct colors
	{
		type: "numberLine",
		width: 900,
		height: 220,
		orientation: "horizontal",
		min: -5,
		max: 2,
		tickInterval: { type: "whole", interval: 1 },
		secondaryTickInterval: null,
		showTickLabels: true,
		highlightedPoints: [
			{ type: "fraction", position: -2.5, color: "#D946EF", style: "dot", numerator: 5, denominator: 2, sign: "-" },
			{ type: "fraction", position: -2/3, color: "#7C3AED", style: "dot", numerator: 2, denominator: 3, sign: "+" }
		],
		segments: null,
		model: null
	},
	// New: Thirds with labeled points a, b, c
	{
		type: "numberLine",
		width: 700,
		height: 160,
		orientation: "horizontal",
		min: -2/3,
		max: 1/3,
		tickInterval: { type: "fraction", denominator: 3 },
		secondaryTickInterval: null,
		showTickLabels: true,
		highlightedPoints: [
			{ type: "mathml", position: -0.5, color: "#2CA6DF", style: "dot", mathml: "<mi>a</mi>" },
			{ type: "mathml", position: -0.28, color: "#C2185B", style: "dot", mathml: "<mi>b</mi>" },
			{ type: "mathml", position: -0.2, color: "#2E7D32", style: "dot", mathml: "<mi>c</mi>" }
		],
		segments: null,
		model: null
	},
	// New: Thirds with model bar of 5 cells and segment from 0 to 1
	{
		type: "numberLine",
		width: 720,
		height: 200,
		orientation: "horizontal",
		min: 0,
		max: 5/3,
		tickInterval: { type: "fraction", denominator: 3 },
		secondaryTickInterval: null,
		showTickLabels: true,
		highlightedPoints: null,
		segments: [
			{ start: 0, end: 1, color: "#6EC6FF" }
		],
		model: {
			totalCells: 5,
			cellGroups: [
				{ count: 3, color: "#A7D8EB" }
			],
			bracketLabel: ""
		}
	},
	// New: Halves across 0..5 with 10-cell model and segment 0..1
	{
		type: "numberLine",
		width: 720,
		height: 200,
		orientation: "horizontal",
		min: 0,
		max: 5,
		tickInterval: { type: "fraction", denominator: 2 },
		secondaryTickInterval: null,
		showTickLabels: true,
		highlightedPoints: null,
		segments: [
			{ start: 0, end: 1, color: "#6EC6FF" }
		],
		model: {
			totalCells: 10,
			cellGroups: [
				{ count: 3, color: "#A7D8EB" }
			],
			bracketLabel: ""
		}
	},
	// New: Fifths across 0..2 with 10-cell model and segment 0..1
	{
		type: "numberLine",
		width: 720,
		height: 200,
		orientation: "horizontal",
		min: 0,
		max: 2,
		tickInterval: { type: "fraction", denominator: 5 },
		secondaryTickInterval: null,
		showTickLabels: true,
		highlightedPoints: null,
		segments: [
			{ start: 0, end: 1, color: "#6EC6FF" }
		],
		model: {
			totalCells: 10,
			cellGroups: [
				{ count: 6, color: "#A7D8EB" }
			],
			bracketLabel: ""
		}
	}
]
