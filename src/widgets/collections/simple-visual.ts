import {
	EmojiImagePropsSchema,
	PeriodicTableWidgetPropsSchema,
	UrlImageWidgetPropsSchema,
	VennDiagramPropsSchema,
	VideoPropsSchema
} from "../registry"

export const simpleVisualCollection = {
	name: "simple-visual",
	schemas: {
		emojiImage: EmojiImagePropsSchema,
		urlImage: UrlImageWidgetPropsSchema,
		vennDiagram: VennDiagramPropsSchema,
		periodicTable: PeriodicTableWidgetPropsSchema,
		video: VideoPropsSchema
	},
	widgetTypeKeys: ["emojiImage", "urlImage", "vennDiagram", "periodicTable", "video"] as const
} as const
