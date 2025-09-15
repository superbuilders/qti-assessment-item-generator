import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { AiContextEnvelope } from "./types"

const SUPPORTED_EXTENSIONS = ["svg", "png", "jpeg", "jpg", "gif"] as const

// NEW: Regex to find standard image URLs and Markdown links
const IMAGE_URL_REGEX = /https?:\/\/[^\s)]+\.(svg|png|jpeg|jpg|gif)/gi
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g

// MODIFIED: Simplify ImageContext. It no longer needs to handle SVGs or resolved URL maps,
// as this logic is now fully encapsulated within the Perseus envelope builder.
export interface ImageContext {
	rasterImageUrls: string[]
}

// MODIFIED: buildPerseusEnvelope is now async and handles all Perseus-specific logic.
export async function buildPerseusEnvelope(
	perseusJson: unknown,
	fetchFn: typeof fetch = fetch
): Promise<AiContextEnvelope> {
	const jsonString = JSON.stringify(perseusJson, null, 2)
	const context: string[] = [jsonString]
	const imageUrls: string[] = []
	const foundUrls = new Set<string>()

	// --- Integrated and Expanded URL Resolution Logic ---

	// NEW: Recursive function to find all types of URLs
	const findAllUrlsAndLinks = (obj: unknown): void => {
		if (typeof obj !== "object" || obj === null) return

		if (Array.isArray(obj)) {
			for (const item of obj) findAllUrlsAndLinks(item)
			return
		}

		for (const value of Object.values(obj)) {
			if (typeof value === "string") {
				// Type 1: Find web+graphie URLs
				if (value.startsWith("web+graphie://")) {
					foundUrls.add(value)
				}

				// Type 2: Find direct https:// image URLs from image widgets and content
				const imageMatches = value.matchAll(IMAGE_URL_REGEX)
				for (const match of imageMatches) {
					if (match[0]) foundUrls.add(match[0])
				}

				// Type 3: Find and extract Markdown links from content strings
				const markdownMatches = value.matchAll(MARKDOWN_LINK_REGEX)
				for (const match of markdownMatches) {
					const [, text, url] = match
					if (text && url) {
						// Add as a separate, explicit context block for the AI
						context.push(`Contextual Link Found: [${text}](${url})`)
					}
				}
			} else {
				// Recurse into nested objects and arrays
				findAllUrlsAndLinks(value)
			}
		}
	}

	const resolveAndFetchUrl = async (
		originalUrl: string
	): Promise<{ type: "raster"; url: string } | { type: "svg"; content: string } | null> => {
		let baseUrl = originalUrl
		let isGraphie = false

		if (originalUrl.startsWith("web+graphie://")) {
			baseUrl = originalUrl.replace("web+graphie://", "https://")
			isGraphie = true
		}

		// If it's a Graphie URL, we need to probe for the correct extension.
		if (isGraphie) {
			for (const ext of SUPPORTED_EXTENSIONS) {
				const urlWithExt = `${baseUrl}.${ext}`
				const headResult = await errors.try(fetchFn(urlWithExt, { method: "HEAD", signal: AbortSignal.timeout(5000) }))
				if (headResult.error || !headResult.data.ok) continue

				if (ext === "svg") {
					const downloadResult = await errors.try(fetchFn(urlWithExt))
					if (downloadResult.error || !downloadResult.data.ok) continue
					const textResult = await errors.try(downloadResult.data.text())
					if (textResult.error) continue
					return { type: "svg", content: textResult.data }
				}
				return { type: "raster", url: urlWithExt }
			}
		} else {
			// It's a direct https:// URL with an extension.
			const isSvg = originalUrl.endsWith(".svg")
			if (isSvg) {
				const downloadResult = await errors.try(fetchFn(originalUrl))
				if (!downloadResult.error && downloadResult.data.ok) {
					const textResult = await errors.try(downloadResult.data.text())
					if (!textResult.error) {
						return { type: "svg", content: textResult.data }
					}
				}
			} else {
				// Assume it's a raster image if not SVG and has a supported extension.
				return { type: "raster", url: originalUrl }
			}
		}
		return null
	}

	// --- Main Execution ---
	findAllUrlsAndLinks(perseusJson)

	if (foundUrls.size > 0) {
		logger.debug("resolving all found urls", { count: foundUrls.size })
		const promises = Array.from(foundUrls).map(async (url) => {
			const result = await errors.try(resolveAndFetchUrl(url))
			if (result.error || !result.data) {
				logger.warn("failed to resolve url, skipping from context", { url, error: result.error })
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
	const imageUrls: string[] = []

	// Validate optional screenshotUrl strictly: if provided but invalid → throw
	if (screenshotUrl) {
		const screenshotUrlResult = errors.trySync(() => new URL(screenshotUrl))
		if (screenshotUrlResult.error) {
			logger.error("invalid screenshot url", { screenshotUrl, error: screenshotUrlResult.error })
			throw errors.wrap(screenshotUrlResult.error, "screenshot url parse")
		}
		const normalized = screenshotUrlResult.data
		if (normalized.protocol !== "http:" && normalized.protocol !== "https:") {
			logger.error("unsupported screenshot url scheme", { screenshotUrl, protocol: normalized.protocol })
			throw errors.new("unsupported screenshot url scheme")
		}
		imageUrls.push(normalized.toString())
	}

	// Robust, case-insensitive <img> tag finder
	const imgTagRegex = /<img\b[^>]*>/gi
	// Within a single tag, robust, case-insensitive src extractor supporting ' or "
	const srcAttrRegex = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i

	const unique = new Set<string>()
	let tagMatch: RegExpExecArray | null
	tagMatch = imgTagRegex.exec(html)
	while (tagMatch !== null) {
		const tag = tagMatch[0]
		const srcMatch = srcAttrRegex.exec(tag)
		if (!srcMatch) {
			logger.error("img tag missing src attribute", { tag })
			throw errors.new("img tag missing src")
		}
		const raw = srcMatch[1] ?? srcMatch[2] ?? ""
		const urlResult = errors.trySync(() => new URL(raw))
		if (urlResult.error) {
			logger.error("invalid image src in html", { src: raw, error: urlResult.error })
			throw errors.wrap(urlResult.error, "html image src parse")
		}
		const url = urlResult.data
		if (url.protocol !== "http:" && url.protocol !== "https:") {
			logger.error("unsupported image url scheme", { src: raw, protocol: url.protocol })
			throw errors.new("unsupported image url scheme")
		}
		unique.add(url.toString())
		tagMatch = imgTagRegex.exec(html)
	}

	for (const u of unique) imageUrls.push(u)

	return { context: [html], imageUrls }
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
