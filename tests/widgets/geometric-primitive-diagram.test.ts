import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import { geometricPrimitiveDiagramExamples } from "../../examples/geometric-primitive-diagram"
import type { Widget } from "../../src/widgets/registry"
import { generateWidget } from "../../src/widgets/widget-generator"

describe("Widget: geometric-primitive-diagram", () => {
    const examples = geometricPrimitiveDiagramExamples as unknown as Widget[]

    examples.forEach((props, index) => {
        test(`should produce consistent output for example #${index + 1}`, async () => {
            const result = await errors.try(generateWidget(props))
            if (result.error) throw result.error
            expect(result.data).toMatchSnapshot()
        })
    })
})


