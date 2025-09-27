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
import { createAssessmentShellPrompt } from "./prompts/shell"
import { createInteractionContentPrompt } from "./prompts/interactions"
import { createWidgetContentPrompt } from "./prompts/widgets"
import { createWidgetMappingPrompt } from "./prompts/widget-mapping"
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

function collectInteractionIdsFromShell(shell: AssessmentItemShell): string[] {
    const ids = new Set<string>()
    const walkInline = (inline: InlineContent | null): void => {
        if (!inline) return
        for (const node of inline) {
            if (node && node.type === "inlineInteractionRef") ids.add(node.interactionId)
        }
    }
    const walkBlock = (blocks: BlockContent | null): void => {
        if (!blocks) return
        for (const node of blocks) {
            if (!node) continue
            if (node.type === "interactionRef") ids.add(node.interactionId)
            if (node.type === "paragraph") walkInline(node.content)
            if (node.type === "unorderedList") node.items.forEach(walkInline)
        }
    }
    walkBlock(shell.body)
    for (const fb of shell.feedbackBlocks) walkBlock(fb.content)
    return Array.from(ids)
}

function createInteractionCollectionSchema(interactionIds: string[]) {
    const shape: Record<string, z.ZodType> = {}
    for (const id of interactionIds) {
        shape[id] = AnyInteractionSchema
    }
    return z.object(shape)
}

