import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { integerChipModelExamples } from "../../examples/integer-chip-model"
import type { IntegerChipModelProps } from "../../src/widgets/generators/integer-chip-model"
import type { WidgetInput } from "../../src/widgets/registry"
import { generateWidget } from "../../src/widgets/widget-generator"

describe("Widget: integer-chip-model", () => {
	const examples: WidgetInput[] = integerChipModelExamples

	examples.forEach((props, index) => {
		test(`should produce consistent output for example #${index + 1}`, async () => {
			const result = await errors.try(generateWidget(props))
			if (result.error) {
				logger.error("widget generation failed", { error: result.error, index })
				throw result.error
			}
			expect(result.data).toMatchSnapshot()
		})
	})

	// Additional comprehensive test cases
	describe("edge cases and special scenarios", () => {
		test("should handle single chip", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 100,
				height: 100,
				showLegend: false,
				chips: [{ sign: "plus", crossedOut: false }]
			}
			const result = await errors.try(generateWidget(props))
			if (result.error) {
				logger.error("widget generation failed", { error: result.error })
				throw result.error
			}
			expect(result.data).toMatchSnapshot()
		})

		test("should handle all crossed-out chips", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 200,
				height: 120,
				showLegend: false,
				chips: [
					{ sign: "plus", crossedOut: true },
					{ sign: "minus", crossedOut: true },
					{ sign: "plus", crossedOut: true }
				]
			}
			const result = await errors.try(generateWidget(props))
			if (result.error) {
				logger.error("widget generation failed", { error: result.error })
				throw result.error
			}
			expect(result.data).toMatchSnapshot()
		})

		test("should handle legend without chips", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 150,
				height: 120,
				showLegend: true,
				chips: [{ sign: "minus", crossedOut: false }]
			}
			const result = await errors.try(generateWidget(props))
			if (result.error) {
				logger.error("widget generation failed", { error: result.error })
				throw result.error
			}
			expect(result.data).toMatchSnapshot()
		})

		test("should handle narrow width forcing vertical layout", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 80,
				height: 300,
				showLegend: false,
				chips: [
					{ sign: "plus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "plus", crossedOut: false }
				]
			}
			const result = await errors.try(generateWidget(props))
			if (result.error) {
				logger.error("widget generation failed", { error: result.error })
				throw result.error
			}
			expect(result.data).toMatchSnapshot()
		})

		test("should handle zero-pair cancellation pattern", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 300,
				height: 150,
				showLegend: true,
				chips: [
					{ sign: "plus", crossedOut: false },
					{ sign: "minus", crossedOut: true },
					{ sign: "plus", crossedOut: true },
					{ sign: "minus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "minus", crossedOut: true },
					{ sign: "plus", crossedOut: true },
					{ sign: "minus", crossedOut: false }
				]
			}
			const result = await errors.try(generateWidget(props))
			if (result.error) {
				logger.error("widget generation failed", { error: result.error })
				throw result.error
			}
			expect(result.data).toMatchSnapshot()
		})

		test("should handle alternating pattern", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 400,
				height: 120,
				showLegend: false,
				chips: [
					{ sign: "plus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "minus", crossedOut: false }
				]
			}
			const result = await errors.try(generateWidget(props))
			if (result.error) {
				logger.error("widget generation failed", { error: result.error })
				throw result.error
			}
			expect(result.data).toMatchSnapshot()
		})

		test("should handle large number of chips with mixed crossed-out", async () => {
			const chips: Array<{ sign: "plus" | "minus"; crossedOut: boolean }> = []
			for (let i = 0; i < 15; i++) {
				chips.push({
					sign: i % 2 === 0 ? "plus" : "minus",
					crossedOut: i % 5 === 0
				})
			}
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 350,
				height: 200,
				showLegend: true,
				chips
			}
			const result = await errors.try(generateWidget(props))
			if (result.error) {
				logger.error("widget generation failed", { error: result.error })
				throw result.error
			}
			expect(result.data).toMatchSnapshot()
		})

		test("should handle minimum width constraint", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 50, // Very narrow
				height: 200,
				showLegend: false,
				chips: [
					{ sign: "plus", crossedOut: false },
					{ sign: "minus", crossedOut: false }
				]
			}
			const result = await errors.try(generateWidget(props))
			if (result.error) {
				logger.error("widget generation failed", { error: result.error })
				throw result.error
			}
			expect(result.data).toMatchSnapshot()
		})
	})
})
