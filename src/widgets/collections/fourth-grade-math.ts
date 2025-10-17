import type { WidgetCollection } from "@/widgets/collections/types"
import { allWidgetDefinitions } from "@/widgets/definitions"

export const fourthGradeMathCollection: WidgetCollection<
	Pick<
		typeof allWidgetDefinitions,
		| "clockDiagram"
		| "wheelDiagram"
		| "geometricPrimitiveDiagram"
		| "angleTypeDiagram"
		| "tapeDiagram"
		| "fractionModelDiagram"
		| "fractionSumDiagram"
		| "fractionMultiplicationModel"
		| "fractionFrequencyPlot"
		| "divisionAreaDiagram"
		| "divisionModelDiagram"
		| "factorizationDiagram"
		| "numberLine"
		| "numberLineWithAction"
		| "protractorAngleDiagram"
		| "quantityFractionalDiagram"
		| "additionWithRegrouping"
		| "subtractionWithRegrouping"
		| "verticalArithmeticSetup"
		| "boxGrid"
		| "barChart"
		| "equivalentFractionModel"
		| "areaModelMultiplication"
		| "simpleArrow"
		| "vectorDiagram"
		| "nPolygon"
		| "patternDiagram"
		| "transformationDiagram"
		| "labeledRectangleDiagram"
		| "customPolygonDiagram"
	>,
	readonly [
		"clockDiagram",
		"wheelDiagram",
		"geometricPrimitiveDiagram",
		"angleTypeDiagram",
		"tapeDiagram",
		"fractionModelDiagram",
		"fractionSumDiagram",
		"fractionMultiplicationModel",
		"fractionFrequencyPlot",
		"divisionAreaDiagram",
		"divisionModelDiagram",
		"factorizationDiagram",
		"numberLine",
		"numberLineWithAction",
		"protractorAngleDiagram",
		"quantityFractionalDiagram",
		"additionWithRegrouping",
		"subtractionWithRegrouping",
		"verticalArithmeticSetup",
		"boxGrid",
		"barChart",
		"equivalentFractionModel",
		"areaModelMultiplication",
		"simpleArrow",
		"vectorDiagram",
		"nPolygon",
		"patternDiagram",
		"transformationDiagram",
		"labeledRectangleDiagram",
		"customPolygonDiagram"
	]
> = {
	name: "fourth-grade-math",
	widgets: {
		clockDiagram: allWidgetDefinitions.clockDiagram,
		wheelDiagram: allWidgetDefinitions.wheelDiagram,
		geometricPrimitiveDiagram: allWidgetDefinitions.geometricPrimitiveDiagram,
		angleTypeDiagram: allWidgetDefinitions.angleTypeDiagram,
		tapeDiagram: allWidgetDefinitions.tapeDiagram,
		fractionModelDiagram: allWidgetDefinitions.fractionModelDiagram,
		fractionSumDiagram: allWidgetDefinitions.fractionSumDiagram,
		fractionMultiplicationModel:
			allWidgetDefinitions.fractionMultiplicationModel,
		fractionFrequencyPlot: allWidgetDefinitions.fractionFrequencyPlot,
		divisionAreaDiagram: allWidgetDefinitions.divisionAreaDiagram,
		divisionModelDiagram: allWidgetDefinitions.divisionModelDiagram,
		factorizationDiagram: allWidgetDefinitions.factorizationDiagram,
		numberLine: allWidgetDefinitions.numberLine,
		numberLineWithAction: allWidgetDefinitions.numberLineWithAction,
		protractorAngleDiagram: allWidgetDefinitions.protractorAngleDiagram,
		quantityFractionalDiagram: allWidgetDefinitions.quantityFractionalDiagram,
		additionWithRegrouping: allWidgetDefinitions.additionWithRegrouping,
		subtractionWithRegrouping: allWidgetDefinitions.subtractionWithRegrouping,
		verticalArithmeticSetup: allWidgetDefinitions.verticalArithmeticSetup,
		boxGrid: allWidgetDefinitions.boxGrid,
		barChart: allWidgetDefinitions.barChart,
		equivalentFractionModel: allWidgetDefinitions.equivalentFractionModel,
		areaModelMultiplication: allWidgetDefinitions.areaModelMultiplication,
		simpleArrow: allWidgetDefinitions.simpleArrow,
		vectorDiagram: allWidgetDefinitions.vectorDiagram,
		nPolygon: allWidgetDefinitions.nPolygon,
		patternDiagram: allWidgetDefinitions.patternDiagram,
		transformationDiagram: allWidgetDefinitions.transformationDiagram,
		labeledRectangleDiagram: allWidgetDefinitions.labeledRectangleDiagram,
		customPolygonDiagram: allWidgetDefinitions.customPolygonDiagram
	},
	widgetTypeKeys: [
		"clockDiagram",
		"wheelDiagram",
		"geometricPrimitiveDiagram",
		"angleTypeDiagram",
		"tapeDiagram",
		"fractionModelDiagram",
		"fractionSumDiagram",
		"fractionMultiplicationModel",
		"fractionFrequencyPlot",
		"divisionAreaDiagram",
		"divisionModelDiagram",
		"factorizationDiagram",
		"numberLine",
		"numberLineWithAction",
		"protractorAngleDiagram",
		"quantityFractionalDiagram",
		"additionWithRegrouping",
		"subtractionWithRegrouping",
		"verticalArithmeticSetup",
		"boxGrid",
		"barChart",
		"equivalentFractionModel",
		"areaModelMultiplication",
		"simpleArrow",
		"vectorDiagram",
		"nPolygon",
		"patternDiagram",
		"transformationDiagram",
		"labeledRectangleDiagram",
		"customPolygonDiagram"
	]
} as const