async function generateInteractionContent(
    openai: OpenAI,
    logger: logger.Logger,
    envelope: AiContextEnvelope,
    assessmentShell: AssessmentItemShell,
    imageContext: ImageContext,
    interactionIds: string[]
): Promise<Record<string, AnyInteraction>> {
    if (interactionIds.length === 0) {
        logger.debug("no interactions to generate, skipping shot 3")
        return {}
    }
    const { systemInstruction, userContent } = createInteractionContentPrompt(
        envelope,
        assessmentShell,
        imageContext
    )
    const InteractionCollectionSchema = createInteractionCollectionSchema(interactionIds)
    const responseFormat = zodResponseFormat(InteractionCollectionSchema, "interaction_content_generator")
    const messageContent: OpenAI.ChatCompletionContentPart[] = [{ type: "text", text: userContent }]
    for (const imageUrl of imageContext.imageUrls) {
        messageContent.push({ type: "image_url", image_url: { url: imageUrl, detail: "high" } })
    }
    logger.debug("calling openai for interaction content generation with multimodal input", { interactionIds })
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
        logger.error("failed to generate interaction content", { error: response.error })
        throw errors.wrap(response.error, "ai interaction generation")
    }
    const choice = response.data.choices[0]
    if (!choice?.message?.parsed) {
        logger.error("CRITICAL: OpenAI interaction generation returned no parsed content")
        throw errors.new("empty ai response: no parsed content for interaction generation")
    }
    return choice.message.parsed as Record<string, AnyInteraction>
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
		identifier: assessmentShell.identifier
	})

	

    const interactionIds = collectInteractionIdsFromShell(assessmentShell)
    const interactionContentResult = await errors.try(
        generateInteractionContent(openai, logger, envelope, assessmentShell, imageContext, interactionIds)
    )
	if (interactionContentResult.error) {
		logger.error("generate interaction content", { error: interactionContentResult.error })
		throw errors.wrap(interactionContentResult.error, "generate interaction content")
	}
	const generatedInteractions = interactionContentResult.data
	logger.debug("shot 3 complete", {
		generatedInteractionKeys: Object.keys(generatedInteractions)
	})

    
    function collectWidgetIdsFromShell(shell: AssessmentItemShell): string[] {
        const ids = new Set<string>()
        const walkInline = (inline: InlineContent | null): void => {
            if (!inline) return
            for (const node of inline) {
                if (node && node.type === "inlineWidgetRef") ids.add(node.widgetId)
            }
        }
        const walkBlock = (blocks: BlockContent | null): void => {
            if (!blocks) return
            for (const node of blocks) {
                if (!node) continue
                if (node.type === "widgetRef") ids.add(node.widgetId)
                if (node.type === "paragraph") walkInline(node.content)
                if (node.type === "unorderedList") node.items.forEach(walkInline)
            }
        }
        walkBlock(shell.body)
        for (const fb of shell.feedbackBlocks) walkBlock(fb.content)
        return Array.from(ids)
    }
    const widgetIds = collectWidgetIdsFromShell(assessmentShell)
    let generatedWidgets: Record<string, WidgetInput> = {}
    if (widgetIds.length > 0) {
        const bodyString = assessmentShell.body ? JSON.stringify(assessmentShell.body) : ""
        const mappingCall = await errors.try(
            (() => {
                const { systemInstruction, userContent, WidgetMappingSchema } = createWidgetMappingPrompt(
                    envelope,
                    bodyString,
                    widgetIds,
                    widgetCollectionName,
                    imageContext
                )
                const responseFormat = zodResponseFormat(WidgetMappingSchema, "widget_mapper")
                const messageContent: OpenAI.ChatCompletionContentPart[] = [{ type: "text", text: userContent }]
                for (const imageUrl of imageContext.imageUrls) {
                    messageContent.push({ type: "image_url", image_url: { url: imageUrl, detail: "high" } })
                }
                return openai.chat.completions.parse({
                    model: OPENAI_MODEL,
                    messages: [
                        { role: "system", content: systemInstruction },
                        { role: "user", content: messageContent }
                    ],
                    response_format: responseFormat
                })
            })()
        )
        if (mappingCall.error) {
            logger.error("map slots to widgets via refs", { error: mappingCall.error })
            throw errors.wrap(mappingCall.error, "ai widget mapping")
        }
        const mapChoice = mappingCall.data.choices[0]
        if (!mapChoice?.message?.parsed) {
            logger.error("widget mapping returned no parsed content")
            throw errors.new("empty ai response: no parsed content for widget mapping")
        }
        const widgetMapping = mapChoice.message.parsed.widget_mapping as Record<string, keyof typeof allWidgetSchemas>

        const widgetPrompt = createWidgetContentPrompt(
            envelope,
            assessmentShell,
            widgetMapping,
            generatedInteractions,
            widgetCollectionName,
            imageContext
        )
        const WidgetCollectionSchemaShape: Record<string, z.ZodType> = {}
        for (const [id, typeKey] of Object.entries(widgetMapping)) {
            const schema = allWidgetSchemas[typeKey]
            if (schema) WidgetCollectionSchemaShape[id] = schema
        }
        const WidgetCollectionSchema = z.object(WidgetCollectionSchemaShape)
        const widgetsResponse = await errors.try(
            openai.chat.completions.parse({
                model: OPENAI_MODEL,
                messages: [
                    { role: "system", content: widgetPrompt.systemInstruction },
                    { role: "user", content: widgetPrompt.userContent }
                ],
                response_format: zodResponseFormat(WidgetCollectionSchema, "widget_content_generator")
            })
        )
        if (widgetsResponse.error) {
            logger.error("generate widget content", { error: widgetsResponse.error })
            throw errors.wrap(widgetsResponse.error, "ai widget generation")
        }
        const wChoice = widgetsResponse.data.choices[0]
        if (!wChoice?.message?.parsed) {
            logger.error("widget generation returned no parsed content")
            throw errors.new("empty ai response: no parsed content for widget generation")
        }
        generatedWidgets = wChoice.message.parsed as Record<string, WidgetInput>
        logger.debug("shot 4 complete", { generatedWidgetKeys: Object.keys(generatedWidgets) })
    }

	const finalAssessmentItem: AssessmentItemInput = {
		...assessmentShell,
		interactions: generatedInteractions,
		widgets: generatedWidgets
	}
	return finalAssessmentItem
}
