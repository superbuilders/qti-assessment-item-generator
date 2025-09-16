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
			{ type: "whole", position: 80, color: "#1E40AF", style: "dot", value: 80, sign: "+" },
			{ type: "whole", position: 125, color: "#1E40AF", style: "dot", value: 125, sign: "+" },
			{ type: "mathml", position: 60, color: "#111111", style: "dot", mathml: "<mo>?</mo>" }
		]
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
		]
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
		]
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
		]
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
		]
	}
]
