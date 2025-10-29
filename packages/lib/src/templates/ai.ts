import * as errors from "@superbuilders/errors"
import type { Logger } from "@superbuilders/slog"
import OpenAI from "openai"
import { callOpenAIWithRetry } from "@/structured/utils/openai"

let cachedOpenAI: OpenAI | null = null
export const TEMPLATE_GENERATION_MODEL = "gpt-5"

export type ChatCompletionMessage = {
	role: "system" | "user" | "assistant"
	content: string
}

export type ChatCompletionParams = {
	model: string
	messages: ChatCompletionMessage[]
}

export interface Ai {
	chatCompletion(params: ChatCompletionParams): Promise<string>
}

export function createAi(logger: Logger, apiKey: string): Ai {
	if (!cachedOpenAI) {
		logger.debug("instantiating openai client")
		cachedOpenAI = new OpenAI({ apiKey })
	}

	const openai = cachedOpenAI

	return {
		async chatCompletion(params) {
			logger.debug("requesting chat completion", {
				model: params.model,
				messageCount: params.messages.length
			})

			const response = await callOpenAIWithRetry(
				"template-generator",
				async () =>
					openai.chat.completions.create({
						model: params.model,
						messages: params.messages
					})
			)

			const content = response.choices[0]?.message?.content
			if (!content) {
				logger.error("received empty chat completion content")
				throw errors.new("chat completion returned no content")
			}
			return content
		}
	}
}
