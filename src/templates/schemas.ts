import { z } from "zod"

/**
 * Canonical schema for seed-only template inputs. Templates are expected to
 * derive all authored data deterministically from this opaque value.
 */
export const SeedSchema = z.bigint().min(0n)

export const SeedPropsSchema = z
	.object({
		seed: SeedSchema
	})
	.strict()
	.describe("Opaque template seed used to deterministically generate content.")

export type SeedProps = z.infer<typeof SeedPropsSchema>

const UINT32_MAX = 0xffffffff
const UINT32_MAX_PLUS_ONE = UINT32_MAX + 1

export type SeededRandom = {
	next: () => number
	nextInt: (min: number, maxInclusive: number) => number
	nextBoolean: () => boolean
}

/**
 * Very small deterministic RNG (LCG) seeded from a bigint. Provides helpers for
 * common integer and boolean draws without relying on global Math.random.
 */
export function createSeededRandom(seed: bigint): SeededRandom {
	// Reduce big seed to 32-bit state while keeping determinism for large inputs.
	let state = Number(seed & BigInt(UINT32_MAX)) >>> 0

	const next = () => {
		state = (state * 1664525 + 1013904223) >>> 0
		return state / UINT32_MAX_PLUS_ONE
	}

	const nextInt = (min: number, maxInclusive: number): number => {
		if (!Number.isFinite(min) || !Number.isFinite(maxInclusive)) {
			throw new Error("nextInt bounds must be finite numbers")
		}
		if (Math.floor(min) !== min || Math.floor(maxInclusive) !== maxInclusive) {
			throw new Error("nextInt bounds must be integers")
		}
		if (maxInclusive < min) {
			throw new Error("nextInt maxInclusive must be >= min")
		}
		const span = maxInclusive - min + 1
		return min + Math.floor(next() * span)
	}

	const nextBoolean = () => next() < 0.5

	return { next, nextInt, nextBoolean }
}
