import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { z } from "zod"
import { typedSchemas } from "../src/widgets/registry"

type UnknownRec = { [k: string]: unknown }

function isRecord(value: unknown): value is UnknownRec {
	return typeof value === "object" && value !== null
}

function hasKey<K extends string>(obj: UnknownRec, key: K): obj is UnknownRec & { [P in K]: unknown } {
	return key in obj
}

function isZodSchema(value: unknown): value is z.ZodType {
	if (!isRecord(value)) return false
	if (!hasKey(value, "_def")) return false
	const def = value._def
	return isRecord(def) && hasKey(def, "typeName")
}

function containsOptional(schema: unknown): boolean {
	if (!isZodSchema(schema)) return false
	const defUnknown: unknown = schema._def
	if (!isRecord(defUnknown)) return false

	if (hasKey(defUnknown, "typeName") && defUnknown.typeName === "ZodOptional") return true

	const shape = hasKey(defUnknown, "shape") ? defUnknown.shape : undefined
	if (isRecord(shape)) {
		for (const value of Object.values(shape)) {
			if (isZodSchema(value) && containsOptional(value)) return true
		}
	}

	const typeField = hasKey(defUnknown, "type") ? defUnknown.type : undefined
	if (isZodSchema(typeField) && containsOptional(typeField)) return true

	const options = hasKey(defUnknown, "options") ? defUnknown.options : undefined
	if (Array.isArray(options)) {
		for (const option of options) {
			if (isZodSchema(option) && containsOptional(option)) return true
		}
	}

	const innerType = hasKey(defUnknown, "innerType") ? defUnknown.innerType : undefined
	if (isZodSchema(innerType) && containsOptional(innerType)) return true

	const innerSchema = hasKey(defUnknown, "schema") ? defUnknown.schema : undefined
	if (isZodSchema(innerSchema) && containsOptional(innerSchema)) return true

	const left = hasKey(defUnknown, "left") ? defUnknown.left : undefined
	const right = hasKey(defUnknown, "right") ? defUnknown.right : undefined
	if (isZodSchema(left) && isZodSchema(right)) {
		if (containsOptional(left) || containsOptional(right)) return true
	}

	return false
}

describe("Zod Schema Optional Ban", () => {
	for (const [widgetType, zodSchema] of Object.entries(typedSchemas)) {
		test(`should not contain any optional() in '${widgetType}' schema`, () => {
			const hasOptional = containsOptional(zodSchema)
			if (hasOptional) {
				logger.error("widget schema contains banned optional()", { widgetType })
				throw errors.new(
					`widget schema '${widgetType}' contains banned optional(). replace optional fields with explicit nullable() where needed.`
				)
			}
			expect(hasOptional).toBe(false)
		})
	}
})
