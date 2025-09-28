import {
    FractionModelDiagramPropsSchema,
    NPolygonPropsSchema,
    NumberLineWithActionPropsSchema,
    ProtractorAngleDiagramPropsSchema,
    QuantityFractionalDiagramPropsSchema,
    TapeDiagramPropsSchema,
    DotPlotPropsSchema
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
        quantityFractionalDiagram: QuantityFractionalDiagramPropsSchema
    },
    widgetTypeKeys: [
        "protractorAngleDiagram",
        "nPolygon",
        "dotPlot",
        "tapeDiagram",
        "numberLineWithAction",
        "fractionModelDiagram",
        "quantityFractionalDiagram"
    ] as const
} as const


