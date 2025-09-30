import { z } from "zod"
import { createBlockContentItemSchema as createCoreBlockContentItemSchema, createBlockContentSchema as createCoreBlockContentSchema } from "../compiler/schemas"
import type { WidgetCollection } from "../widgets/collections/types"
import { createWidgetTypeEnumFromCollection } from "./schemas"

/**
 * Creates a collection-scoped BlockContent schema.
 * Extracted to prevent import cycles between structured modules.
 */
export function createBlockContentSchema(collection: WidgetCollection): z.ZodType {
	const ScopedWidgetEnum = createWidgetTypeEnumFromCollection(collection)
	return createCoreBlockContentSchema(ScopedWidgetEnum)
}

/**
 * Creates a collection-scoped BlockContentItem schema.
 */
export function createBlockContentItemSchema(collection: WidgetCollection): z.ZodType {
	const ScopedWidgetEnum = createWidgetTypeEnumFromCollection(collection)
	return createCoreBlockContentItemSchema(ScopedWidgetEnum)
}