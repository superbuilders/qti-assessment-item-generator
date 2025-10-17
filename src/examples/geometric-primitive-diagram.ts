import type { GeometricPrimitiveDiagramProps } from "@/widgets/generators/geometric-primitive-diagram"

export const geometricPrimitiveDiagramExamples: GeometricPrimitiveDiagramProps[] =
	[
		// First Image (Question 6) - slanted segment PS
		{
			type: "geometricPrimitiveDiagram",
			width: 300,
			height: 300,
			primitive: {
				type: "segment",
				pointOne: { label: "P" },
				pointTwo: { label: "S" },
				rotation: -35,
				length: 180
			}
		},
		// First Image (Question 6) - horizontal segment PS from explanation
		{
			type: "geometricPrimitiveDiagram",
			width: 300,
			height: 300,
			primitive: {
				type: "segment",
				pointOne: { label: "P" },
				pointTwo: { label: "S" },
				rotation: 0,
				length: 120
			}
		},
		// Second Image (Question 5) - (a) Point Q
		{
			type: "geometricPrimitiveDiagram",
			width: 300,
			height: 300,
			primitive: {
				type: "point",
				pointOne: { label: "Q" }
			}
		},
		// Second Image (Question 5) - (b) Ray
		{
			type: "geometricPrimitiveDiagram",
			width: 300,
			height: 300,
			primitive: {
				type: "ray",
				pointOne: { label: null },
				pointTwo: { label: null },
				rotation: -115,
				length: 100
			}
		},
		// Second Image (Question 5) - (c) Arc
		{
			type: "geometricPrimitiveDiagram",
			width: 300,
			height: 300,
			primitive: {
				type: "arc",
				pointOne: { label: null },
				pointTwo: { label: null },
				rotation: -20,
				length: 100,
				bulge: 0.6
			}
		},
		// Second Image (Question 5) - (d) Line
		{
			type: "geometricPrimitiveDiagram",
			width: 300,
			height: 300,
			primitive: {
				type: "line",
				pointOne: { label: null },
				pointTwo: { label: null },
				rotation: -120,
				length: 100
			}
		},
		// Second Image (Question 5) - (e) Segment (also used in explanation)
		{
			type: "geometricPrimitiveDiagram",
			width: 300,
			height: 300,
			primitive: {
				type: "segment",
				pointOne: { label: null },
				pointTwo: { label: null },
				rotation: -125,
				length: 120
			}
		}
	]
