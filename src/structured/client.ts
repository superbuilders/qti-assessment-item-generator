import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type OpenAI from "openai"
import { z } from "zod"
import type { AssessmentItemInput, BlockContent, ResponseDeclaration } from "../compiler/schemas"
import type { WidgetCollection } from "../widgets/collections/types"
import { allWidgetSchemas, type Widget, WidgetSchema } from "../widgets/registry"

function isWidgetTypeKey(v: string): v is keyof typeof allWidgetSchemas {
	return v in allWidgetSchemas
}

import { collectWidgetRefs } from "./collector"
import { feedbackMapToBlocks } from "./feedback-converter"
import { enumerateFeedbackTargets } from "./feedback-targets"
import { toJSONSchemaPromptSafe } from "./json-schema"
import { createFeedbackPrompt } from "./prompts/feedback"
import { createInteractionContentPrompt } from "./prompts/interactions"
import { createAssessmentShellPrompt } from "./prompts/shell"
import { createWidgetContentPrompt } from "./prompts/widgets"
import { createCollectionScopedInteractionSchema, createCollectionScopedShellSchema } from "./schemas"
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
	imageContext: ImageContext,
	widgetCollection: WidgetCollection
) {
	const { systemInstruction, userContent } = createAssessmentShellPrompt(envelope, imageContext, widgetCollection)

	const ShellSchema = createCollectionScopedShellSchema(widgetCollection)
	const jsonSchema = toJSONSchemaPromptSafe(ShellSchema)

	logger.debug("generated json schema for openai", {
		functionName: "generateAssessmentShell",
		generatorName: "assessment_shell_generator"
	})

	const messageContent: OpenAI.ChatCompletionContentPart[] = [{ type: "text", text: userContent }]
	for (const imageUrl of imageContext.imageUrls) {
		messageContent.push({ type: "image_url", image_url: { url: imageUrl, detail: "high" } })
	}

	logger.debug("calling openai for assessment shell with multimodal input")
	const response = await errors.try(
		openai.chat.completions.create({
			model: OPENAI_MODEL,
			messages: [
				{ role: "system", content: systemInstruction },
				{ role: "user", content: messageContent }
			],
			response_format: {
				type: "json_schema",
				json_schema: {
					name: "assessment_shell_generator",
					schema: jsonSchema,
					strict: true
				}
			}
		})
	)
	if (response.error) {
		logger.error("ai shell generation", {
			error: response.error
		})
		throw errors.wrap(response.error, "ai shell generation")
	}

	const choice = response.data.choices[0]
	if (!choice) {
		logger.error("openai returned no choices")
		throw errors.new("openai returned no choices")
	}

	const message = choice.message
	if (!message.content) {
		logger.error("openai returned no content")
		throw errors.new("empty ai response: no content")
	}
	const content = message.content

	const parseResult = errors.trySync(() => JSON.parse(content))
	if (parseResult.error) {
		logger.error("json parse", { error: parseResult.error })
		throw errors.wrap(parseResult.error, "json parse")
	}

	const validation = ShellSchema.safeParse(parseResult.data)
	if (!validation.success) {
		logger.error("shell validation failed", { error: validation.error })
		throw errors.wrap(validation.error, "shell validation")
	}

	return validation.data
}

function collectInteractionIdsFromShell(shell: { body: unknown }): string[] {
	const ids = new Set<string>()

	function walkInline(inline: unknown): void {
		if (!inline || !Array.isArray(inline)) return
		for (const node of inline) {
			if (
				node &&
				typeof node === "object" &&
				"type" in node &&
				node.type === "inlineInteractionRef" &&
				"interactionId" in node &&
				typeof node.interactionId === "string"
			) {
				ids.add(node.interactionId)
			}
		}
	}

	function walkBlock(blocks: unknown): void {
		if (!blocks || !Array.isArray(blocks)) return
		for (const node of blocks) {
			if (!node || typeof node !== "object" || !("type" in node)) continue
			if (node.type === "interactionRef" && "interactionId" in node && typeof node.interactionId === "string") {
				ids.add(node.interactionId)
			}
			if (node.type === "paragraph" && "content" in node) {
				walkInline(node.content)
			}
			if (
				(node.type === "unorderedList" || node.type === "orderedList") &&
				"items" in node &&
				Array.isArray(node.items)
			) {
				node.items.forEach(walkInline)
			}
		}
	}

	walkBlock(shell.body)
	return Array.from(ids)
}

