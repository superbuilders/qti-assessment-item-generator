import type { WidgetCollection } from "@/widgets/collections/types"
import { allWidgetDefinitions } from "@/widgets/definitions"

export const allWidgetsCollection: WidgetCollection<typeof allWidgetDefinitions, ReadonlyArray<keyof typeof allWidgetDefinitions & string>> = {
	name: "all",
	widgets: allWidgetDefinitions,
	widgetTypeKeys: Object.keys(allWidgetDefinitions) as ReadonlyArray<keyof typeof allWidgetDefinitions & string>
} as const
