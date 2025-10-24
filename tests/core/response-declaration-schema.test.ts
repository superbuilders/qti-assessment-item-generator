import { describe, expect, test } from "bun:test"
import { ResponseDeclarationSchema } from "@/core/item/schema"

describe("ResponseDeclarationSchema", () => {
	test("accepts valid numeric declarations", () => {
	const result = ResponseDeclarationSchema.safeParse({
		identifier: "RESPONSE_FLOAT",
		cardinality: "single",
		baseType: "float",
		correct: 3.14,
		rounding: {
			strategy: "decimalPlaces",
			figures: 2
		}
	})

		expect(result.success).toBe(true)
	})

	test("rejects float declarations with string correct values", () => {
	const result = ResponseDeclarationSchema.safeParse({
		identifier: "RESPONSE_FLOAT",
		cardinality: "single",
		baseType: "float",
		correct: "3.14",
		rounding: {
			strategy: "decimalPlaces",
			figures: 2
		}
	})

		expect(result.success).toBe(false)
	})

	test("rejects integer declarations with non-integer numbers", () => {
		const result = ResponseDeclarationSchema.safeParse({
			identifier: "RESPONSE_INT",
			cardinality: "single",
			baseType: "integer",
			correct: 2.5
		})

		expect(result.success).toBe(false)
	})

	test("rejects numeric declarations using Infinity or NaN", () => {
	const infinityResult = ResponseDeclarationSchema.safeParse({
		identifier: "RESPONSE_FLOAT",
		cardinality: "single",
		baseType: "float",
		correct: Number.POSITIVE_INFINITY,
		rounding: {
			strategy: "decimalPlaces",
			figures: 2
		}
	})
	const nanResult = ResponseDeclarationSchema.safeParse({
		identifier: "RESPONSE_FLOAT",
		cardinality: "single",
		baseType: "float",
		correct: Number.NaN,
		rounding: {
			strategy: "decimalPlaces",
			figures: 2
		}
	})

		expect(infinityResult.success).toBe(false)
		expect(nanResult.success).toBe(false)
	})

	test("rejects string declarations with numeric correct values", () => {
	const result = ResponseDeclarationSchema.safeParse({
		identifier: "RESPONSE_TEXT",
		cardinality: "single",
		baseType: "string",
		correct: 42
	})

		expect(result.success).toBe(false)
	})

	test("rejects float declarations without rounding metadata", () => {
		const result = ResponseDeclarationSchema.safeParse({
			identifier: "RESPONSE_FLOAT",
			cardinality: "single",
			baseType: "float",
			correct: 1.23
		})

		expect(result.success).toBe(false)
	})
})
