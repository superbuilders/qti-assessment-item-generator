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
				type: "value",
				value: 3,
				color: "#4285F4",
				style: "arrowAndDot",
				label: "3"
			},
			{
				type: "value",
				value: 7.5,
				color: "#FF6B6B",
				style: "dot",
				label: "7.5"
			}
		]
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
				type: "value",
				value: -2,
				color: "#34A853",
				style: "arrowAndDot",
				label: "-2"
			},
			{
				type: "value",
				value: 4,
				color: "#FF6B6B",
				style: "arrowAndDot",
				label: "4"
			}
		]
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
			{ type: "value", value: 80, color: "#1E40AF", style: "dot", label: null },
			{ type: "value", value: 125, color: "#1E40AF", style: "dot", label: "125" },
			{ type: "unknown", value: 60, color: "#111111", style: "box", label: null }
		]
	}
]
