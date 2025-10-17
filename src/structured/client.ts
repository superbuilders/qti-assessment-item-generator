import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type OpenAI from "openai"
import { z } from "zod"
import type { BlockContent, FeedbackContent, InlineContent } from "@/core/content"
import type { AssessmentItemInput, ResponseDeclaration } from "@/core/item"
import type {
	WidgetCollection,
	WidgetDefinition,
	WidgetTypeTupleFrom
} from "@/widgets/collections/types"
import { allWidgetSchemas, type Widget, WidgetSchema } from "@/widgets/registry"

function isWidgetTypeKey(v: string): v is keyof typeof allWidgetSchemas {
	return v in allWidgetSchemas
}

import {
	buildFeedbackPlanFromInteractions,
	createFeedbackObjectSchema,
	type FeedbackPlan
} from "@/core/feedback"
import type { AnyInteraction } from "@/core/interactions"
import { createAnyInteractionSchema } from "@/core/interactions"
import { type AssessmentItemShell, createAssessmentItemShellSchema } from "@/core/item"
import { toJSONSchemaPromptSafe } from "@/core/json-schema"
import { createPerOutcomeNestedFeedbackPrompt } from "./prompts/feedback-per-outcome"
import { createInteractionContentPrompt } from "./prompts/interactions"
import { formatUnifiedContextSections } from "./prompts/shared"
import { createAssessmentShellPrompt } from "./prompts/shell"
import { createWidgetContentPrompt } from "./prompts/widgets"
import type { AiContextEnvelope, ImageContext } from "./types"
import { collectWidgetRefs } from "./utils/collector"
import { callOpenAIWithRetry } from "./utils/openai"

const OPENAI_MODEL = "gpt-5"
const MAX_IMAGES_PER_REQUEST = 500
export const ErrWidgetNotFound = errors.new("widget could not be mapped to a known type")

// NEW: Type definitions for Responses API content parts matching SDK
type InputTextContentPart = {
	type: "input_text"
	text: string
}

type InputFileContentPart = {
	type: "input_file"
	filename?: string
	file_data?: string
}

type InputImageContentPart = {
	type: "input_image"
	detail: "high" | "low" | "auto"
	image_url?: string
}

type ExtendedContentPart = InputTextContentPart | InputFileContentPart | InputImageContentPart

export const ErrUnsupportedInteraction = errors.new("unsupported interaction type found")

type Leaf<E extends readonly string[]> = { content: FeedbackContent<E> }
interface NestedNode<E extends readonly string[]> {
	[responseIdentifier: string]: {
		[key: string]: Leaf<E> | NestedNode<E>
	}
}

function isLeaf<E extends readonly string[]>(v: Leaf<E> | NestedNode<E>): v is Leaf<E> {
	return Object.hasOwn(v, "content")
}

