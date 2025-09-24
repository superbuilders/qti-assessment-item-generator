import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from "zod"
import {
	type AnyInteraction,
	AnyInteractionSchema,
	type AssessmentItemInput,
	type AssessmentItemShell,
	AssessmentItemShellSchema,
	type BlockContent,
	type InlineContent
} from "../compiler/schemas"
import type { WidgetCollectionName } from "../widgets/collections"
import { allWidgetSchemas, type WidgetInput } from "../widgets/registry"
import { buildImageContext, type ImageContext } from "./ai-context-builder"
import { createInteractionContentPrompt } from "./prompts/interactions"
import { createAssessmentShellPrompt } from "./prompts/shell"
import { createWidgetMappingPrompt } from "./prompts/widget-mapping"
import { createWidgetContentPrompt } from "./prompts/widgets"
import type { AiContextEnvelope } from "./types"

const OPENAI_MODEL = "gpt-5"

// Simplified API: just pass OpenAI client directly to functions

// MODIFIED: Add back the specific error for the widget mapping bail condition.
export const ErrWidgetNotFound = errors.new("widget could not be mapped to a known type")

export const ErrUnsupportedInteraction = errors.new("unsupported interaction type found")

// Use the AssessmentItemShellSchema from schemas.ts

/**
 * Dynamically creates a Zod schema for a collection of widgets based on a mapping.
 * @param widgetMapping A map of slot names to widget type names.
 * @returns A Zod object schema for the widget collection.
 */
function createWidgetCollectionSchema(widgetMapping: Record<string, keyof typeof allWidgetSchemas>) {
	const shape: Record<string, z.ZodType> = {}
	for (const [slotName, widgetType] of Object.entries(widgetMapping)) {
		const schema = allWidgetSchemas[widgetType]
		if (!schema) {
			// This check ensures we don't proceed with an invalid type from the mapping.
			logger.error("unknown widget type in structured client mapping", {
				slotName,
				widgetType
			})
			throw errors.new(`unknown widget type in mapping: ${widgetType}`)
		}
		shape[slotName] = schema
	}
	// Ensure the schema is properly structured to avoid OpenAI API interpretation issues
	return z
		.object(shape)
		.strict()
		.describe("A collection of fully-defined widget objects corresponding to the provided slots.")
}

/**
 * NEW: Dynamically creates a Zod schema for a collection of interactions.
 * @param interactionSlotNames A list of interaction slot names from the shell.
 * @returns A Zod object schema for the interaction collection.
 */
function createInteractionCollectionSchema(interactionSlotNames: string[]) {
	const shape: Record<string, z.ZodType> = {}
	for (const slotName of interactionSlotNames) {
		// All interactions must conform to the AnyInteractionSchema.
		shape[slotName] = AnyInteractionSchema
	}
	return z.object(shape).describe("A collection of fully-defined QTI interaction objects.")
}

/**
 * ✅ REFACTORED: This is the new Shot 2 function.
 */
