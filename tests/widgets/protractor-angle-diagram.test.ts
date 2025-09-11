import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import { protractorAngleDiagramExamples } from "../../examples/protractor-angle-diagram"
import type { Widget } from "../../src/widgets/registry"
import { generateWidget } from "../../src/widgets/widget-generator"

describe("Widget: protractor-angle-diagram", () => {
	const examples = protractorAngleDiagramExamples as unknown as Widget[]

	examples.forEach((props, index) => {
		test(`should produce consistent output for example #${index + 1}`, async () => {
			const result = await errors.try(generateWidget(props))
			if (result.error) throw result.error
			expect(result.data).toMatchSnapshot()
		})
	})
})