async function generateInteractionContent(
	openai: OpenAI,
	logger: logger.Logger,
	envelope: AiContextEnvelope,
	assessmentShell: { body: BlockContent | null; responseDeclarations: ResponseDeclaration[] },
	imageContext: ImageContext,
	interactionIds: string[],
	widgetCollection: WidgetCollection
) {
	if (interactionIds.length === 0) {
		logger.debug("no interactions to generate, skipping shot 2")
		return {}
	}

	const { systemInstruction, userContent } = createInteractionContentPrompt(
		envelope,
		assessmentShell,
		imageContext,
		widgetCollection
	)

	const InteractionSchema = createCollectionScopedInteractionSchema(interactionIds, widgetCollection)
	const jsonSchema = toJSONSchemaPromptSafe(InteractionSchema)

	const messageContent: OpenAI.ChatCompletionContentPart[] = [{ type: "text", text: userContent }]
	for (const imageUrl of imageContext.imageUrls) {
		messageContent.push({ type: "image_url", image_url: { url: imageUrl, detail: "high" } })
	}

	logger.debug("calling openai for interaction content generation with multimodal input", { interactionIds })
	const response = await errors.try(
		openai.chat.completions.create({
			model: OPENAI_MODEL,
			messages: [
				{ role: "system", content: systemInstruction },
				{ role: "user", content: messageContent }
			],
			response_format: {
				type: "json_schema",
				json_schema: {
					name: "interaction_content_generator",
					schema: jsonSchema,
					strict: true
				}
			}
		})
	)
	if (response.error) {
		logger.error("ai interaction generation", { error: response.error })
		throw errors.wrap(response.error, "ai interaction generation")
	}

	const choice = response.data.choices[0]
	if (!choice?.message?.content) {
		logger.error("openai interaction generation returned no content")
		throw errors.new("empty ai response: no content for interaction generation")
	}
	const content = choice.message.content

	const parseResult = errors.trySync(() => JSON.parse(content))
	if (parseResult.error) {
		logger.error("json parse", { error: parseResult.error })
		throw errors.wrap(parseResult.error, "json parse")
	}

	const validation = InteractionSchema.safeParse(parseResult.data)
	if (!validation.success) {
		logger.error("interaction validation failed", { error: validation.error })
		throw errors.wrap(validation.error, "interaction validation")
	}

	return validation.data
}