async function mapSlotsToWidgets(
	openai: OpenAI,
	logger: logger.Logger,
	envelope: AiContextEnvelope,
	assessmentBody: string,
	slotNames: string[], // ✅ Takes the parsed slot names to generate the prompt.
	widgetCollectionName: WidgetCollectionName,
	imageContext: ImageContext // ADD this parameter
): Promise<Record<string, keyof typeof allWidgetSchemas>> {
	// ✅ The prompt and the schema are now generated together dynamically.
	const { systemInstruction, userContent, WidgetMappingSchema } = createWidgetMappingPrompt(
		envelope,
		assessmentBody,
		slotNames,
		widgetCollectionName,
		imageContext // PASS this parameter
	)

	const responseFormat = zodResponseFormat(WidgetMappingSchema, "widget_mapper")
	logger.debug("generated json schema for openai", {
		functionName: "mapSlotsToWidgets",
		generatorName: "widget_mapper",
		schema: JSON.stringify(responseFormat.json_schema?.schema, null, 2)
	})

	// NEW: Build multimodal message content, same as other shots
	const messageContent: OpenAI.ChatCompletionContentPart[] = [{ type: "text", text: userContent }]
	for (const imageUrl of imageContext.rasterImageUrls) {
		messageContent.push({ type: "image_url", image_url: { url: imageUrl } })
	}

	logger.debug("calling openai for slot-to-widget mapping with multimodal input", { slotNames })
	const response = await errors.try(
		openai.chat.completions.parse({
			model: OPENAI_MODEL,
			messages: [
				{ role: "system", content: systemInstruction },
				{ role: "user", content: messageContent } // MODIFIED to use multimodal content
			],
			// ✅ The dynamically generated, constrained schema is used here.
			response_format: responseFormat
		})
	)
	if (response.error) {
		logger.error("failed to map slots to widgets via openai", {
			error: response.error
		})
		throw errors.wrap(response.error, "ai widget mapping")
	}

	const choice = response.data.choices[0]
	if (!choice?.message?.parsed) {
		logger.error("CRITICAL: OpenAI widget mapping returned no parsed content")
		throw errors.new("empty ai response: no parsed content for widget mapping")
	}
	if (choice.message.refusal) {
		logger.error("openai refused widget mapping request", {
			refusal: choice.message.refusal
		})
		throw errors.new(`ai refused request: ${choice.message.refusal}`)
	}

	const rawMapping = choice.message.parsed.widget_mapping

	// Type guard to check if a value is a valid widget type
	const isValidWidgetType = (val: unknown): val is keyof typeof allWidgetSchemas => {
		return typeof val === "string" && val in allWidgetSchemas
	}

	// Validate and build the properly typed mapping
	const mapping: Record<string, keyof typeof allWidgetSchemas> = {}
	for (const [key, value] of Object.entries(rawMapping)) {
		// ADDED: Check for the WIDGET_NOT_FOUND bail string.
		// If found, throw a specific error to be caught upstream.
		if (value === "WIDGET_NOT_FOUND") {
			logger.error("widget slot could not be mapped by AI", { slot: key })
			// Throw the specific error, which will be wrapped in a NonRetriableError by the Inngest function.
			throw errors.wrap(ErrWidgetNotFound, `AI bailed on widget mapping for slot: "${key}"`)
		}

		if (isValidWidgetType(value)) {
			mapping[key] = value
		} else {
			logger.error("invalid widget type in mapping", {
				slot: key,
				type: value
			})
			throw errors.new(`invalid widget type "${value}" for slot "${key}"`)
		}
	}

	logger.info("successfully mapped slots to widgets", {
		mapping,
		count: Object.keys(mapping).length
	})
	return mapping
}

/**
 * NEW - Shot 1: Generate Content Shell & Plan.
 */
async function generateAssessmentShell(
	openai: OpenAI,
	logger: logger.Logger,
	envelope: AiContextEnvelope,
	imageContext: ImageContext
): Promise<AssessmentItemShell> {
	// Assumes a new prompt function is created for this shot.
	const { systemInstruction, userContent } = createAssessmentShellPrompt(envelope, imageContext)

	const responseFormat = zodResponseFormat(AssessmentItemShellSchema, "assessment_shell_generator")
	logger.debug("generated json schema for openai", {
		functionName: "generateAssessmentShell",
		generatorName: "assessment_shell_generator",
		schema: JSON.stringify(responseFormat.json_schema?.schema, null, 2)
	})

	const messageContent: OpenAI.ChatCompletionContentPart[] = [{ type: "text", text: userContent }]
	for (const imageUrl of imageContext.rasterImageUrls) {
		messageContent.push({ type: "image_url", image_url: { url: imageUrl } })
	}

	logger.debug("calling openai for assessment shell with multimodal input")
	const response = await errors.try(
		openai.chat.completions.parse({
			model: OPENAI_MODEL,
			messages: [
				{ role: "system", content: systemInstruction },
				{ role: "user", content: messageContent }
			],
			response_format: responseFormat
		})
	)
	if (response.error) {
		logger.error("failed to generate assessment shell", {
			error: response.error
		})
		throw errors.wrap(response.error, "ai shell generation")
	}

	const choice = response.data.choices[0]
	if (!choice) {
		logger.error("CRITICAL: OpenAI response contained no choices")
		throw errors.new("openai returned no choices")
	}

	const message = choice.message
	if (!message.parsed) {
		logger.error("CRITICAL: OpenAI returned no parsed content for shell generation")
		throw errors.new("empty ai response: no parsed content")
	}

	return message.parsed
}

