import type { WidgetCollection } from "@/widgets/collections/types"
import { allWidgetDefinitions } from "@/widgets/definitions"

export const teksMath4Collection: WidgetCollection<
	Pick<
		typeof allWidgetDefinitions,
		| "protractorAngleDiagram"
		| "nPolygon"
		| "dotPlot"
		| "tapeDiagram"
		| "stripDiagram"
		| "numberLineWithAction"
		| "fractionModelDiagram"
		| "quantityFractionalDiagram"
		| "symmetryDiagram"
	>,
	readonly [
		"protractorAngleDiagram",
		"nPolygon",
		"dotPlot",
		"tapeDiagram",
		"stripDiagram",
		"numberLineWithAction",
		"fractionModelDiagram",
		"quantityFractionalDiagram",
		"symmetryDiagram"
	]
> = {
	name: "teks-math-4",
	widgets: {
		protractorAngleDiagram: allWidgetDefinitions.protractorAngleDiagram,
		nPolygon: allWidgetDefinitions.nPolygon,
		dotPlot: allWidgetDefinitions.dotPlot,
		tapeDiagram: allWidgetDefinitions.tapeDiagram,
		stripDiagram: allWidgetDefinitions.stripDiagram,
		numberLineWithAction: allWidgetDefinitions.numberLineWithAction,
		fractionModelDiagram: allWidgetDefinitions.fractionModelDiagram,
		quantityFractionalDiagram: allWidgetDefinitions.quantityFractionalDiagram,
		symmetryDiagram: allWidgetDefinitions.symmetryDiagram
	},
	widgetTypeKeys: [
		"protractorAngleDiagram",
		"nPolygon",
		"dotPlot",
		"tapeDiagram",
		"stripDiagram",
		"numberLineWithAction",
		"fractionModelDiagram",
		"quantityFractionalDiagram",
		"symmetryDiagram"
	]
} as const
