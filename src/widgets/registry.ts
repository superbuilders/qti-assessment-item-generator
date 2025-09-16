import { z } from "zod"

// Import individual schemas and keep their generators defined in their own files
import { ThreeDIntersectionDiagramPropsSchema } from "./generators/3d-intersection-diagram"
import { AbsoluteValueNumberLinePropsSchema } from "./generators/absolute-value-number-line"
import { AdditionWithRegroupingPropsSchema } from "./generators/addition-with-regrouping"
import { AngleDiagramPropsSchema } from "./generators/angle-diagram"
import { AngleTypeDiagramPropsSchema } from "./generators/angle-type-diagram"
import { AreaGraphPropsSchema } from "./generators/area-graph"
import { AreaModelMultiplicationPropsSchema } from "./generators/area-model-multiplication"
import { BarChartPropsSchema } from "./generators/bar-chart"
import { BoxGridPropsSchema } from "./generators/box-grid"
import { BoxPlotPropsSchema } from "./generators/box-plot"
import { CircleAngleDiagramPropsSchema } from "./generators/circle-angle-diagram"
import { CircleDiagramPropsSchema } from "./generators/circle-diagram"
import { ClockDiagramPropsSchema } from "./generators/clock-diagram"
import { CompositeShapeDiagramPropsSchema } from "./generators/composite-shape-diagram"
import { ConceptualGraphPropsSchema } from "./generators/conceptual-graph"
import { ConstraintGeometryDiagramPropsSchema } from "./generators/constraint-geometry-diagram"
import { CoordinatePlaneComprehensivePropsSchema } from "./generators/coordinate-plane-comprehensive"
import { CustomPolygonDiagramPropsSchema } from "./generators/custom-polygon-diagram"
import { DataTablePropsSchema } from "./generators/data-table"
import { DiscreteObjectRatioDiagramPropsSchema } from "./generators/discrete-object-ratio-diagram"
import { DistanceFormulaGraphPropsSchema } from "./generators/distance-formula-graph"
import { DivergentBarChartPropsSchema } from "./generators/divergent-bar-chart"
import { DivisionAreaDiagramPropsSchema } from "./generators/division-area-diagram"
import { DivisionModelDiagramPropsSchema } from "./generators/division-model-diagram"
import { DotPlotPropsSchema } from "./generators/dot-plot"
import { DoubleNumberLinePropsSchema } from "./generators/double-number-line"
import { EmojiImagePropsSchema } from "./generators/emoji-image"
import { EquivalentFractionModelPropsSchema } from "./generators/equivalent-fraction-model"
import { FactorizationDiagramPropsSchema } from "./generators/factorization-diagram"
import { FigureComparisonDiagramPropsSchema } from "./generators/figure-comparison-diagram"
import { FractionFrequencyPlotPropsSchema } from "./generators/fraction-frequency-plot"
import { FractionMultiplicationModelPropsSchema } from "./generators/fraction-multiplication-model"
import { FractionNumberLinePropsSchema } from "./generators/fraction-number-line"
import { FractionSumDiagramPropsSchema } from "./generators/fraction-sum-diagram"
import { FractionModelDiagramPropsSchema } from "./generators/fractional-model-diagram"
import { FreeBodyDiagramPropsSchema } from "./generators/free-body-diagram"
import { FunctionPlotGraphPropsSchema } from "./generators/function-plot-graph"
import { GeometricPrimitiveDiagramPropsSchema } from "./generators/geometric-primitive-diagram"
import { GeometricSolidDiagramPropsSchema } from "./generators/geometric-solid-diagram"
import { HangerDiagramPropsSchema } from "./generators/hanger-diagram"
import { HistogramPropsSchema } from "./generators/histogram"
import { InequalityNumberLinePropsSchema } from "./generators/inequality-number-line"
import { IntegerChipModelPropsSchema } from "./generators/integer-chip-model"
import { KeelingCurvePropsSchema } from "./generators/keeling-curve"
import { LabeledRectangleDiagramPropsSchema } from "./generators/labeled-rectangle-diagram"
import { LineDiagramPropsSchema } from "./generators/line-diagram"
import { LineEquationGraphPropsSchema } from "./generators/line-equation-graph"
import { LineGraphPropsSchema } from "./generators/line-graph"
import { MarbleDiagramPropsSchema } from "./generators/marble-diagram"
import { NPolygonPropsSchema } from "./generators/n-polygon"
import { NestedShapeDiagramPropsSchema } from "./generators/nested-shape-diagram"
import { NumberLinePropsSchema } from "./generators/number-line"
import { NumberLineForOppositesPropsSchema } from "./generators/number-line-for-opposites"
import { NumberLineWithActionPropsSchema } from "./generators/number-line-with-action"
import { NumberLineWithFractionGroupsPropsSchema } from "./generators/number-line-with-fraction-groups"
import { NumberSetDiagramPropsSchema } from "./generators/number-set-diagram"
import { ParabolaGraphPropsSchema } from "./generators/parabola-graph"
import { ParallelogramTrapezoidDiagramPropsSchema } from "./generators/parallelogram-trapezoid-diagram"
import { PartitionedShapePropsSchema } from "./generators/partitioned-shape"
import { PatternDiagramPropsSchema } from "./generators/pattern-diagram"
import { PentagonIntersectionDiagramPropsSchema } from "./generators/pentagon-intersection-diagram"
import { PeriodicTableWidgetPropsSchema } from "./generators/periodic-table"
import { PESSpectrumPropsSchema } from "./generators/pes-spectrum"
import { PieChartWidgetPropsSchema } from "./generators/pi-chart"
import { PictographPropsSchema } from "./generators/pictograph"
import { PointPlotGraphPropsSchema } from "./generators/point-plot-graph"
import { PolygonGraphPropsSchema } from "./generators/polygon-graph"
import { PolyhedronDiagramPropsSchema } from "./generators/polyhedron-diagram"
import { PolyhedronNetDiagramPropsSchema } from "./generators/polyhedron-net-diagram"
import { PopulationBarChartPropsSchema } from "./generators/population-bar-chart"
import { PopulationChangeEventGraphPropsSchema } from "./generators/population-change-event-graph"
import { ProbabilitySpinnerPropsSchema } from "./generators/probability-spinner"
import { ProtractorAngleDiagramPropsSchema } from "./generators/protractor-angle-diagram"
import { PythagoreanProofDiagramPropsSchema } from "./generators/pythagorean-proof-diagram"
import { QuadrantDiagramPropsSchema } from "./generators/quadrant-diagram"
import { QuantityFractionalDiagramPropsSchema } from "./generators/quantity-fractional-diagram"
import { RadiallyConstrainedAngleDiagramPropsSchema } from "./generators/radially-constrained-angle-diagram"
import { RatioBoxDiagramPropsSchema } from "./generators/ratio-box-diagram"
import { RectangularFrameDiagramPropsSchema } from "./generators/rectangular-frame-diagram"
import { ScaleCopiesSliderPropsSchema } from "./generators/scale-copies-slider"
import { ScatterPlotPropsSchema } from "./generators/scatter-plot"
import { ShapeTransformationGraphPropsSchema } from "./generators/shape-transformation-graph"
import { SimpleArrowPropsSchema } from "./generators/simple-arrow"
import { SinCosineWidgetPropsSchema } from "./generators/sin-cosine-widget"
import { StackedItemsDiagramPropsSchema } from "./generators/stacked-items-diagram"
import { StickPlotPropsSchema } from "./generators/stick-plot"
import { SubtractionWithRegroupingPropsSchema } from "./generators/subtraction-with-regrouping"
import { TapeDiagramPropsSchema } from "./generators/tape-diagram"
import { TransformationDiagramPropsSchema } from "./generators/transformation-diagram"
import { TransformationOnAGridPropsSchema } from "./generators/transformation-on-a-grid"
import { TransversalAngleDiagramPropsSchema } from "./generators/transversal-angle-diagram"
import { TreeDiagramPropsSchema } from "./generators/tree-diagram"
import { TriangleDiagramPropsSchema } from "./generators/triangle-diagram"
import { UnitBlockDiagramPropsSchema } from "./generators/unit-block-diagram"
import { UrlImageWidgetPropsSchema } from "./generators/url-image"
import { VectorDiagramPropsSchema } from "./generators/vector-diagram"
import { VennDiagramPropsSchema } from "./generators/venn-diagram"
import { VerticalArithmeticSetupPropsSchema } from "./generators/vertical-arithmetic-setup"
import { WheelDiagramPropsSchema } from "./generators/wheel-diagram"

