import type { AssessmentItemInput } from "@/core/item"
import type { allWidgetsCollection } from "@/widgets/collections/all"
import type { WidgetTypeTupleFrom } from "@/widgets/collections/types"

export const allExamples: AssessmentItemInput<WidgetTypeTupleFrom<typeof allWidgetsCollection>>[] = []
