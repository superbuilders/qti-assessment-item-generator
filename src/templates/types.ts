import type { AssessmentItemInput } from "@/core/item"
import type { WidgetTypeTuple } from "@/widgets/collections/types"

/**
 * Canonical template module interface for pluggable templates.
 */
export type TemplateModule<E extends WidgetTypeTuple = WidgetTypeTuple> = (
	seed: bigint
) => AssessmentItemInput<E>
