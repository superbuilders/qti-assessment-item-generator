import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { z } from "zod"
import { typedSchemas } from "../src/widgets/registry"

type AnyRecord = Record<string, unknown>

function isRecord(value: unknown): value is AnyRecord {
	return typeof value === "object" && value !== null
}

function hasKey<K extends string>(obj: AnyRecord, key: K): obj is AnyRecord & { [P in K]: unknown } {
	return key in obj
}

function isZodSchema(value: unknown): value is z.ZodType {
	return isRecord(value) && hasKey(value, "_def") && isRecord(value._def) && hasKey(value._def, "typeName")
}

function containsTuple(schema: z.ZodType): boolean {
	const root: unknown = schema
	if (!isRecord(root) || !hasKey(root, "_def") || !isRecord(root._def)) return false
	const def = root._def
	if (hasKey(def, "typeName") && def.typeName === "ZodTuple") return true

	if (hasKey(def, "shape") && isRecord(def.shape)) {
		for (const value of Object.values(def.shape)) {
			if (isZodSchema(value) && containsTuple(value)) return true
		}
	}

	if (hasKey(def, "type") && isZodSchema(def.type)) {
		if (containsTuple(def.type)) return true
	}

	if (hasKey(def, "options") && Array.isArray(def.options)) {
		for (const option of def.options) {
			if (isZodSchema(option) && containsTuple(option)) return true
		}
	}

	if (hasKey(def, "innerType") && isZodSchema(def.innerType)) {
		if (containsTuple(def.innerType)) return true
	}

	if (hasKey(def, "schema") && isZodSchema(def.schema)) {
		if (containsTuple(def.schema)) return true
	}

	if (
		hasKey(def, "left") &&
		hasKey(def, "right") &&
		isZodSchema(def.left) &&
		isZodSchema(def.right)
	) {
		if (containsTuple(def.left) || containsTuple(def.right)) return true
	}

	return false
}

describe("Zod Schema Tuple Ban", () => {
	for (const [widgetType, zodSchema] of Object.entries(typedSchemas)) {
		test(`should not contain any tuple types in '${widgetType}' schema`, () => {
			const hasTuples = containsTuple(zodSchema)
			if (hasTuples) {
				logger.error("widget schema contains tuple types which are not compatible with openai api", { widgetType })
				throw errors.new(
					`widget schema '${widgetType}' contains tuple types which are not compatible with openai api. ` +
					"replace tuples with arrays and add runtime validation. " +
					"example: change z.tuple([z.string(), z.string()]) to z.array(z.string()) with a runtime length check."
				)
			}
			expect(hasTuples).toBe(false)
		})
	}
})


