import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import { divisionAreaDiagramExamples_51_div_3, divisionAreaDiagramExamples_28_div_2 } from "../../examples/division-area-diagram"
import type { Widget } from "../../src/widgets/registry"
import { generateWidget } from "../../src/widgets/widget-generator"

describe("Widget: division-area-diagram", () => {
  const examples = [
    ...divisionAreaDiagramExamples_51_div_3,
    ...divisionAreaDiagramExamples_28_div_2
  ] as unknown as Widget[]

  examples.forEach((props, index) => {
    test(`should produce consistent output for example #${index + 1}`, async () => {
      const result = await errors.try(generateWidget(props))
      if (result.error) throw result.error
      expect(result.data).toMatchSnapshot()
    })
  })
})


