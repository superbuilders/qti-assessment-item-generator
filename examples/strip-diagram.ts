import type { StripDiagramProps } from "@/widgets/generators/strip-diagram"

export const stripDiagramExamples: StripDiagramProps[] = [
	// Example 1: Simple part-whole model (3 + 4 + 5 = 12)
	{
		type: "stripDiagram",
		width: 500,
		height: 300,
		totalSize: 12,
		topRow: [
			{ size: 3, label: "3" },
			{ size: 4, label: "4" },
			{ size: 5, label: "5" }
		],
		bottomRow: [{ size: 12, label: "12" }]
	},

	// Example 2: Part-whole with variables (x + 5 = 10)
	{
		type: "stripDiagram",
		width: 400,
		height: 300,
		totalSize: 10,
		topRow: [
			{ size: 5, label: "x" },
			{ size: 5, label: "5" }
		],
		bottomRow: [{ size: 10, label: "10" }]
	},

	// Example 3: Equal parts (4 equal sections)
	{
		type: "stripDiagram",
		width: 500,
		height: 300,
		totalSize: 20,
		topRow: [
			{ size: 5, label: "5" },
			{ size: 5, label: "5" },
			{ size: 5, label: "5" },
			{ size: 5, label: "5" }
		],
		bottomRow: [{ size: 20, label: "20" }]
	},

	// Example 4: Comparison model (two rows with different divisions)
	{
		type: "stripDiagram",
		width: 500,
		height: 300,
		totalSize: 24,
		topRow: [
			{ size: 8, label: "8" },
			{ size: 8, label: "8" },
			{ size: 8, label: "8" }
		],
		bottomRow: [
			{ size: 6, label: "6" },
			{ size: 6, label: "6" },
			{ size: 6, label: "6" },
			{ size: 6, label: "6" }
		]
	},

	// Example 5: No labels (showing just proportions)
	{
		type: "stripDiagram",
		width: 500,
		height: 300,
		totalSize: 10,
		topRow: [
			{ size: 7, label: null },
			{ size: 3, label: null }
		],
		bottomRow: [{ size: 10, label: null }]
	},

	// Example 6: Part-whole with mixed labels
	{
		type: "stripDiagram",
		width: 500,
		height: 300,
		totalSize: 15,
		topRow: [
			{ size: 7, label: "Used" },
			{ size: 8, label: "Left" }
		],
		bottomRow: [{ size: 15, label: "Total: 15" }]
	},

	// Example 7: Equation model (3x + 5 = 20)
	{
		type: "stripDiagram",
		width: 500,
		height: 300,
		totalSize: 20,
		topRow: [
			{ size: 5, label: "x" },
			{ size: 5, label: "x" },
			{ size: 5, label: "x" },
			{ size: 5, label: "5" }
		],
		bottomRow: [{ size: 20, label: "20" }]
	},

	// Example 8: Equation model (24 = 4x)
	{
		type: "stripDiagram",
		width: 500,
		height: 300,
		totalSize: 24,
		topRow: [
			{ size: 6, label: "x" },
			{ size: 6, label: "x" },
			{ size: 6, label: "x" },
			{ size: 6, label: "x" }
		],
		bottomRow: [{ size: 24, label: "24" }]
	},

	// Example 9: Equation model (2x + 3 = 15)
	{
		type: "stripDiagram",
		width: 500,
		height: 300,
		totalSize: 15,
		topRow: [
			{ size: 6, label: "x" },
			{ size: 6, label: "x" },
			{ size: 3, label: "3" }
		],
		bottomRow: [{ size: 15, label: "15" }]
	},

	// Example 10: Equation model (5x = 30)
	{
		type: "stripDiagram",
		width: 500,
		height: 300,
		totalSize: 30,
		topRow: [
			{ size: 6, label: "x" },
			{ size: 6, label: "x" },
			{ size: 6, label: "x" },
			{ size: 6, label: "x" },
			{ size: 6, label: "x" }
		],
		bottomRow: [{ size: 30, label: "30" }]
	},

	// Example 11: Equation model with larger constant (4x + 8 = 32)
	{
		type: "stripDiagram",
		width: 500,
		height: 300,
		totalSize: 32,
		topRow: [
			{ size: 6, label: "x" },
			{ size: 6, label: "x" },
			{ size: 6, label: "x" },
			{ size: 6, label: "x" },
			{ size: 8, label: "8" }
		],
		bottomRow: [{ size: 32, label: "32" }]
	}
]

