import {
	DataTablePropsSchema,
	EmojiImagePropsSchema,
	PeriodicTableWidgetPropsSchema,
	UrlImageWidgetPropsSchema,
	VennDiagramPropsSchema,
	VideoPropsSchema
} from "../registry"

export const simpleVisualCollection = {
	name: "simple-visual",
	schemas: {
		dataTable: DataTablePropsSchema,
		emojiImage: EmojiImagePropsSchema,
		urlImage: UrlImageWidgetPropsSchema,
		vennDiagram: VennDiagramPropsSchema,
		periodicTable: PeriodicTableWidgetPropsSchema,
		video: VideoPropsSchema
	},
	widgetTypeKeys: ["dataTable", "emojiImage", "urlImage", "vennDiagram", "periodicTable", "video"] as const
} as const
