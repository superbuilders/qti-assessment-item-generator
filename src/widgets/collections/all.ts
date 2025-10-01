import type { WidgetCollection } from "@/widgets/collections/types"
import { allWidgetSchemas } from "@/widgets/registry"

function isWidgetKey(key: string): key is keyof typeof allWidgetSchemas {
	return key in allWidgetSchemas
}

const widgetTypeKeys: Array<keyof typeof allWidgetSchemas> = []
for (const k of Object.keys(allWidgetSchemas)) {
	if (isWidgetKey(k)) widgetTypeKeys.push(k)
}

export const allWidgetsCollection: WidgetCollection<typeof widgetTypeKeys> = {
	name: "all",
	schemas: allWidgetSchemas,
	widgetTypeKeys
} as const
