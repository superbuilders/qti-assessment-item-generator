import type { WidgetCollection } from "@/widgets/collections/types"
import { allWidgetDefinitions } from "@/widgets/definitions"

export const teksMath4Collection: WidgetCollection<
	Pick<
		typeof allWidgetDefinitions,
		| "protractorAngleDiagram"
		| "nPolygon"
		| "dotPlot"
		| "pictograph"
		| "tapeDiagram"
		| "numberLineWithAction"
		| "fractionModelDiagram"
		| "quantityFractionalDiagram"
		| "symmetryDiagram"
		| "stemLeafPlot"
		| "dataTable"
		| "geometricPrimitiveDiagram"
	>,
	readonly [
		"protractorAngleDiagram",
		"nPolygon",
		"dotPlot",
		"pictograph",
		"tapeDiagram",
		"numberLineWithAction",
		"fractionModelDiagram",
		"quantityFractionalDiagram",
		"symmetryDiagram",
		"stemLeafPlot",
		"dataTable",
		"geometricPrimitiveDiagram"
	]
> = {
	name: "teks-math-4",
	widgets: {
		protractorAngleDiagram: allWidgetDefinitions.protractorAngleDiagram,
		nPolygon: allWidgetDefinitions.nPolygon,
		dotPlot: allWidgetDefinitions.dotPlot,
		pictograph: allWidgetDefinitions.pictograph,
		tapeDiagram: allWidgetDefinitions.tapeDiagram,
		numberLineWithAction: allWidgetDefinitions.numberLineWithAction,
		fractionModelDiagram: allWidgetDefinitions.fractionModelDiagram,
		quantityFractionalDiagram: allWidgetDefinitions.quantityFractionalDiagram,
		symmetryDiagram: allWidgetDefinitions.symmetryDiagram,
		stemLeafPlot: allWidgetDefinitions.stemLeafPlot,
		dataTable: allWidgetDefinitions.dataTable,
		geometricPrimitiveDiagram: allWidgetDefinitions.geometricPrimitiveDiagram
	},
	widgetTypeKeys: [
		"protractorAngleDiagram",
		"nPolygon",
		"dotPlot",
		"pictograph",
		"tapeDiagram",
		"numberLineWithAction",
		"fractionModelDiagram",
		"quantityFractionalDiagram",
		"symmetryDiagram",
		"stemLeafPlot",
		"dataTable",
		"geometricPrimitiveDiagram"
	]
} as const
