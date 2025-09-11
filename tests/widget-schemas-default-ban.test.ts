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

function containsDefault(schema: z.ZodType): boolean {
	if (!hasZodDef(schema)) return false
	const defUnknown: unknown = (schema satisfies { _def: unknown })._def
	if (isRecord(defUnknown) && hasKey(defUnknown, "typeName") && defUnknown.typeName === "ZodDefault") return true

	if (isRecord(defUnknown) && hasKey(defUnknown, "shape") && isRecord(defUnknown.shape)) {
		for (const value of Object.values(defUnknown.shape)) {
			if (isZodSchema(value) && containsDefault(value)) return true
		}
	}

	if (isRecord(defUnknown) && hasKey(defUnknown, "type") && isZodSchema(defUnknown.type)) {
		if (containsDefault(defUnknown.type)) return true
	}

	if (isRecord(defUnknown) && hasKey(defUnknown, "options") && Array.isArray(defUnknown.options)) {
		for (const option of defUnknown.options) {
			if (isZodSchema(option) && containsDefault(option)) return true
		}
	}

	if (isRecord(defUnknown) && hasKey(defUnknown, "innerType") && isZodSchema(defUnknown.innerType)) {
		if (containsDefault(defUnknown.innerType)) return true
	}

	if (isRecord(defUnknown) && hasKey(defUnknown, "schema") && isZodSchema(defUnknown.schema)) {
		if (containsDefault(defUnknown.schema)) return true
	}

	if (
		isRecord(defUnknown) &&
		hasKey(defUnknown, "left") &&
		hasKey(defUnknown, "right") &&
		isZodSchema(defUnknown.left) &&
		isZodSchema(defUnknown.right)
	) {
		if (containsDefault(defUnknown.left) || containsDefault(defUnknown.right)) return true
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
