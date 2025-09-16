import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { WidgetInput } from "../../src/widgets/registry"
import { generateWidget } from "../../src/widgets/widget-generator"

function makeSeededRandom(seed: number): () => number {
	let s = seed >>> 0
	return () => {
		s = (s * 1664525 + 1013904223) >>> 0
		return s / 0x100000000
	}
}

async function runWithSeed<T>(seed: number, fn: () => Promise<T>): Promise<T> {
	const original = Math.random
	Object.defineProperty(Math, "random", { value: makeSeededRandom(seed), configurable: true })
	const execResult = await errors.try(fn())
	Object.defineProperty(Math, "random", { value: original, configurable: true })
	if (execResult.error) {
		logger.error("seeded execution failed", { seed, error: execResult.error })
		throw execResult.error
	}
	return execResult.data
}

describe("Widget: marble-diagram", () => {
	const examples: WidgetInput[] = [
		{ type: "marbleDiagram", blueMarbles: 2, redMarbles: 3 },
		{ type: "marbleDiagram", blueMarbles: 5, redMarbles: 0 },
		{ type: "marbleDiagram", blueMarbles: 0, redMarbles: 5 },
		{ type: "marbleDiagram", blueMarbles: 3, redMarbles: 4 },
		{ type: "marbleDiagram", blueMarbles: 1, redMarbles: 1 }
	]

	examples.forEach((props, index) => {
		test(`should produce consistent output for example #${index + 1}`, async () => {
			await runWithSeed(12345 + index * 777, async () => {
				const result = await errors.try(generateWidget(props))
				if (result.error) {
					logger.error("widget generation failed", { error: result.error, index })
					throw result.error
				}
				expect(result.data).toMatchSnapshot()
			})
		})
	})
})
