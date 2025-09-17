import type { TriangleDiagramProps } from "../src/widgets/generators/triangle-diagram"

// Valid examples for the Triangle Diagram widget
export const triangleDiagramExamples: TriangleDiagramProps[] = [
  // Reworked example using constraint-first v2 schema
  {
    type: "triangleDiagram",
    width: 462,
    height: 231,
    points: {
      A: { id: "pt_tri_A", label: "A" },
      B: { id: "pt_tri_B", label: "B" },
      C: { id: "pt_tri_C", label: "C" }
    },
    extraPoints: [
      { id: "pt_tri_D", label: "D" }
    ],
    lines: [
      ["pt_tri_D", "pt_tri_A", "pt_tri_C"]
    ],
    angleArcs: [
      { vertex: "pt_tri_A", from: "pt_tri_D", to: "pt_tri_B", value: { type: "numeric", value: 114 }, color: "#1fab54", showArc: true, showLabel: true },
      { vertex: "pt_tri_B", from: "pt_tri_A", to: "pt_tri_C", value: { type: "numeric", value: 56 }, color: "#11accd", showArc: true, showLabel: true },
      { vertex: "pt_tri_C", from: "pt_tri_A", to: "pt_tri_B", value: { type: "symbolic", symbol: "x" }, color: "#7854ab", showArc: true, showLabel: true }
    ],
    sideLabels: { AB: null, BC: null, CA: null },
    constructionLines: null,
    rightAngleMarks: null,
    altitudes: null
  },
  // Exterior helper with dashed perpendicular reference at left of base
  {
    type: "triangleDiagram",
    width: 462,
    height: 231,
    points: {
      A: { id: "pt_tri_A10", label: "A" },
      B: { id: "pt_tri_B10", label: "B" },
      C: { id: "pt_tri_C10", label: "C" }
    },
    extraPoints: [
      { id: "pt_tri_D10", label: "D" }
    ],
    // Place D on the base line to the left of B; draw dashed helper lines
    lines: [["pt_tri_D10", "pt_tri_B10", "pt_tri_C10"]],
    constructionLines: [
      { points: ["pt_tri_D10", "pt_tri_A10"], style: "dashed" },
      { points: ["pt_tri_D10", "pt_tri_B10"], style: "dashed" }
    ],
    rightAngleMarks: [
      { vertex: "pt_tri_D10", from: "pt_tri_A10", to: "pt_tri_B10", size: null }
    ],
    angleArcs: [
      { vertex: "pt_tri_A10", from: "pt_tri_B10", to: "pt_tri_C10", value: { type: "numeric", value: 41 }, color: "#11accd", showArc: true, showLabel: true },
      { vertex: "pt_tri_C10", from: "pt_tri_A10", to: "pt_tri_B10", value: { type: "numeric", value: 28 }, color: "#1fab54", showArc: true, showLabel: true },
      { vertex: "pt_tri_B10", from: "pt_tri_C10", to: "pt_tri_A10", value: { type: "symbolic", symbol: "x" }, color: "#7854ab", showArc: true, showLabel: true }
    ],
    sideLabels: {
      AB: { type: "symbolic", symbol: "B" },
      BC: { type: "symbolic", symbol: "C" },
      CA: { type: "symbolic", symbol: "A" }
    },
    altitudes: null
  },
  // Right triangle with top horizontal (A), right vertical (B) and dashed segment to right vertex
  {
    type: "triangleDiagram",
    width: 462,
    height: 231,
    points: {
      A: { id: "pt_tri_A11", label: "A" },
      B: { id: "pt_tri_B11", label: "B" },
      C: { id: "pt_tri_C11", label: "C" }
    },
    extraPoints: [
      { id: "pt_tri_D11", label: "D" }
    ],
    // Put D on hypotenuse AC; draw dashed from D to the right-angle vertex B
    lines: [["pt_tri_A11", "pt_tri_D11", "pt_tri_C11"]],
    constructionLines: [
      { points: ["pt_tri_D11", "pt_tri_B11"], style: "dashed" }
    ],
    rightAngleMarks: [
      { vertex: "pt_tri_B11", from: "pt_tri_A11", to: "pt_tri_C11", size: null }
    ],
    angleArcs: [
      { vertex: "pt_tri_A11", from: "pt_tri_B11", to: "pt_tri_C11", value: { type: "numeric", value: 30 }, color: "#11accd", showArc: true, showLabel: true },
      { vertex: "pt_tri_C11", from: "pt_tri_A11", to: "pt_tri_B11", value: { type: "numeric", value: 60 }, color: "#1fab54", showArc: true, showLabel: true },
      { vertex: "pt_tri_B11", from: "pt_tri_A11", to: "pt_tri_C11", value: { type: "symbolic", symbol: "x" }, color: "#7854ab", showArc: true, showLabel: true }
    ],
    sideLabels: {
      AB: { type: "symbolic", symbol: "A" },
      BC: { type: "symbolic", symbol: "B" },
      CA: { type: "symbolic", symbol: "C" }
    },
    altitudes: null
  },
  // New example: B = 69°, C = 66°, exterior at A is x°
  {
    type: "triangleDiagram",
    width: 462,
    height: 231,
    points: {
      A: { id: "pt_tri_A2", label: "A" },
      B: { id: "pt_tri_B2", label: "B" },
      C: { id: "pt_tri_C2", label: "C" }
    },
    extraPoints: [
      { id: "pt_tri_D2", label: "D" }
    ],
    lines: [
      ["pt_tri_D2", "pt_tri_A2", "pt_tri_C2"]
    ],
    angleArcs: [
      { vertex: "pt_tri_B2", from: "pt_tri_A2", to: "pt_tri_C2", value: { type: "numeric", value: 69 }, color: "#7854ab", showArc: true, showLabel: true },
      { vertex: "pt_tri_C2", from: "pt_tri_A2", to: "pt_tri_B2", value: { type: "numeric", value: 66 }, color: "#11accd", showArc: true, showLabel: true },
      { vertex: "pt_tri_A2", from: "pt_tri_D2", to: "pt_tri_B2", value: { type: "symbolic", symbol: "x" }, color: "#1fab54", showArc: true, showLabel: true }
    ],
    sideLabels: { AB: null, BC: null, CA: null },
    constructionLines: null,
    rightAngleMarks: null,
    altitudes: null
  },
  // New example 3: angled quadrilateral-like with 48°, 23°, and exterior x° at left top
  {
    type: "triangleDiagram",
    width: 462,
    height: 231,
    points: {
      A: { id: "pt_tri_A3", label: "A" },
      B: { id: "pt_tri_B3", label: "B" },
      C: { id: "pt_tri_C3", label: "C" }
    },
    extraPoints: [
      { id: "pt_tri_D3", label: "D" }
    ],
    lines: [["pt_tri_D3", "pt_tri_A3", "pt_tri_C3"]],
    angleArcs: [
      { vertex: "pt_tri_C3", from: "pt_tri_A3", to: "pt_tri_B3", value: { type: "numeric", value: 23 }, color: "#11accd", showArc: true, showLabel: true },
      { vertex: "pt_tri_A3", from: "pt_tri_B3", to: "pt_tri_C3", value: { type: "numeric", value: 48 }, color: "#11accd", showArc: true, showLabel: true },
      { vertex: "pt_tri_A3", from: "pt_tri_D3", to: "pt_tri_B3", value: { type: "symbolic", symbol: "x" }, color: "#1fab54", showArc: true, showLabel: true }
    ],
    sideLabels: { AB: null, BC: null, CA: null },
    constructionLines: null,
    rightAngleMarks: null,
    altitudes: null
  },
  // Interior-angle triangle (from first image): interior at A + C given, solve interior at left-top as x
  {
    type: "triangleDiagram",
    width: 462,
    height: 231,
    points: {
      A: { id: "pt_tri_A4", label: "A" },
      B: { id: "pt_tri_B4", label: "B" },
      C: { id: "pt_tri_C4", label: "C" }
    },
    angleArcs: [
      { vertex: "pt_tri_A4", from: "pt_tri_B4", to: "pt_tri_C4", value: { type: "numeric", value: 48 }, color: "#11accd", showArc: true, showLabel: true },
      { vertex: "pt_tri_C4", from: "pt_tri_A4", to: "pt_tri_B4", value: { type: "numeric", value: 23 }, color: "#1fab54", showArc: true, showLabel: true },
      { vertex: "pt_tri_B4", from: "pt_tri_C4", to: "pt_tri_A4", value: { type: "symbolic", symbol: "x" }, color: "#7854ab", showArc: true, showLabel: true }
    ],
    sideLabels: { AB: null, BC: null, CA: null },
    constructionLines: null,
    extraPoints: null,
    lines: null,
    rightAngleMarks: null,
    altitudes: null
  },
  // Interior-angle triangle (second image): given 21° at left, 125° at top, find x at right
  {
    type: "triangleDiagram",
    width: 462,
    height: 231,
    points: {
      A: { id: "pt_tri_A5", label: "A" },
      B: { id: "pt_tri_B5", label: "B" },
      C: { id: "pt_tri_C5", label: "C" }
    },
    angleArcs: [
      { vertex: "pt_tri_A5", from: "pt_tri_B5", to: "pt_tri_C5", value: { type: "numeric", value: 21 }, color: "#11accd", showArc: true, showLabel: true },
      { vertex: "pt_tri_B5", from: "pt_tri_A5", to: "pt_tri_C5", value: { type: "numeric", value: 125 }, color: "#1fab54", showArc: true, showLabel: true },
      { vertex: "pt_tri_C5", from: "pt_tri_B5", to: "pt_tri_A5", value: { type: "symbolic", symbol: "x" }, color: "#7854ab", showArc: true, showLabel: true }
    ],
    sideLabels: { AB: null, BC: null, CA: null },
    constructionLines: null,
    extraPoints: null,
    lines: null,
    rightAngleMarks: null,
    altitudes: null
  },
  // Right triangle with numeric side (third image): legs 3 and x, hypotenuse 5
  {
    type: "triangleDiagram",
    width: 462,
    height: 231,
    points: {
      A: { id: "pt_tri_A6", label: "A" },
      B: { id: "pt_tri_B6", label: "B" },
      C: { id: "pt_tri_C6", label: "C" }
    },
    angleArcs: [
      { vertex: "pt_tri_B6", from: "pt_tri_A6", to: "pt_tri_C6", value: { type: "numeric", value: 37 }, color: "#11accd", showArc: true, showLabel: true },
      { vertex: "pt_tri_C6", from: "pt_tri_B6", to: "pt_tri_A6", value: { type: "numeric", value: 53 }, color: "#1fab54", showArc: true, showLabel: true },
      { vertex: "pt_tri_A6", from: "pt_tri_B6", to: "pt_tri_C6", value: { type: "symbolic", symbol: "x" }, color: "#7854ab", showArc: true, showLabel: true }
    ],
    sideLabels: {
      AB: { type: "numeric", value: 3 },
      BC: { type: "numeric", value: 5 },
      CA: { type: "symbolic", symbol: "x" }
    },
    constructionLines: null,
    extraPoints: null,
    lines: null,
    rightAngleMarks: null,
    altitudes: [
      // Height from the left vertical leg to the hypotenuse is 8 in the image,
      // but our A,B,C positions are synthetic; we provide an altitude from A to BC.
      { vertex: "pt_tri_A6", toSide: "BC", value: { type: "numeric", value: 8 }, style: "dashed", color: "#777777", withRightAngle: true }
    ]
  },
  // Isosceles-like (fifth image): equal sides 3.3 with base angle 39°, opposite angle 39°, ask interior x
  {
    type: "triangleDiagram",
    width: 462,
    height: 231,
    points: {
      A: { id: "pt_tri_A7", label: "A" },
      B: { id: "pt_tri_B7", label: "B" },
      C: { id: "pt_tri_C7", label: "C" }
    },
    angleArcs: [
      { vertex: "pt_tri_A7", from: "pt_tri_B7", to: "pt_tri_C7", value: { type: "numeric", value: 39 }, color: "#11accd", showArc: true, showLabel: true },
      { vertex: "pt_tri_C7", from: "pt_tri_B7", to: "pt_tri_A7", value: { type: "numeric", value: 39 }, color: "#1fab54", showArc: true, showLabel: true },
      { vertex: "pt_tri_B7", from: "pt_tri_A7", to: "pt_tri_C7", value: { type: "symbolic", symbol: "x" }, color: "#7854ab", showArc: true, showLabel: true }
    ],
    sideLabels: {
      AB: { type: "numeric", value: 3.3 },
      BC: { type: "numeric", value: 5.1 },
      CA: { type: "numeric", value: 3.3 }
    },
    constructionLines: null,
    extraPoints: null,
    lines: null,
    rightAngleMarks: null,
    altitudes: [
      // Drop height from the right vertical to the base CA (value 21 per image)
      { vertex: "pt_tri_B7", toSide: "CA", value: { type: "numeric", value: 21 }, style: "dashed", color: "#777777", withRightAngle: true }
    ]
  },
  // New: MathML side labels on slanted sides, base numeric, interior altitude with symbolic label x
  {
    type: "triangleDiagram",
    width: 462,
    height: 231,
    points: {
      A: { id: "pt_tri_A8", label: "A" },
      B: { id: "pt_tri_B8", label: "B" },
      C: { id: "pt_tri_C8", label: "C" }
    },
    angleArcs: [
      // Provide two numeric interior angles so geometry is derivable
      { vertex: "pt_tri_A8", from: "pt_tri_B8", to: "pt_tri_C8", value: { type: "numeric", value: 35 }, color: "#11accd", showArc: true, showLabel: true },
      { vertex: "pt_tri_B8", from: "pt_tri_C8", to: "pt_tri_A8", value: { type: "numeric", value: 35 }, color: "#1fab54", showArc: true, showLabel: true },
      { vertex: "pt_tri_C8", from: "pt_tri_B8", to: "pt_tri_A8", value: { type: "symbolic", symbol: "x" }, color: "#7854ab", showArc: true, showLabel: true }
    ],
    sideLabels: {
      AB: { type: "numeric", value: 8 },
      BC: { type: "mathml", mathml: "<msqrt><mn>20</mn></msqrt>", value: 4.47213595499958 },
      CA: { type: "mathml", mathml: "<msqrt><mn>20</mn></msqrt>", value: 4.47213595499958 }
    },
    constructionLines: null,
    extraPoints: null,
    lines: null,
    rightAngleMarks: null,
    altitudes: [
      { vertex: "pt_tri_C8", toSide: "AB", value: null, style: "dashed", color: "#777777", withRightAngle: true }
    ]
  },
  // New: MathML side labels on slanted sides, known altitude 3 and base symbolic x
  {
    type: "triangleDiagram",
    width: 462,
    height: 231,
    points: {
      A: { id: "pt_tri_A9", label: "A" },
      B: { id: "pt_tri_B9", label: "B" },
      C: { id: "pt_tri_C9", label: "C" }
    },
    angleArcs: [
      { vertex: "pt_tri_A9", from: "pt_tri_B9", to: "pt_tri_C9", value: { type: "numeric", value: 40 }, color: "#11accd", showArc: true, showLabel: true },
      { vertex: "pt_tri_B9", from: "pt_tri_C9", to: "pt_tri_A9", value: { type: "numeric", value: 40 }, color: "#1fab54", showArc: true, showLabel: true },
      { vertex: "pt_tri_C9", from: "pt_tri_B9", to: "pt_tri_A9", value: { type: "symbolic", symbol: "x" }, color: "#7854ab", showArc: true, showLabel: true }
    ],
    sideLabels: {
      AB: { type: "symbolic", symbol: "x" },
      BC: { type: "mathml", mathml: "<msqrt><mn>45</mn></msqrt>", value: 6.70820393249937 },
      CA: { type: "mathml", mathml: "<msqrt><mn>45</mn></msqrt>", value: 6.70820393249937 }
    },
    constructionLines: null,
    extraPoints: null,
    lines: null,
    rightAngleMarks: null,
    altitudes: [
      { vertex: "pt_tri_C9", toSide: "AB", value: { type: "numeric", value: 3 }, style: "dashed", color: "#777777", withRightAngle: true }
    ]
  }
]


