import {
    DataTablePropsSchema,
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
        dataTable: DataTablePropsSchema,
        tapeDiagram: TapeDiagramPropsSchema,
        numberLineWithAction: NumberLineWithActionPropsSchema,
        fractionModelDiagram: FractionModelDiagramPropsSchema,
        quantityFractionalDiagram: QuantityFractionalDiagramPropsSchema
    },
    widgetTypeKeys: [
        "protractorAngleDiagram",
        "nPolygon",
        "dataTable",
        "tapeDiagram",
        "numberLineWithAction",
        "fractionModelDiagram",
        "quantityFractionalDiagram"
    ] as const
} as const