// Master registry of widget schemas for dynamic validation and prompting
export const allWidgetSchemas = {
	threeDIntersectionDiagram: ThreeDIntersectionDiagramPropsSchema,
	absoluteValueNumberLine: AbsoluteValueNumberLinePropsSchema,
	quadrantDiagram: QuadrantDiagramPropsSchema,
	clockDiagram: ClockDiagramPropsSchema,
	angleDiagram: AngleDiagramPropsSchema,
	angleTypeDiagram: AngleTypeDiagramPropsSchema,
	circleAngleDiagram: CircleAngleDiagramPropsSchema,
	areaModelMultiplication: AreaModelMultiplicationPropsSchema,
	areaGraph: AreaGraphPropsSchema,
	barChart: BarChartPropsSchema,
	boxGrid: BoxGridPropsSchema,
	boxPlot: BoxPlotPropsSchema,
	circleDiagram: CircleDiagramPropsSchema,
	fractionModelDiagram: FractionModelDiagramPropsSchema,
	fractionMultiplicationModel: FractionMultiplicationModelPropsSchema,
	compositeShapeDiagram: CompositeShapeDiagramPropsSchema,
	nestedShapeDiagram: NestedShapeDiagramPropsSchema,
	conceptualGraph: ConceptualGraphPropsSchema,
	constraintGeometryDiagram: ConstraintGeometryDiagramPropsSchema,
	coordinatePlane: CoordinatePlaneComprehensivePropsSchema,
	distanceFormulaGraph: DistanceFormulaGraphPropsSchema,
	divergentBarChart: DivergentBarChartPropsSchema,
	functionPlotGraph: FunctionPlotGraphPropsSchema,
	lineEquationGraph: LineEquationGraphPropsSchema,
	pointPlotGraph: PointPlotGraphPropsSchema,
	populationChangeEventGraph: PopulationChangeEventGraphPropsSchema,
	polygonGraph: PolygonGraphPropsSchema,
	protractorAngleDiagram: ProtractorAngleDiagramPropsSchema,
	radiallyConstrainedAngleDiagram: RadiallyConstrainedAngleDiagramPropsSchema,
	shapeTransformationGraph: ShapeTransformationGraphPropsSchema,
	dataTable: DataTablePropsSchema,
	discreteObjectRatioDiagram: DiscreteObjectRatioDiagramPropsSchema,
	dotPlot: DotPlotPropsSchema,
	doubleNumberLine: DoubleNumberLinePropsSchema,
	populationBarChart: PopulationBarChartPropsSchema,
	emojiImage: EmojiImagePropsSchema,
	figureComparisonDiagram: FigureComparisonDiagramPropsSchema,
	fractionNumberLine: FractionNumberLinePropsSchema,
	fractionSumDiagram: FractionSumDiagramPropsSchema,
	geometricPrimitiveDiagram: GeometricPrimitiveDiagramPropsSchema,
	geometricSolidDiagram: GeometricSolidDiagramPropsSchema,
	hangerDiagram: HangerDiagramPropsSchema,
	histogram: HistogramPropsSchema,
	nPolygon: NPolygonPropsSchema,
	patternDiagram: PatternDiagramPropsSchema,
	inequalityNumberLine: InequalityNumberLinePropsSchema,
	keelingCurve: KeelingCurvePropsSchema,
	lineGraph: LineGraphPropsSchema,
	numberLine: NumberLinePropsSchema,
	numberLineForOpposites: NumberLineForOppositesPropsSchema,
	numberLineWithAction: NumberLineWithActionPropsSchema,
	numberLineWithFractionGroups: NumberLineWithFractionGroupsPropsSchema,
	numberSetDiagram: NumberSetDiagramPropsSchema,
	parabolaGraph: ParabolaGraphPropsSchema,
	partitionedShape: PartitionedShapePropsSchema,
	pentagonIntersectionDiagram: PentagonIntersectionDiagramPropsSchema,
	pictograph: PictographPropsSchema,
	integerChipModel: IntegerChipModelPropsSchema,
	polyhedronDiagram: PolyhedronDiagramPropsSchema,
	probabilitySpinner: ProbabilitySpinnerPropsSchema,
	polyhedronNetDiagram: PolyhedronNetDiagramPropsSchema,
	pythagoreanProofDiagram: PythagoreanProofDiagramPropsSchema,
	quantityFractionalDiagram: QuantityFractionalDiagramPropsSchema,
	ratioBoxDiagram: RatioBoxDiagramPropsSchema,
	rectangularFrameDiagram: RectangularFrameDiagramPropsSchema,
	scaleCopiesSlider: ScaleCopiesSliderPropsSchema,
	simpleArrow: SimpleArrowPropsSchema,
	sinCosineWidget: SinCosineWidgetPropsSchema,
	scatterPlot: ScatterPlotPropsSchema,
	stackedItemsDiagram: StackedItemsDiagramPropsSchema,
	tapeDiagram: TapeDiagramPropsSchema,
	transformationDiagram: TransformationDiagramPropsSchema,
	transformationOnAGrid: TransformationOnAGridPropsSchema,
	transversalAngleDiagram: TransversalAngleDiagramPropsSchema,
	treeDiagram: TreeDiagramPropsSchema,
	triangleDiagram: TriangleDiagramPropsSchema,
	unitBlockDiagram: UnitBlockDiagramPropsSchema,
	periodicTable: PeriodicTableWidgetPropsSchema,
	urlImage: UrlImageWidgetPropsSchema,
	vennDiagram: VennDiagramPropsSchema,
	verticalArithmeticSetup: VerticalArithmeticSetupPropsSchema,
	vectorDiagram: VectorDiagramPropsSchema,
	parallelogramTrapezoidDiagram: ParallelogramTrapezoidDiagramPropsSchema,
	pieChart: PieChartWidgetPropsSchema,
	fractionFrequencyPlot: FractionFrequencyPlotPropsSchema,
	freeBodyDiagram: FreeBodyDiagramPropsSchema,
	divisionAreaDiagram: DivisionAreaDiagramPropsSchema,
	divisionModelDiagram: DivisionModelDiagramPropsSchema,
	factorizationDiagram: FactorizationDiagramPropsSchema,
	equivalentFractionModel: EquivalentFractionModelPropsSchema,
	subtractionWithRegrouping: SubtractionWithRegroupingPropsSchema,
	additionWithRegrouping: AdditionWithRegroupingPropsSchema,
	wheelDiagram: WheelDiagramPropsSchema,
	labeledRectangleDiagram: LabeledRectangleDiagramPropsSchema,
	customPolygonDiagram: CustomPolygonDiagramPropsSchema,
	lineDiagram: LineDiagramPropsSchema,
	pesSpectrum: PESSpectrumPropsSchema,
	stickPlot: StickPlotPropsSchema,
	marbleDiagram: MarbleDiagramPropsSchema
} as const

