import type { z } from "zod"
import type { allWidgetSchemas } from "../registry"

// Create a union type of all valid widget keys from the central registry.
type AllWidgetKeys = keyof typeof allWidgetSchemas

// Redefine WidgetTypeTuple to be a readonly array of valid widget keys.
// This allows for an empty array and enforces that all members are known widget types.
export type WidgetTypeTuple = readonly AllWidgetKeys[]

// Update the default generic for WidgetCollection to reflect the new, more flexible tuple.
export type WidgetCollection<E extends WidgetTypeTuple = readonly AllWidgetKeys[]> = {
    readonly name: string
    readonly widgetTypeKeys: E
    readonly schemas: { [K in E[number]]: z.ZodType<unknown> }
}