export async function generateFromEnvelope(
	openai: OpenAI,
	logger: logger.Logger,
	envelope: AiContextEnvelope,
	widgetCollection: WidgetCollection
): Promise<AssessmentItemInput> {
	if (!envelope.primaryContent || envelope.primaryContent.trim() === "") {
		logger.error("envelope validation failed", { reason: "primaryContent is empty" })
		throw errors.new("primaryContent cannot be empty")
	}

	logger.info("starting structured qti generation from envelope", {
		widgetCollection: widgetCollection.name,
		primaryContentLength: envelope.primaryContent.length,
		supplementaryContentCount: envelope.supplementaryContent.length,
		multimodalUrlCount: envelope.multimodalImageUrls.length,
		multimodalPayloadCount: envelope.multimodalImagePayloads.length
	})

	const resolvedImagesResult = await errors.try(resolveRasterImages(envelope))
	if (resolvedImagesResult.error) {
		logger.error("raster image resolution", { error: resolvedImagesResult.error })
		throw errors.wrap(resolvedImagesResult.error, "raster image resolution")
	}
	const imageContext = resolvedImagesResult.data

	const shellResult = await errors.try(
		generateAssessmentShell(openai, logger, envelope, imageContext, widgetCollection)
	)
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
		generateInteractionContent(
			openai,
			logger,
			envelope,
			assessmentShell,
			imageContext,
			interactionIds,
			widgetCollection
		)
	)
	if (interactionContentResult.error) {
		logger.error("generate interaction content", { error: interactionContentResult.error })
		throw errors.wrap(interactionContentResult.error, "generate interaction content")
	}
	const generatedInteractions = interactionContentResult.data
	logger.debug("shot 2 complete", {
		generatedInteractionKeys: Object.keys(generatedInteractions)
	})

	// Shot 3 - Generate feedback
	const feedbackTargets = enumerateFeedbackTargets(assessmentShell.responseDeclarations, generatedInteractions)
	logger.debug("enumerated feedback targets", { targets: feedbackTargets })

	const {
		systemInstruction: feedbackSystem,
		userContent: feedbackUser,
		FeedbackSchema
	} = createFeedbackPrompt(
		envelope,
		assessmentShell,
		generatedInteractions,
		feedbackTargets,
		imageContext,
		widgetCollection
	)

	const feedbackJsonSchema = toJSONSchemaPromptSafe(FeedbackSchema)
	const feedbackResult = await errors.try(
		openai.chat.completions.create({
			model: OPENAI_MODEL,
			messages: [
				{ role: "system", content: feedbackSystem },
				{ role: "user", content: feedbackUser }
			],
			response_format: {
				type: "json_schema",
				json_schema: {
					name: "feedback_generator",
					schema: feedbackJsonSchema,
					strict: true
				}
			}
		})
	)
	if (feedbackResult.error) {
		logger.error("generate feedback", { error: feedbackResult.error })
		throw errors.wrap(feedbackResult.error, "generate feedback")
	}

	const feedbackChoice = feedbackResult.data.choices[0]
	if (!feedbackChoice?.message?.content) {
		logger.error("openai feedback generation returned no content")
		throw errors.new("empty ai response: no content for feedback generation")
	}
	const feedbackContent = feedbackChoice.message.content

	const feedbackParseResult = errors.trySync(() => JSON.parse(feedbackContent))
	if (feedbackParseResult.error) {
		logger.error("json parse", { error: feedbackParseResult.error })
		throw errors.wrap(feedbackParseResult.error, "json parse")
	}

	const feedbackValidation = FeedbackSchema.safeParse(feedbackParseResult.data)
	if (!feedbackValidation.success) {
		logger.error("feedback validation failed", { error: feedbackValidation.error })
		throw errors.wrap(feedbackValidation.error, "feedback validation")
	}

	const feedbackBlocks = feedbackMapToBlocks(feedbackValidation.data.feedback)

	// Validation: ensure all targets were addressed
	const generatedOutcomes = new Set(feedbackBlocks.map((fb) => `${fb.outcomeIdentifier}::${fb.identifier}`))
	const missingTargets = feedbackTargets.filter(
		(t) => !generatedOutcomes.has(`${t.outcomeIdentifier}::${t.blockIdentifier}`)
	)
	if (missingTargets.length > 0) {
		logger.error("feedback generation missed required targets", { missingTargets })
		throw errors.new(
			`feedback generation: missing targets: ${missingTargets.map((t) => `${t.outcomeIdentifier}::${t.blockIdentifier}`).join(", ")}`
		)
	}

	logger.debug("shot 3 complete", { feedbackBlockCount: feedbackBlocks.length })

	// Shot 4: Collect widget refs with types and generate widget content
	const widgetRefs = collectWidgetRefs({
		body: assessmentShell.body,
		feedbackBlocks: feedbackBlocks,
		interactions: generatedInteractions
	})

	logger.debug("collected widget refs", { count: widgetRefs.size, refs: Array.from(widgetRefs.entries()) })

	let generatedWidgets: Record<string, Widget> = {}
	if (widgetRefs.size > 0) {
		// Build a typed mapping with runtime guard
		const widgetMapping: Record<string, keyof typeof allWidgetSchemas> = {}
		for (const [id, typeName] of widgetRefs) {
			if (!isWidgetTypeKey(typeName)) {
				logger.error("unknown widget type in refs", { widgetId: id, typeName })
				throw errors.new("unknown widget type in refs")
			}
			widgetMapping[id] = typeName
		}
		const widgetPrompt = createWidgetContentPrompt(
			envelope,
			assessmentShell,
			widgetMapping,
			generatedInteractions,
			widgetCollection.name,
			imageContext
		)

		// Accept any widget id → widget union; enforce required ids below
		const WidgetCollectionSchema = z.record(z.string(), WidgetSchema)
		const widgetJsonSchema = toJSONSchemaPromptSafe(WidgetCollectionSchema)

		const widgetsResponse = await errors.try(
			openai.chat.completions.create({
				model: OPENAI_MODEL,
				messages: [
					{ role: "system", content: widgetPrompt.systemInstruction },
					{ role: "user", content: widgetPrompt.userContent }
				],
				response_format: {
					type: "json_schema",
					json_schema: {
						name: "widget_content_generator",
						schema: widgetJsonSchema,
						strict: true
					}
				}
			})
		)
		if (widgetsResponse.error) {
			logger.error("generate widget content", { error: widgetsResponse.error })
			throw errors.wrap(widgetsResponse.error, "ai widget generation")
		}

		const wChoice = widgetsResponse.data.choices[0]
		if (!wChoice?.message?.content) {
			logger.error("widget generation returned no content")
			throw errors.new("empty ai response: no content for widget generation")
		}
		const widgetContent = wChoice.message.content

		const widgetParseResult = errors.trySync(() => JSON.parse(widgetContent))
		if (widgetParseResult.error) {
			logger.error("json parse", { error: widgetParseResult.error })
			throw errors.wrap(widgetParseResult.error, "json parse")
		}

		const widgetValidation = WidgetCollectionSchema.safeParse(widgetParseResult.data)
		if (!widgetValidation.success) {
			logger.error("widget validation failed", { error: widgetValidation.error })
			throw errors.wrap(widgetValidation.error, "widget validation")
		}

		generatedWidgets = widgetValidation.data

		// Validate all required widgets were generated
		const generatedKeys = new Set(Object.keys(generatedWidgets))
		const requiredIds = Array.from(widgetRefs.keys())
		const missingContent = requiredIds.filter((id) => !generatedKeys.has(id))
		if (missingContent.length > 0) {
			logger.error("widget content generation did not produce all required widgets", { missingContent })
			throw errors.new(`widget content generation: missing content for slots: ${missingContent.join(", ")}`)
		}

		logger.debug("shot 4 complete", { generatedWidgetKeys: Object.keys(generatedWidgets) })
	}

	return {
		...assessmentShell,
		interactions: generatedInteractions,
		widgets: generatedWidgets,
		feedbackBlocks: feedbackBlocks
	}
}
