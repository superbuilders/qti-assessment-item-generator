import type { AssessmentItemInput } from "@/core/item"
import type { WidgetTypeTuple } from "@/widgets/collections/types"

export type TypeScriptDiagnostic = {
	message: string
	line: number
	column: number
	tsCode: number
}

export type TemplateModule<E extends WidgetTypeTuple = WidgetTypeTuple> = (
	seed: bigint
) => AssessmentItemInput<E>
