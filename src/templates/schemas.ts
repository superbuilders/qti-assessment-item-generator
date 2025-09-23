import { z } from "zod"

// -----------------------------------------------------------------------------
// Canonical, constrained numeric value schemas for template inputs
// Heavily inspired by number-line widget patterns, but simplified for template IO
// -----------------------------------------------------------------------------

// Whole integer (can be negative)
export const IntegerSchema = z
	.object({
		type: z.literal("integer"),
		value: z.number().int()
	})
	.strict()
	.describe("Whole integer value, may be negative or zero")

// Positive integer (> 0)
export const PositiveIntegerSchema = z
	.object({
		type: z.literal("positiveInteger"),
		value: z.number().int().positive()
	})
	.strict()
	.describe("Positive integer value greater than zero")

// Proper or improper fraction with optional sign encoded explicitly
export const FractionSchema = z
	.object({
		type: z.literal("fraction"),
		numerator: z.number().int().min(0),
		denominator: z.number().int().positive(),
		sign: z.enum(["+", "-"]).default("+")
	})
	.strict()
	.describe("Fraction value with explicit sign and positive denominator")

// Mixed number with explicit sign
export const MixedNumberSchema = z
	.object({
		type: z.literal("mixed"),
		whole: z.number().int().min(0),
		numerator: z.number().int().min(0),
		denominator: z.number().int().positive(),
		sign: z.enum(["+", "-"]).default("+")
	})
	.strict()
	.describe("Mixed number with explicit sign and positive denominator")

// Decimal number (finite), generic numeric
export const DecimalNumberSchema = z
	.object({
		type: z.literal("decimal"),
		value: z.number()
	})
	.strict()
	.describe("Finite decimal number")

// Number of the form a + b*pi
export const PiNumberSchema = z
	.object({
		type: z.literal("piNumber"),
		a: z.number().describe("non-pi part"),
		b: z.number().describe("coefficient of pi")
	})
	.strict()
	.describe("Number of the form a + b*pi")

// TODO (future): complex numbers { a, b, form }

export const NumericValueSchema = z
	.discriminatedUnion("type", [
		IntegerSchema,
		PositiveIntegerSchema,
		FractionSchema,
		MixedNumberSchema,
		DecimalNumberSchema,
		PiNumberSchema
	])
	.describe("Canonical numeric value union for template inputs")

export type NumericValue = z.infer<typeof NumericValueSchema>

// Subset limited to exact rationals (excludes decimal and pi forms)
export const RationalValueSchema = z
	.discriminatedUnion("type", [IntegerSchema, PositiveIntegerSchema, FractionSchema, MixedNumberSchema])
	.describe("Exact rational numeric value (integer, positiveInteger, fraction, mixed)")

export type RationalValue = z.infer<typeof RationalValueSchema>

// Utility converters
export function numericValueToRational(v: NumericValue): { numerator: number; denominator: number; sign: "+" | "-" } | null {
	if (v.type === "integer") {
		const sign: "+" | "-" = v.value < 0 ? "-" : "+"
		return { numerator: Math.abs(v.value), denominator: 1, sign }
	}
	if (v.type === "positiveInteger") {
		return { numerator: v.value, denominator: 1, sign: "+" }
	}
	if (v.type === "fraction") {
		return { numerator: v.numerator, denominator: v.denominator, sign: v.sign }
	}
	if (v.type === "mixed") {
		const improper = v.whole * v.denominator + v.numerator
		return { numerator: improper, denominator: v.denominator, sign: v.sign }
	}
	// For decimal and piNumber, return null to force template-specific handling
	return null
}


