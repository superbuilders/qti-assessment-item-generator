import type { ProtractorAngleDiagramProps } from "../src/widgets/generators/protractor-angle-diagram"

export const protractorAngleDiagramExamples: ProtractorAngleDiagramProps[] = [
	{
		type: "protractorAngleDiagram",
		width: 400,
		height: 300,
		smallerReading: 0,
		largerReading: 45,
		startPointLabel: "A",
		centerPointLabel: "B",
		endPointLabel: "C"
	},
	{
		type: "protractorAngleDiagram",
		width: 450,
		height: 350,
		smallerReading: 0,
		largerReading: 120,
		startPointLabel: "D",
		centerPointLabel: "E",
		endPointLabel: "F"
	},
	// Example showcasing a non-zero starting angle to match a rotated measurement
	{
		type: "protractorAngleDiagram",
		width: 480,
		height: 340,
		smallerReading: 125,
		largerReading: 160,
		startPointLabel: "A",
		centerPointLabel: "B",
		endPointLabel: "C"
	},
	{
		type: "protractorAngleDiagram",
		width: 350,
		height: 250,
		smallerReading: 0,
		largerReading: 90,
		startPointLabel: "",
		centerPointLabel: "",
		endPointLabel: ""
	}
]
