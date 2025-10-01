import { z } from "zod"
import { FeedbackDimensionSchema, FeedbackCombinationSchema, FeedbackPlanSchema } from "./schema"

export type FeedbackDimension = z.infer<typeof FeedbackDimensionSchema>
export type FeedbackCombination = z.infer<typeof FeedbackCombinationSchema>
export type FeedbackPlan = z.infer<typeof FeedbackPlanSchema>
