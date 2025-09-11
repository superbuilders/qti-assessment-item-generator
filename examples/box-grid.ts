import type { BoxGridProps } from "../src/widgets/generators/box-grid"

export const boxGridExamples: BoxGridProps[] = [
	{
		type: "boxGrid",
		width: 300,
		height: 200,
		data: [
			[
				{
					content: { type: "text", content: "1" },
					backgroundColor: "#FFE5B4"
				},
				{
					content: { type: "text", content: "2" },
					backgroundColor: null
				},
				{
					content: { type: "text", content: "3" },
					backgroundColor: "#B4E5FF"
				},
				{
					content: { type: "text", content: "4" },
					backgroundColor: null
				}
			],
			[
				{
					content: { type: "text", content: "5" },
					backgroundColor: null
				},
				{
					content: { type: "text", content: "6" },
					backgroundColor: "#FFB4E5"
				},
				{
					content: { type: "text", content: "7" },
					backgroundColor: null
				},
				{
					content: { type: "text", content: "8" },
					backgroundColor: "#B4FFE5"
				}
			],
			[
				{
					content: { type: "text", content: "9" },
					backgroundColor: null
				},
				{
					content: { type: "text", content: "10" },
					backgroundColor: "#E5B4FF"
				},
				{
					content: { type: "text", content: "11" },
					backgroundColor: null
				},
				{
					content: { type: "text", content: "12" },
					backgroundColor: "#FFE5B4"
				}
			]
		],
		showGridLines: true
	},
	{
		type: "boxGrid",
		width: 250,
		height: 150,
		data: [
			[
				{
					content: { type: "math", mathml: "<mn>2</mn><mo>+</mo><mn>3</mn>" },
					backgroundColor: "#4285F4"
				},
				{
					content: { type: "text", content: "=" },
					backgroundColor: null
				},
				{
					content: { type: "text", content: "5" },
					backgroundColor: "#34A853"
				}
			],
			[
				{
					content: { type: "math", mathml: "<mn>4</mn><mo>×</mo><mn>6</mn>" },
					backgroundColor: "#FF6B6B"
				},
				{
					content: { type: "text", content: "=" },
					backgroundColor: null
				},
				{
					content: { type: "text", content: "24" },
					backgroundColor: "#FFD93D"
				}
			]
		],
		showGridLines: true
	}
]
