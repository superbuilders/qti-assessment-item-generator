import type { TransversalAngleDiagramProps } from "../src/widgets/generators/transversal-angle-diagram"

export const transversalAngleDiagramExamples: TransversalAngleDiagramProps[] = [
	// Example 1: Basic corresponding angles (parallel mains)
	{
		type: "transversalAngleDiagram",
		width: 500,
		height: 400,
		line1Angle: 0,
		line2Angle: 0,
		transversalAngle: 45, // Diagonal transversal
		intersections: {
			line1: {
				label: "P",
				angles: [
					{ span: "mainToTransversal", label: "1", color: "#ff6b6b", fromRay: { dir: "-" }, toRay: { dir: "+" } },
					{ span: "transversalToMain", label: "2", color: "#4ecdc4", fromRay: { dir: "+" }, toRay: { dir: "+" } },
					{ span: "mainToTransversal", label: "3", color: "#45b7d1", fromRay: { dir: "+" }, toRay: { dir: "-" } },
					{ span: "transversalToMain", label: "4", color: "#96ceb4", fromRay: { dir: "-" }, toRay: { dir: "-" } }
				]
			},
			line2: {
				label: "Q",
				angles: [
					{ span: "mainToTransversal", label: "5", color: "#ffeaa7", fromRay: { dir: "-" }, toRay: { dir: "+" } },
					{ span: "transversalToMain", label: "6", color: "#fd79a8", fromRay: { dir: "+" }, toRay: { dir: "+" } },
					{ span: "mainToTransversal", label: "7", color: "#a29bfe", fromRay: { dir: "+" }, toRay: { dir: "-" } },
					{ span: "transversalToMain", label: "8", color: "#6c5ce7", fromRay: { dir: "-" }, toRay: { dir: "-" } }
				]
			}
		},
		pointLabels: {
			line1: ["A", "B"],
			line2: ["C", "D"],
			transversal: ["E", "F"]
		}
	},

	// Example 2: Vertical transversal with different angle orientations (parallel mains)
	{
		type: "transversalAngleDiagram",
		width: 400,
		height: 500,
		line1Angle: 30, // Slightly angled parallel lines
		line2Angle: 30,
		transversalAngle: 90, // Vertical transversal
		intersections: {
			line1: {
				label: "M",
				angles: [
					{ span: "mainToTransversal", label: "α", color: "#e17055", fromRay: { dir: "-" }, toRay: { dir: "+" } },
					{ span: "transversalToMain", label: "β", color: "#00b894", fromRay: { dir: "+" }, toRay: { dir: "+" } }
				]
			},
			line2: {
				label: "N",
				angles: [
					{ span: "mainToTransversal", label: "γ", color: "#0984e3", fromRay: { dir: "-" }, toRay: { dir: "+" } },
					{ span: "transversalToMain", label: "δ", color: "#6c5ce7", fromRay: { dir: "+" }, toRay: { dir: "+" } },
					{ span: "mainToTransversal", label: "ε", color: "#fd79a8", fromRay: { dir: "+" }, toRay: { dir: "-" } }
				]
			}
		},
		pointLabels: {
			line1: ["G", "H"],
			line2: ["I", "J"],
			transversal: ["K", "L"]
		}
	},

	// Example 3: Alternate interior angles focus (parallel mains)
	{
		type: "transversalAngleDiagram",
		width: 450,
		height: 350,
		line1Angle: -15, // Slightly negative angle
		line2Angle: -15,
		transversalAngle: 60, // Sharp angle transversal
		intersections: {
			line1: {
				label: "R",
				angles: [
					{ span: "mainToTransversal", label: "∠1", color: "#ff7675", fromRay: { dir: "+" }, toRay: { dir: "-" } },
					{ span: "transversalToMain", label: "∠2", color: "#74b9ff", fromRay: { dir: "-" }, toRay: { dir: "-" } }
				]
			},
			line2: {
				label: "S",
				angles: [
					{ span: "mainToTransversal", label: "∠3", color: "#00b894", fromRay: { dir: "-" }, toRay: { dir: "+" } },
					{ span: "transversalToMain", label: "∠4", color: "#fdcb6e", fromRay: { dir: "+" }, toRay: { dir: "+" } }
				]
			}
		},
		pointLabels: {
			line1: ["X", "Y"],
			line2: ["Z", "W"],
			transversal: ["U", "V"]
		}
	},

	// Example 4: Non-parallel mains with diagonal transversal (mirrors Question 1 style)
	{
		type: "transversalAngleDiagram",
		width: 520,
		height: 400,
		line1Angle: 30,
		line2Angle: 140,
		transversalAngle: -45,
		intersections: {
			line1: {
				label: "G",
				angles: [
					{ span: "mainToTransversal", label: "1", color: "#1e90ff", fromRay: { dir: "-" }, toRay: { dir: "+" } },
					{ span: "mainToTransversal", label: "2", color: "#f39c12", fromRay: { dir: "+" }, toRay: { dir: "+" } },
					{ span: "transversalToMain", label: "6", color: "#f1c40f", fromRay: { dir: "+" }, toRay: { dir: "+" } }
				]
			},
			line2: {
				label: "H",
				angles: [
					{ span: "mainToTransversal", label: "3", color: "#16a085", fromRay: { dir: "-" }, toRay: { dir: "-" } },
					{ span: "transversalToMain", label: "4", color: "#27ae60", fromRay: { dir: "-" }, toRay: { dir: "+" } },
					{ span: "transversalToMain", label: "5", color: "#e67e22", fromRay: { dir: "-" }, toRay: { dir: "-" } }
				]
			}
		},
		pointLabels: {
			line1: ["C", "D"],
			line2: ["A", "B"],
			transversal: ["F", "E"]
		}
	},

	// Example 5: Horizontal and slanted mains, upward transversal (mirrors Question 2 style)
	{
		type: "transversalAngleDiagram",
		width: 520,
		height: 420,
		line1Angle: 10,
		line2Angle: 0,
		transversalAngle: -70,
		intersections: {
			line1: {
				label: "M",
				angles: [
					{ span: "mainToTransversal", label: "1", color: "#3498db", fromRay: { dir: "-" }, toRay: { dir: "+" } },
					{ span: "transversalToMain", label: "2", color: "#e67e22", fromRay: { dir: "+" }, toRay: { dir: "+" } }
				]
			},
			line2: {
				label: "N",
				angles: [
					{ span: "mainToTransversal", label: "3", color: "#2ecc71", fromRay: { dir: "-" }, toRay: { dir: "+" } },
					{ span: "transversalToMain", label: "4", color: "#1abc9c", fromRay: { dir: "+" }, toRay: { dir: "+" } },
					{ span: "transversalToMain", label: "5", color: "#d35400", fromRay: { dir: "+" }, toRay: { dir: "-" } }
				]
			}
		},
		pointLabels: {
			line1: ["C1", "D1"],
			line2: ["A1", "B1"],
			transversal: ["N1", "M1"]
		}
	}
]
