import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"
import { createAssessmentItemShellSchema } from "../../src/core/item"
import { toJSONSchemaPromptSafe } from "../../src/core/json-schema"
import { allWidgetsCollection } from "../../src/widgets/collections/all"

describe("JSON Schema Preflight", () => {
	test("collection-scoped shell schema converts to JSON Schema", () => {
		const Shell = createAssessmentItemShellSchema(allWidgetsCollection.widgetTypeKeys)
		const result = errors.trySync(() => z.toJSONSchema(Shell))
		if (result.error) {
			logger.error("shell schema json conversion", { error: result.error })
			throw errors.wrap(result.error, "shell json schema conversion")
		}
		expect(result.error).toBeFalsy()
	})

	test("widget schemas convert by unwrapping transforms to input schemas", () => {
		const failures: Array<{ key: string; message: string }> = []
		for (const key of allWidgetsCollection.widgetTypeKeys) {
			const schema = allWidgetsCollection.schemas[key]
			if (!schema) {
				failures.push({ key, message: "missing schema in collection.schemas" })
				continue
			}
			const res = errors.trySync(() => toJSONSchemaPromptSafe(schema))
			if (res.error) {
				logger.error("widget schema prompt-safe conversion failed", { key, error: res.error })
				failures.push({ key, message: String(res.error) })
			}
		}
		if (failures.length > 0) {
			const breakdown = failures.map((f) => `${f.key}: ${f.message}`).join("\n")
			logger.error("widget schema conversion failures", { count: failures.length, breakdown })
			throw errors.new(`widget hack json schema conversion failures (count=${failures.length}):\n${breakdown}`)
		}
		expect(failures.length).toBe(0)
	})
})
