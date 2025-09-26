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
import { createInteractionContentPrompt } from "./prompts/interactions"
import { createAssessmentShellPrompt } from "./prompts/shell"
import { createWidgetMappingPrompt } from "./prompts/widget-mapping"
import { createWidgetContentPrompt } from "./prompts/widgets"
import type { AiContextEnvelope, ImageContext } from "./types"

const OPENAI_MODEL = "gpt-5"
const MAX_IMAGES_PER_REQUEST = 500
const MAX_IMAGE_PAYLOAD_BYTES_PER_REQUEST = 50 * 1024 * 1024
export const ErrWidgetNotFound = errors.new("widget could not be mapped to a known type")

export const ErrUnsupportedInteraction = errors.new("unsupported interaction type found")

async function resolveRasterImages(envelope: AiContextEnvelope): Promise<ImageContext> {
	const finalImageUrls: string[] = []
	let totalPayloadBytes = 0

	for (const url of envelope.multimodalImageUrls) {
		const urlResult = errors.trySync(() => new URL(url))
		if (urlResult.error) {
			logger.error("invalid url in multimodalImageUrls", { url, error: urlResult.error })
			throw errors.wrap(urlResult.error, "invalid image url")
		}
		const scheme = urlResult.data.protocol
		if (scheme !== "http:" && scheme !== "https:" && scheme !== "data:") {
			logger.error("unsupported url scheme in multimodalImageUrls", { url, scheme })
			throw errors.new("unsupported url scheme")
		}
		if (scheme === "data:") {
			totalPayloadBytes += url.length
		}
		finalImageUrls.push(url)
	}

	for (const payload of envelope.multimodalImagePayloads) {
		totalPayloadBytes += payload.data.byteLength
		const base64 = Buffer.from(payload.data).toString("base64")
		const dataUrl = `data:${payload.mimeType};base64,${base64}`
		finalImageUrls.push(dataUrl)
	}

	if (finalImageUrls.length > MAX_IMAGES_PER_REQUEST) {
		logger.error("too many image inputs for request", {
			count: finalImageUrls.length,
			max: MAX_IMAGES_PER_REQUEST
		})
		throw errors.new("too many image inputs for request")
	}
	if (totalPayloadBytes > MAX_IMAGE_PAYLOAD_BYTES_PER_REQUEST) {
		logger.error("image payload size over per-request cap", {
			bytes: totalPayloadBytes,
			cap: MAX_IMAGE_PAYLOAD_BYTES_PER_REQUEST
		})
		throw errors.new("image payload size over per-request cap")
	}

	return { imageUrls: finalImageUrls }
}
function createWidgetCollectionSchema(widgetMapping: Record<string, keyof typeof allWidgetSchemas>) {
	const shape: Record<string, z.ZodType> = {}
	for (const [slotName, widgetType] of Object.entries(widgetMapping)) {
		const schema = allWidgetSchemas[widgetType]
		if (!schema) {
			logger.error("unknown widget type in structured client mapping", {
				slotName,
				widgetType
			})
			throw errors.new(`unknown widget type in mapping: ${widgetType}`)
		}
		shape[slotName] = schema
	}
	return z
		.object(shape)
		.strict()
		.describe("A collection of fully-defined widget objects corresponding to the provided slots.")
}

function createInteractionCollectionSchema(interactionSlotNames: string[]) {
	const shape: Record<string, z.ZodType> = {}
	for (const slotName of interactionSlotNames) {
		shape[slotName] = AnyInteractionSchema
	}
	return z.object(shape).describe("A collection of fully-defined QTI interaction objects.")
}

