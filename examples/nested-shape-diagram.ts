import type { NestedShapeDiagramProps } from "../src/widgets/generators/nested-shape-diagram"

export const nestedShapeDiagramExamples: NestedShapeDiagramProps[] = [
	// Example 1: Area of a shaded region between a circle and a rectangle
	// Question ID: xdd3424e759f98328
	{
		type: "nestedShapeDiagram",
		width: 240,
		height: 240,
		vertices: [
			{ id: "O", x: 0, y: 0 }, // Circle center
			{ id: "C0", x: 110, y: 0 }, // Point on circle for radius label
			{ id: "R1", x: -20, y: -30 }, // Rectangle vertices
			{ id: "R2", x: 20, y: -30 },
			{ id: "R3", x: 20, y: 30 },
			{ id: "R4", x: -20, y: 30 }
		],
		shapes: [
			{ id: "main_circle", type: "circle", centerId: "O", radius: 110 },
			{ id: "inner_rect", type: "polygon", vertexIds: ["R1", "R2", "R3", "R4"] }
		],
		shadedRegions: [
			{
				fillColor: "#ccfaff80",
				path: [
					{ shapeId: "main_circle", pathType: "outer" },
					{ shapeId: "inner_rect", pathType: "inner" } // Creates hole
				]
			}
		],
		internalSegments: [
			{ fromVertexId: "O", toVertexId: "C0", style: "solid", label: { value: 11, unit: "cm" } },
			{ fromVertexId: "R1", toVertexId: "R2", style: "solid", label: { value: 6, unit: "cm" } },
			{ fromVertexId: "R2", toVertexId: "R3", style: "solid", label: null }, // Right edge - no label to avoid clutter
			{ fromVertexId: "R3", toVertexId: "R4", style: "solid", label: null },
			{ fromVertexId: "R4", toVertexId: "R1", style: "solid", label: { value: 4, unit: "cm" } } // Left edge with label
		],
		rightAngleMarkers: null
	},

	// Example 2: Area of a shaded region (circle minus rectangle)
	// Question ID: x9b74005f28d0b824
	{
		type: "nestedShapeDiagram",
		width: 260,
		height: 260,
		vertices: [
			{ id: "C", x: 0, y: 0 }, // Circle center
			{ id: "P0", x: 120, y: 0 }, // Point on circle for radius
			{ id: "R1", x: -25, y: -55 }, // Rectangle vertices
			{ id: "R2", x: 25, y: -55 },
			{ id: "R3", x: 25, y: 55 },
			{ id: "R4", x: -25, y: 55 }
		],
		shapes: [
			{ id: "outer_circle", type: "circle", centerId: "C", radius: 120 },
			{ id: "inner_rect", type: "polygon", vertexIds: ["R1", "R2", "R3", "R4"] }
		],
		shadedRegions: [
			{
				fillColor: "#ccfaff80",
				path: [
					{ shapeId: "outer_circle", pathType: "outer" },
					{ shapeId: "inner_rect", pathType: "inner" }
				]
			}
		],
		internalSegments: [
			{ fromVertexId: "C", toVertexId: "P0", style: "solid", label: { value: 12, unit: "cm" } },
			{ fromVertexId: "R1", toVertexId: "R2", style: "solid", label: { value: 5, unit: "cm" } },
			{ fromVertexId: "R2", toVertexId: "R3", style: "solid", label: null }, // Right edge - no label
			{ fromVertexId: "R3", toVertexId: "R4", style: "solid", label: null },
			{ fromVertexId: "R4", toVertexId: "R1", style: "solid", label: { value: 11, unit: "cm" } } // Left edge with label
		],
		rightAngleMarkers: null
	},

	// Example 3: Area of a shaded region (square minus circle)
	// Question ID: x70ade9874035cc08
	{
		type: "nestedShapeDiagram",
		width: 210,
		height: 175,
		vertices: [
			{ id: "A", x: 35, y: 35 }, // Square vertices
			{ id: "B", x: 140, y: 35 },
			{ id: "C", x: 140, y: 140 },
			{ id: "D", x: 35, y: 140 },
			{ id: "O", x: 87.5, y: 87.5 }, // Circle center
			{ id: "P0", x: 122.5, y: 87.5 } // Point on circle
		],
		shapes: [
			{ id: "outer_square", type: "polygon", vertexIds: ["A", "B", "C", "D"] },
			{ id: "inner_circle", type: "circle", centerId: "O", radius: 35 }
		],
		shadedRegions: [
			{
				fillColor: "#ccfaff80",
				path: [
					{ shapeId: "outer_square", pathType: "outer" },
					{ shapeId: "inner_circle", pathType: "inner" }
				]
			}
		],
		internalSegments: [
			{ fromVertexId: "O", toVertexId: "P0", style: "solid", label: { value: 1, unit: "cm" } },
			{ fromVertexId: "A", toVertexId: "B", style: "solid", label: { value: 3, unit: "cm" } },
			{ fromVertexId: "B", toVertexId: "C", style: "solid", label: { value: 3, unit: "cm" } },
			{ fromVertexId: "C", toVertexId: "D", style: "solid", label: null },
			{ fromVertexId: "D", toVertexId: "A", style: "solid", label: null }
		],
		rightAngleMarkers: [
			{ vertexId: "A", size: 10 },
			{ vertexId: "B", size: 10 },
			{ vertexId: "C", size: 10 },
			{ vertexId: "D", size: 10 }
		]
	},

	// Example 4: Area of a shaded region between a circle and a rectangle
	// Question ID: x7893c043131fd6d6
	{
		type: "nestedShapeDiagram",
		width: 360,
		height: 360,
		vertices: [
			{ id: "O", x: 180, y: 180 }, // Circle center
			{ id: "P0", x: 340, y: 180 }, // Point on circle
			{ id: "A", x: 60, y: 160 }, // Rectangle vertices
			{ id: "B", x: 300, y: 160 },
			{ id: "C", x: 300, y: 200 },
			{ id: "D", x: 60, y: 200 }
		],
		shapes: [
			{ id: "large_circle", type: "circle", centerId: "O", radius: 160 },
			{ id: "horizontal_rect", type: "polygon", vertexIds: ["A", "B", "C", "D"] }
		],
		shadedRegions: [
			{
				fillColor: "#ccfaff80",
				path: [
					{ shapeId: "large_circle", pathType: "outer" },
					{ shapeId: "horizontal_rect", pathType: "inner" }
				]
			}
		],
		internalSegments: [
			{ fromVertexId: "O", toVertexId: "P0", style: "solid", label: { value: 8, unit: "cm" } },
			{ fromVertexId: "A", toVertexId: "B", style: "solid", label: { value: 12, unit: "cm" } },
			{ fromVertexId: "B", toVertexId: "C", style: "solid", label: null },
			{ fromVertexId: "C", toVertexId: "D", style: "solid", label: null },
			{ fromVertexId: "D", toVertexId: "A", style: "solid", label: { value: 2, unit: "cm" } }
		],
		rightAngleMarkers: null
	},

	// Example 5: Area of a shaded region (circle minus rectangle)
	// Question ID: xd8c0fb6d8bfff96e
	{
		type: "nestedShapeDiagram",
		width: 280,
		height: 280,
		vertices: [
			{ id: "O", x: 140, y: 140 }, // Circle center
			{ id: "A", x: 70, y: 90 }, // Rectangle vertices
			{ id: "B", x: 210, y: 90 },
			{ id: "C", x: 210, y: 190 },
			{ id: "D", x: 70, y: 190 },
			{ id: "C0", x: 260, y: 140 } // Point on circle
		],
		shapes: [
			{ id: "main_circle", type: "circle", centerId: "O", radius: 120 },
			{ id: "rect", type: "polygon", vertexIds: ["A", "B", "C", "D"] }
		],
		shadedRegions: [
			{
				fillColor: "#ccfaff",
				path: [
					{ shapeId: "main_circle", pathType: "outer" },
					{ shapeId: "rect", pathType: "inner" }
				]
			}
		],
		internalSegments: [
			{ fromVertexId: "O", toVertexId: "C0", style: "solid", label: { value: 6, unit: "cm" } },
			{ fromVertexId: "A", toVertexId: "B", style: "solid", label: { value: 7, unit: "cm" } },
			{ fromVertexId: "B", toVertexId: "C", style: "solid", label: null },
			{ fromVertexId: "C", toVertexId: "D", style: "solid", label: null },
			{ fromVertexId: "D", toVertexId: "A", style: "solid", label: { value: 5, unit: "cm" } }
		],
		rightAngleMarkers: null
	},

	// Example 6: Area of the shaded region (circle minus rectangle)
	// Question ID: x3a68667079fdffdd
	{
		type: "nestedShapeDiagram",
		width: 200,
		height: 200,
		vertices: [
			{ id: "O", x: 100, y: 100 }, // Circle center
			{ id: "R1", x: 70, y: 80 }, // Rectangle vertices
			{ id: "R2", x: 130, y: 80 },
			{ id: "R3", x: 130, y: 120 },
			{ id: "R4", x: 70, y: 120 },
			{ id: "C0", x: 180, y: 100 } // Point on circle
		],
		shapes: [
			{ id: "circle", type: "circle", centerId: "O", radius: 80 },
			{ id: "rectangle", type: "polygon", vertexIds: ["R1", "R2", "R3", "R4"] }
		],
		shadedRegions: [
			{
				fillColor: "#ccfaff80",
				path: [
					{ shapeId: "circle", pathType: "outer" },
					{ shapeId: "rectangle", pathType: "inner" }
				]
			}
		],
		internalSegments: [
			{ fromVertexId: "O", toVertexId: "C0", style: "solid", label: { value: 4, unit: "cm" } },
			{ fromVertexId: "R1", toVertexId: "R2", style: "solid", label: { value: 3, unit: "cm" } },
			{ fromVertexId: "R2", toVertexId: "R3", style: "solid", label: null },
			{ fromVertexId: "R3", toVertexId: "R4", style: "solid", label: null },
			{ fromVertexId: "R4", toVertexId: "R1", style: "solid", label: { value: 2, unit: "cm" } }
		],
		rightAngleMarkers: null
	},

	// Example 7: Area of the shaded region between a rectangle and a circle
	// Question ID: x55061cb6ed4c4ee5
	{
		type: "nestedShapeDiagram",
		width: 350,
		height: 350,
		vertices: [
			{ id: "A", x: 25, y: 25 }, // Rectangle vertices
			{ id: "B", x: 300, y: 25 },
			{ id: "C", x: 300, y: 325 },
			{ id: "D", x: 25, y: 325 },
			{ id: "O", x: 162.5, y: 175 }, // Circle center
			{ id: "R", x: 187.5, y: 175 } // Point on circle
		],
		shapes: [
			{ id: "rectangle", type: "polygon", vertexIds: ["A", "B", "C", "D"] },
			{ id: "circle", type: "circle", centerId: "O", radius: 25 }
		],
		shadedRegions: [
			{
				fillColor: "#ccfaff80",
				path: [
					{ shapeId: "rectangle", pathType: "outer" },
					{ shapeId: "circle", pathType: "inner" }
				]
			}
		],
		internalSegments: [
			{ fromVertexId: "O", toVertexId: "R", style: "solid", label: { value: 1, unit: "cm" } },
			{ fromVertexId: "A", toVertexId: "B", style: "solid", label: { value: 11, unit: "cm" } },
			{ fromVertexId: "B", toVertexId: "C", style: "solid", label: { value: 12, unit: "cm" } },
			{ fromVertexId: "C", toVertexId: "D", style: "solid", label: null },
			{ fromVertexId: "D", toVertexId: "A", style: "solid", label: null }
		],
		rightAngleMarkers: [
			{ vertexId: "A", size: 10 },
			{ vertexId: "B", size: 10 },
			{ vertexId: "C", size: 10 },
			{ vertexId: "D", size: 10 }
		]
	},

	// Example 8: Area of the shaded region: rectangle minus circle
	// Question ID: xb9a2f2df68f7f278
	{
		type: "nestedShapeDiagram",
		width: 275,
		height: 225,
		vertices: [
			{ id: "R1", x: 25, y: 25 }, // Rectangle vertices
			{ id: "R2", x: 225, y: 25 },
			{ id: "R3", x: 225, y: 200 },
			{ id: "R4", x: 25, y: 200 },
			{ id: "O", x: 125, y: 112.5 }, // Circle center
			{ id: "P0", x: 200, y: 112.5 } // Point on circle
		],
		shapes: [
			{ id: "rect", type: "polygon", vertexIds: ["R1", "R2", "R3", "R4"] },
			{ id: "circle", type: "circle", centerId: "O", radius: 75 }
		],
		shadedRegions: [
			{
				fillColor: "#ccfaff80",
				path: [
					{ shapeId: "rect", pathType: "outer" },
					{ shapeId: "circle", pathType: "inner" }
				]
			}
		],
		internalSegments: [
			{ fromVertexId: "O", toVertexId: "P0", style: "solid", label: { value: 3, unit: "cm" } },
			{ fromVertexId: "R1", toVertexId: "R2", style: "solid", label: { value: 8, unit: "cm" } },
			{ fromVertexId: "R2", toVertexId: "R3", style: "solid", label: { value: 7, unit: "cm" } },
			{ fromVertexId: "R3", toVertexId: "R4", style: "solid", label: null },
			{ fromVertexId: "R4", toVertexId: "R1", style: "solid", label: null }
		],
		rightAngleMarkers: [
			{ vertexId: "R1", size: 10 },
			{ vertexId: "R2", size: 10 },
			{ vertexId: "R3", size: 10 },
			{ vertexId: "R4", size: 10 }
		]
	},

	// Example 9: Area of a shaded region (rectangle with inscribed circle)
	// Question ID: xc12b923ac5d6ad9e
	{
		type: "nestedShapeDiagram",
		width: 210,
		height: 210,
		vertices: [
			{ id: "A", x: 35, y: 35 }, // Rectangle vertices
			{ id: "B", x: 140, y: 35 },
			{ id: "C", x: 140, y: 175 },
			{ id: "D", x: 35, y: 175 },
			{ id: "O", x: 87.5, y: 105 }, // Circle center
			{ id: "R", x: 122.5, y: 105 } // Point on circle
		],
		shapes: [
			{ id: "rectangle", type: "polygon", vertexIds: ["A", "B", "C", "D"] },
			{ id: "circle", type: "circle", centerId: "O", radius: 35 }
		],
		shadedRegions: [
			{
				fillColor: "#ccfaff80",
				path: [
					{ shapeId: "rectangle", pathType: "outer" },
					{ shapeId: "circle", pathType: "inner" }
				]
			}
		],
		internalSegments: [
			{ fromVertexId: "O", toVertexId: "R", style: "solid", label: { value: 1, unit: "cm" } },
			{ fromVertexId: "A", toVertexId: "B", style: "solid", label: { value: 3, unit: "cm" } },
			{ fromVertexId: "B", toVertexId: "C", style: "solid", label: { value: 4, unit: "cm" } },
			{ fromVertexId: "C", toVertexId: "D", style: "solid", label: null },
			{ fromVertexId: "D", toVertexId: "A", style: "solid", label: null }
		],
		rightAngleMarkers: [
			{ vertexId: "A", size: 10 },
			{ vertexId: "B", size: 10 },
			{ vertexId: "C", size: 10 },
			{ vertexId: "D", size: 10 }
		]
	},

	// Example 10: Area of a shaded region: rectangle minus circle
	// Question ID: x9b473530bde85c53
	{
		type: "nestedShapeDiagram",
		width: 350,
		height: 350,
		vertices: [
			{ id: "A", x: 25, y: 25 }, // Rectangle vertices
			{ id: "B", x: 300, y: 25 },
			{ id: "C", x: 300, y: 325 },
			{ id: "D", x: 25, y: 325 },
			{ id: "O", x: 162.5, y: 175 }, // Circle center
			{ id: "R", x: 212.5, y: 175 } // Point on circle
		],
		shapes: [
			{ id: "rectangle", type: "polygon", vertexIds: ["A", "B", "C", "D"] },
			{ id: "circle", type: "circle", centerId: "O", radius: 50 }
		],
		shadedRegions: [
			{
				fillColor: "#ccfaff80",
				path: [
					{ shapeId: "rectangle", pathType: "outer" },
					{ shapeId: "circle", pathType: "inner" }
				]
			}
		],
		internalSegments: [
			{ fromVertexId: "O", toVertexId: "R", style: "solid", label: { value: 2, unit: "cm" } },
			{ fromVertexId: "A", toVertexId: "B", style: "solid", label: { value: 11, unit: "cm" } },
			{ fromVertexId: "B", toVertexId: "C", style: "solid", label: { value: 12, unit: "cm" } },
			{ fromVertexId: "C", toVertexId: "D", style: "solid", label: null },
			{ fromVertexId: "D", toVertexId: "A", style: "solid", label: null }
		],
		rightAngleMarkers: null
	},

	// Example 11: Area of the shaded region between a square and a circle
	// Question ID: xf0438c2e9eb979cd
	{
		type: "nestedShapeDiagram",
		width: 350,
		height: 325,
		vertices: [
			{ id: "A", x: 25, y: 25 }, // Square vertices
			{ id: "B", x: 300, y: 25 },
			{ id: "C", x: 300, y: 300 },
			{ id: "D", x: 25, y: 300 },
			{ id: "O", x: 162.5, y: 162.5 }, // Circle center
			{ id: "R", x: 287.5, y: 162.5 } // Point on circle
		],
		shapes: [
			{ id: "square", type: "polygon", vertexIds: ["A", "B", "C", "D"] },
			{ id: "circle", type: "circle", centerId: "O", radius: 125 }
		],
		shadedRegions: [
			{
				fillColor: "#ccfaff80",
				path: [
					{ shapeId: "square", pathType: "outer" },
					{ shapeId: "circle", pathType: "inner" }
				]
			}
		],
		internalSegments: [
			{ fromVertexId: "O", toVertexId: "R", style: "solid", label: { value: 5, unit: "cm" } },
			{ fromVertexId: "A", toVertexId: "B", style: "solid", label: { value: 11, unit: "cm" } },
			{ fromVertexId: "B", toVertexId: "C", style: "solid", label: { value: 11, unit: "cm" } },
			{ fromVertexId: "C", toVertexId: "D", style: "solid", label: null },
			{ fromVertexId: "D", toVertexId: "A", style: "solid", label: null }
		],
		rightAngleMarkers: null
	},

	// Example 12: Area of a shaded region between a circle and a square
	// Question ID: x74eb96d7a07de3a4
	{
		type: "nestedShapeDiagram",
		width: 200,
		height: 200,
		vertices: [
			{ id: "O", x: 100, y: 100 }, // Circle center
			{ id: "S1", x: 70, y: 70 }, // Square vertices
			{ id: "S2", x: 130, y: 70 },
			{ id: "S3", x: 130, y: 130 },
			{ id: "S4", x: 70, y: 130 },
			{ id: "C0", x: 180, y: 100 } // Point on circle
		],
		shapes: [
			{ id: "circle", type: "circle", centerId: "O", radius: 80 },
			{ id: "square", type: "polygon", vertexIds: ["S1", "S2", "S3", "S4"] }
		],
		shadedRegions: [
			{
				fillColor: "#ccfaff",
				path: [
					{ shapeId: "circle", pathType: "outer" },
					{ shapeId: "square", pathType: "inner" }
				]
			}
		],
		internalSegments: [
			{ fromVertexId: "S1", toVertexId: "S2", style: "solid", label: { value: 3, unit: "cm" } },
			{ fromVertexId: "S2", toVertexId: "S3", style: "solid", label: null },
			{ fromVertexId: "S3", toVertexId: "S4", style: "solid", label: null },
			{ fromVertexId: "S4", toVertexId: "S1", style: "solid", label: { value: 3, unit: "cm" } },
			{ fromVertexId: "O", toVertexId: "C0", style: "solid", label: { value: 4, unit: "cm" } }
		],
		rightAngleMarkers: null
	}
]
