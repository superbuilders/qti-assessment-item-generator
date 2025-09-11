import type { ProtractorAngleDiagramProps } from "../src/widgets/generators/protractor-angle-diagram"

export const protractorAngleDiagramExamples: ProtractorAngleDiagramProps[] = [
	{
		type: "protractorAngleDiagram",
		width: 400,
		height: 300,
		angle: 45,
		startPointLabel: "A",
		centerPointLabel: "B",
		endPointLabel: "C",
		showAngleLabel: true
	},
	{
		type: "protractorAngleDiagram",
		width: 450,
		height: 350,
		angle: 120,
		startPointLabel: "D",
		centerPointLabel: "E",
		endPointLabel: "F",
		showAngleLabel: true
	},
	{
		type: "protractorAngleDiagram",
		width: 350,
		height: 250,
		angle: 90,
		startPointLabel: "",
		centerPointLabel: "",
		endPointLabel: "",
		showAngleLabel: false
	}
]
