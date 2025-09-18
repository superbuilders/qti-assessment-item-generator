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
				width: 300,
				height: 300,
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
				width: 300,
				height: 300,
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

		test("should handle narrow width forcing vertical layout", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 300,
				height: 300,
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

		test("should handle alternating pattern", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 400,
				height: 300,
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

		test("should handle minimum width constraint", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 300, // Very narrow
				height: 300,
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

	// Database-extracted test cases for comprehensive coverage
	describe("database-extracted test scenarios", () => {
		test("should handle large collection with mixed signs", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 320,
				height: 300,
				chips: [
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
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

		test("should handle wide layout with many chips", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 300,
				height: 300,
				chips: [
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
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

		test("should handle subtraction with single crossed out chip", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 320,
				height: 300,
				chips: [
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "minus", crossedOut: true }
				]
			}
			const result = await errors.try(generateWidget(props))
			if (result.error) {
				logger.error("widget generation failed", { error: result.error })
				throw result.error
			}
			expect(result.data).toMatchSnapshot()
		})

		test("should handle multiple positive chips crossed out", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 320,
				height: 300,
				chips: [
					{ sign: "plus", crossedOut: true },
					{ sign: "plus", crossedOut: true },
					{ sign: "plus", crossedOut: true },
					{ sign: "plus", crossedOut: true },
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

		test("should handle mixed crossed out negative chips", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 320,
				height: 300,
				chips: [
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: true },
					{ sign: "plus", crossedOut: false },
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

		test("should handle complex subtraction pattern", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 320,
				height: 300,
				chips: [
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "plus", crossedOut: true },
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

		test("should handle mostly crossed out negative chips", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 320,
				height: 300,
				chips: [
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: false },
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

		test("should handle large collection with different height", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 320,
				height: 300,
				chips: [
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
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

		test("should handle complex subtraction with multiple crossed out", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 320,
				height: 300,
				chips: [
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: true }
				]
			}
			const result = await errors.try(generateWidget(props))
			if (result.error) {
				logger.error("widget generation failed", { error: result.error })
				throw result.error
			}
			expect(result.data).toMatchSnapshot()
		})

		test("should handle all negative chips only", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 320,
				height: 300,
				chips: [
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
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

		test("should handle mixed evaluation scenario", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 320,
				height: 300,
				chips: [
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
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

		test("should handle small collection with different dimensions", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 320,
				height: 300,
				chips: [
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
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

		test("should handle single crossed out negative chip", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 320,
				height: 300,
				chips: [
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: false },
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

		test("should handle mixed crossed out positive chips", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 320,
				height: 300,
				chips: [
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: true },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
					{ sign: "plus", crossedOut: false },
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

		test("should handle partial subtraction pattern", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 320,
				height: 300,
				chips: [
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
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

		test("should handle subtraction with crossed out negative chips", async () => {
			const props: IntegerChipModelProps = {
				type: "integerChipModel",
				width: 320,
				height: 300,
				chips: [
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: true },
					{ sign: "minus", crossedOut: false },
					{ sign: "minus", crossedOut: false },
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
