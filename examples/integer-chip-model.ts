import type { IntegerChipModelProps } from "../src/widgets/generators/integer-chip-model"

export const integerChipModelExamples: IntegerChipModelProps[] = [
	// Basic positive chips
	{
		type: "integerChipModel",
		width: 300,
		height: 150,
		showLegend: false,
		chips: [
			{ sign: "plus", crossedOut: false },
			{ sign: "plus", crossedOut: false },
			{ sign: "plus", crossedOut: false },
			{ sign: "plus", crossedOut: false },
			{ sign: "plus", crossedOut: false }
		]
	},
	// Mixed layout with legend
	{
		type: "integerChipModel",
		width: 320,
		height: 180,
		showLegend: true,
		chips: [
			{ sign: "minus", crossedOut: false },
			{ sign: "minus", crossedOut: false },
			{ sign: "minus", crossedOut: false },
			{ sign: "plus", crossedOut: false },
			{ sign: "plus", crossedOut: false },
			{ sign: "plus", crossedOut: false }
		]
	},
	// Crossed-out chips demonstrating zero pairs
	{
		type: "integerChipModel",
		width: 280,
		height: 160,
		showLegend: false,
		chips: [
			{ sign: "plus", crossedOut: false },
			{ sign: "plus", crossedOut: false },
			{ sign: "plus", crossedOut: false },
			{ sign: "plus", crossedOut: false },
			{ sign: "plus", crossedOut: false },
			{ sign: "minus", crossedOut: true },
			{ sign: "plus", crossedOut: true },
			{ sign: "minus", crossedOut: false }
		]
	},
	// All negative chips
	{
		type: "integerChipModel",
		width: 220,
		height: 220,
		showLegend: false,
		chips: [
			{ sign: "minus", crossedOut: false },
			{ sign: "minus", crossedOut: false },
			{ sign: "minus", crossedOut: false },
			{ sign: "minus", crossedOut: false },
			{ sign: "minus", crossedOut: false },
			{ sign: "minus", crossedOut: false },
			{ sign: "minus", crossedOut: false },
			{ sign: "minus", crossedOut: false },
			{ sign: "minus", crossedOut: false },
			{ sign: "minus", crossedOut: false }
		]
	},
	// Complex mixed layout with crossed-out pairs and legend
	{
		type: "integerChipModel",
		width: 360,
		height: 200,
		showLegend: true,
		chips: [
			{ sign: "plus", crossedOut: false },
			{ sign: "plus", crossedOut: false },
			{ sign: "plus", crossedOut: false },
			{ sign: "minus", crossedOut: true },
			{ sign: "plus", crossedOut: true },
			{ sign: "minus", crossedOut: false },
			{ sign: "minus", crossedOut: false },
			{ sign: "minus", crossedOut: false },
			{ sign: "minus", crossedOut: false },
			{ sign: "minus", crossedOut: true },
			{ sign: "plus", crossedOut: true },
			{ sign: "plus", crossedOut: false },
			{ sign: "plus", crossedOut: false },
			{ sign: "plus", crossedOut: false }
		]
	}
]
