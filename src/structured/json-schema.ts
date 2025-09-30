import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"

type BaseSchema = z.core.JSONSchema.BaseSchema

/**
 * Converts a Zod schema to JSON Schema suitable for prompt-time usage.
 * - Recursively unwraps transform nodes by converting the inner (input) schema
 * - Uses io: "input" so prompt schemas reflect input shape
 * - Fails hard if conversion throws or produces an empty schema
 */
export function toJSONSchemaPromptSafe(schema: z.ZodType): BaseSchema {
	// Define options with a self-referential override to unwrap transforms recursively
	const options: Parameters<typeof z.toJSONSchema>[1] = {
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
	return json
}
