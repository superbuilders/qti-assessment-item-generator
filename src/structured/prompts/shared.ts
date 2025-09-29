import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { WidgetCollection } from "../../widgets/collections/types"
import { allWidgetSchemas } from "../../widgets/registry"
import { toJSONSchemaPromptSafe } from "../json-schema"

/**
 * Generates the reusable markdown section for widget selection instructions.
 */
export function createWidgetSelectionPromptSection(collection: WidgetCollection): string {
	const allowedWidgetTypes = collection.widgetTypeKeys
	const widgetSchemas: Record<string, object> = {}

	// Integrity checks
	for (const key of allowedWidgetTypes) {
		if (!collection.schemas[key]) {
			logger.error("collection integrity: missing schema", { key, collection: collection.name })
			throw errors.new(`collection integrity: missing schema for key '${key}' in collection '${collection.name}'`)
		}
		if (!(key in allWidgetSchemas)) {
			logger.error("registry integrity: key not found", { key })
			throw errors.new(`registry integrity: key '${key}' not found in allWidgetSchemas`)
		}
	}

	for (const key of allowedWidgetTypes) {
		const schema = collection.schemas[key]
		if (!schema) continue
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
