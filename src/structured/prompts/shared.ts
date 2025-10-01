import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"
import type { WidgetCollection, WidgetTypeTuple } from "../../widgets/collections/types"
import { toJSONSchemaPromptSafe } from "@core/json-schema"

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
	
	// Iterate using the allowed keys to ensure we only process what's in the collection's tuple.
	for (const key of allowedWidgetTypes) {
		// Access schema with proper type handling
		const schemaEntry = collection.schemas[key as E[number]]
		
		if (!isZodSchema(schemaEntry)) {
			logger.error("collection schema not a zod type", { key, collectionName: collection.name })
			throw errors.new(`Schema for key '${key}' in collection '${collection.name}' is not a valid Zod schema.`)
		}

		const jsonResult = errors.trySync(() => toJSONSchemaPromptSafe(schemaEntry))
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
