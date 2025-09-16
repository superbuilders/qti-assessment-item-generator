import type { LineEquationGraphProps } from "../src/widgets/generators/line-equation-graph"

// Valid examples for the Line Equation Graph widget
export const lineEquationGraphExamples: LineEquationGraphProps[] = [
	// Example 1: line "p" with positive slope
	{
		type: "lineEquationGraph",
		width: 500,
		height: 500,
		xAxis: { label: "r", min: -10, max: 10, tickInterval: 1, showGridLines: true },
		yAxis: { label: "y", min: -10, max: 10, tickInterval: 2, showGridLines: true },
		showQuadrantLabels: false,
		lines: [
			{
				id: "line_p",
				equation: { type: "slopeIntercept", slope: 2, yIntercept: 2 },
				color: "#1fb6ff",
				style: "solid",
				label: "p"
			}
		],
		points: []
	},
	// Example 2: line "q" shallow positive slope, negative intercept
	{
		type: "lineEquationGraph",
		width: 500,
		height: 500,
		xAxis: { label: "t", min: -10, max: 10, tickInterval: 1, showGridLines: true },
		yAxis: { label: "y", min: -10, max: 10, tickInterval: 2, showGridLines: true },
		showQuadrantLabels: false,
		lines: [
			{
				id: "line_q",
				equation: { type: "slopeIntercept", slope: 0.75, yIntercept: -6 },
				color: "#14b8a6",
				style: "solid",
				label: "q"
			}
		],
		points: []
	}
]


