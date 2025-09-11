import type { NumberLineProps } from "../src/widgets/generators/number-line"

export const numberLineExamples: NumberLineProps[] = [
	{
		type: "numberLine",
		width: 500,
		height: 120,
		min: 0,
		max: 10,
		tickInterval: { type: "whole", interval: 1 },
		highlightedPoints: [
			{
				value: 3,
				color: "#4285F4",
				style: "arrowAndDot",
				label: "3"
			},
			{
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
		min: -5,
		max: 5,
		tickInterval: { type: "whole", interval: 1 },
		highlightedPoints: [
			{
				value: -2,
				color: "#34A853",
				style: "arrowAndDot",
				label: "-2"
			},
			{
				value: 4,
				color: "#FF6B6B",
				style: "arrowAndDot",
				label: "4"
			}
		]
	}
]