export const typedSchemas = allWidgetSchemas

// Re-export all individual schemas for use in collections
export {
	ThreeDIntersectionDiagramPropsSchema,
	AbsoluteValueNumberLinePropsSchema,
	QuadrantDiagramPropsSchema,
	AdditionWithRegroupingPropsSchema,
	AngleDiagramPropsSchema,
	AngleTypeDiagramPropsSchema,
	AreaGraphPropsSchema,
	AreaModelMultiplicationPropsSchema,
	BarChartPropsSchema,
	BoxGridPropsSchema,
	BoxPlotPropsSchema,
	CircleDiagramPropsSchema,
	CircleAngleDiagramPropsSchema,
	CompositeShapeDiagramPropsSchema,
	NestedShapeDiagramPropsSchema,
	ConceptualGraphPropsSchema,
	ConstraintGeometryDiagramPropsSchema,
	CoordinatePlaneComprehensivePropsSchema,
	DataTablePropsSchema,
	DiscreteObjectRatioDiagramPropsSchema,
	DistanceFormulaGraphPropsSchema,
	DivergentBarChartPropsSchema,
	DivisionAreaDiagramPropsSchema,
	DivisionModelDiagramPropsSchema,
	DotPlotPropsSchema,
	DoubleNumberLinePropsSchema,
	EmojiImagePropsSchema,
	EquivalentFractionModelPropsSchema,
	FactorizationDiagramPropsSchema,
	FigureComparisonDiagramPropsSchema,
	FractionFrequencyPlotPropsSchema,
	FractionMultiplicationModelPropsSchema,
	FractionNumberLinePropsSchema,
	FractionSumDiagramPropsSchema,
	FractionModelDiagramPropsSchema,
	FreeBodyDiagramPropsSchema,
	FunctionPlotGraphPropsSchema,
	GeometricPrimitiveDiagramPropsSchema,
	GeometricSolidDiagramPropsSchema,
	HangerDiagramPropsSchema,
	HistogramPropsSchema,
	InequalityNumberLinePropsSchema,
	KeelingCurvePropsSchema,
	LineEquationGraphPropsSchema,
	LineGraphPropsSchema,
	NPolygonPropsSchema,
	PatternDiagramPropsSchema,
	NumberLinePropsSchema,
	NumberLineForOppositesPropsSchema,
	NumberLineWithActionPropsSchema,
	NumberLineWithFractionGroupsPropsSchema,
	NumberSetDiagramPropsSchema,
	ParabolaGraphPropsSchema,
	ParallelogramTrapezoidDiagramPropsSchema,
	PartitionedShapePropsSchema,
	PentagonIntersectionDiagramPropsSchema,
	PeriodicTableWidgetPropsSchema,
	PieChartWidgetPropsSchema,
	PictographPropsSchema,
	IntegerChipModelPropsSchema,
	PointPlotGraphPropsSchema,
	PolygonGraphPropsSchema,
	PolyhedronDiagramPropsSchema,
	PolyhedronNetDiagramPropsSchema,
	PopulationBarChartPropsSchema,
	PopulationChangeEventGraphPropsSchema,
	ProbabilitySpinnerPropsSchema,
	ProtractorAngleDiagramPropsSchema,
	RadiallyConstrainedAngleDiagramPropsSchema,
	PythagoreanProofDiagramPropsSchema,
	QuantityFractionalDiagramPropsSchema,
	RatioBoxDiagramPropsSchema,
	RectangularFrameDiagramPropsSchema,
	ScaleCopiesSliderPropsSchema,
	ScatterPlotPropsSchema,
	ShapeTransformationGraphPropsSchema,
	SimpleArrowPropsSchema,
	SinCosineWidgetPropsSchema,
	StackedItemsDiagramPropsSchema,
	SubtractionWithRegroupingPropsSchema,
	TapeDiagramPropsSchema,
	TransformationDiagramPropsSchema,
	TransformationOnAGridPropsSchema,
	TransversalAngleDiagramPropsSchema,
	TreeDiagramPropsSchema,
	TriangleDiagramPropsSchema,
	UnitBlockDiagramPropsSchema,
	UrlImageWidgetPropsSchema,
	VectorDiagramPropsSchema,
	VennDiagramPropsSchema,
	VerticalArithmeticSetupPropsSchema,
	ClockDiagramPropsSchema,
	WheelDiagramPropsSchema,
	LabeledRectangleDiagramPropsSchema,
	CustomPolygonDiagramPropsSchema,
	LineDiagramPropsSchema,
	PESSpectrumPropsSchema,
	StickPlotPropsSchema,
	MarbleDiagramPropsSchema
}

