import type { IntegerChipModelProps } from "../src/widgets/generators/integer-chip-model"

export const integerChipModelExamples: IntegerChipModelProps[] = [
	{
		type: "integerChipModel",
		width: 300,
		height: 150,
		chipGroups: [{ count: 5, sign: "plus" }]
	},
	{
		type: "integerChipModel",
		width: 320,
		height: 180,
		chipGroups: [
			{ count: 3, sign: "minus" },
			{ count: 3, sign: "plus" }
		]
	},
	{
		type: "integerChipModel",
		width: 280,
		height: 160,
		chipGroups: [
			{ count: 8, sign: "plus" },
			{ count: 2, sign: "minus" }
		]
	},
	{
		type: "integerChipModel",
		width: 220,
		height: 220,
		chipGroups: [{ count: 10, sign: "minus" }]
	},
	{
		type: "integerChipModel",
		width: 360,
		height: 200,
		chipGroups: [
			{ count: 7, sign: "plus" },
			{ count: 7, sign: "minus" },
			{ count: 4, sign: "plus" }
		]
	}
]
