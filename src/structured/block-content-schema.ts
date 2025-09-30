import { z } from "zod"
import {
	createBlockContentItemSchema as createBlockContentItemSchemaFromCompiler,
	createBlockContentSchema as createBlockContentSchemaFromCompiler
} from "../compiler/schemas"
import type { BlockContent, BlockContentItem } from "../compiler/schemas"
import type { WidgetTypeTuple } from "../widgets/collections/types"

/**
 * Creates a collection-scoped BlockContent schema.
 * Extracted to prevent import cycles between structured modules.
 */
export function createBlockContentSchema<const E extends WidgetTypeTuple>(
	widgetTypeKeys: E
): z.ZodType<BlockContent<E>> {
	return createBlockContentSchemaFromCompiler(widgetTypeKeys)
}

/**
 * Creates a collection-scoped BlockContentItem schema.
 */
export function createBlockContentItemSchema<const E extends WidgetTypeTuple>(
	widgetTypeKeys: E
): z.ZodType<BlockContentItem<E>> {
	return createBlockContentItemSchemaFromCompiler(widgetTypeKeys)
}