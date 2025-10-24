import type { AssessmentItemInput } from "@/core/item"
import type { SeedProps, SeedPropsSchema } from "@/templates/schemas"
import type { WidgetTypeTuple } from "@/widgets/collections/types"

/**
 * Canonical template module interface for pluggable templates.
 *
 * Requirements:
 * - templateId: globally unique identifier for the template (e.g., "math.fraction-addition").
 * - version: semver string for reproducibility.
 * - propsSchema: Zod schema describing the required input; must be strict and total (no defaults added at runtime).
 * - generate: pure, deterministic function that transforms validated input into AssessmentItemInput.
 */
export type TemplateModule<E extends WidgetTypeTuple = WidgetTypeTuple> = {
	readonly templateId: string
	readonly version: string
	readonly propsSchema: typeof SeedPropsSchema
	readonly generate: (props: SeedProps) => AssessmentItemInput<E>
}

export type { SeedPropsSchema }
export type { SeedProps }