/**
 * ✅ NEW: This is Shot 3. It generates ONLY the interaction content.
 */
async function generateInteractionContent(
	openai: OpenAI,
	logger: logger.Logger,
	envelope: AiContextEnvelope,
	assessmentShell: AssessmentItemShell,
	imageContext: ImageContext,
	widgetMapping?: Record<string, keyof typeof allWidgetSchemas>
): Promise<Record<string, AnyInteraction>> {
	const interactionSlotNames = assessmentShell.interactions
	if (interactionSlotNames.length === 0) {
		logger.debug("no interactions to generate, skipping shot 3")
		return {}
	}

	// This new prompt function instructs the AI to generate the interaction objects.
	const { systemInstruction, userContent } = createInteractionContentPrompt(
		envelope,
		assessmentShell,
		imageContext,
		widgetMapping
	)

	// Create a precise schema asking ONLY for the interactions.
	const InteractionCollectionSchema = createInteractionCollectionSchema(interactionSlotNames)
	const responseFormat = zodResponseFormat(InteractionCollectionSchema, "interaction_content_generator")

	logger.debug("generated json schema for openai", {
		functionName: "generateInteractionContent",
		generatorName: "interaction_content_generator",
		schema: JSON.stringify(responseFormat.json_schema?.schema, null, 2)
	})

	const messageContent: OpenAI.ChatCompletionContentPart[] = [{ type: "text", text: userContent }]
	for (const imageUrl of imageContext.rasterImageUrls) {
		messageContent.push({ type: "image_url", image_url: { url: imageUrl } })
	}

	logger.debug("calling openai for interaction content generation with multimodal input", { interactionSlotNames })
	const response = await errors.try(
		openai.chat.completions.parse({
			model: OPENAI_MODEL,
			messages: [
				{ role: "system", content: systemInstruction },
				{ role: "user", content: messageContent }
			],
			response_format: responseFormat
		})
	)
	if (response.error) {
		logger.error("failed to generate interaction content", {
			error: response.error
		})
		throw errors.wrap(response.error, "ai interaction generation")
	}

	const choice = response.data.choices[0]
	if (!choice?.message?.parsed) {
		logger.error("CRITICAL: OpenAI interaction generation returned no parsed content")
		throw errors.new("empty ai response: no parsed content for interaction generation")
	}

	return choice.message.parsed
}

/**
 * NEW - Shot 4: Generate ONLY the widget objects.
 */
