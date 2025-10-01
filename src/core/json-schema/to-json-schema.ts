import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"

type BaseSchema = z.core.JSONSchema.BaseSchema

// Type guard for JSON Schema objects (non-boolean, non-array objects)
type ObjectSchema = {
	type?: unknown
	properties?: Record<string, BaseSchema>
	items?: BaseSchema | BaseSchema[]
	anyOf?: BaseSchema[]
	allOf?: BaseSchema[]
	oneOf?: BaseSchema[]
	not?: BaseSchema
	additionalProperties?: BaseSchema | boolean
	definitions?: Record<string, BaseSchema>
	$defs?: Record<string, BaseSchema>
} & Record<string, unknown>

function isObjectSchema(node: unknown): node is ObjectSchema {
	return typeof node === "object" && node !== null && !Array.isArray(node)
}

// Hoisted normalization helper: ensure every object has an explicit properties: {}
function ensureEmptyProperties(node: unknown): void {
	if (!isObjectSchema(node)) return

	if (node.type === "object" && node.properties === undefined) {
		node.properties = {}
	}

	// Recurse into properties
	if (node.properties) {
		for (const key of Object.keys(node.properties)) {
			ensureEmptyProperties(node.properties[key])
		}
	}

	// Recurse into items (single schema or tuple)
	const items = node.items
	if (Array.isArray(items)) {
		for (const it of items) ensureEmptyProperties(it)
	} else if (items) {
		ensureEmptyProperties(items)
	}

	// Recurse combinators
	const combs = [node.anyOf, node.allOf, node.oneOf]
	for (const group of combs) {
		if (Array.isArray(group)) {
			for (const s of group) ensureEmptyProperties(s)
		}
	}

	// Recurse into not
	if (node.not) ensureEmptyProperties(node.not)

	// Recurse into additionalProperties when it is a schema
	if (node.additionalProperties && typeof node.additionalProperties === "object") {
		ensureEmptyProperties(node.additionalProperties)
	}

	// Recurse into definitions / $defs
	if (node.definitions) {
		for (const key of Object.keys(node.definitions)) {
			ensureEmptyProperties(node.definitions[key])
		}
	}
	if (node.$defs) {
		for (const key of Object.keys(node.$defs)) {
			ensureEmptyProperties(node.$defs[key])
		}
	}
}

/**
 * Converts a Zod schema to JSON Schema suitable for prompt-time usage.
 * - Recursively unwraps transform nodes by converting the inner (input) schema
 * - Uses io: "input" so prompt schemas reflect input shape
 * - Fails hard if conversion throws or produces an empty schema
 */
export function toJSONSchemaPromptSafe(schema: z.ZodType): BaseSchema {
	// Define options with a self-referential override to unwrap transforms recursively
	const options: Parameters<typeof z.toJSONSchema>[1] = {
		target: "openapi-3.0",
		unrepresentable: "any",
		override: (ctx) => {
			const def = ctx?.zodSchema?._zod?.def
			if (def?.type === "transform" && "inner" in def && def.inner) {
				// biome-ignore lint: this is fine
				ctx.jsonSchema = z.toJSONSchema(def.inner as z.ZodType, options)
			}
		}
	}

	const result = errors.trySync(() => z.toJSONSchema(schema, options))
	if (result.error) {
		logger.error("json schema prompt-safe conversion", { error: result.error })
		throw errors.wrap(result.error, "json schema prompt-safe conversion")
	}
	const json = result.data as BaseSchema
	if (
		!json ||
		(typeof json !== "boolean" && typeof json !== "object") ||
		(typeof json === "object" && Object.keys(json).length === 0)
	) {
		logger.error("json schema prompt-safe conversion produced empty")
		throw errors.new("json schema conversion empty")
	}
	ensureEmptyProperties(json)
	return json
}