// NEW: Input types for each schema
export type ThreeDIntersectionDiagramProps = z.input<typeof ThreeDIntersectionDiagramPropsSchema>
export type AbsoluteValueNumberLineProps = z.input<typeof AbsoluteValueNumberLinePropsSchema>
export type QuadrantDiagramProps = z.input<typeof QuadrantDiagramPropsSchema>
export type AdditionWithRegroupingProps = z.input<typeof AdditionWithRegroupingPropsSchema>
export type AngleDiagramProps = z.input<typeof AngleDiagramPropsSchema>
export type AngleTypeDiagramProps = z.input<typeof AngleTypeDiagramPropsSchema>
export type AreaGraphProps = z.input<typeof AreaGraphPropsSchema>
export type AreaModelMultiplicationProps = z.input<typeof AreaModelMultiplicationPropsSchema>
export type BarChartProps = z.input<typeof BarChartPropsSchema>
export type BoxGridProps = z.input<typeof BoxGridPropsSchema>
export type BoxPlotProps = z.input<typeof BoxPlotPropsSchema>
export type CircleDiagramProps = z.input<typeof CircleDiagramPropsSchema>
export type CircleAngleDiagramProps = z.input<typeof CircleAngleDiagramPropsSchema>
export type CompositeShapeDiagramProps = z.input<typeof CompositeShapeDiagramPropsSchema>
export type NestedShapeDiagramProps = z.input<typeof NestedShapeDiagramPropsSchema>
export type ConceptualGraphProps = z.input<typeof ConceptualGraphPropsSchema>
export type ConstraintGeometryDiagramProps = z.input<typeof ConstraintGeometryDiagramPropsSchema>
export type CoordinatePlaneComprehensiveProps = z.input<typeof CoordinatePlaneComprehensivePropsSchema>
export type DataTableProps = z.input<typeof DataTablePropsSchema>
export type DiscreteObjectRatioDiagramProps = z.input<typeof DiscreteObjectRatioDiagramPropsSchema>
export type DistanceFormulaGraphProps = z.input<typeof DistanceFormulaGraphPropsSchema>
export type DivergentBarChartProps = z.input<typeof DivergentBarChartPropsSchema>
export type DivisionAreaDiagramProps = z.input<typeof DivisionAreaDiagramPropsSchema>
export type DivisionModelDiagramProps = z.input<typeof DivisionModelDiagramPropsSchema>
export type DotPlotProps = z.input<typeof DotPlotPropsSchema>
export type DoubleNumberLineProps = z.input<typeof DoubleNumberLinePropsSchema>
export type EmojiImageProps = z.input<typeof EmojiImagePropsSchema>
export type EquivalentFractionModelProps = z.input<typeof EquivalentFractionModelPropsSchema>
export type FactorizationDiagramProps = z.input<typeof FactorizationDiagramPropsSchema>
export type FigureComparisonDiagramProps = z.input<typeof FigureComparisonDiagramPropsSchema>
export type FractionFrequencyPlotProps = z.input<typeof FractionFrequencyPlotPropsSchema>
export type FractionMultiplicationModelProps = z.input<typeof FractionMultiplicationModelPropsSchema>
export type FractionNumberLineProps = z.input<typeof FractionNumberLinePropsSchema>
export type FractionSumDiagramProps = z.input<typeof FractionSumDiagramPropsSchema>
export type FractionModelDiagramProps = z.input<typeof FractionModelDiagramPropsSchema>
export type FreeBodyDiagramProps = z.input<typeof FreeBodyDiagramPropsSchema>
export type FunctionPlotGraphProps = z.input<typeof FunctionPlotGraphPropsSchema>
export type GeometricPrimitiveDiagramProps = z.input<typeof GeometricPrimitiveDiagramPropsSchema>
export type GeometricSolidDiagramProps = z.input<typeof GeometricSolidDiagramPropsSchema>
export type HangerDiagramProps = z.input<typeof HangerDiagramPropsSchema>
export type HistogramProps = z.input<typeof HistogramPropsSchema>
export type InequalityNumberLineProps = z.input<typeof InequalityNumberLinePropsSchema>
export type KeelingCurveProps = z.input<typeof KeelingCurvePropsSchema>
export type LineEquationGraphProps = z.input<typeof LineEquationGraphPropsSchema>
export type LineGraphProps = z.input<typeof LineGraphPropsSchema>
export type NPolygonProps = z.input<typeof NPolygonPropsSchema>
export type PatternDiagramProps = z.input<typeof PatternDiagramPropsSchema>
export type NumberLineProps = z.input<typeof NumberLinePropsSchema>
export type NumberLineForOppositesProps = z.input<typeof NumberLineForOppositesPropsSchema>
export type NumberLineWithActionProps = z.input<typeof NumberLineWithActionPropsSchema>
export type NumberLineWithFractionGroupsProps = z.input<typeof NumberLineWithFractionGroupsPropsSchema>
export type NumberSetDiagramProps = z.input<typeof NumberSetDiagramPropsSchema>
export type ParabolaGraphProps = z.input<typeof ParabolaGraphPropsSchema>
export type ParallelogramTrapezoidDiagramProps = z.input<typeof ParallelogramTrapezoidDiagramPropsSchema>
export type PartitionedShapeProps = z.input<typeof PartitionedShapePropsSchema>
export type PentagonIntersectionDiagramProps = z.input<typeof PentagonIntersectionDiagramPropsSchema>
export type PeriodicTableWidgetProps = z.input<typeof PeriodicTableWidgetPropsSchema>
export type PieChartWidgetProps = z.input<typeof PieChartWidgetPropsSchema>
export type PictographProps = z.input<typeof PictographPropsSchema>
export type PointPlotGraphProps = z.input<typeof PointPlotGraphPropsSchema>
export type PolygonGraphProps = z.input<typeof PolygonGraphPropsSchema>
export type PolyhedronDiagramProps = z.input<typeof PolyhedronDiagramPropsSchema>
export type PolyhedronNetDiagramProps = z.input<typeof PolyhedronNetDiagramPropsSchema>
export type PopulationBarChartProps = z.input<typeof PopulationBarChartPropsSchema>
export type PopulationChangeEventGraphProps = z.input<typeof PopulationChangeEventGraphPropsSchema>
export type ProbabilitySpinnerProps = z.input<typeof ProbabilitySpinnerPropsSchema>
export type ProtractorAngleDiagramProps = z.input<typeof ProtractorAngleDiagramPropsSchema>
export type RadiallyConstrainedAngleDiagramProps = z.input<typeof RadiallyConstrainedAngleDiagramPropsSchema>
export type PythagoreanProofDiagramProps = z.input<typeof PythagoreanProofDiagramPropsSchema>
export type QuantityFractionalDiagramProps = z.input<typeof QuantityFractionalDiagramPropsSchema>
export type RatioBoxDiagramProps = z.input<typeof RatioBoxDiagramPropsSchema>
export type RectangularFrameDiagramProps = z.input<typeof RectangularFrameDiagramPropsSchema>
export type ScaleCopiesSliderProps = z.input<typeof ScaleCopiesSliderPropsSchema>
export type ScatterPlotProps = z.input<typeof ScatterPlotPropsSchema>
export type ShapeTransformationGraphProps = z.input<typeof ShapeTransformationGraphPropsSchema>
export type SimpleArrowProps = z.input<typeof SimpleArrowPropsSchema>
export type SinCosineWidgetProps = z.input<typeof SinCosineWidgetPropsSchema>
export type StackedItemsDiagramProps = z.input<typeof StackedItemsDiagramPropsSchema>
export type SubtractionWithRegroupingProps = z.input<typeof SubtractionWithRegroupingPropsSchema>
export type TapeDiagramProps = z.input<typeof TapeDiagramPropsSchema>
export type TransformationDiagramProps = z.input<typeof TransformationDiagramPropsSchema>
export type TransformationOnAGridProps = z.input<typeof TransformationOnAGridPropsSchema>
export type TransversalAngleDiagramProps = z.input<typeof TransversalAngleDiagramPropsSchema>
export type TreeDiagramProps = z.input<typeof TreeDiagramPropsSchema>
export type TriangleDiagramProps = z.input<typeof TriangleDiagramPropsSchema>
export type UnitBlockDiagramProps = z.input<typeof UnitBlockDiagramPropsSchema>
export type UrlImageWidgetProps = z.input<typeof UrlImageWidgetPropsSchema>
export type VectorDiagramProps = z.input<typeof VectorDiagramPropsSchema>
export type VennDiagramProps = z.input<typeof VennDiagramPropsSchema>
export type VerticalArithmeticSetupProps = z.input<typeof VerticalArithmeticSetupPropsSchema>
export type ClockDiagramProps = z.input<typeof ClockDiagramPropsSchema>
export type WheelDiagramProps = z.input<typeof WheelDiagramPropsSchema>
export type LabeledRectangleDiagramProps = z.input<typeof LabeledRectangleDiagramPropsSchema>
export type CustomPolygonDiagramProps = z.input<typeof CustomPolygonDiagramPropsSchema>
export type LineDiagramProps = z.input<typeof LineDiagramPropsSchema>
export type PESSpectrumProps = z.input<typeof PESSpectrumPropsSchema>
export type StickPlotProps = z.input<typeof StickPlotPropsSchema>
export type MarbleDiagramProps = z.input<typeof MarbleDiagramPropsSchema>

