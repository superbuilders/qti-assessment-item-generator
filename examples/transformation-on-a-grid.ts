import type { TransformationOnAGridProps } from "../src/widgets/generators/transformation-on-a-grid"

export const transformationOnAGridExamples: TransformationOnAGridProps[] = [
	// Example 1: Dilation on 14x16 grid
	{
		type: "transformationOnAGrid",
		width: 400,
		height: 460, // Adjusted height for 14x16 aspect ratio
		grid: { rows: 14, columns: 16, tickStep: 1 },
		polygons: [
			{
				id: "figure1",
				points: [
					{ x: 2, y: 4, label: "M" },
					{ x: 3, y: 5, label: null },
					{ x: 5, y: 4, label: null },
					{ x: 3, y: 3, label: null }
				],
				fillColor: "#00b3d680",
				strokeColor: "#00b3d6",
				label: "Figure 1"
			},
			{
				id: "figure2",
				points: [
					{ x: 8, y: 7, label: "A" },
					{ x: 10, y: 5, label: "B" },
					{ x: 14, y: 7, label: "C" },
					{ x: 10, y: 9, label: "D" }
				],
				fillColor: "#00800080",
				strokeColor: "#008000",
				label: "Figure 2"
			}
		]
	},
	// Example 2: Translation from user image 2
	{
		type: "transformationOnAGrid",
		width: 400,
		height: 400,
		grid: { rows: 8, columns: 8, tickStep: 1 },
		polygons: [
			{
				id: "original",
				points: [
					{ x: 2, y: 5, label: "A" },
					{ x: 4, y: 4, label: "B" },
					{ x: 3, y: 2, label: "C" },
					{ x: 1, y: 4, label: "D" }
				],
				fillColor: "#80808080",
				strokeColor: "#808080",
				label: null
			},
			{
				id: "translated",
				points: [
					{ x: 5, y: 7, label: "L" },
					{ x: 7, y: 6, label: "M" },
					{ x: 6, y: 4, label: "N" },
					{ x: 4, y: 6, label: "K" }
				],
				fillColor: "#00b3d680",
				strokeColor: "#00b3d6",
				label: null
			}
		]
	},
	// Example 3: Reflection/Rotation from user image 3
	{
		type: "transformationOnAGrid",
		width: 400,
		height: 400,
		grid: { rows: 7, columns: 10, tickStep: 1 },
		polygons: [
			{
				id: "original-triangle",
				points: [
					{ x: 3, y: 4, label: "A" },
					{ x: 6, y: 3, label: "B" },
					{ x: 2, y: 2, label: "C" }
				],
				fillColor: "#80808080",
				strokeColor: "#808080",
				label: null
			},
			{
				id: "transformed-triangle",
				points: [
					{ x: 9, y: 6, label: "M" },
					{ x: 7, y: 4, label: "K" },
					{ x: 8, y: 2, label: "L" }
				],
				fillColor: "#00b3d680",
				strokeColor: "#00b3d6",
				label: null
			}
		]
	}
]
