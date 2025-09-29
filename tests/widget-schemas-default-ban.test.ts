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

function hasZodDef(obj: unknown): obj is { _def: unknown } {
	return isRecord(obj) && hasKey(obj, "_def") && isRecord(obj._def)
}

function containsDefault(schema: z.ZodType, visited = new Set<z.ZodType>()): boolean {
	if (!hasZodDef(schema)) return false
	if (visited.has(schema)) return false
	visited.add(schema)

	const defUnknown: unknown = (schema satisfies { _def: unknown })._def
	if (isRecord(defUnknown) && hasKey(defUnknown, "typeName") && defUnknown.typeName === "ZodDefault") return true

	// Generic deep traversal over all enumerable properties on _def
	if (isRecord(defUnknown)) {
		for (const value of Object.values(defUnknown)) {
			if (isZodSchema(value)) {
				if (containsDefault(value, visited)) return true
				continue
			}
			if (Array.isArray(value)) {
				for (const v of value) {
					if (isZodSchema(v) && containsDefault(v, visited)) return true
				}
				continue
			}
			if (isRecord(value)) {
				for (const v of Object.values(value)) {
					if (isZodSchema(v) && containsDefault(v, visited)) return true
				}
			}
		}
	}

	return false
}

describe("Zod Schema Default Ban", () => {
	for (const [widgetType, zodSchema] of Object.entries(typedSchemas)) {
		test(`should not contain any default() in '${widgetType}' schema`, () => {
			const hasDefault = containsDefault(zodSchema)
			if (hasDefault) {
				logger.error("widget schema contains banned default()", { widgetType })
				throw errors.new(
					`widget schema '${widgetType}' contains banned default(). remove default() and provide explicit values at runtime or nullable().`
				)
			}
			expect(hasDefault).toBe(false)
		})
	}
})
