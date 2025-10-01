import type { BlockContent, InlineContent } from "@/core/content"
import type { AssessmentItemInput, ResponseDeclaration } from "@/core/item"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { WidgetCollection, WidgetDefinition, WidgetTypeTupleFrom } from "@/widgets/collections/types"
import { allWidgetSchemas, type Widget, WidgetSchema } from "@/widgets/registry"
import type OpenAI from "openai"
import type { ChatCompletion, ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions"
import { z } from "zod"

function isWidgetTypeKey(v: string): v is keyof typeof allWidgetSchemas {
	return v in allWidgetSchemas
}

import {
	buildFeedbackPlanFromInteractions,
	convertNestedFeedbackToBlocks,
	validateNestedFeedback
} from "@/core/feedback"
import { createAnyInteractionSchema } from "@/core/interactions"
import { createAssessmentItemShellSchema } from "@/core/item"
import { toJSONSchemaPromptSafe } from "@/core/json-schema"
import { createFeedbackPrompt } from "./prompts/feedback"
import { createInteractionContentPrompt } from "./prompts/interactions"
import { createAssessmentShellPrompt } from "./prompts/shell"
import { createWidgetContentPrompt } from "./prompts/widgets"
import type { AiContextEnvelope, ImageContext } from "./types"
import { collectWidgetRefs } from "./utils/collector"

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

async function generateAssessmentShell<
	C extends WidgetCollection<Record<string, WidgetDefinition<unknown, unknown>>, readonly string[]>
>(
	openai: OpenAI,
	logger: logger.Logger,
	envelope: AiContextEnvelope,
	imageContext: ImageContext,
	widgetCollection: C
) {
	const { systemInstruction, userContent } = createAssessmentShellPrompt(envelope, imageContext, widgetCollection)

	const ShellSchema = createAssessmentItemShellSchema(widgetCollection.widgetTypeKeys)
	const jsonSchema = toJSONSchemaPromptSafe(ShellSchema)

	logger.debug("generated json schema for openai", {
		functionName: "generateAssessmentShell",
		generatorName: "assessment_shell_generator",
		schema: jsonSchema
	})

	const messageContent: OpenAI.ChatCompletionContentPart[] = [{ type: "text", text: userContent }]
	for (const imageUrl of imageContext.imageUrls) {
		messageContent.push({ type: "image_url", image_url: { url: imageUrl, detail: "high" } })
	}

	logger.debug("calling openai for assessment shell with multimodal input")
	const params: ChatCompletionCreateParamsNonStreaming = {
		model: OPENAI_MODEL,
		messages: [
			{ role: "system", content: systemInstruction },
			{ role: "user", content: messageContent }
		],
		response_format: {
			type: "json_schema",
			json_schema: {
				name: "assessment_shell_generator",
				schema: jsonSchema as Record<string, unknown>,
				strict: true
			}
		},
		stream: false
	}
	const response = await errors.try(openai.chat.completions.create(params))
	if (response.error) {
		logger.error("ai shell generation", {
			error: response.error
		})
		throw errors.wrap(response.error, "ai shell generation")
	}

	const completion = response.data as ChatCompletion
	const choice = completion.choices[0]
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

function collectInteractionIdsFromShell<E extends readonly string[]>(shell: { body: BlockContent<E> | null }): string[] {
	const ids = new Set<string>()

	function walkInline(inline: InlineContent<E>): void {
		for (const node of inline) {
			if (node.type === "inlineInteractionRef") {
				ids.add(node.interactionId)
			}
		}
	}

	function walkBlock(blocks: BlockContent<E>): void {
		for (const node of blocks) {
			switch (node.type) {
				case "interactionRef":
					ids.add(node.interactionId)
					break
				case "paragraph":
					walkInline(node.content)
					break
				case "unorderedList":
				case "orderedList":
					for (const item of node.items) {
						walkInline(item)
					}
					break
				case "tableRich":
					if (node.header) {
						for (const row of node.header) {
							for (const cell of row) {
								if (cell) {
									walkInline(cell)
								}
							}
						}
					}
					for (const row of node.rows) {
						for (const cell of row) {
							if (cell) {
								walkInline(cell)
							}
						}
					}
					break
				case "widgetRef":
				case "codeBlock":
					// These don't contain interactions
					break
			}
		}
	}

	if (shell.body) {
		walkBlock(shell.body)
	}
	return Array.from(ids)
}

async function generateInteractionContent<
	C extends WidgetCollection<Record<string, WidgetDefinition<unknown, unknown>>, readonly string[]>
>(
	openai: OpenAI,
	logger: logger.Logger,
	envelope: AiContextEnvelope,
	assessmentShell: { body: BlockContent<WidgetTypeTupleFrom<C>> | null; responseDeclarations: ResponseDeclaration[] },
	imageContext: ImageContext,
	interactionIds: string[],
	widgetCollection: C
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

	const AnyInteraction = createAnyInteractionSchema(widgetCollection.widgetTypeKeys)
	const InteractionSchema = z.record(z.string(), AnyInteraction)
	const jsonSchema = toJSONSchemaPromptSafe(InteractionSchema)

	logger.debug("generated json schema for openai", {
		functionName: "generateInteractionContent",
		generatorName: "interaction_content_generator",
		interactionIds,
		schema: jsonSchema
	})

	const messageContent: OpenAI.ChatCompletionContentPart[] = [{ type: "text", text: userContent }]
	for (const imageUrl of imageContext.imageUrls) {
		messageContent.push({ type: "image_url", image_url: { url: imageUrl, detail: "high" } })
	}

	logger.debug("calling openai for interaction content generation with multimodal input", { interactionIds })
	const params: ChatCompletionCreateParamsNonStreaming = {
		model: OPENAI_MODEL,
		messages: [
			{ role: "system", content: systemInstruction },
			{ role: "user", content: messageContent }
		],
		response_format: {
			type: "json_schema",
			json_schema: {
				name: "interaction_content_generator",
				schema: jsonSchema as Record<string, unknown>,
				strict: true
			}
		},
		stream: false
	}
	const response = await errors.try(openai.chat.completions.create(params))
	if (response.error) {
		logger.error("ai interaction generation", { error: response.error })
		throw errors.wrap(response.error, "ai interaction generation")
	}

	const completion = response.data as ChatCompletion
	const choice = completion.choices[0]
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

export async function generateFromEnvelope<
	C extends WidgetCollection<Record<string, WidgetDefinition<unknown, unknown>>, readonly string[]>
>(
	openai: OpenAI,
	logger: logger.Logger,
	envelope: AiContextEnvelope,
	widgetCollection: C
): Promise<AssessmentItemInput<WidgetTypeTupleFrom<C>>> {
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

	// Build the explicit feedback plan from interactions (this is the ONLY place we infer)
	const feedbackPlan = buildFeedbackPlanFromInteractions(generatedInteractions, assessmentShell.responseDeclarations)
	logger.debug("built feedback plan", {
		mode: feedbackPlan.mode,
		dimensionCount: feedbackPlan.dimensions.length,
		combinationCount: feedbackPlan.combinations.length
	})

	// Shot 3 - Generate feedback
	const {
		systemInstruction: feedbackSystem,
		userContent: feedbackUser,
		FeedbackSchema
	} = createFeedbackPrompt(envelope, assessmentShell, feedbackPlan, imageContext, widgetCollection)

	const feedbackJsonSchema = toJSONSchemaPromptSafe(FeedbackSchema)
	logger.debug("generated json schema for openai", {
		functionName: "generateFeedback",
		generatorName: "feedback_generator",
		schema: feedbackJsonSchema
	})
	const feedbackParams: ChatCompletionCreateParamsNonStreaming = {
		model: OPENAI_MODEL,
		messages: [
			{ role: "system", content: feedbackSystem },
			{ role: "user", content: feedbackUser }
		],
		response_format: {
			type: "json_schema",
			json_schema: {
				name: "feedback_generator",
				schema: feedbackJsonSchema as Record<string, unknown>,
				strict: true
			}
		},
		stream: false
	}
	const feedbackResult = await errors.try(openai.chat.completions.create(feedbackParams))
	if (feedbackResult.error) {
		logger.error("generate feedback", { error: feedbackResult.error })
		throw errors.wrap(feedbackResult.error, "generate feedback")
	}

	const feedbackCompletion = feedbackResult.data as ChatCompletion
	const feedbackChoice = feedbackCompletion.choices[0]
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

	const validatedNestedFeedback = validateNestedFeedback(
		feedbackParseResult.data,
		feedbackPlan,
		widgetCollection.widgetTypeKeys
	)
	const feedbackBlocks = convertNestedFeedbackToBlocks(validatedNestedFeedback, feedbackPlan)
	logger.debug("shot 3 complete", { feedbackBlockCount: Object.keys(feedbackBlocks).length })

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
		logger.debug("generated json schema for openai", {
			functionName: "generateWidgetContent",
			generatorName: "widget_content_generator",
			schema: widgetJsonSchema
		})

		const widgetParams: ChatCompletionCreateParamsNonStreaming = {
			model: OPENAI_MODEL,
			messages: [
				{ role: "system", content: widgetPrompt.systemInstruction },
				{ role: "user", content: widgetPrompt.userContent }
			],
			response_format: {
				type: "json_schema",
				json_schema: {
					name: "widget_content_generator",
					schema: widgetJsonSchema as Record<string, unknown>,
					strict: true
				}
			},
			stream: false
		}
		const widgetsResponse = await errors.try(openai.chat.completions.create(widgetParams))
		if (widgetsResponse.error) {
			logger.error("generate widget content", { error: widgetsResponse.error })
			throw errors.wrap(widgetsResponse.error, "ai widget generation")
		}

		const widgetCompletion = widgetsResponse.data as ChatCompletion
		const wChoice = widgetCompletion.choices[0]
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
		feedbackPlan,
		feedbackBlocks: feedbackBlocks
	}
}