async function mapSlotsToWidgets(
	openai: OpenAI,
	logger: logger.Logger,
	envelope: AiContextEnvelope,
	assessmentBody: string,
	slotNames: string[],
	widgetCollectionName: WidgetCollectionName,
	imageContext: ImageContext
): Promise<Record<string, keyof typeof allWidgetSchemas>> {
	const { systemInstruction, userContent, WidgetMappingSchema } = createWidgetMappingPrompt(
		envelope,
		assessmentBody,
		slotNames,
		widgetCollectionName,
		imageContext
	)

	const responseFormat = zodResponseFormat(WidgetMappingSchema, "widget_mapper")
	logger.debug("generated json schema for openai", {
		functionName: "mapSlotsToWidgets",
		generatorName: "widget_mapper",
		schema: JSON.stringify(responseFormat.json_schema?.schema, null, 2)
	})

	const messageContent: OpenAI.ChatCompletionContentPart[] = [{ type: "text", text: userContent }]
	for (const imageUrl of imageContext.imageUrls) {
		messageContent.push({ type: "image_url", image_url: { url: imageUrl, detail: "high" } })
	}

	logger.debug("calling openai for slot-to-widget mapping with multimodal input", { slotNames })
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

	const isValidWidgetType = (val: unknown): val is keyof typeof allWidgetSchemas => {
		return typeof val === "string" && val in allWidgetSchemas
	}

	const mapping: Record<string, keyof typeof allWidgetSchemas> = {}
	for (const [key, value] of Object.entries(rawMapping)) {
		if (value === "WIDGET_NOT_FOUND") {
			logger.error("widget slot could not be mapped by AI", { slot: key })
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

async function generateAssessmentShell(
	openai: OpenAI,
	logger: logger.Logger,
	envelope: AiContextEnvelope,
	imageContext: ImageContext
): Promise<AssessmentItemShell> {
	const { systemInstruction, userContent } = createAssessmentShellPrompt(envelope, imageContext)

	const responseFormat = zodResponseFormat(AssessmentItemShellSchema, "assessment_shell_generator")
	logger.debug("generated json schema for openai", {
		functionName: "generateAssessmentShell",
		generatorName: "assessment_shell_generator",
		schema: JSON.stringify(responseFormat.json_schema?.schema, null, 2)
	})

	const messageContent: OpenAI.ChatCompletionContentPart[] = [{ type: "text", text: userContent }]
	for (const imageUrl of imageContext.imageUrls) {
		messageContent.push({ type: "image_url", image_url: { url: imageUrl, detail: "high" } })
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

	const { systemInstruction, userContent } = createInteractionContentPrompt(
		envelope,
		assessmentShell,
		imageContext,
		widgetMapping
	)

	const InteractionCollectionSchema = createInteractionCollectionSchema(interactionSlotNames)
	const responseFormat = zodResponseFormat(InteractionCollectionSchema, "interaction_content_generator")

	logger.debug("generated json schema for openai", {
		functionName: "generateInteractionContent",
		generatorName: "interaction_content_generator",
		schema: JSON.stringify(responseFormat.json_schema?.schema, null, 2)
	})

	const messageContent: OpenAI.ChatCompletionContentPart[] = [{ type: "text", text: userContent }]
	for (const imageUrl of imageContext.imageUrls) {
		messageContent.push({ type: "image_url", image_url: { url: imageUrl, detail: "high" } })
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

	const { systemInstruction, userContent } = createWidgetContentPrompt(
		envelope,
		assessmentShell,
		widgetMapping,
		generatedInteractions,
		widgetCollectionName,
		imageContext
	)

	const WidgetCollectionSchema = createWidgetCollectionSchema(widgetMapping)
	const responseFormat = zodResponseFormat(WidgetCollectionSchema, "widget_content_generator")

	// ANALYTICS: Detect and log any $ref nodes that also include description/default
	function collectRefConflicts(node: unknown, path: string, out: Array<{ pointer: string; keys: string[] }>): void {
		if (Array.isArray(node)) {
			for (let i = 0; i < node.length; i++) collectRefConflicts(node[i], `${path}/${i}`, out)
			return
		}
		if (node && typeof node === "object") {
			const obj = node as Record<string, unknown>
			const hasRef = Object.prototype.hasOwnProperty.call(obj, "$ref")
			const hasDescription = Object.prototype.hasOwnProperty.call(obj, "description")
			const hasDefault = Object.prototype.hasOwnProperty.call(obj, "default")
			if (hasRef && (hasDescription || hasDefault)) {
				const present: string[] = []
				if (hasDescription) present.push("description")
				if (hasDefault) present.push("default")
				out.push({ pointer: path || "/", keys: present })
			}
			for (const [k, v] of Object.entries(obj)) {
				const next = `${path}/${k.replaceAll("~", "~0").replaceAll("/", "~1")}`
				collectRefConflicts(v, next, out)
			}
		}
	}

	const schemaRoot = responseFormat.json_schema?.schema
	if (schemaRoot) {
		const conflicts: Array<{ pointer: string; keys: string[] }> = []
		collectRefConflicts(schemaRoot, "", conflicts)
		if (conflicts.length > 0) {
			logger.error("json schema contains $ref with conflicting keywords", {
				functionName: "generateWidgetContent",
				widgetSlotNames,
				conflictCount: conflicts.length,
				sample: conflicts.slice(0, 20)
			})
		}
	}

	logger.debug("generated json schema for openai", {
		functionName: "generateWidgetContent",
		generatorName: "widget_content_generator",
		schema: JSON.stringify(responseFormat.json_schema?.schema, null, 2)
	})

	const messageContent: OpenAI.ChatCompletionContentPart[] = [{ type: "text", text: userContent }]
	for (const imageUrl of imageContext.imageUrls) {
		messageContent.push({ type: "image_url", image_url: { url: imageUrl, detail: "high" } })
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

export async function generateFromEnvelope(
	openai: OpenAI,
	logger: logger.Logger,
	envelope: AiContextEnvelope,
	widgetCollectionName: WidgetCollectionName
): Promise<AssessmentItemInput> {
	if (!envelope.primaryContent || envelope.primaryContent.trim() === "") {
		logger.error("envelope validation failed", { reason: "primaryContent is empty" })
		throw errors.new("primaryContent cannot be empty")
	}

	logger.info("starting structured qti generation from envelope", {
		widgetCollection: widgetCollectionName,
		primaryContentLength: envelope.primaryContent.length,
		supplementaryContentCount: envelope.supplementaryContent.length,
		multimodalUrlCount: envelope.multimodalImageUrls.length,
		multimodalPayloadCount: envelope.multimodalImagePayloads.length
	})

	const resolvedImagesResult = await errors.try(resolveRasterImages(envelope))
	if (resolvedImagesResult.error) {
		logger.error("failed to resolve raster images from envelope", { error: resolvedImagesResult.error })
		throw errors.wrap(resolvedImagesResult.error, "raster image resolution")
	}
	const imageContext = resolvedImagesResult.data

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

	logger.debug("validating consistency between declared slots and body content")

	function collectAllSlotIds(shell: AssessmentItemShell): Set<string> {
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

		walkBlock(shell.body)
		for (const block of shell.feedbackBlocks) {
			walkBlock(block.content)
		}

		if (shell.interactions) {
		}

		return ids
	}

	const allDeclaredSlots = new Set([...assessmentShell.widgets, ...assessmentShell.interactions])
	const slotsUsedInContent = collectAllSlotIds(assessmentShell)

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

	if (unusedSlots.length > 0) {
		logger.debug("retaining declared-but-unused slots for later stages", {
			unusedSlots
		})
	}

	logger.debug("slot consistency validation successful")

	const widgetSlotNames = assessmentShell.widgets
	logger.debug("shot 2: mapping slots to widgets", {
		count: widgetSlotNames.length
	})

	const performWidgetMapping = async () => {
		if (widgetSlotNames.length === 0) {
			logger.info("no widget slots found, skipping ai widget mapping call")
			const emptyMapping: Record<string, keyof typeof allWidgetSchemas> = {}
			return { data: emptyMapping, error: null }
		}
		const bodyString = assessmentShell.body ? JSON.stringify(assessmentShell.body) : ""
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
		walkBlock(shell.body)
		for (const block of shell.feedbackBlocks) {
			walkBlock(block.content)
		}
		for (const interaction of Object.values(interactions)) {
			if (interaction.type === "choiceInteraction" || interaction.type === "orderInteraction") {
				for (const choice of interaction.choices) {
					walkBlock(choice.content)
				}
			}
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
	assessmentShell.widgets = usedWidgetSlots
	widgetMapping = Object.fromEntries(
		Object.entries(widgetMapping).filter(([slot]) => originalWidgetSlots.has(slot) && usedAfterShot3.has(slot))
	)

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

	const finalAssessmentItem: AssessmentItemInput = {
		...assessmentShell,
		interactions: generatedInteractions,
		widgets: generatedWidgets
	}
	return finalAssessmentItem
}
