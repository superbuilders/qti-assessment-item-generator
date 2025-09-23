import type { z } from "zod"
import type { AssessmentItemInput } from "../compiler/schemas"

/**
 * Canonical template module interface for pluggable templates.
 *
 * Requirements:
 * - templateId: globally unique identifier for the template (e.g., "math.fraction-addition").
 * - version: semver string for reproducibility.
 * - propsSchema: Zod schema describing the required input; must be strict and total (no defaults added at runtime).
 * - generate: pure, deterministic function that transforms validated input into AssessmentItemInput.
 */
export type TemplateModule<Schema extends z.ZodTypeAny = z.ZodTypeAny> = {
  readonly templateId: string
  readonly version: string
  readonly propsSchema: Schema
  readonly generate: (props: z.input<Schema>) => AssessmentItemInput
}


