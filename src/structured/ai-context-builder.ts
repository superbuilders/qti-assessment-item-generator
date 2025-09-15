import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { AiContextEnvelope } from "./types"

const SUPPORTED_EXTENSIONS = ["svg", "png", "jpeg", "jpg", "gif"] as const
const IMAGE_URL_REGEX = /https?:\/\/[^\s"'()<>]+?\.(svg|png|jpeg|jpg|gif)/gi

// Network timeout only (no concurrency limits or size caps)
const FETCH_TIMEOUT_MS = 30000

// MODIFIED: ImageContext now holds both raster and vector URLs for prompts.
export interface ImageContext {
	rasterImageUrls: string[]
	vectorImageUrls: string[]
}

// MODIFIED: Complete refactor for unified URL discovery and processing.
export async function buildPerseusEnvelope(
	perseusJson: unknown,
	fetchFn: typeof fetch = fetch
): Promise<AiContextEnvelope> {
	const jsonString = JSON.stringify(perseusJson, null, 2)
	const context: string[] = [jsonString]
	const rasterImageUrls = new Set<string>()
	const vectorImageUrls = new Set<string>()
	const foundUrls = new Set<string>()

	const findAllUrls = (obj: unknown): void => {
		if (typeof obj !== "object" || obj === null) return
		if (Array.isArray(obj)) {
			for (const item of obj) findAllUrls(item)
			return
		}
		for (const value of Object.values(obj)) {
			if (typeof value === "string") {
				if (value.startsWith("web+graphie://")) foundUrls.add(value)
				const imageMatches = value.matchAll(IMAGE_URL_REGEX)
				for (const match of imageMatches) {
					if (match[0]) foundUrls.add(match[0])
				}
			} else {
				findAllUrls(value)
			}
		}
	}

	const resolveAndFetchUrl = async (
		url: string
	): Promise<{ type: "raster" | "svg"; url: string; content?: string } | null> => {
		if (url.startsWith("web+graphie://")) {
			const baseUrl = url.replace("web+graphie://", "https://")
			for (const ext of SUPPORTED_EXTENSIONS) {
				const urlWithExt = `${baseUrl}.${ext}`

				const headResult = await errors.try(
					fetchFn(urlWithExt, { 
						method: "HEAD", 
						signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) 
					})
				)
				if (headResult.error || !headResult.data.ok) continue

				if (ext === "svg") {
					const dl = await errors.try(fetchFn(urlWithExt, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }))
					if (dl.error || !dl.data.ok) continue
					const text = await errors.try(dl.data.text())
					if (text.error) continue
					return { type: "svg", url: urlWithExt, content: text.data }
				}
				return { type: "raster", url: urlWithExt }
			}
		} else {
			try {
				const u = new URL(url)
				if (u.protocol !== "http:" && u.protocol !== "https:") return null
			} catch {
				return null
			}

			if (url.endsWith(".svg")) {
				const dl = await errors.try(fetchFn(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }))
				if (dl.error || !dl.data.ok) return null
				const text = await errors.try(dl.data.text())
				if (text.error) return null
				return { type: "svg", url, content: text.data }
			}
			return { type: "raster", url }
		}
		return null
	}

	findAllUrls(perseusJson)

	if (foundUrls.size > 0) {
		logger.debug("resolving perseus urls", { count: foundUrls.size })
		const promises = Array.from(foundUrls).map(async (url) => {
			const result = await errors.try(resolveAndFetchUrl(url))
			if (result.error || !result.data) {
				logger.warn("failed to resolve perseus url", { url, error: result.error })
				return
			}
			if (result.data.type === "svg" && result.data.content) {
				context.push(result.data.content)
				vectorImageUrls.add(result.data.url)
			} else {
				rasterImageUrls.add(result.data.url)
			}
		})
		await Promise.all(promises)
	}

	// Return URLs in deterministic order (sorted)
	return { 
		context, 
		rasterImageUrls: Array.from(rasterImageUrls).sort(), 
		vectorImageUrls: Array.from(vectorImageUrls).sort() 
	}
}