async function generateWidgetContent(
	openai: OpenAI,
	logger: logger.Logger,
	envelope: AiContextEnvelope,
	assessmentShell: AssessmentItemShell,
	widgetMapping: Record<string, keyof typeof allWidgetSchemas>,
	generatedInteractions: Record<string, AnyInteraction>,
	widgetCollectionName: WidgetCollectionName,
	imageContext: ImageContext
): Promise<Record<string, WidgetInput>> {
	const widgetSlotNames = Object.keys(widgetMapping)
	if (widgetSlotNames.length === 0) {
		logger.debug("no widgets to generate, skipping shot 4")
		return {}
	}

	// This new prompt function instructs the AI to generate the widget objects.
	const { systemInstruction, userContent } = createWidgetContentPrompt(
		envelope,
		assessmentShell,
		widgetMapping,
		generatedInteractions,
		widgetCollectionName,
		imageContext
	)

	// Create a precise schema asking ONLY for the widgets.
	const WidgetCollectionSchema = createWidgetCollectionSchema(widgetMapping)
	const responseFormat = zodResponseFormat(WidgetCollectionSchema, "widget_content_generator")

	logger.debug("generated json schema for openai", {
		functionName: "generateWidgetContent",
		generatorName: "widget_content_generator",
		schema: JSON.stringify(responseFormat.json_schema?.schema, null, 2)
	})

	const messageContent: OpenAI.ChatCompletionContentPart[] = [{ type: "text", text: userContent }]
	for (const imageUrl of imageContext.rasterImageUrls) {
		messageContent.push({ type: "image_url", image_url: { url: imageUrl } })
	}

	logger.debug("calling openai for widget content generation with multimodal input", { widgetSlotNames })
	const response = await errors.try(
		openai.chat.completions.parse({
			model: OPENAI_MODEL,
			messages: [
				{ role: "system", content: systemInstruction },
				{ role: "user", content: messageContent }
			],
			response_format: responseFormat
		})
	)
	if (response.error) {
		logger.error("failed to generate widget content", {
			error: response.error
		})
		throw errors.wrap(response.error, "ai widget generation")
	}

	const choice = response.data.choices[0]
	if (!choice?.message?.parsed) {
		logger.error("CRITICAL: OpenAI widget generation returned no parsed content")
		throw errors.new("empty ai response: no parsed content for widget generation")
	}

	return choice.message.parsed
}

