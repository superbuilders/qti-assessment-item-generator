import type { AngleTypeDiagramProps } from "../src/widgets/generators/angle-type-diagram"

// Valid examples for the Angle Type Diagram widget
export const angleTypeDiagramExamples: AngleTypeDiagramProps[] = [
  {
    // Question 4, Diagram 'b' - Obtuse Angle
    type: "angleTypeDiagram",
    width: 250,
    height: 200,
    angleType: "obtuse",
    rotation: 270,
    labels: { ray1Point: "P", vertex: "Q", ray2Point: "R" },
    showAngleArc: true,
    sectorColor: "#f1c40f",
  },
  {
    // Question 4, Diagram 'c' - Right Angle
    type: "angleTypeDiagram",
    width: 250,
    height: 200,
    angleType: "right",
    rotation: 0,
    labels: { ray1Point: "P", vertex: "Q", ray2Point: "R" },
    showAngleArc: true,
    sectorColor: "#f1c40f",
  },
  {
    // Question 4, Diagram 'd' - Straight Angle
    type: "angleTypeDiagram",
    width: 250,
    height: 200,
    angleType: "straight",
    rotation: 180,
    labels: { ray1Point: "P", vertex: "Q", ray2Point: "R" },
    showAngleArc: true,
    sectorColor: "#f1c40f",
  },
  {
    // Question 4, Diagram 'e' - Reflex Angle
    type: "angleTypeDiagram",
    width: 250,
    height: 200,
    angleType: "reflex",
    rotation: 135,
    labels: { ray1Point: "P", vertex: "Q", ray2Point: "R" },
    showAngleArc: true,
    sectorColor: "#f1c40f",
  },
  {
    // Question 4, Explanation Diagram - Obtuse Angle (Same as diagram 'b')
    type: "angleTypeDiagram",
    width: 250,
    height: 200,
    angleType: "obtuse",
    rotation: 270,
    labels: { ray1Point: "P", vertex: "Q", ray2Point: "R" },
    showAngleArc: true,
    sectorColor: "#f1c40f",
  },
  {
    // Question 3, Diagram 'a' - Right Angle
    type: "angleTypeDiagram",
    width: 250,
    height: 200,
    angleType: "right",
    rotation: 0,
    labels: { ray1Point: "A", vertex: "B", ray2Point: "C" },
    showAngleArc: true,
    sectorColor: "#9b59b6",
  },
  {
    // Question 3, Diagram 'b' - Obtuse Angle
    type: "angleTypeDiagram",
    width: 250,
    height: 200,
    angleType: "obtuse",
    rotation: 0,
    labels: { ray1Point: "A", vertex: "B", ray2Point: "C" },
    showAngleArc: true,
    sectorColor: "#9b59b6",
  },
  {
    // Question 3, Diagram 'c' - Straight Angle
    type: "angleTypeDiagram",
    width: 250,
    height: 200,
    angleType: "straight",
    rotation: 0,
    labels: { ray1Point: "A", vertex: "B", ray2Point: "C" },
    showAngleArc: true,
    sectorColor: "#9b59b6",
  },
  {
    // Question 3, Diagram 'd' - Acute Angle
    type: "angleTypeDiagram",
    width: 250,
    height: 200,
    angleType: "acute",
    rotation: 0,
    labels: { ray1Point: "A", vertex: "B", ray2Point: "C" },
    showAngleArc: true,
    sectorColor: "#9b59b6",
  },
  {
    // Question 3, Explanation Diagram - Obtuse Angle (Same as diagram 'b')
    type: "angleTypeDiagram",
    width: 250,
    height: 200,
    angleType: "obtuse",
    rotation: 0,
    labels: { ray1Point: "A", vertex: "B", ray2Point: "C" },
    showAngleArc: true,
    sectorColor: "#9b59b6",
  },
]


