#!/usr/bin/env bun
import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"

// Enable debug logging for this script
logger.setDefaultLogLevel(logger.DEBUG)
logger.info("canvas stimulus generator started with debug logging enabled")

// --- Configuration ---
const ROOT_DIR = "canvas-scrape/English 09, Part 1"
const CONCURRENCY_LIMIT = 200

const BASE_DIR_ARG = process.argv[2]
if (!BASE_DIR_ARG) {
	logger.error("base data directory not provided")
	throw errors.new("base data directory must be provided as first argument (e.g., 'data')")
}
const OUTPUT_DIR = path.resolve(process.cwd(), BASE_DIR_ARG, "stimulus-out")
const ROOT = path.resolve(process.cwd(), ROOT_DIR)
// ---

// ----------------------
// Utility helpers
// ----------------------

/**
 * Executes an array of async task functions in parallel with a specified concurrency limit.
 */
async function runWithConcurrency<T>(
	tasks: Array<() => Promise<T>>,
	limit: number
): Promise<Array<PromiseSettledResult<T>>> {
	const results: Array<PromiseSettledResult<T>> = new Array(tasks.length)
	let taskIndex = 0
	const executing: Array<Promise<void>> = []

	const execute = async () => {
		if (taskIndex >= tasks.length) {
			return
		}

		const currentIndex = taskIndex++
		const task = tasks[currentIndex]

		if (!task) return

		async function runOne(): Promise<void> {
			const res = await errors.try(task())
			if (res.error) {
				results[currentIndex] = { status: "rejected", reason: res.error }
			} else {
				results[currentIndex] = { status: "fulfilled", value: res.data }
			}
		}

		const promise = runOne()

		executing.push(promise)
		await promise
		executing.splice(executing.indexOf(promise), 1)

		await execute()
	}

	const initialPromises = Array(Math.min(limit, tasks.length)).fill(null).map(execute)
	await Promise.all(initialPromises)

	return results
}

/**
 * Converts a string to lowercase kebab-case.
 */
function toKebabCase(str: string): string {
	return str
		.trim()
		.toLowerCase()
		.replace(/[\s._]+/g, "-")
		.replace(/[^a-z0-9-]/g, "")
}

/** Remove HTML comments */
function stripComments(input: string): string {
	return input.replace(/<!--([\s\S]*?)-->/g, "")
}

/**
 * Remove entire blocks for tags that we never want in stimulus output
 * like nav, form, script, style.
 */
function stripBlockedElements(input: string): string {
	let out = input
	out = out.replace(/<script[\s\S]*?<\/script>/gi, "")
	out = out.replace(/<style[\s\S]*?<\/style>/gi, "")
	out = out.replace(/<nav[\s\S]*?<\/nav>/gi, "")
	out = out.replace(/<form[\s\S]*?<\/form>/gi, "")
	out = out.replace(/<input[^>]*>/gi, "")
	// common hidden utility spans
	out = out.replace(/<span[^>]*class="[^"]*\bsr-only\b[^"]*"[^>]*>[\s\S]*?<\/span>/gi, "")
	return out
}

// Note: We intentionally avoid attempting to slice out role="main" with regex,
// as nested divs make that approach unreliable. We instead remove unwanted
// navigational elements while keeping the original flow of mainContent.html.

/**
 * Strip all attributes from tags except a strict whitelist for a, iframe, img.
 * 1) First, normalize anchors, iframes, and images by rebuilding allowed attributes.
 * 2) Then, strip attributes from all remaining element tags.
 */
