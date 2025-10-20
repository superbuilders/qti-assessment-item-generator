import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"

const YoutubeDetailsSchema = z
	.object({
		video_id: z.string(),
		title: z.string(),
		description: z.string(),
		video_length: z.union([z.string(), z.number()])
	})
	.strict()

type YoutubeDetails = z.infer<typeof YoutubeDetailsSchema>

export type YoutubeMetadata = {
	title: string
	description: string
	durationSeconds: number
}

const RAPID_API_HOST = "youtube-v2.p.rapidapi.com"

let cachedRapidApiKey: string | undefined

function requireRapidApiKey(): string {
	if (cachedRapidApiKey !== undefined) {
		return cachedRapidApiKey
	}
	const key = process.env.RAPIDAPI_YOUTUBE_KEY
	if (typeof key !== "string" || key.trim().length === 0) {
		logger.error("RAPIDAPI_YOUTUBE_KEY missing")
		throw errors.new("rapidapi youtube key missing")
	}
	cachedRapidApiKey = key
	return cachedRapidApiKey
}

function parseDurationSeconds(value: YoutubeDetails["video_length"]): number {
	if (typeof value === "number") {
		if (!Number.isFinite(value) || value <= 0) {
			logger.error("youtube duration invalid", { videoLength: value })
			throw errors.new("youtube duration invalid")
		}
		return Math.floor(value)
	}
	const trimmed = value.trim()
	if (trimmed.length === 0) {
		logger.error("youtube duration missing", { videoLength: value })
		throw errors.new("youtube duration missing")
	}
	const parsed = Number.parseInt(trimmed, 10)
	if (!Number.isFinite(parsed) || parsed <= 0) {
		logger.error("youtube duration invalid", { videoLength: value })
		throw errors.new("youtube duration invalid")
	}
	return parsed
}

export async function fetchYoutubeMetadata(
	youtubeId: string
): Promise<YoutubeMetadata> {
	if (typeof youtubeId !== "string" || youtubeId.trim().length !== 11) {
		logger.error("invalid youtube id provided", { youtubeId })
		throw errors.new("youtube id invalid")
	}
	const apiKey = requireRapidApiKey()
	const url = new URL("https://youtube-v2.p.rapidapi.com/video/details")
	url.searchParams.set("video_id", youtubeId)
	const request = await errors.try(
		fetch(url.toString(), {
			method: "GET",
			headers: {
				"x-rapidapi-key": apiKey,
				"x-rapidapi-host": RAPID_API_HOST
			}
		})
	)
	if (request.error) {
		logger.error("youtube metadata request failed", {
			youtubeId,
			error: request.error
		})
		throw errors.wrap(request.error, "youtube metadata request")
	}
	const response = request.data
	if (!response.ok) {
		logger.error("youtube metadata response not ok", {
			youtubeId,
			status: response.status
		})
		throw errors.new("youtube metadata http error")
	}
	const payloadResult = await errors.try(response.json())
	if (payloadResult.error) {
		logger.error("youtube metadata parse failed", {
			youtubeId,
			error: payloadResult.error
		})
		throw errors.wrap(payloadResult.error, "youtube metadata parse")
	}
	const payload = payloadResult.data
	const validation = YoutubeDetailsSchema.safeParse(payload)
	if (!validation.success) {
		logger.error("youtube metadata schema mismatch", {
			youtubeId,
			error: validation.error
		})
		throw errors.wrap(validation.error, "youtube metadata validate")
	}
	const record = validation.data
	const durationSeconds = parseDurationSeconds(record.video_length)
	return {
		title: record.title,
		description: record.description,
		durationSeconds
	}
}
