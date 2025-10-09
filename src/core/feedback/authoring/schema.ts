import { z } from "zod"
import type { BlockContent } from "@/core/content"
import { createBlockContentSchema } from "@/core/content"
import type { FeedbackPlan } from "../plan"

/**
 * Builds a flat exact-object Zod schema for feedback authoring strictly from a FeedbackPlan.
 * This approach avoids schema nesting, preventing "enum explosion" errors from the OpenAI API.
 *
 * @param feedbackPlan The feedback plan containing all required combination IDs.
 * @param widgetTypeKeys The tuple of widget types available for use in feedback content.
 * @returns A Zod schema expecting a flat map of feedback keyed by combination IDs.
 */
type FlatFeedbackAuthoring<P extends FeedbackPlan, E extends readonly string[]> = {
	feedback: {
		FEEDBACK__OVERALL: Record<P["combinations"][number]["id"], { content: BlockContent<E> }>
	}
}

export function createFlatFeedbackZodSchema<P extends FeedbackPlan, const E extends readonly string[]>(
	feedbackPlan: P,
	widgetTypeKeys: E
): z.ZodType<FlatFeedbackAuthoring<P, E>> {
	const ScopedBlockContentSchema = createBlockContentSchema(widgetTypeKeys)
	// Note: BlockContent is already an array schema; additional .min(1) enforcement omitted for type compatibility.
	const LeafNodeSchema = z.object({ content: ScopedBlockContentSchema }).strict()

	// Create a shape where each key is a deterministic combination ID from the plan.
	// The insertion order MUST follow `feedbackPlan.combinations` for deterministic output.
	const shape: Record<string, typeof LeafNodeSchema> = {}
	for (const combo of feedbackPlan.combinations) {
		// REUSE THE SAME INSTANCE for all keys to minimize the final JSON Schema size.
		shape[combo.id] = LeafNodeSchema
	}

	// The final schema expects a flat object under `feedback.FEEDBACK__OVERALL`,
	// with keys strictly matching the generated shape.
	const Schema = z
		.object({
			feedback: z
				.object({
					FEEDBACK__OVERALL: z.object(shape).strict()
				})
				.strict()
		})
		.strict()

	return Schema
}
