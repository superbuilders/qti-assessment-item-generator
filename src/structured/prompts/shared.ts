import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"
import type { WidgetCollection, WidgetTypeTuple } from "../../widgets/collections/types"
import { allWidgetSchemas } from "../../widgets/registry"
import { toJSONSchemaPromptSafe } from "../json-schema"

// Runtime type guard to ensure values are Zod schemas without using type assertions
function isZodSchema(value: unknown): value is z.ZodType<unknown> {
    return value instanceof z.ZodType
}

/**
 * Generates the reusable markdown section for widget selection instructions.
 */
export function createWidgetSelectionPromptSection<E extends WidgetTypeTuple>(collection: WidgetCollection<E>): string {
	const allowedWidgetTypes = collection.widgetTypeKeys
	const widgetSchemas: Record<string, object> = {}
	
	// Convert to Set of strings for easier checking
	const allowedSet = new Set(allowedWidgetTypes.map(String))

	// Integrity checks - verify all declared widget types exist in schemas and registry
	for (const key of allowedWidgetTypes) {
		if (!Object.prototype.hasOwnProperty.call(allWidgetSchemas, key)) {
			logger.error("registry integrity: key not found", { key })
			throw errors.new(`registry integrity: key '${key}' not found in allWidgetSchemas`)
		}
	}

	// Iterate using Object.entries to get proper types without assertions
	for (const [key, schema] of Object.entries(collection.schemas)) {
		// Verify this schema key is in the allowed list
		if (!allowedSet.has(key)) {
			continue
		}
		
    if (!isZodSchema(schema)) {
        logger.error("collection schema not a zod type", { key })
        throw errors.new("collection schema must be a Zod schema")
    }
    const jsonResult = errors.trySync(() => toJSONSchemaPromptSafe(schema))
		if (jsonResult.error) {
			logger.error("widget schema json conversion", { key, error: jsonResult.error })
			throw errors.wrap(jsonResult.error, "widget schema json conversion")
		}
		widgetSchemas[key] = jsonResult.data
	}
	const widgetSchemasJson = JSON.stringify(widgetSchemas, null, 2)

	return `
## Available Widget Types and Schemas
You MUST choose a \`widgetType\` from this exact list: \`[${Array.from(allowedWidgetTypes)
		.map((t) => `"${t}"`)
		.join(", ")}]\`.
Here are the FULL JSON schemas for each available widget:
\`\`\`json
${widgetSchemasJson}
\`\`\`
`
}

/**
 * Format unified context sections for all prompts
 */
export function formatUnifiedContextSections(
	envelope: { primaryContent: string; supplementaryContent: string[] },
	imageContext: { imageUrls: string[] }
): string {
	const sections: string[] = []

	sections.push("## Primary Content (Perseus JSON):")
	sections.push("```json")
	sections.push(envelope.primaryContent)
	sections.push("```")

	if (envelope.supplementaryContent && envelope.supplementaryContent.length > 0) {
		sections.push("\n## Supplementary Content:")
		for (let i = 0; i < envelope.supplementaryContent.length; i++) {
			sections.push(`\n### Supplement ${i + 1}:`)
			sections.push("```")
			sections.push(envelope.supplementaryContent[i])
			sections.push("```")
		}
	}

	if (imageContext.imageUrls && imageContext.imageUrls.length > 0) {
		sections.push("\n## Visual Context:")
		sections.push(
			`This assessment includes ${imageContext.imageUrls.length} raster image(s) provided as multimodal input for your vision capabilities.`
		)
		sections.push("Use these images to understand visual content that will be represented by widgets.")
	}

	return sections.join("\n")
}
