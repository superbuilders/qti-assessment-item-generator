import type { ProtractorAngleDiagramProps } from "../src/widgets/generators/protractor-angle-diagram"

export const protractorAngleDiagramExamples: ProtractorAngleDiagramProps[] = [
	{
		type: "protractorAngleDiagram",
		width: 400,
		height: 300,
		startingReading: 0,
		angleDegrees: 45,
		startPointLabel: "A",
		centerPointLabel: "B",
		endPointLabel: "C"
	},
	{
		type: "protractorAngleDiagram",
		width: 450,
		height: 350,
		startingReading: 0,
		angleDegrees: 120,
		startPointLabel: "D",
		centerPointLabel: "E",
		endPointLabel: "F"
	},
	// Example showcasing a non-zero starting angle to match a rotated measurement
	{
		type: "protractorAngleDiagram",
		width: 480,
		height: 340,
		startingReading: 125,
		angleDegrees: 35,
		startPointLabel: "A",
		centerPointLabel: "B",
		endPointLabel: "C"
	},
	{
		type: "protractorAngleDiagram",
		width: 350,
		height: 300,
		startingReading: 0,
		angleDegrees: 90,
		startPointLabel: "",
		centerPointLabel: "",
		endPointLabel: ""
	}
]
