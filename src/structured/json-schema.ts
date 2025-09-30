import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"

type BaseSchema = z.core.JSONSchema.BaseSchema

function isObjectSchema(value: BaseSchema): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

// Recursively enforce JSON Schema objects to disallow unspecified properties
function enforceNoAdditionalProperties(schema: BaseSchema): void {
  if (!isObjectSchema(schema)) return

  const typeValue = (schema as Record<string, unknown>).type
  const props = (schema as Record<string, unknown>).properties
  const hasProperties = isObjectSchema(props as BaseSchema)
  if ((typeValue === "object" || hasProperties) && (schema as Record<string, unknown>).additionalProperties === undefined) {
    ;(schema as Record<string, unknown>).additionalProperties = false
  }

  // Recurse into properties
  if (hasProperties) {
    const properties = props as Record<string, BaseSchema>
    for (const key of Object.keys(properties)) {
      enforceNoAdditionalProperties(properties[key])
    }
  }

  // Recurse into items (can be schema or tuple of schemas)
  const items = (schema as Record<string, unknown>).items as BaseSchema | BaseSchema[] | undefined
  if (Array.isArray(items)) {
    for (const it of items) enforceNoAdditionalProperties(it)
  } else if (items !== undefined) {
    enforceNoAdditionalProperties(items)
  }

  // Recurse into combinators
  const combinators = ["anyOf", "allOf", "oneOf"] as const
  for (const key of combinators) {
    const arr = (schema as Record<string, unknown>)[key] as BaseSchema[] | undefined
    if (Array.isArray(arr)) arr.forEach(enforceNoAdditionalProperties)
  }

  // Recurse into not
  const not = (schema as Record<string, unknown>).not as BaseSchema | undefined
  if (not !== undefined) enforceNoAdditionalProperties(not)

  // Recurse into definitions/$defs if present
  const defs = (schema as Record<string, unknown>).definitions as Record<string, BaseSchema> | undefined
  const $defs = (schema as Record<string, unknown>)["$defs"] as Record<string, BaseSchema> | undefined
  if (defs) {
    for (const key of Object.keys(defs)) enforceNoAdditionalProperties(defs[key])
  }
  if ($defs) {
    for (const key of Object.keys($defs)) enforceNoAdditionalProperties($defs[key])
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
		io: "input",
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
  if (!json || (typeof json !== "boolean" && typeof json !== "object") || (typeof json === "object" && Object.keys(json).length === 0)) {
		logger.error("json schema prompt-safe conversion produced empty")
		throw errors.new("json schema conversion empty")
	}
  // Ensure all object schemas disallow unspecified properties to satisfy strict validators
  enforceNoAdditionalProperties(json)
	return json
}
