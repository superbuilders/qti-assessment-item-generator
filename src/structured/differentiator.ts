import * as errors from "@superbuilders/errors"
import type * as logger from "@superbuilders/slog"
import type OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from "zod"
import { type AssessmentItemInput, createDynamicAssessmentItemSchema } from "../compiler/schemas"
import { allWidgetSchemas } from "../widgets/registry"
import { transformArraysToObjects, transformObjectsToArrays } from "./shape-helpers"
import { generateZodSchemaFromObject } from "./zod-runtime-generator"

const OPENAI_MODEL = "gpt-5"

/**
 * Represents the content-only plan for an assessment item variation.
 * This is a marker type; the actual structure is validated at runtime against a
 * dynamically generated schema based on the source item. It explicitly lacks
 * `widgets` and `identifier`.
 */
export type ContentPlan = Omit<AssessmentItemInput, "widgets" | "identifier">

/**
 * [SHOT 1] Generates UI-agnostic content plans for an assessment item.
 * This function is strictly concerned with content and has no knowledge of widgets or UI.
 * It uses a runtime-generated schema to enforce that the LLM's output has a structure
 * identical to the source item's content fields.
 * @internal
 */
async function planContentDifferentiation(
	openai: OpenAI,
	logger: logger.Logger,
	assessmentItem: AssessmentItemInput,
	n: number
): Promise<ContentPlan[]> {
	logger.info("starting differentiation planning", { identifier: assessmentItem.identifier, variations: n })

	// Create a pure content payload by explicitly removing widget and identifier fields at runtime.
	// This ensures the LLM focuses only on the content to be varied.
	const { widgets: _widgets, identifier: _identifier, ...contentOnlyItem } = assessmentItem
	const transformedItem = transformArraysToObjects(contentOnlyItem)

	// Also prepare the full original item for context (not used for schema validation).
	const fullOriginalItemJson = JSON.stringify(assessmentItem, null, 2)

	// Build an exact, strict runtime schema from the stripped, transformed item.
	// This is the core of our structural integrity guarantee. The `.length(n)` call
	// ensures the LLM returns exactly the number of variations requested.
	const contentPlanSchema = generateZodSchemaFromObject(transformedItem)
	const ContentPlanResponseSchema = z
		.object({
			plans: z.array(contentPlanSchema).length(n)
		})
		.strict()

	// The system instruction is hardened to forbid any UI/widget concepts and mandate
	// preservation of structure, difficulty, and pedagogical intent.
	const systemInstruction = [
		"You are a curriculum development expert generating content-only variations for an assessment item.",
		"CRITICAL RULES:",
		"- Your entire focus is on varying the content fields: title, body, interactions, responseDeclarations, feedback.",
		"- Do NOT include or mention any UI, widgets, visuals, envelopes, or collections.",
		"- The JSON structure of your output MUST BE IDENTICAL to the source: same keys, same array lengths, same union choices.",
		"- You MUST preserve the exact interaction keys and array lengths from the source.",
		"- All variations must test the same concept at the same difficulty level.",
		"- All MathML content must be valid.",
		"- Your output must validate against the provided example's exact structure."
	].join("\n")

	const userContent = [
		`Generate exactly ${n} unique content plans for the assessment item below, preserving the exact JSON structure.`,
		"Return the plans as a JSON array within a parent object under the key 'plans': { \"plans\": [ ... ] }",
		"",
		"## Original source item (full structured JSON; for context only, do not output widgets):",
		"```json",
		fullOriginalItemJson,
		"```",
		"",
		"## Content structure to match (widgets and identifier removed):",
		"```json",
		JSON.stringify(transformedItem, null, 2),
		"```"
	].join("\n")

	const responseFormat = zodResponseFormat(ContentPlanResponseSchema, "differentiation_planner")

	const result = await errors.try(
		openai.chat.completions.parse({
			model: OPENAI_MODEL,
			messages: [
				{ role: "system", content: systemInstruction },
				{ role: "user", content: userContent }
			],
			response_format: responseFormat
		})
	)

	if (result.error) {
		logger.error("openai differentiation planning call failed", { error: result.error })
		throw errors.wrap(result.error, "ai differentiation planning")
	}

	const choice = result.data.choices[0]
	if (!choice?.message?.parsed) {
		logger.error("openai planning call returned no parsed content")
		throw errors.new("empty ai response: no parsed content for differentiation plan")
	}

	// Convert the object-based structures from the AI back into our standard array-based format.
	const transformedPlans = choice.message.parsed.plans.map((plan: unknown) => transformObjectsToArrays(plan))
	// biome-ignore lint: Type assertion needed after transformation from AI response
	const finalPlans = transformedPlans as any as ContentPlan[]

	// Post-validation: Ensure structural integrity of the generated plans.
	for (const plan of finalPlans) {
		if ("widgets" in plan || "identifier" in plan) {
			logger.error("plan contains forbidden keys", { keys: Object.keys(plan) })
			throw errors.new("structural validation failed: plan contains forbidden keys")
		}

		// 1) Interaction keys must match exactly
		const sourceInteractions = assessmentItem.interactions
		// biome-ignore lint: Type assertion needed for runtime validation
		const planObj = plan as any
		const planInteractions = planObj.interactions
		const sourceKeys = sourceInteractions ? Object.keys(sourceInteractions).sort() : []
		const planKeys =
			planInteractions && typeof planInteractions === "object" && planInteractions !== null
				? Object.keys(planInteractions).sort()
				: []
		if (JSON.stringify(sourceKeys) !== JSON.stringify(planKeys)) {
			logger.error("plan interaction keys do not match source", { sourceKeys, planKeys })
			throw errors.new("structural validation failed: interaction keys mismatch")
		}

		// Helper to get array length for a given key if present; returns -1 when not an array
		function arrayLengthOfKey(obj: unknown, key: string): number {
			if (typeof obj !== "object" || obj === null) return -1
			// biome-ignore lint: Type assertion needed for runtime property access
			const objRec = obj as any
			const value = objRec[key]
			return Array.isArray(value) ? value.length : -1
		}

		// 2) Body array length must match exactly (if present)
		const sourceBodyLen = arrayLengthOfKey(assessmentItem, "body")
		const planBodyLen = arrayLengthOfKey(plan, "body")
		if (sourceBodyLen !== -1 || planBodyLen !== -1) {
			if (sourceBodyLen !== planBodyLen) {
				logger.error("plan body length does not match source", { sourceBodyLen, planBodyLen })
				throw errors.new("structural validation failed: body length mismatch")
			}
		}

		// 3) For each interaction, enforce choices length equality when choices arrays exist
		for (const key of sourceKeys) {
			// biome-ignore lint: Type assertion needed for runtime property access
			const sourceInteractionsObj = sourceInteractions as any
			const srcInteraction = sourceInteractionsObj[key]
			// biome-ignore lint: Type assertion needed for runtime property access
			const planInteractionsObj = planInteractions as any
			const planInteraction = planInteractionsObj ? planInteractionsObj[key] : undefined
			const srcChoicesLen = arrayLengthOfKey(srcInteraction, "choices")
			const planChoicesLen = arrayLengthOfKey(planInteraction, "choices")
			if (srcChoicesLen !== -1 || planChoicesLen !== -1) {
				if (srcChoicesLen !== planChoicesLen) {
					logger.error("plan interaction choices length mismatch", { key, srcChoicesLen, planChoicesLen })
					throw errors.new("structural validation failed: interaction choices length mismatch")
				}
			}
		}
	}

	logger.info("successfully generated and validated differentiation plans", {
		count: finalPlans.length,
		identifier: assessmentItem.identifier
	})

	return finalPlans
}

