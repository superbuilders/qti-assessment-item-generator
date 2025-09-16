import type { TreeDiagramProps } from "../src/widgets/registry"

// Example extracted from question x150b1c6c6e15ce1f: Select a tree diagram for three coin flips
export const treeDiagramExamples: TreeDiagramProps[] = [
  {
    type: "treeDiagram",
    width: 440,
    height: 304,
    nodeRadius: 20,
    nodeFontSize: 14,
    nodes: [
      { id: "root", color: "#000000", label: "Start", style: "circled", position: { x: 220, y: 12 } },
      { id: "n1_L1", color: "#000000", label: "H", style: "circled", position: { x: 120, y: 74 } },
      { id: "n2_L1", color: "#000000", label: "T", style: "circled", position: { x: 320, y: 74 } },
      { id: "n1_L2_left", color: "#000000", label: "H", style: "circled", position: { x: 70, y: 174 } },
      { id: "n1_L2_right", color: "#000000", label: "T", style: "circled", position: { x: 170, y: 174 } },
      { id: "n2_L2_left", color: "#000000", label: "H", style: "circled", position: { x: 270, y: 174 } },
      { id: "n2_L2_right", color: "#000000", label: "T", style: "circled", position: { x: 370, y: 174 } },
      { id: "n1_L3_ll", color: "#000000", label: "H", style: "circled", position: { x: 45, y: 274 } },
      { id: "n1_L3_lr", color: "#000000", label: "T", style: "circled", position: { x: 95, y: 274 } },
      { id: "n1_L3_rl", color: "#000000", label: "H", style: "circled", position: { x: 145, y: 274 } },
      { id: "n1_L3_rr", color: "#000000", label: "T", style: "circled", position: { x: 195, y: 274 } },
      { id: "n2_L3_ll", color: "#000000", label: "H", style: "circled", position: { x: 245, y: 274 } },
      { id: "n2_L3_lr", color: "#000000", label: "T", style: "circled", position: { x: 295, y: 274 } },
      { id: "n2_L3_rl", color: "#000000", label: "H", style: "circled", position: { x: 345, y: 274 } },
      { id: "n2_L3_rr", color: "#000000", label: "T", style: "circled", position: { x: 395, y: 274 } }
    ],
    edges: [
      { to: "n1_L1", from: "root", style: "solid" },
      { to: "n2_L1", from: "root", style: "solid" },
      { to: "n1_L2_left", from: "n1_L1", style: "solid" },
      { to: "n1_L2_right", from: "n1_L1", style: "solid" },
      { to: "n2_L2_left", from: "n2_L1", style: "solid" },
      { to: "n2_L2_right", from: "n2_L1", style: "solid" },
      { to: "n1_L3_ll", from: "n1_L2_left", style: "solid" },
      { to: "n1_L3_lr", from: "n1_L2_left", style: "solid" },
      { to: "n1_L3_rl", from: "n1_L2_right", style: "solid" },
      { to: "n1_L3_rr", from: "n1_L2_right", style: "solid" },
      { to: "n2_L3_ll", from: "n2_L2_left", style: "solid" },
      { to: "n2_L3_lr", from: "n2_L2_left", style: "solid" },
      { to: "n2_L3_rl", from: "n2_L2_right", style: "solid" },
      { to: "n2_L3_rr", from: "n2_L2_right", style: "solid" }
    ]
  },
  // Extracted from question: xcfc0bdb0990dfe10
  // Question: Select the tree diagram for 2 lefts and 1 right
  // Widget key: image_1
  {
    type: "treeDiagram",
    edges: [
      { to: "n1", from: "root", style: "solid" },
      { to: "n2", from: "root", style: "solid" },
      { to: "n3", from: "root", style: "solid" },
      { to: "n4", from: "root", style: "solid" }
    ],
    nodes: [
      { id: "root", color: "#000000", label: null, style: "circled", position: { x: 220, y: 12 } },
      { id: "n1", color: "#000000", label: "3 Lefts", style: "circled", position: { x: 70, y: 94 } },
      { id: "n2", color: "#000000", label: "2 Lefts 1 Right", style: "circled", position: { x: 170, y: 94 } },
      { id: "n3", color: "#000000", label: "1 Left 2 Rights", style: "circled", position: { x: 270, y: 94 } },
      { id: "n4", color: "#000000", label: "3 Rights", style: "circled", position: { x: 370, y: 94 } }
    ],
    width: 440,
    height: 144,
    nodeRadius: 40,
    nodeFontSize: 12
  }
]