export async function buildHtmlEnvelope(
	html: string,
	screenshotUrl?: string,
	fetchFn: typeof fetch = fetch
): Promise<AiContextEnvelope> {
	const context: string[] = [html]
	const rasterImageUrls = new Set<string>()
	const vectorImageUrls = new Set<string>()
	const svgUrlsToFetch = new Set<string>()

	if (screenshotUrl) {
		const result = errors.trySync(() => new URL(screenshotUrl))
		if (result.error) {
			logger.error("invalid screenshot url", { screenshotUrl, error: result.error })
			throw errors.wrap(result.error, "screenshot url parse")
		}
		const normalized = result.data
		if (normalized.protocol !== "http:" && normalized.protocol !== "https:") {
			logger.error("unsupported screenshot url scheme", { screenshotUrl, protocol: normalized.protocol })
			throw errors.new("unsupported screenshot url scheme")
		}
		rasterImageUrls.add(normalized.toString())
	}

	const imgTagRegex = /<img\s[^>]*src\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>/gi
	let match: RegExpExecArray | null
	while ((match = imgTagRegex.exec(html)) !== null) {
		const rawSrc = match[1] ?? match[2]
		if (!rawSrc) continue
		
		const urlResult = errors.trySync(() => new URL(rawSrc))
		if (urlResult.error) {
			logger.warn("skipping invalid image src in html", { src: rawSrc, error: urlResult.error })
			continue
		}
		const urlObj = urlResult.data
		if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") continue
		const url = urlObj.toString()
		const isSvg = urlObj.pathname.toLowerCase().endsWith(".svg")
		if (isSvg) {
			svgUrlsToFetch.add(url)
		} else {
			rasterImageUrls.add(url)
		}
	}

    // NOTE: Inline <svg> content remains inside the primary HTML (context[0]).
    // We do not extract or duplicate it as separate context entries.

	// Fetch external SVGs (no concurrency limiting)
	if (svgUrlsToFetch.size > 0) {
		logger.debug("fetching svg urls from html", { count: svgUrlsToFetch.size })
		const promises = Array.from(svgUrlsToFetch).map(async (url) => {
			const result = await errors.try(fetchFn(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }))
			if (result.error || !result.data.ok) {
				logger.warn("failed to fetch svg from html", { url, error: result.error })
				return
			}
			const textResult = await errors.try(result.data.text())
			if (textResult.error) {
				logger.warn("failed to read svg text from html", { url, error: textResult.error })
				return
			}
			context.push(textResult.data)
			vectorImageUrls.add(url)
		})
		await Promise.all(promises)
	}

	// Return URLs in deterministic order (sorted)
	return {
		context,
		rasterImageUrls: Array.from(rasterImageUrls).sort(),
		vectorImageUrls: Array.from(vectorImageUrls).sort()
	}
}

// MODIFIED: Renamed and updated to build a complete image context.
export function buildImageContext(envelope: AiContextEnvelope): ImageContext {
	const context: ImageContext = {
		rasterImageUrls: [],
		vectorImageUrls: []
	}

	for (const url of envelope.rasterImageUrls) {
		const result = errors.trySync(() => new URL(url))
		if (result.error) {
			logger.error("invalid raster image url in envelope", { url, error: result.error })
			throw errors.wrap(result.error, "invalid raster image url")
		}
		context.rasterImageUrls.push(result.data.toString())
	}

	for (const url of envelope.vectorImageUrls) {
		const result = errors.trySync(() => new URL(url))
		if (result.error) {
			logger.error("invalid vector image url in envelope", { url, error: result.error })
			throw errors.wrap(result.error, "invalid vector image url")
		}
		context.vectorImageUrls.push(result.data.toString())
	}

	return context
}