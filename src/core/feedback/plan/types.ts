import type { z } from "zod"
import type {
	FeedbackCombinationSchema,
	FeedbackDimensionSchema,
	FeedbackPlanSchema
} from "./schema"

export type FeedbackDimension = z.infer<typeof FeedbackDimensionSchema>
export type FeedbackCombination = z.infer<typeof FeedbackCombinationSchema>
export type FeedbackPlan = z.infer<typeof FeedbackPlanSchema>