const widgetSchemasWithoutSpecialUnions = [
	typedSchemas.threeDIntersectionDiagram,
	typedSchemas.absoluteValueNumberLine,
	typedSchemas.quadrantDiagram,
	typedSchemas.clockDiagram,
	typedSchemas.angleDiagram,
	typedSchemas.angleTypeDiagram,
	typedSchemas.circleAngleDiagram,
	typedSchemas.areaModelMultiplication,
	typedSchemas.areaGraph,
	typedSchemas.barChart,
	typedSchemas.boxGrid,
	typedSchemas.boxPlot,
	typedSchemas.circleDiagram,
	typedSchemas.fractionModelDiagram,
	typedSchemas.fractionMultiplicationModel,
	typedSchemas.compositeShapeDiagram,
	typedSchemas.nestedShapeDiagram,
	typedSchemas.conceptualGraph,
	typedSchemas.constraintGeometryDiagram,
	typedSchemas.coordinatePlane,
	typedSchemas.distanceFormulaGraph,
	typedSchemas.divergentBarChart,
	typedSchemas.functionPlotGraph,
	typedSchemas.lineEquationGraph,
	typedSchemas.pointPlotGraph,
	typedSchemas.populationChangeEventGraph,
	typedSchemas.polygonGraph,
	typedSchemas.protractorAngleDiagram,
	typedSchemas.radiallyConstrainedAngleDiagram,
	typedSchemas.shapeTransformationGraph,
	typedSchemas.dataTable,
	typedSchemas.integerChipModel,
	typedSchemas.discreteObjectRatioDiagram,
	typedSchemas.dotPlot,
	typedSchemas.doubleNumberLine,
	typedSchemas.populationBarChart,
	typedSchemas.emojiImage,
	typedSchemas.figureComparisonDiagram,
	typedSchemas.fractionNumberLine,
	typedSchemas.fractionSumDiagram,
	typedSchemas.geometricPrimitiveDiagram,
	typedSchemas.geometricSolidDiagram,
	typedSchemas.hangerDiagram,
	typedSchemas.histogram,
	typedSchemas.nPolygon,
	typedSchemas.patternDiagram,
	typedSchemas.inequalityNumberLine,
	typedSchemas.keelingCurve,
	typedSchemas.lineGraph,
	typedSchemas.numberLine,
	typedSchemas.numberLineForOpposites,
	typedSchemas.numberLineWithAction,
	typedSchemas.numberLineWithFractionGroups,
	typedSchemas.numberSetDiagram,
	typedSchemas.parabolaGraph,
	typedSchemas.pentagonIntersectionDiagram,
	typedSchemas.pictograph,
	typedSchemas.polyhedronDiagram,
	typedSchemas.probabilitySpinner,
	typedSchemas.pythagoreanProofDiagram,
	typedSchemas.quantityFractionalDiagram,
	typedSchemas.ratioBoxDiagram,
	typedSchemas.rectangularFrameDiagram,
	typedSchemas.scaleCopiesSlider,
	typedSchemas.simpleArrow,
	typedSchemas.sinCosineWidget,
	typedSchemas.scatterPlot,
	typedSchemas.stackedItemsDiagram,
	typedSchemas.tapeDiagram,
	typedSchemas.transformationDiagram,
	typedSchemas.transformationOnAGrid,
	typedSchemas.transversalAngleDiagram,
	typedSchemas.treeDiagram,
	typedSchemas.triangleDiagram,
	typedSchemas.unitBlockDiagram,
	typedSchemas.periodicTable,
	typedSchemas.urlImage,
	typedSchemas.vennDiagram,
	typedSchemas.verticalArithmeticSetup,
	typedSchemas.vectorDiagram,
	typedSchemas.parallelogramTrapezoidDiagram,
	typedSchemas.pieChart,
	typedSchemas.fractionFrequencyPlot,
	typedSchemas.freeBodyDiagram,
	typedSchemas.divisionAreaDiagram,
	typedSchemas.divisionModelDiagram,
	typedSchemas.factorizationDiagram,
	typedSchemas.equivalentFractionModel,
	typedSchemas.subtractionWithRegrouping,
	typedSchemas.additionWithRegrouping,
	typedSchemas.wheelDiagram,
	typedSchemas.labeledRectangleDiagram,
	typedSchemas.customPolygonDiagram,
	typedSchemas.lineDiagram,
	typedSchemas.pesSpectrum,
	typedSchemas.stickPlot,
	typedSchemas.marbleDiagram
] as const

export const WidgetSchema = z.union([
	z.discriminatedUnion("type", widgetSchemasWithoutSpecialUnions),
	typedSchemas.partitionedShape,
	typedSchemas.polyhedronNetDiagram
])
export type Widget = z.infer<typeof WidgetSchema>
export type WidgetInput = z.input<typeof WidgetSchema>
