import type { z } from "zod"
import type { AssessmentItemInput } from "@/core/item"
import type {
	FractionSchema,
	NumericValueSchema,
	RationalValueSchema
} from "@/templates/schemas"
import type { WidgetTypeTuple } from "@/widgets/collections/types"
import type { PartitionedShapePropsSchema } from "@/widgets/registry"

/**
 * Canonical template module interface for pluggable templates.
 *
 * Requirements:
 * - templateId: globally unique identifier for the template (e.g., "math.fraction-addition").
 * - version: semver string for reproducibility.
 * - propsSchema: Zod schema describing the required input; must be strict and total (no defaults added at runtime).
 * - generate: pure, deterministic function that transforms validated input into AssessmentItemInput.
 */
// AssessmentItemSchema no longer exported - use AssessmentItemInput type instead
type FractionSchemaT = typeof FractionSchema
type NumericValueSchemaT = typeof NumericValueSchema
type RationalValueSchemaT = typeof RationalValueSchema
type PartitionedShapePropsSchemaT = typeof PartitionedShapePropsSchema

export type TemplateContext = {
	valueSchemas: {
		FractionSchema: FractionSchemaT
		NumericValueSchema: NumericValueSchemaT
		RationalValueSchema: RationalValueSchemaT
	}
	widgetSchemas: {
		partitionedShape: PartitionedShapePropsSchemaT
	}
}

export type TemplateModule<
	Schema extends z.ZodType<unknown> = z.ZodType<unknown>,
	E extends WidgetTypeTuple = WidgetTypeTuple
> = {
	readonly templateId: string
	readonly version: string
	readonly propsSchema: Schema
	readonly generate: (props: z.input<Schema>) => AssessmentItemInput<E>
}
