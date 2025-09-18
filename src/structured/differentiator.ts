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

// Simple type guards for runtime narrowing
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

// intentionally unused currently; keep for future guard expansions
// function hasKey<K extends string>(obj: Record<string, unknown>, key: K): obj is Record<string, unknown> & { [P in K]: unknown } {
// 	return key in obj
// }

function getProp(obj: unknown, key: string): unknown {
	if (!isRecord(obj)) return undefined
	return obj[key]
}

function isWidgetTypeName(value: unknown): value is keyof typeof allWidgetSchemas {
	return typeof value === "string" && value in allWidgetSchemas
}

/**
 * Builds an informational section for Shot 1 that lists the fixed widget mapping (slot → type)
 * used in Shot 2. This is purely contextual so the planner avoids generating incompatible content.
 */
function buildShot1WidgetInfoSection(
	assessmentItem: AssessmentItemInput,
	logger: logger.Logger
): string {
	const widgets = assessmentItem.widgets
	if (!widgets || typeof widgets !== "object") {
		return ""
	}

	const mapping: Record<string, string> = {}
	for (const [key, widget] of Object.entries(widgets)) {
		if (!widget || typeof widget !== "object") {
			logger.error("source widget is not an object", { key })
			throw errors.new("invalid source item: widget invalid shape")
		}
		const typeUnknown = getProp(widget, "type")
		if (typeof typeUnknown !== "string") {
			logger.error("source widget is missing a 'type' property", { key })
			throw errors.new("invalid source item: widget missing type")
		}
		const typeName = typeUnknown
		if (!isWidgetTypeName(typeName)) {
			logger.error("source widget has unknown type", { key, typeName })
			throw errors.new("invalid source item: unknown widget type")
		}
		mapping[key] = typeName
	}

	// Build compact per-type schema digests to guide Shot 1 without overconstraining
	const uniqueTypes = Array.from(new Set(Object.values(mapping)))
	const digestSections: string[] = []
	for (const typeName of uniqueTypes) {
		if (!isWidgetTypeName(typeName)) {
			logger.error("internal widget type mismatch after mapping build", { typeName })
			throw errors.new("internal widget type mismatch")
		}
		const zodSchema = allWidgetSchemas[typeName]
		const responseFormat = zodResponseFormat(zodSchema, `widget_${typeName}`)
		// The helper returns an OpenAI-consumable JSON Schema with no $ref
		// Extract only top-level properties and required to keep token usage small
		const jsonSchemaContainer = responseFormat.json_schema
		if (!jsonSchemaContainer) {
			logger.error("missing json schema for widget type", { typeName })
			throw errors.new("widget schema export missing json schema")
		}
		const jsonSchema = getProp(jsonSchemaContainer, "schema")
		if (!isRecord(jsonSchema)) {
			logger.error("invalid json schema structure for widget type", { typeName })
			throw errors.new("widget json schema invalid structure")
		}
		const properties = getProp(jsonSchema, "properties")
		if (!isRecord(properties)) {
			logger.error("widget json schema missing properties", { typeName })
			throw errors.new("widget json schema missing properties")
		}
		const required = getProp(jsonSchema, "required")
		if (!Array.isArray(required)) {
			logger.error("widget json schema missing required array", { typeName })
			throw errors.new("widget json schema missing required")
		}
		const digest = { properties, required }
		digestSections.push(
			`#### ${typeName} \n\n\`\`\`json\n${JSON.stringify(digest, null, 2)}\n\`\`\``
		)
	}

	return [
		"## Widget constraints for Shot 2 (context only — do NOT edit widgets here)",
		"- Widget slots and types are fixed and will be regenerated in Shot 2 using strict per-type schemas.",
		"- This section is provided solely to help ensure your content plan remains compatible with the existing widgets.",
		"- Do not include or modify any widgets in this shot.",
		"",
		"### Widget mapping (slot → widget type):",
		"```json",
		JSON.stringify(mapping, null, 2),
		"```",
		"",
		"### Widget schema constraints (per type, context only):",
		...digestSections,
		""
	].join("\n")
}

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
		"- Do NOT output any UI, widgets, visuals, envelopes, or collections.",
		"- You may use the provided widget mapping and schema constraints as context. Do not output widgets.",
		"- The JSON structure of your output MUST BE IDENTICAL to the source: same keys, same array lengths, same union choices.",
		"- You MUST preserve the exact interaction keys and array lengths from the source.",
		"- All variations must test the same concept at the same difficulty level.",
		"- All MathML content must be valid.",
		"- Your output must validate against the provided example's exact structure.",
		"",
		"**⚠️ CRITICAL: VARIATION REQUIREMENTS — SAME DIFFICULTY, DIFFERENT WORDING ⚠️**",
		"You MUST generate a slightly reworded version of the question at the SAME difficulty level. Do NOT produce the identical question.",
		"",
		"REQUIRED CHANGES (all):",
		"- Rephrase body/prompt sentences so that no sentence is identical to the source.",
		"- Rewrite EVERY choice's wording. Preserve which choice is correct, but do not copy its text.",
		"- Change named entities/contextual labels (e.g., competition/event/place/team/year) while preserving the underlying concept tested.",
		"- Keep interaction keys, array lengths, and overall structure IDENTICAL to the source.",
		"",
		"STRICT BANS:",
		"- Do NOT copy any sentence verbatim from the source (allow at most 5 consecutive identical tokens).",
		"- Do NOT make trivial synonym swaps only; at least one substantive wording change per sentence is required.",
		"- Do NOT change the mathematical/statistical concept or the difficulty (no hints, no simplifications, no extra steps).",
		"- Do NOT change the response type (e.g., multiple choice stays multiple choice, text entry stays text entry).",
		"- Do NOT change what the diagram/widget represents (e.g., box plots stay box plots, bar charts stay bar charts).",
		"",
		"SELF-CHECK BEFORE FINALIZING (do not output this analysis):",
		"- Verify each sentence has meaningful rewording beyond minor synonym swaps.",
		"- Verify every choice is rephrased; ensure semantic correctness is preserved for the correct choice.",
		"- Verify named entities/contexts are changed but the tested concept is unchanged.",
		"- If any check fails, REWRITE the plan before returning.",
		"",
		"### Positive example (GOOD — reworded, same concept/difficulty)",
		"Source concept: comparing centers in two box plots; correct idea = \"final distances higher on average.\"",
		"",
		"```json",
		"{",
		"  \"title\": \"Compare box plots for throw distances\",",
		"  \"body\": [",
		"    { \"type\": \"paragraph\", \"content\": [",
		"      { \"type\": \"text\", \"content\": \"Before selecting athletes for an international meet, a national program runs a qualifying event.\" }",
		"    ]},",
		"    { \"type\": \"paragraph\", \"content\": [",
		"      { \"type\": \"text\", \"content\": \"The box plots below show the final-round distances (in meters) for the top \" },",
		"      { \"type\": \"math\", \"mathml\": \"<mn>11</mn>\" },",
		"      { \"type\": \"text\", \"content\": \" competitors at the Championship Final and the top \" },",
		"      { \"type\": \"math\", \"mathml\": \"<mn>12</mn>\" },",
		"      { \"type\": \"text\", \"content\": \" competitors at the National Qualifier.\" }",
		"    ]},",
		"    { \"type\": \"blockSlot\", \"slotId\": \"image_1\" },",
		"    { \"type\": \"paragraph\", \"content\": [",
		"      { \"type\": \"text\", \"content\": \"Which statement best matches these box plots?\" }",
		"    ]},",
		"    { \"type\": \"blockSlot\", \"slotId\": \"choice_interaction\" }",
		"  ],",
		"  \"interactions\": {",
		"    \"choice_interaction\": {",
		"      \"type\": \"choiceInteraction\",",
		"      \"prompt\": [{ \"type\": \"text\", \"content\": \"Select one answer.\" }],",
		"      \"choices\": [",
		"        { \"identifier\": \"A\", \"content\": [{ \"type\": \"paragraph\", \"content\": [{ \"type\": \"text\", \"content\": \"On average, the Championship Final throws were longer.\" }]}]},",
		"        { \"identifier\": \"B\", \"content\": [{ \"type\": \"paragraph\", \"content\": [{ \"type\": \"text\", \"content\": \"Every Championship Final throw exceeded every Qualifier throw.\" }]}]},",
		"        { \"identifier\": \"C\", \"content\": [{ \"type\": \"paragraph\", \"content\": [{ \"type\": \"text\", \"content\": \"The Championship Final shows much greater variability.\" }]}]},",
		"        { \"identifier\": \"D\", \"content\": [{ \"type\": \"paragraph\", \"content\": [{ \"type\": \"text\", \"content\": \"None of the above.\" }]}]}",
		"      ],",
		"      \"maxChoices\": 1,",
		"      \"minChoices\": 1,",
		"      \"shuffle\": true,",
		"      \"responseIdentifier\": \"choice_interaction\"",
		"    }",
		"  },",
		"  \"responseDeclarations\": [",
		"    { \"identifier\": \"choice_interaction\", \"cardinality\": \"single\", \"baseType\": \"identifier\", \"correct\": \"A\" }",
		"  ]",
		"}",
		"```",
		"",
		"### Negative examples (BAD — reject and rewrite)",
		"",
		"1) **BAD: Identical wording copied**",
		"```json",
		"{",
		"  \"body\": [",
		"    { \"type\": \"paragraph\", \"content\": [{ \"type\": \"text\", \"content\": \"Before sending track and field athletes to the Olympics, the U.S. holds a qualifying meet.\" }] }",
		"  ],",
		"  \"interactions\": {",
		"    \"choice_interaction\": {",
		"      \"choices\": [",
		"        { \"identifier\": \"A\", \"content\": [{ \"type\": \"paragraph\", \"content\": [{ \"type\": \"text\", \"content\": \"The distances in the Olympic final were farther on average.\" }]}]}",
		"      ]",
		"    }",
		"  }",
		"}",
		"```",
		"",
		"2) **BAD: Only trivial synonym changes** (still \"Olympic final\", choices nearly identical)",
		"```json",
		"{",
		"  \"body\": [",
		"    { \"type\": \"paragraph\", \"content\": [{ \"type\": \"text\", \"content\": \"Before sending athletes to the Olympics, the U.S. has a qualifying meet.\" }] }",
		"  ],",
		"  \"interactions\": {",
		"    \"choice_interaction\": {",
		"      \"choices\": [",
		"        { \"identifier\": \"A\", \"content\": [{ \"type\": \"paragraph\", \"content\": [{ \"type\": \"text\", \"content\": \"The distances in the Olympic final were longer on average.\" }]}]}",
		"      ]",
		"    }",
		"  }",
		"}",
		"```",
		"",
		"3) **BAD: Difficulty drift — adds hint/explanation (makes it EASIER)**",
		"```json",
		"{",
		"  \"body\": [",
		"    { \"type\": \"paragraph\", \"content\": [{ \"type\": \"text\", \"content\": \"The median of the Olympic box plot is clearly higher, so choose the option about averages.\" }] }",
		"  ]",
		"}",
		"```",
		"",
		"4) **BAD: Difficulty drift — requires additional calculation (makes it HARDER)**",
		"```json",
		"{",
		"  \"body\": [",
		"    { \"type\": \"paragraph\", \"content\": [{ \"type\": \"text\", \"content\": \"Calculate the exact difference between the medians and determine which dataset has higher average values.\" }] }",
		"  ]",
		"}",
		"```",
		"",
		"5) **BAD: Changed response type** (was multiple choice, now text entry)",
		"```json",
		"{",
		"  \"interactions\": {",
		"    \"choice_interaction\": {",
		"      \"type\": \"textEntryInteraction\",",
		"      \"prompt\": [{ \"type\": \"text\", \"content\": \"Enter the name of the dataset with higher average values.\" }]",
		"    }",
		"  }",
		"}",
		"```",
		"",
		"6) **BAD: Changed diagram type** (was box plots, now bar chart)",
		"```json",
		"{",
		"  \"body\": [",
		"    { \"type\": \"paragraph\", \"content\": [{ \"type\": \"text\", \"content\": \"The bar chart below shows average distances...\" }] }",
		"  ]",
		"}",
		"```",
		"",
		"7) **BAD: Changed statistical concept** (was comparing centers, now comparing spreads)",
		"```json",
		"{",
		"  \"body\": [",
		"    { \"type\": \"paragraph\", \"content\": [{ \"type\": \"text\", \"content\": \"Which dataset has the larger interquartile range?\" }] }",
		"  ],",
		"  \"responseDeclarations\": [",
		"    { \"identifier\": \"choice_interaction\", \"correct\": \"C\" }",
		"  ]",
		"}",
		"```",
		"",
		"8) **BAD: Removed critical context** (makes question ambiguous)",
		"```json",
		"{",
		"  \"body\": [",
		"    { \"type\": \"paragraph\", \"content\": [{ \"type\": \"text\", \"content\": \"Look at the box plots below.\" }] },",
		"    { \"type\": \"blockSlot\", \"slotId\": \"image_1\" },",
		"    { \"type\": \"paragraph\", \"content\": [{ \"type\": \"text\", \"content\": \"Which is true?\" }] }",
		"  ]",
		"}",
		"```"
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
		buildShot1WidgetInfoSection(assessmentItem, logger),
		"",
		"## Content structure to match (widgets and identifier removed):",
		"```json",
		JSON.stringify(transformedItem, null, 2),
		"```",
		"",
		"You MUST reword all body sentences and every choice; do not copy sentences from the source."
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
	// Narrowed by zodResponseFormat schema; treat as ContentPlan[]
	const finalPlans = transformedPlans as unknown as ContentPlan[]

	// Post-validation: Ensure structural integrity of the generated plans.
	for (const plan of finalPlans) {
		if ("widgets" in plan || "identifier" in plan) {
			logger.error("plan contains forbidden keys", { keys: Object.keys(plan) })
			throw errors.new("structural validation failed: plan contains forbidden keys")
		}

		// 1) Interaction keys must match exactly
		const sourceInteractions = assessmentItem.interactions
		const planInteractionsUnknown = getProp(plan, "interactions")
		const planInteractions = planInteractionsUnknown
		const sourceKeys = sourceInteractions ? Object.keys(sourceInteractions).sort() : []
		const planKeys =
			isRecord(planInteractions) ? Object.keys(planInteractions).sort() : []
		if (JSON.stringify(sourceKeys) !== JSON.stringify(planKeys)) {
			logger.error("plan interaction keys do not match source", { sourceKeys, planKeys })
			throw errors.new("structural validation failed: interaction keys mismatch")
		}

		// Helper to get array length for a given key if present; returns -1 when not an array
		function arrayLengthOfKey(obj: unknown, key: string): number {
			if (!isRecord(obj)) return -1
			const value = obj[key]
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
			const srcInteraction = isRecord(sourceInteractions) ? sourceInteractions[key] : undefined
			const planInteraction = isRecord(planInteractions) ? planInteractions[key] : undefined
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
			if (!isWidgetTypeName(widget.type)) {
				logger.error("source widget has unknown type", { key, typeName: widget.type })
				throw errors.new("invalid source item: unknown widget type")
			}
			widgetTypes[key] = widget.type
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