function normalizeAndStripAttributes(input: string): string {
	let out = input

	// Normalize <a> tags to only keep href and title
	out = out.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (_m, attrs: string, inner: string) => {
		const hrefMatch = attrs.match(/\bhref\s*=\s*(["'])(.*?)\1/i)
		const href = hrefMatch ? hrefMatch[2] : undefined
		const titleMatch = attrs.match(/\btitle\s*=\s*(["'])(.*?)\1/i)
		const title = titleMatch ? titleMatch[2] : undefined
		const hrefAttr = href ? ` href="${href}"` : ""
		const titleAttr = title ? ` title="${title}"` : ""
		return `<a${hrefAttr}${titleAttr}>${inner}</a>`
	})

	// Normalize <iframe> tags to only keep src, width, height, allow, allowfullscreen
	out = out.replace(/<iframe\b([^>]*)>([\s\S]*?)<\/iframe>/gi, (_m, attrs: string) => {
		const srcMatch = attrs.match(/\bsrc\s*=\s*(["'])(.*?)\1/i)
		const widthMatch = attrs.match(/\bwidth\s*=\s*(["'])(.*?)\1/i)
		const heightMatch = attrs.match(/\bheight\s*=\s*(["'])(.*?)\1/i)
		const allowMatch = attrs.match(/\ballow\s*=\s*(["'])(.*?)\1/i)
		const allowFs = /allowfullscreen/i.test(attrs)

		const src = srcMatch ? srcMatch[2] : undefined
		const width = widthMatch ? widthMatch[2] : undefined
		const height = heightMatch ? heightMatch[2] : undefined
		const allow = allowMatch ? allowMatch[2] : undefined

		const srcAttr = src ? ` src="${src}"` : ""
		const widthAttr = width ? ` width="${width}"` : ""
		const heightAttr = height ? ` height="${height}"` : ""
		const allowAttr = allow ? ` allow="${allow}"` : ""
		const fsAttr = allowFs ? " allowfullscreen" : ""
		return `<iframe${srcAttr}${widthAttr}${heightAttr}${allowAttr}${fsAttr}></iframe>`
	})

	// Normalize <img> tags to only keep src, alt, title
	out = out.replace(/<img\b([^>]*?)(\/)?>/gi, (_m, attrs: string) => {
		const srcMatch = attrs.match(/\bsrc\s*=\s*(["'])(.*?)\1/i)
		const altMatch = attrs.match(/\balt\s*=\s*(["'])(.*?)\1/i)
		const titleMatch = attrs.match(/\btitle\s*=\s*(["'])(.*?)\1/i)

		const src = srcMatch ? srcMatch[2] : undefined
		const alt = altMatch ? altMatch[2] : undefined
		const title = titleMatch ? titleMatch[2] : undefined

		const srcAttr = src ? ` src="${src}"` : ""
		const altAttr = alt ? ` alt="${alt}"` : ""
		const titleAttr = title ? ` title="${title}"` : ""
		return `<img${srcAttr}${altAttr}${titleAttr}>`
	})

	// Strip attributes from all remaining elements except a|iframe|img
	out = out.replace(/<(?!\/?(?:a|iframe|img)\b)([a-z0-9]+)(\s[^>]*)?>/gi, (_m, tag: string) => {
		return `<${tag}>`
	})

	// Remove event handler attributes that might survive in text
	out = out.replace(/\s+on[a-z]+\s*=\s*(["']).*?\1/gi, "")
	return out
}

/**
 * Compress redundant whitespace while preserving block structure.
 */
function compressWhitespace(input: string): string {
	let out = input
	// collapse 3+ newlines to 2
	out = out.replace(/\n{3,}/g, "\n\n")
	// trim spaces inside tags where possible
	out = out.replace(/>\s+</g, "><")
	return out.trim()
}

// No title derivation is required; consumers can render titles separately if needed.

// ----------------------
// Schemas and Types
// ----------------------

const SectionSchema = z.object({
	heading: z.string().optional(),
	level: z.number().optional(),
	content: z.string().optional()
})

const LinkSchema = z.object({
	text: z.string().optional(),
	url: z.string().optional(),
	type: z.string().optional()
})

const MediaSchema = z.object({
	type: z.string(),
	src: z.string().optional()
})

const PageDataSchema = z.object({
	title: z.string().optional(),
	url: z.string().optional(),
	mainContent: z
		.object({
			html: z.string().optional(),
			text: z.string().optional()
		})
		.optional(),
	sections: z.array(SectionSchema).optional(),
	links: z.array(LinkSchema).optional(),
	media: z.array(MediaSchema).optional(),
	metadata: z.record(z.string(), z.unknown()).optional()
})

// Type is available for future use if needed
// type PageData = z.infer<typeof PageDataSchema>

// ----------------------
// Core processing
// ----------------------

async function processPage(pageJsonPath: string, outputRoot: string, rootDir: string): Promise<void> {
	const dir = path.dirname(pageJsonPath)
	const relFromRoot = path.relative(rootDir, dir)
	const slugParts = relFromRoot
		.split(path.sep)
		.map((p) => toKebabCase(p))
		.filter((p) => p.length > 0)
	const outDir = path.join(outputRoot, ...slugParts)

	logger.info("processing page", { dir: relFromRoot })

	const jsonResult = await errors.try(fs.readFile(pageJsonPath, "utf8"))
	if (jsonResult.error) {
		logger.warn("page-data.json unreadable, skipping", { file: pageJsonPath, error: jsonResult.error })
		return
	}

	const parsedUnknown = errors.trySync(() => JSON.parse(jsonResult.data))
	if (parsedUnknown.error) {
		logger.warn("page-data.json parse failed, skipping", { file: pageJsonPath, error: parsedUnknown.error })
		return
	}

	const pd = PageDataSchema.safeParse(parsedUnknown.data)
	if (!pd.success) {
		logger.warn("page-data.json schema mismatch, skipping", { file: pageJsonPath })
		return
	}
	const page = pd.data

	const rawHtml = page.mainContent?.html
	if (!rawHtml || rawHtml.trim().length === 0) {
		logger.warn("mainContent.html missing, skipping page", { file: pageJsonPath })
		return
	}

	// Cleaning pipeline
	let cleaned = rawHtml
	cleaned = stripComments(cleaned)
	cleaned = stripBlockedElements(cleaned)
	cleaned = normalizeAndStripAttributes(cleaned)
	cleaned = compressWhitespace(cleaned)

	// Wrap final cleaned content in a single <article> element
	const article = `<article>${cleaned}</article>`

	const outPath = path.join(outDir, "stimulus.html")
	await fs.mkdir(outDir, { recursive: true })
	const writeResult = await errors.try(Bun.write(outPath, article))
	if (writeResult.error) {
		logger.error("failed to write stimulus html", { file: outPath, error: writeResult.error })
		return
	}

	logger.info("wrote stimulus html", { file: outPath })
}

// ----------------------
// Main orchestration
// ----------------------

async function main() {
	const rootStat = await errors.try(fs.stat(ROOT))
	if (rootStat.error || !rootStat.data.isDirectory()) {
		logger.error("root directory not found", { dir: ROOT, error: rootStat.error })
		throw errors.new("root directory not found")
	}

	// Discover all page-data.json files under ROOT, excluding any _quiz subdirectories
	const pageJsonFiles: string[] = []
	const walk = async (dir: string) => {
		const direntsResult = await errors.try(fs.readdir(dir, { withFileTypes: true }))
		if (direntsResult.error) {
			logger.debug("failed reading directory", { dir, error: direntsResult.error })
			return
		}
		for (const d of direntsResult.data) {
			const full = path.join(dir, d.name)
			if (d.isDirectory()) {
				if (d.name === "_quiz") continue
				await walk(full)
			} else if (d.isFile() && d.name === "page-data.json") {
				pageJsonFiles.push(full)
			}
		}
	}

	await walk(ROOT)

	logger.info("discovered pages with page-data.json", { count: pageJsonFiles.length })

	const tasks = pageJsonFiles.map((p) => () => processPage(p, OUTPUT_DIR, ROOT))
	const results = await runWithConcurrency(tasks, CONCURRENCY_LIMIT)

	const failures = results.filter((r): r is PromiseRejectedResult => r.status === "rejected")
	if (failures.length > 0) {
		logger.error("some pages failed to process", {
			failureCount: failures.length,
			reasons: failures.map((f) => f.reason)
		})
	}

	logger.info("stimulus generation complete", {
		total: pageJsonFiles.length,
		successes: results.length - failures.length,
		failures: failures.length
	})
}

// --- Script Execution ---
const result = await errors.try(main())
if (result.error) {
	logger.error("script failed to complete", { error: result.error })
	process.exit(1)
}