/**
 * Builds a strict Zod object schema for widgets based on the provided widgetTypes mapping.
 * Each key maps to the authoritative schema for its widget type.
 */
function buildWidgetsResponseSchema(
	widgetTypes: Record<string, keyof typeof allWidgetSchemas>
): z.ZodObject<Record<string, z.ZodTypeAny>> {
	const shape: Record<string, z.ZodTypeAny> = {}
	for (const [key, typeName] of Object.entries(widgetTypes)) {
		const schema = allWidgetSchemas[typeName]
		if (!schema) {
			throw errors.new("unknown widget type in mapping")
		}
		shape[key] = schema
	}
	return z.object(shape).strict()
}

/**
 * [SHOT 2 via LLM] Generate complete widget objects for a given content plan using the
 * authoritative widget schemas and the mapping derived from the source item.
 */
async function regenerateWidgetsViaLLM(
	openai: OpenAI,
	logger: logger.Logger,
	sourceItem: AssessmentItemInput,
	plan: ContentPlan,
	widgetTypes: Record<string, keyof typeof allWidgetSchemas>
): Promise<Record<string, unknown>> {
    const widgetKeys = Object.keys(widgetTypes)
    logger.info("shot 2 widget generation starting", { widgetKeysCount: widgetKeys.length })
	const WidgetsEnvelopeSchema = z
		.object({ widgets: buildWidgetsResponseSchema(widgetTypes) })
		.strict()

	const systemInstruction = [
		"You are an expert in generating QTI widget objects that strictly conform to their Zod schemas.",
		"Generate ONLY the widget objects for the specified mapping. Do not include SVG/HTML content fields.",
		"CRITICAL RULES:",
		"- Output MUST be a JSON object with a single key 'widgets'.",
		"- Under 'widgets', include exactly the provided widget keys, no more, no fewer.",
		"- Each widget must conform EXACTLY to its authoritative schema (types, enums, required fields).",
		"- Do NOT leak answers. Do NOT label visuals with answers. Maintain neutrality.",
		"- No LaTeX. Math must be valid MathML where applicable.",
		"- Preserve structure; ensure arrays/lengths match the plan's body/interaction context where relevant."
	].join("\n")

	const userContent = [
		"## Content plan (the new item content; widgets and identifier omitted):",
		"```json",
		JSON.stringify(plan, null, 2),
		"```",
		"",
		"## Source item (for contextual reference only):",
		"```json",
		JSON.stringify({ ...sourceItem, widgets: undefined }, null, 2),
		"```",
		"",
		"## Widget mapping (keys to widget types):",
		"```json",
		JSON.stringify(widgetTypes, null, 2),
		"```",
		"",
		"Return ONLY a JSON object with a single key 'widgets' whose value is an object mapping keys to fully-formed widget objects."
	].join("\n")

    const responseFormat = zodResponseFormat(WidgetsEnvelopeSchema, "widgets_generator")

    // Log prompt meta (avoid logging full prompt to keep logs readable)
    const systemLen = systemInstruction.length
    const userLen = userContent.length
    logger.debug("calling openai for widget generation", {
        model: OPENAI_MODEL,
        widgetKeysCount: widgetKeys.length,
        systemChars: systemLen,
        userChars: userLen
    })

	const llmResult = await errors.try(
		openai.chat.completions.parse({
			model: OPENAI_MODEL,
			messages: [
				{ role: "system", content: systemInstruction },
				{ role: "user", content: userContent }
			],
			response_format: responseFormat
		})
	)
    if (llmResult.error) {
	logger.error("openai widget generation call failed", { error: llmResult.error })
	throw errors.wrap(llmResult.error, "ai widget generation")
}
    logger.info("openai widget generation completed")
	const choice = llmResult.data.choices[0]
	if (!choice?.message?.parsed) {
		logger.error("openai widget generation returned no parsed content")
		throw errors.new("empty ai response: no parsed widget content")
	}

	return choice.message.parsed.widgets
}

