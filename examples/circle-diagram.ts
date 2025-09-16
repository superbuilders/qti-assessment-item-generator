import type { CircleDiagramProps } from "../src/widgets/generators/circle-diagram"

export const circleDiagramExamples: CircleDiagramProps[] = [
	{
		type: "circleDiagram",
		shape: "circle",
		width: 240,
		height: 240,
		radius: 100,
		rotation: 0,
		fillColor: "#00000000",
		strokeColor: "#11accd",
		innerRadius: 60,
		annulusFillColor: "#CCFAFF80",
		segments: [
			{ type: "radius", angle: 0, color: "#11accd", label: "5 cm" },
			{ type: "innerRadius", angle: 90, color: "#1fab54", label: "3 cm" }
		],
		arcs: [],
		sectors: [],
		showCenterDot: false,
		areaLabel: null
	}
]
