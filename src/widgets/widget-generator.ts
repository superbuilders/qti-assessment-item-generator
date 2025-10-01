import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { z } from "zod"
import type { WidgetCollection, WidgetDefinition } from "@/widgets/collections/types"
import { allWidgetsCollection } from "@/widgets/collections/all"
import type { WidgetInput } from "@/widgets/registry"

// Type guard to safely check if a key exists in a collection's widgets.
function hasWidget<
	C extends WidgetCollection<Record<string, WidgetDefinition<unknown, unknown>>, readonly string[]>,
	K extends string
>(collection: C, key: K): key is K & keyof C["widgets"] {
	return key in collection.widgets
}

// Pure dispatcher: assumes data has already been validated upstream against the matching schema.
export async function generateWidget<
	C extends WidgetCollection<Record<string, WidgetDefinition<unknown, unknown>>, readonly string[]>,
	K extends keyof C["widgets"] & string
>(collection: C, widgetType: K, data: z.infer<C["widgets"][K]["schema"]>): Promise<string> {
	if (!hasWidget(collection, widgetType)) {
		logger.error("widget type not found in provided collection", { widgetType, collectionName: collection.name })
		throw errors.new("widget type not found in collection")
	}
	const definition = collection.widgets[widgetType]
	return await definition.generator(data)
}

/**
 * Legacy wrapper for tests: accepts WidgetInput (pre or post transform) and dispatches using allWidgetsCollection.
 * Validates the input against the schema before calling the generator.
 * @deprecated Use generateWidget(collection, type, data) in production code.
 */
export async function generateWidgetLegacy(widgetInput: WidgetInput): Promise<string> {
	const widgetType = widgetInput.type
	if (!hasWidget(allWidgetsCollection, widgetType)) {
		logger.error("widget type not found in default collection", { widgetType })
		throw errors.new("widget type not found in default collection")
	}
	const definition = allWidgetsCollection.widgets[widgetType]
	
	// Validate input against the schema to handle transforms (z.input -> z.output)
	const parsed = definition.schema.safeParse(widgetInput)
	if (!parsed.success) {
		logger.error("widget validation failed", { widgetType, error: parsed.error })
		throw errors.wrap(parsed.error, "widget validation")
	}
	
	return await definition.generator(parsed.data as any)
}
