import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { WidgetInput } from "../../src/widgets/registry"
import { generateWidgetForTest } from "../helpers/generateWidgetForTest"

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
		{
			type: "marbleDiagram",
			groups: [
				{ color: "#5B8DEF", count: 2 },
				{ color: "#D0021B", count: 3 }
			]
		},
		{ type: "marbleDiagram", groups: [{ color: "#5B8DEF", count: 5 }] },
		{ type: "marbleDiagram", groups: [{ color: "#D0021B", count: 5 }] },
		{
			type: "marbleDiagram",
			groups: [
				{ color: "#5B8DEF", count: 3 },
				{ color: "#D0021B", count: 4 }
			]
		},
		{
			type: "marbleDiagram",
			groups: [
				{ color: "#5B8DEF", count: 1 },
				{ color: "#D0021B", count: 1 },
				{ color: "#00AA00", count: 2 }
			]
		}
	]

	examples.forEach((props, index) => {
		test(`should produce consistent output for example #${index + 1}`, async () => {
			await runWithSeed(12345 + index * 777, async () => {
				const result = await errors.try(generateWidgetForTest(props))
				if (result.error) {
					logger.error("widget generation failed", { error: result.error, index })
					throw result.error
				}
				expect(result.data).toMatchSnapshot()
			})
		})
	})
})
