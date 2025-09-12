import type { DivisionAreaDiagramProps } from "../src/widgets/generators/division-area-diagram"

// Example set 1: 51 ÷ 3 (four progressive states)
export const divisionAreaDiagramExamples_51_div_3: DivisionAreaDiagramProps[] = [
  {
    type: "divisionAreaDiagram",
    divisor: 3,
    dividend: 51,
    quotientParts: [
      { type: "value", value: 10 },
      { type: "placeholder" }
    ],
    steps: [
      { subtrahend: null, difference: null, differenceColor: null },
      { subtrahend: null, difference: null, differenceColor: null }
    ],
    showFinalRemainderBox: false
  },
  {
    type: "divisionAreaDiagram",
    divisor: 3,
    dividend: 51,
    quotientParts: [
      { type: "value", value: 10 },
      { type: "placeholder" }
    ],
    steps: [
      { subtrahend: 30, difference: 21, differenceColor: "red" },
      { subtrahend: null, difference: null, differenceColor: null }
    ],
    showFinalRemainderBox: false
  },
  {
    type: "divisionAreaDiagram",
    divisor: 3,
    dividend: 51,
    quotientParts: [
      { type: "value", value: 10 },
      { type: "placeholder" }
    ],
    steps: [
      { subtrahend: 30, difference: 21, differenceColor: "red" },
      { subtrahend: null, difference: 21, differenceColor: "red" }
    ],
    showFinalRemainderBox: false
  },
  {
    type: "divisionAreaDiagram",
    divisor: 3,
    dividend: 51,
    quotientParts: [
      { type: "value", value: 10 },
      { type: "value", value: 7 }
    ],
    steps: [
      { subtrahend: 30, difference: 21, differenceColor: "red" },
      { subtrahend: 21, difference: 0, differenceColor: null }
    ],
    showFinalRemainderBox: true
  }
]

// Example set 2: 28 ÷ 2 (four progressive states)
export const divisionAreaDiagramExamples_28_div_2: DivisionAreaDiagramProps[] = [
  {
    type: "divisionAreaDiagram",
    divisor: 2,
    dividend: 28,
    quotientParts: [
      { type: "placeholder" },
      { type: "placeholder" }
    ],
    steps: [
      { subtrahend: null, difference: null, differenceColor: null },
      { subtrahend: null, difference: null, differenceColor: null }
    ],
    showFinalRemainderBox: false
  },
  {
    type: "divisionAreaDiagram",
    divisor: 2,
    dividend: 28,
    quotientParts: [
      { type: "value", value: 10 },
      { type: "placeholder" }
    ],
    steps: [
      { subtrahend: 20, difference: 8, differenceColor: "red" },
      { subtrahend: null, difference: null, differenceColor: null }
    ],
    showFinalRemainderBox: false
  },
  {
    type: "divisionAreaDiagram",
    divisor: 2,
    dividend: 28,
    quotientParts: [
      { type: "value", value: 10 },
      { type: "placeholder" }
    ],
    steps: [
      { subtrahend: 20, difference: 8, differenceColor: "red" },
      { subtrahend: null, difference: 8, differenceColor: "red" }
    ],
    showFinalRemainderBox: false
  },
  {
    type: "divisionAreaDiagram",
    divisor: 2,
    dividend: 28,
    quotientParts: [
      { type: "value", value: 10 },
      { type: "value", value: 4 }
    ],
    steps: [
      { subtrahend: 20, difference: 8, differenceColor: "red" },
      { subtrahend: 8, difference: 0, differenceColor: null }
    ],
    showFinalRemainderBox: true
  }
]