// ADD the new single public entry point that accepts a normalized envelope.
export async function generateFromEnvelope(
	openai: OpenAI,
	logger: logger.Logger,
	envelope: AiContextEnvelope,
	widgetCollectionName: WidgetCollectionName
): Promise<AssessmentItemInput> {
	// Validate envelope at the boundary. No defaults or fallbacks.
	if (!envelope.context || envelope.context.length === 0) {
		logger.error("envelope validation failed", { reason: "context array is empty" })
		throw errors.new("envelope context cannot be empty")
	}

	logger.info("starting structured qti generation from envelope", {
		widgetCollection: widgetCollectionName,
		contextBlockCount: envelope.context.length,
		rasterUrlCount: envelope.rasterImageUrls.length, // MODIFIED log field
		vectorUrlCount: envelope.vectorImageUrls.length // NEW log field
	})
	
	// MODIFIED: Use the new, unified image context builder.
	const imageContext = buildImageContext(envelope)

	// --- AI Pipeline Shots ---
	// All subsequent "shot" functions MUST be updated to accept the `envelope` object.

	// Shot 1: Generate Shell
	const shellResult = await errors.try(generateAssessmentShell(openai, logger, envelope, imageContext))
	if (shellResult.error) {
		logger.error("generate assessment shell", { error: shellResult.error })
		throw errors.wrap(shellResult.error, "generate assessment shell")
	}
	const assessmentShell = shellResult.data
	logger.debug("shot 1 complete", {
		identifier: assessmentShell.identifier,
		widgetSlots: assessmentShell.widgets,
		interactionSlots: assessmentShell.interactions
	})

	// FIX: Replace the incomplete slot checker with a comprehensive one.
	logger.debug("validating consistency between declared slots and body content")

	function collectAllSlotIds(shell: AssessmentItemShell): Set<string> {
		const ids = new Set<string>()
		// Track seen interactions if needed for future validations (currently unused)

		function walkInline(items: InlineContent | null | undefined) {
			if (!items) return
			for (const item of items) {
				if (item.type === "inlineSlot") ids.add(item.slotId)
			}
		}

		function walkBlock(items: BlockContent | null | undefined) {
			if (!items) return
			for (const item of items) {
				if (item.type === "blockSlot") ids.add(item.slotId)
				else if (item.type === "paragraph") walkInline(item.content)
			}
		}

		walkBlock(shell.body)
		for (const block of shell.feedbackBlocks) {
			walkBlock(block.content)
		}

		if (shell.interactions) {
			// Also check for slots inside interaction definitions passed in the shell if any
			// Although the shell's interactions is just string[], this ensures future-proofing
			// if the shell becomes more complex. We check the final generated interactions.
		}

		return ids
	}

	const allDeclaredSlots = new Set([...assessmentShell.widgets, ...assessmentShell.interactions])
	const slotsUsedInContent = collectAllSlotIds(assessmentShell)

	// Compute explicit differences so we can enforce missing declarations strictly
	// Note: We no longer prune declared-but-unused slots here to preserve
	// choice-level widget slots that are intentionally not present in the body.
	const undeclaredSlots = [...slotsUsedInContent].filter((slot) => !allDeclaredSlots.has(slot))
	const unusedSlots = [...allDeclaredSlots].filter((slot) => !slotsUsedInContent.has(slot))

	if (undeclaredSlots.length > 0) {
		const errorMessage = `Slot declaration mismatch detected after shell generation.
	- Slots used in content but not declared in widget/interaction arrays: [${undeclaredSlots.join(", ")}]
	- Slots declared in arrays but not used in any content field: [${unusedSlots.join(", ")}]`
		logger.error("slot consistency validation failed", {
			undeclaredSlots,
			unusedSlots
		})
		throw errors.new(errorMessage)
	}

	// Intentionally retain declared-but-unused slots; some slots (e.g., choice-level visuals)
	// are not referenced in the top-level body/feedback and are filled later.
	if (unusedSlots.length > 0) {
		logger.debug("retaining declared-but-unused slots for later stages", {
			unusedSlots
		})
	}

	logger.debug("slot consistency validation successful")

	// Step 2: Map widget slot names to widget types.
	const widgetSlotNames = assessmentShell.widgets
	logger.debug("shot 2: mapping slots to widgets", {
		count: widgetSlotNames.length
	})

	const performWidgetMapping = async () => {
		if (widgetSlotNames.length === 0) {
			logger.info("no widget slots found, skipping ai widget mapping call")
			// Return a successful result with empty data, mimicking the `errors.try` output
			const emptyMapping: Record<string, keyof typeof allWidgetSchemas> = {}
			return { data: emptyMapping, error: null }
		}
		// Only make the AI call if there are widgets to map
		// Convert structured body to string representation for widget mapping prompt
		const bodyString = assessmentShell.body ? JSON.stringify(assessmentShell.body) : ""
		// MODIFIED: Pass the full imageContext to the mapSlotsToWidgets call
		const mappingResult = await errors.try(
			mapSlotsToWidgets(openai, logger, envelope, bodyString, widgetSlotNames, widgetCollectionName, imageContext)
		)
		if (mappingResult.error) {
			const emptyMapping: Record<string, keyof typeof allWidgetSchemas> = {}
			return { data: emptyMapping, error: mappingResult.error }
		}
		return { data: mappingResult.data, error: null }
	}

	const widgetMappingResult = await performWidgetMapping()

	if (widgetMappingResult.error) {
		logger.error("map slots to widgets", { error: widgetMappingResult.error })
		throw errors.wrap(widgetMappingResult.error, "map slots to widgets")
	}
	let widgetMapping = widgetMappingResult.data

	// Shot 3: Generate Interactions
	const interactionContentResult = await errors.try(
		generateInteractionContent(openai, logger, envelope, assessmentShell, imageContext, widgetMapping)
	)
	if (interactionContentResult.error) {
		logger.error("generate interaction content", { error: interactionContentResult.error })
		throw errors.wrap(interactionContentResult.error, "generate interaction content")
	}
	const generatedInteractions = interactionContentResult.data
	logger.debug("shot 3 complete", {
		generatedInteractionKeys: Object.keys(generatedInteractions)
	})

	// After interactions are generated, we can safely prune widgets that are truly unused
	// across body, feedback, and interaction choice content. This ensures we never prune
	// before interaction compilation, preserving choice-level visuals.
	logger.debug("post-shot-3: computing used slot ids for safe pruning of widgets")
	function collectUsedSlotIdsAfterInteractions(
		shell: AssessmentItemShell,
		interactions: Record<string, AnyInteraction>
	): Set<string> {
		const ids = new Set<string>()
		function walkInline(items: InlineContent | null | undefined) {
			if (!items) return
			for (const item of items) {
				if (item.type === "inlineSlot") ids.add(item.slotId)
			}
		}
		function walkBlock(items: BlockContent | null | undefined) {
			if (!items) return
			for (const item of items) {
				if (item.type === "blockSlot") ids.add(item.slotId)
				else if (item.type === "paragraph") walkInline(item.content)
			}
		}
		// Shell body and feedback
		walkBlock(shell.body)
		for (const block of shell.feedbackBlocks) {
			walkBlock(block.content)
		}
		// Interaction choice content (where choice-level visuals are embedded)
		for (const interaction of Object.values(interactions)) {
			if (interaction.type === "choiceInteraction" || interaction.type === "orderInteraction") {
				for (const choice of interaction.choices) {
					walkBlock(choice.content)
				}
			}
			// inlineChoiceInteraction uses inline content (no blockSlot expected)
		}
		return ids
	}
	const usedAfterShot3 = collectUsedSlotIdsAfterInteractions(assessmentShell, generatedInteractions)
	const originalWidgetSlots = new Set(assessmentShell.widgets)
	const usedWidgetSlots = assessmentShell.widgets.filter((slot) => usedAfterShot3.has(slot))
	const prunedWidgetSlots = assessmentShell.widgets.filter((slot) => !usedAfterShot3.has(slot))
	if (prunedWidgetSlots.length > 0) {
		logger.debug("post-shot-3: pruning declared widgets unused by body/feedback/choices", {
			unused: prunedWidgetSlots
		})
	}
	// Update shell widgets now that interactions are known
	assessmentShell.widgets = usedWidgetSlots
	// Also filter the mapping to only generate needed widgets in Shot 4
	widgetMapping = Object.fromEntries(
		Object.entries(widgetMapping).filter(([slot]) => originalWidgetSlots.has(slot) && usedAfterShot3.has(slot))
	)

	// Shot 4: Generate Widgets
	const widgetContentResult = await errors.try(
		generateWidgetContent(
			openai,
			logger,
			envelope,
			assessmentShell,
			widgetMapping,
			generatedInteractions,
			widgetCollectionName,
			imageContext
		)
	)
	if (widgetContentResult.error) {
		logger.error("generate widget content", { error: widgetContentResult.error })
		throw errors.wrap(widgetContentResult.error, "generate widget content")
	}
	const generatedWidgets = widgetContentResult.data
	logger.debug("shot 4 complete", {
		generatedWidgetKeys: Object.keys(generatedWidgets)
	})

	// Final Assembly
	const finalAssessmentItem: AssessmentItemInput = {
		...assessmentShell,
		interactions: generatedInteractions,
		widgets: generatedWidgets
	}
	return finalAssessmentItem
}

