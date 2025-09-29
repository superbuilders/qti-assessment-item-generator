import { SymmetryDiagramPropsSchema } from "../generators/symmetry-diagram"
import {
	DotPlotPropsSchema,
	FractionModelDiagramPropsSchema,
	NPolygonPropsSchema,
	NumberLineWithActionPropsSchema,
	ProtractorAngleDiagramPropsSchema,
	QuantityFractionalDiagramPropsSchema,
	TapeDiagramPropsSchema
} from "../registry"

export const teksMath4Collection = {
	name: "teks-math-4",
	schemas: {
		protractorAngleDiagram: ProtractorAngleDiagramPropsSchema,
		nPolygon: NPolygonPropsSchema,
		dotPlot: DotPlotPropsSchema,
		tapeDiagram: TapeDiagramPropsSchema,
		numberLineWithAction: NumberLineWithActionPropsSchema,
		fractionModelDiagram: FractionModelDiagramPropsSchema,
		quantityFractionalDiagram: QuantityFractionalDiagramPropsSchema,
		symmetryDiagram: SymmetryDiagramPropsSchema
	},
	widgetTypeKeys: [
		"protractorAngleDiagram",
		"nPolygon",
		"dotPlot",
		"tapeDiagram",
		"numberLineWithAction",
		"fractionModelDiagram",
		"quantityFractionalDiagram",
		"symmetryDiagram"
	] as const
} as const
