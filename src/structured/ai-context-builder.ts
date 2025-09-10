import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { AiContextEnvelope } from "./types"

const SUPPORTED_EXTENSIONS = ["svg", "png", "jpeg", "jpg", "gif"] as const

// MODIFIED: Simplify ImageContext. It no longer needs to handle SVGs or resolved URL maps,
// as this logic is now fully encapsulated within the Perseus envelope builder.
export interface ImageContext {
	rasterImageUrls: string[]
}

// MODIFIED: buildPerseusEnvelope is now async and handles all Perseus-specific logic.
export async function buildPerseusEnvelope(perseusJson: unknown): Promise<AiContextEnvelope> {
	const context: string[] = [JSON.stringify(perseusJson, null, 2)]
	const imageUrls: string[] = []

	// --- Integrated Perseus URL Resolution Logic ---
	const findPerseusUrls = (obj: unknown, urls: Set<string>): void => {
		if (typeof obj !== "object" || obj === null) return
		if (Array.isArray(obj)) {
			for (const item of obj) findPerseusUrls(item, urls)
			return
		}
		for (const [key, value] of Object.entries(obj)) {
			if (key === "url" && typeof value === "string" && value.startsWith("web+graphie://")) {
				urls.add(value)
			} else {
				findPerseusUrls(value, urls)
			}
		}
	}

	const resolveAndFetchUrl = async (
		originalUrl: string
	): Promise<{ type: "raster"; url: string } | { type: "svg"; content: string } | null> => {
		const baseUrl = originalUrl.replace("web+graphie://", "https://")
		for (const ext of SUPPORTED_EXTENSIONS) {
			const urlWithExt = `${baseUrl}.${ext}`
			const headResult = await errors.try(fetch(urlWithExt, { method: "HEAD", signal: AbortSignal.timeout(5000) }))
			if (headResult.error || !headResult.data.ok) continue

			if (ext === "svg") {
				const downloadResult = await errors.try(fetch(urlWithExt))
				if (downloadResult.error || !downloadResult.data.ok) continue
				const textResult = await errors.try(downloadResult.data.text())
				if (textResult.error) continue
				return { type: "svg", content: textResult.data }
			}
			return { type: "raster", url: urlWithExt }
		}
		return null
	}

	const perseusUrls = new Set<string>()
	findPerseusUrls(perseusJson, perseusUrls)

	if (perseusUrls.size > 0) {
		logger.debug("resolving perseus urls", { count: perseusUrls.size })
		const promises = Array.from(perseusUrls).map(async (url) => {
			const result = await errors.try(resolveAndFetchUrl(url))
			if (result.error || !result.data) {
				logger.warn("failed to resolve perseus url", { url, error: result.error })
				return
			}
			if (result.data.type === "svg") {
				context.push(result.data.content)
			} else {
				imageUrls.push(result.data.url)
			}
		})
		await Promise.all(promises)
	}

	return { context, imageUrls }
}

export function buildHtmlEnvelope(html: string, screenshotUrl?: string): AiContextEnvelope {
	// No changes needed here, but kept for context.
	return {
		context: [html],
		imageUrls: screenshotUrl ? [new URL(screenshotUrl).toString()] : []
	}
}

// MODIFIED: Renamed and simplified. This function no longer probes for extensions or handles SVGs.
// It assumes all provided URLs are direct, valid raster image URLs.
export async function buildImageContextFromRasterUrls(urls: string[]): Promise<ImageContext> {
	const context: ImageContext = {
		rasterImageUrls: []
	}

	for (const url of urls) {
		// Boundary validation: ensure URLs are valid before passing them to the AI.
		const urlResult = errors.trySync(() => new URL(url))
		if (urlResult.error) {
			logger.error("invalid image url in envelope", { url, error: urlResult.error })
			throw errors.wrap(urlResult.error, "invalid image url")
		}
		context.rasterImageUrls.push(urlResult.data.toString())
	}

	return context
}