async function resolveRasterImages(envelope: AiContextEnvelope): Promise<ImageContext> {
	const finalImageUrls: string[] = []

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
		finalImageUrls.push(url)
	}

	if (finalImageUrls.length > MAX_IMAGES_PER_REQUEST) {
		logger.error("too many image inputs for request", {
			count: finalImageUrls.length,
			max: MAX_IMAGES_PER_REQUEST
		})
		throw errors.new("too many image inputs for request")
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
	const { systemInstruction, userContent } = createAssessmentShellPrompt(
		envelope,
		imageContext,
		widgetCollection
	)

	const ShellSchema = createAssessmentItemShellSchema(widgetCollection.widgetTypeKeys)
	const jsonSchema = toJSONSchemaPromptSafe(ShellSchema)

	logger.debug("generated json schema for openai", {
		functionName: "generateAssessmentShell",
		generatorName: "assessment_shell_generator",
		schema: jsonSchema
	})

	// MODIFIED: Construct a multi-part content body for the Responses API
	const contentParts: ExtendedContentPart[] = []
	contentParts.push({ type: "input_text", text: userContent })

	// Add image URLs using input_image type
	for (const imageUrl of imageContext.imageUrls) {
		contentParts.push({ type: "input_image", detail: "high", image_url: imageUrl })
	}

	// NEW: Process raw image payloads into base64-encoded input_file parts
	for (const image of envelope.multimodalImagePayloads) {
		const base64 = Buffer.from(image.data).toString("base64")
		const dataUrl = `data:${image.mimeType};base64,${base64}`
		contentParts.push({
			type: "input_image",
			detail: "high",
			image_url: dataUrl
		})
	}

	// NEW: Process raw PDF payloads into base64-encoded input_file parts (Shot 1 ONLY)
	for (const pdf of envelope.pdfPayloads) {
		const base64 = Buffer.from(pdf.data).toString("base64")
		const dataUrl = `data:application/pdf;base64,${base64}`
		const filename = pdf.name.endsWith(".pdf") ? pdf.name : `${pdf.name}.pdf`
		contentParts.push({
			type: "input_file",
			filename,
			file_data: dataUrl
		})
	}

	logger.debug("calling openai for assessment shell with multimodal input", {
		partCount: contentParts.length
	})

	// MODIFIED: API call migrated to Responses API
	const response = await callOpenAIWithRetry("generateAssessmentShell", () =>
		openai.responses.create({
			model: OPENAI_MODEL,
			instructions: systemInstruction,
			input: [{ role: "user", content: contentParts }],
			text: {
				format: {
					type: "json_schema",
					name: "assessment_shell_generator",
					schema: jsonSchema,
					strict: true
				}
			}
		})
	)

	// MODIFIED: Parse response from output_text
	const content = response.output_text
	if (!content) {
		logger.error("openai returned no content")
		throw errors.new("empty ai response: no content")
	}

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

function collectInteractionIdsFromShell<E extends readonly string[]>(shell: {
	body: BlockContent<E> | null
}): string[] {
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
	assessmentShell: {
		body: BlockContent<WidgetTypeTupleFrom<C>> | null
		responseDeclarations: ResponseDeclaration[]
	},
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

	// MODIFIED: Construct multi-part content for Responses API (exclude PDFs in Shot 2)
	const contentParts: ExtendedContentPart[] = []
	contentParts.push({ type: "input_text", text: userContent })

	for (const imageUrl of imageContext.imageUrls) {
		contentParts.push({ type: "input_image", detail: "high", image_url: imageUrl })
	}

	for (const image of envelope.multimodalImagePayloads) {
		const base64 = Buffer.from(image.data).toString("base64")
		const dataUrl = `data:${image.mimeType};base64,${base64}`
		contentParts.push({
			type: "input_image",
			detail: "high",
			image_url: dataUrl
		})
	}
	// Include PDFs in Shot 2 for complete context
	for (const pdf of envelope.pdfPayloads) {
		const base64 = Buffer.from(pdf.data).toString("base64")
		const dataUrl = `data:application/pdf;base64,${base64}`
		const filename = pdf.name.endsWith(".pdf") ? pdf.name : `${pdf.name}.pdf`
		contentParts.push({
			type: "input_file",
			filename,
			file_data: dataUrl
		})
	}

	logger.debug("calling openai for interaction content generation with multimodal input", {
		interactionIds
	})

	// MODIFIED: API call migrated to Responses API
	const response = await callOpenAIWithRetry("generateInteractionContent", () =>
		openai.responses.create({
			model: OPENAI_MODEL,
			instructions: systemInstruction,
			input: [{ role: "user", content: contentParts }],
			text: {
				format: {
					type: "json_schema",
					name: "interaction_content_generator",
					schema: jsonSchema,
					strict: true
				}
			}
		})
	)

	// MODIFIED: Parse response from output_text
	const content = response.output_text
	if (!content) {
		logger.error("openai interaction generation returned no content")
		throw errors.new("empty ai response: no content for interaction generation")
	}

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

async function generateFeedbackForOutcomeNested<
	C extends WidgetCollection<Record<string, WidgetDefinition<unknown, unknown>>, readonly string[]>
>(
	openai: OpenAI,
	logger: logger.Logger,
	assessmentShell: AssessmentItemShell<WidgetTypeTupleFrom<C>>,
	widgetCollection: C,
	feedbackPlan: FeedbackPlan,
	combination: FeedbackPlan["combinations"][0],
	interactions: Record<string, AnyInteraction<WidgetTypeTupleFrom<C>>>,
	envelope: AiContextEnvelope,
	imageContext: ImageContext
): Promise<{ id: string; content: FeedbackContent<WidgetTypeTupleFrom<C>> }> {
	const { systemInstruction, userContent, ShallowSchema } = createPerOutcomeNestedFeedbackPrompt(
		assessmentShell,
		feedbackPlan,
		combination,
		widgetCollection,
		interactions
	)

	const jsonSchema = toJSONSchemaPromptSafe(ShallowSchema)
	logger.debug("generated shallow json schema for openai feedback (shard)", {
		functionName: "generateFeedbackForOutcomeNested",
		combinationId: combination.id
	})

	// MODIFIED: Switch feedback to multi-part content including images and PDFs
	const feedbackParts: ExtendedContentPart[] = []
	feedbackParts.push({ type: "input_text", text: userContent })
	feedbackParts.push({
		type: "input_text",
		text: formatUnifiedContextSections(envelope, imageContext)
	})

	for (const imageUrl of imageContext.imageUrls) {
		feedbackParts.push({ type: "input_image", detail: "high", image_url: imageUrl })
	}

	for (const image of envelope.multimodalImagePayloads) {
		const base64 = Buffer.from(image.data).toString("base64")
		const dataUrl = `data:${image.mimeType};base64,${base64}`
		feedbackParts.push({ type: "input_image", detail: "high", image_url: dataUrl })
	}

	for (const pdf of envelope.pdfPayloads) {
		const base64 = Buffer.from(pdf.data).toString("base64")
		const dataUrl = `data:application/pdf;base64,${base64}`
		const filename = pdf.name.endsWith(".pdf") ? pdf.name : `${pdf.name}.pdf`
		feedbackParts.push({ type: "input_file", filename, file_data: dataUrl })
	}

	const response = await callOpenAIWithRetry("generateFeedbackForOutcomeNested", () =>
		openai.responses.create({
			model: OPENAI_MODEL,
			instructions: systemInstruction,
			input: [{ role: "user", content: feedbackParts }],
			text: {
				format: {
					type: "json_schema",
					name: "feedback",
					schema: jsonSchema,
					strict: true
				}
			}
		})
	)

	// MODIFIED: Parse response from output_text
	const messageContent = response.output_text
	if (!messageContent) {
		logger.error("openai feedback shard returned no content", { combinationId: combination.id })
		throw errors.new(`empty ai response for feedback shard ${combination.id}`)
	}

	const parsedResult = errors.trySync(() => JSON.parse(messageContent))
	if (parsedResult.error) {
		logger.error("feedback shard json parse", {
			combinationId: combination.id,
			error: parsedResult.error
		})
		throw errors.wrap(parsedResult.error, `feedback shard json parse for ${combination.id}`)
	}
	const validated = ShallowSchema.safeParse(parsedResult.data)
	if (!validated.success) {
		logger.error("feedback shard validation failed", {
			combinationId: combination.id,
			error: validated.error
		})
		throw errors.wrap(validated.error, `feedback shard validation for ${combination.id}`)
	}

	const parsedContent = validated.data.content
	if (parsedContent.steps.length === 0) {
		logger.warn("feedback shard returned empty steps array", { combinationId: combination.id })
	}

	return { id: combination.id, content: parsedContent }
}

/**
 * Promotes a partial record of feedback content to a total record, ensuring both
 * CORRECT and INCORRECT keys are present. Throws an error if either is missing.
 * This function acts as a strict type guard at the assembly stage.
 */
function promoteFallback<E extends readonly string[]>(
	parts: Partial<Record<"CORRECT" | "INCORRECT", FeedbackContent<E>>>
): Record<"CORRECT" | "INCORRECT", FeedbackContent<E>> {
	const correct = parts.CORRECT
	const incorrect = parts.INCORRECT

	if (!correct || !incorrect) {
		const context = {
			hasCorrect: Boolean(correct),
			hasIncorrect: Boolean(incorrect)
		}
		logger.error("missing required fallback feedback content", context)
		throw errors.new("missing required fallback feedback content")
	}

	return { CORRECT: correct, INCORRECT: incorrect }
}

async function runShardedFeedbackNested<
	C extends WidgetCollection<Record<string, WidgetDefinition<unknown, unknown>>, readonly string[]>
>(
	openai: OpenAI,
	logger: logger.Logger,
	shell: AssessmentItemShell<WidgetTypeTupleFrom<C>>,
	collection: C,
	plan: FeedbackPlan,
	interactions: Record<string, AnyInteraction<WidgetTypeTupleFrom<C>>>,
	envelope: AiContextEnvelope,
	imageContext: ImageContext
): Promise<Record<string, FeedbackContent<WidgetTypeTupleFrom<C>>>> {
	let combinationsToProcess = [...plan.combinations]
	const successfulShards: Record<string, FeedbackContent<WidgetTypeTupleFrom<C>>> = {}
	let pass = 0

	while (combinationsToProcess.length > 0) {
		pass++
		logger.info("starting feedback shard generation pass", {
			pass,
			remaining: combinationsToProcess.length,
			total: plan.combinations.length
		})

		const tasks = combinationsToProcess.map(
			(combination) => () =>
				generateFeedbackForOutcomeNested(
					openai,
					logger,
					shell,
					collection,
					plan,
					combination,
					interactions,
					envelope,
					imageContext
				)
		)

		const results = await Promise.allSettled(tasks.map((task) => task()))

		const failedCombinations: typeof combinationsToProcess = []

		for (let index = 0; index < results.length; index++) {
			const result = results[index]
			const combination = combinationsToProcess[index]
			if (!combination) {
				continue
			}
			if (result.status === "fulfilled") {
				const { id, content } = result.value
				if (content && content.steps.length > 0) {
					successfulShards[id] = content
				} else {
					logger.warn("feedback shard returned empty steps, will retry", {
						combinationId: id,
						pass
					})
					failedCombinations.push(combination)
				}
			} else {
				logger.warn("feedback shard failed, scheduling for retry", {
					combinationId: combination.id,
					pass,
					reason: result.reason
				})
				failedCombinations.push(combination)
			}
		}

		if (
			failedCombinations.length > 0 &&
			failedCombinations.length === combinationsToProcess.length
		) {
			logger.warn("no progress in feedback shard generation pass, retrying all", { pass })
		}

		combinationsToProcess = failedCombinations
	}

	logger.info("all feedback shards generated successfully", { totalPasses: pass })
	return successfulShards
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
		multimodalPayloadCount: envelope.multimodalImagePayloads.length,
		pdfPayloadCount: envelope.pdfPayloads.length
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

	if (!assessmentShell.responseDeclarations || assessmentShell.responseDeclarations.length === 0) {
		logger.error("assessment shell has no response declarations", {
			identifier: assessmentShell.identifier
		})
		throw errors.new("assessment shell must have at least one response declaration")
	}

	const feedbackPlan = buildFeedbackPlanFromInteractions(
		generatedInteractions,
		assessmentShell.responseDeclarations
	)
	logger.debug("built feedback plan", {
		mode: feedbackPlan.mode,
		dimensionCount: feedbackPlan.dimensions.length,
		combinationCount: feedbackPlan.combinations.length
	})

	logger.info("starting sharded feedback generation", {
		combinationCount: feedbackPlan.combinations.length,
		mode: feedbackPlan.mode
	})
	const shardedResult = await errors.try(
		runShardedFeedbackNested(
			openai,
			logger,
			assessmentShell,
			widgetCollection,
			feedbackPlan,
			generatedInteractions,
			envelope,
			imageContext
		)
	)
	if (shardedResult.error) {
		logger.error("sharded feedback generation failed", { error: shardedResult.error })
		throw errors.wrap(shardedResult.error, "sharded feedback generation")
	}
	const feedbackBlocks = shardedResult.data
	logger.debug("sharded feedback generation complete", {
		feedbackBlockCount: Object.keys(feedbackBlocks).length
	})

	let nestedFeedbackObject: { feedback: { FEEDBACK__OVERALL: unknown } }

	if (feedbackPlan.mode === "fallback") {
		// Use promoteFallback for typed promotion from partial to total
		const promotedContent = promoteFallback(feedbackBlocks)
		nestedFeedbackObject = {
			feedback: {
				FEEDBACK__OVERALL: {
					CORRECT: { content: promotedContent.CORRECT },
					INCORRECT: { content: promotedContent.INCORRECT }
				}
			}
		}
	} else {
		const root: NestedNode<WidgetTypeTupleFrom<C>> = {}

		for (const combination of feedbackPlan.combinations) {
			const content = feedbackBlocks[combination.id]
			if (!content) {
				logger.error("missing content for combination in final assembly", {
					combinationId: combination.id
				})
				throw errors.new(`missing feedback content for combination ${combination.id}`)
			}
			let currentNode: NestedNode<WidgetTypeTupleFrom<C>> = root
			for (let i = 0; i < combination.path.length; i++) {
				const segment = combination.path[i]
				if (!segment) {
					logger.error("invalid combination path segment during assembly", {
						combinationId: combination.id,
						index: i
					})
					throw errors.new("invalid combination path segment")
				}
				const isLast = i === combination.path.length - 1
				const branch = currentNode[segment.responseIdentifier] || {}
				currentNode[segment.responseIdentifier] = branch
				if (isLast) {
					branch[segment.key] = { content }
				} else {
					const nextNode = branch[segment.key]
					if (nextNode) {
						if (isLeaf(nextNode)) {
							logger.error("leaf encountered before end of path", {
								combinationId: combination.id,
								index: i
							})
							throw errors.new("invalid feedback tree shape during assembly")
						}
						currentNode = nextNode
					} else {
						const emptyNode: NestedNode<WidgetTypeTupleFrom<C>> = {}
						branch[segment.key] = emptyNode
						currentNode = emptyNode
					}
				}
			}
		}

		nestedFeedbackObject = { feedback: { FEEDBACK__OVERALL: root } }
	}

	// Validate nested feedback against the official schema to satisfy AssessmentItem type
	const FeedbackObjectSchema = createFeedbackObjectSchema(
		feedbackPlan,
		widgetCollection.widgetTypeKeys
	)
	const feedbackValidation = FeedbackObjectSchema.safeParse(nestedFeedbackObject.feedback)
	if (!feedbackValidation.success) {
		logger.error("nested feedback validation failed", { error: feedbackValidation.error })
		throw errors.wrap(feedbackValidation.error, "nested feedback validation")
	}

	const widgetRefs = collectWidgetRefs({
		body: assessmentShell.body,
		feedback: { FEEDBACK__OVERALL: feedbackValidation.data.FEEDBACK__OVERALL },
		interactions: generatedInteractions
	})

	logger.debug("collected widget refs", {
		count: widgetRefs.size,
		refs: Array.from(widgetRefs.entries())
	})

	let generatedWidgets: Record<string, Widget> = {}
	if (widgetRefs.size > 0) {
		// Build a typed mapping with runtime guard
		const widgetMapping: Record<string, WidgetTypeTupleFrom<C>[number]> = {}
		for (const [id, typeName] of widgetRefs) {
			if (!isWidgetTypeKey(typeName)) {
				logger.error("unknown widget type in refs", { widgetId: id, typeName })
				throw errors.new("unknown widget type in refs")
			}
			// Verify widget type exists in the provided collection
			if (!widgetCollection.widgetTypeKeys.includes(typeName)) {
				logger.error("widget type not in collection", {
					widgetId: id,
					typeName,
					collectionName: widgetCollection.name,
					availableTypes: widgetCollection.widgetTypeKeys
				})
				throw errors.new("widget type not in collection")
			}
			widgetMapping[id] = typeName
		}
		const widgetPrompt = createWidgetContentPrompt(
			envelope,
			assessmentShell,
			widgetMapping,
			generatedInteractions,
			widgetCollection,
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

		// MODIFIED: Construct multi-part content for Responses API (INCLUDE PDFs in Shot 4)
		const widgetContentParts: ExtendedContentPart[] = []
		widgetContentParts.push({ type: "input_text", text: widgetPrompt.userContent })

		for (const imageUrl of imageContext.imageUrls) {
			widgetContentParts.push({ type: "input_image", detail: "high", image_url: imageUrl })
		}

		for (const image of envelope.multimodalImagePayloads) {
			const base64 = Buffer.from(image.data).toString("base64")
			const dataUrl = `data:${image.mimeType};base64,${base64}`
			widgetContentParts.push({
				type: "input_image",
				detail: "high",
				image_url: dataUrl
			})
		}
		// Include PDFs for widget generation as well
		for (const pdf of envelope.pdfPayloads) {
			const base64 = Buffer.from(pdf.data).toString("base64")
			const dataUrl = `data:application/pdf;base64,${base64}`
			const filename = pdf.name.endsWith(".pdf") ? pdf.name : `${pdf.name}.pdf`
			widgetContentParts.push({
				type: "input_file",
				filename,
				file_data: dataUrl
			})
		}

		// MODIFIED: API call migrated to Responses API
		const widgetResponse = await callOpenAIWithRetry("generateWidgetContent", () =>
			openai.responses.create({
				model: OPENAI_MODEL,
				instructions: widgetPrompt.systemInstruction,
				input: [{ role: "user", content: widgetContentParts }],
				text: {
					format: {
						type: "json_schema",
						name: "widget_content_generator",
						schema: widgetJsonSchema,
						strict: true
					}
				}
			})
		)

		// MODIFIED: Parse response from output_text
		const widgetContent = widgetResponse.output_text
		if (!widgetContent) {
			logger.error("widget generation returned no content")
			throw errors.new("empty ai response: no content for widget generation")
		}

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
			logger.error("widget content generation did not produce all required widgets", {
				missingContent
			})
			throw errors.new(
				`widget content generation: missing content for slots: ${missingContent.join(", ")}`
			)
		}

		logger.debug("shot 4 complete", { generatedWidgetKeys: Object.keys(generatedWidgets) })
	}

	return {
		...assessmentShell,
		interactions: generatedInteractions,
		widgets: generatedWidgets,
		feedbackPlan,
		feedback: feedbackValidation.data
	}
}