// All internal "shot" functions MUST be updated to accept the `envelope`.
// async function generateAssessmentShell(openai: OpenAI, logger: logger.Logger, envelope: AiContextEnvelope, imageContext: ImageContext): Promise<AssessmentItemShell> { /* ... */ }
// async function mapSlotsToWidgets(openai: OpenAI, logger: logger.Logger, envelope: AiContextEnvelope, assessmentBody: string, slotNames: string[], widgetCollectionName: WidgetCollectionName): Promise<Record<string, keyof typeof allWidgetSchemas>> { /* ... */ }
// async function generateInteractionContent(openai: OpenAI, logger: logger.Logger, envelope: AiContextEnvelope, assessmentShell: AssessmentItemShell, imageContext: ImageContext, widgetMapping?: Record<string, keyof typeof allWidgetSchemas>): Promise<Record<string, AnyInteraction>> { /* ... */ }
// async function generateWidgetContent(openai: OpenAI, logger: logger.Logger, envelope: AiContextEnvelope, assessmentShell: AssessmentItemShell, widgetMapping: Record<string, keyof typeof allWidgetSchemas>, generatedInteractions: Record<string, AnyInteraction>, widgetCollectionName: WidgetCollectionName, imageContext: ImageContext): Promise<Record<string, WidgetInput>> { /* ... */ }
