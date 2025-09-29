import { allWidgetSchemas } from "../registry"
import type { WidgetCollection } from "./types"

const widgetTypeKeys = Object.keys(allWidgetSchemas) as Array<keyof typeof allWidgetSchemas>

export const allWidgetsCollection: WidgetCollection = {
	name: "all",
	schemas: allWidgetSchemas,
	widgetTypeKeys
} as const
