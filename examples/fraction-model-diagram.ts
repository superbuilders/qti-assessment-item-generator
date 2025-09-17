import type { FractionModelDiagramProps } from "../src/widgets/generators/fractional-model-diagram"

export const fractionModelDiagramExamples: FractionModelDiagramProps[] = [
	{
		type: "fractionModelDiagram",
		width: 400,
		height: 300,
		shapeType: "circle",
		shapes: [
			{
				numerator: 3,
				denominator: 4,
				color: "#4285F4"
			},
			{
				numerator: 1,
				denominator: 4,
				color: "#FF6B6B"
			}
		],
		operators: ["="]
	},
	{
		type: "fractionModelDiagram",
		width: 500,
		height: 300,
		shapeType: "box",
		shapes: [
			{
				numerator: 2,
				denominator: 3,
				color: "#34A853"
			},
			{
				numerator: 4,
				denominator: 6,
				color: "#FFD93D"
			}
		],
		operators: ["="]
	},
	{
		type: "fractionModelDiagram",
		width: 500,
		height: 300,
		shapeType: "polygon",
		shapes: [
			{
				numerator: 1,
				denominator: 3,
				color: "#9C27B0"
			},
			{
				numerator: 1,
				denominator: 4,
				color: "#FF5722"
			},
			{
				numerator: 3,
				denominator: 4,
				color: "#607D8B"
			}
		],
		operators: ["+", "="]
	}
]