/**
 * Orchestrates the full two-shot differentiation pipeline. This is the sole
 * public entry point for item differentiation. It is atomic: either all `n`
 * variations are generated successfully, or it throws an error.
 */
export async function differentiateAssessmentItem(
	openai: OpenAI,
	logger: logger.Logger,
	sourceItem: AssessmentItemInput,
	n: number
): Promise<AssessmentItemInput[]> {
	logger.info("starting differentiation", { identifier: sourceItem.identifier, variations: n })

	// Shot 1: Generate UI-agnostic content plans (LLM prompt includes full original item for context).
	const plansResult = await errors.try(planContentDifferentiation(openai, logger, sourceItem, n))
	if (plansResult.error) {
		logger.error("differentiation planning shot failed", { error: plansResult.error })
		throw errors.wrap(plansResult.error, "differentiation planning")
	}
	const plans = plansResult.data
	logger.info("shot 1 (planning) complete", { count: plans.length })

	// Deterministically extract the widget types from the source item.
	const widgetTypes: Record<string, keyof typeof allWidgetSchemas> = {}
	if (sourceItem.widgets) {
		for (const [key, widget] of Object.entries(sourceItem.widgets)) {
			if (!widget?.type) {
				logger.error("source widget is missing a 'type' property", { key })
				throw errors.new("invalid source item: widget missing type")
			}
			// biome-ignore lint: Type assertion needed after runtime validation
			widgetTypes[key] = widget.type as any
		}
	}

	// Shot 2: Generate widgets via LLM for each plan using authoritative schemas. This loop is all-or-nothing.
	const finalItems: AssessmentItemInput[] = []
	for (let i = 0; i < plans.length; i++) {
		const plan = plans[i]
		const identifier = `${sourceItem.identifier}_${i + 1}`

		if (Object.keys(widgetTypes).length === 0) {
			const item: AssessmentItemInput = { ...plan, identifier, widgets: null }
			finalItems.push(item)
			continue
		}

        logger.info("shot 2 generating widgets for variation", {
            index: i + 1,
            identifier,
            widgetKeys: Object.keys(widgetTypes)
        })

        const widgetsResult = await errors.try(
            regenerateWidgetsViaLLM(openai, logger, sourceItem, plan, widgetTypes)
        )
		if (widgetsResult.error) {
			logger.error("shot 2 widget generation failed", { error: widgetsResult.error, itemIdentifier: identifier })
			throw errors.wrap(widgetsResult.error, "widget generation")
		}
		const regeneratedWidgets = widgetsResult.data

		const finalItem: AssessmentItemInput = { ...plan, identifier, widgets: regeneratedWidgets }
		const { AssessmentItemSchema: finalItemSchema } = createDynamicAssessmentItemSchema(widgetTypes)
		const finalValidation = finalItemSchema.safeParse(finalItem)
		if (!finalValidation.success) {
			logger.error("final differentiated item failed schema validation", { identifier, error: finalValidation.error })
			throw errors.wrap(finalValidation.error, "final item validation")
		}
		finalItems.push(finalValidation.data)
	}

	logger.info("differentiation complete", { requested: n, completed: finalItems.length })
	return finalItems
}
