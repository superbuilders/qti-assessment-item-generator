import type { TapeDiagramProps } from "../src/widgets/generators/tape-diagram"

export const tapeDiagramExamples: TapeDiagramProps[] = [
	{
		type: "tapeDiagram",
		width: 500,
		height: 200,
		modelType: "additive",
		topTape: {
			label: "Total",
			segments: [
				{ label: "15", length: 3 },
				{ label: "12", length: 2.4 },
				{ label: "8", length: 1.6 }
			],
			color: "#4285F4"
		},
		bottomTape: {
			label: "Parts",
			segments: [
				{ label: "Part A", length: 3 },
				{ label: "Part B", length: 2.4 },
				{ label: "Part C", length: 1.6 }
			],
			color: "#34A853"
		},
		showTotalBracket: true,
		totalLabel: "35"
	},
	{
		type: "tapeDiagram",
		width: 400,
		height: 150,
		modelType: "additive",
		topTape: {
			label: "Sarah's Money",
			segments: [
				{ label: "$20", length: 4 },
				{ label: "$15", length: 3 }
			],
			color: "#FF6B6B"
		},
		bottomTape: {
			label: "Tom's Money",
			segments: [
				{ label: "?", length: 2 }
			],
			color: "#FFD93D"
		},
		showTotalBracket: false,
		totalLabel: null
	}
]
