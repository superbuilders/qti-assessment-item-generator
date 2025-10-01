import type { WidgetCollection } from "@/widgets/collections/types"
import { allWidgetDefinitions } from "@/widgets/definitions"

export const simpleVisualCollection: WidgetCollection<
	Pick<
		typeof allWidgetDefinitions,
		"emojiImage" | "urlImage" | "vennDiagram" | "periodicTable" | "video"
	>,
	readonly ["emojiImage", "urlImage", "vennDiagram", "periodicTable", "video"]
> = {
	name: "simple-visual",
	widgets: {
		emojiImage: allWidgetDefinitions.emojiImage,
		urlImage: allWidgetDefinitions.urlImage,
		vennDiagram: allWidgetDefinitions.vennDiagram,
		periodicTable: allWidgetDefinitions.periodicTable,
		video: allWidgetDefinitions.video
	},
	widgetTypeKeys: ["emojiImage", "urlImage", "vennDiagram", "periodicTable", "video"]
} as const
