#!/usr/bin/env bun
import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"
import { buildStimulusFromPageData } from "@/stimulus/builder"
import type { StimulusOptions } from "@/stimulus/types"

// Enable debug logging for this script
logger.setDefaultLogLevel(logger.DEBUG)
logger.info("canvas stimulus generator started with debug logging enabled")

// --- Configuration ---
const ROOT_DIR = "canvas-scrape/English 09, Part 1"
const CONCURRENCY_LIMIT = 200

const RAW_ARGS = process.argv.slice(2)
if (RAW_ARGS.length !== 1) {
	logger.error(
		"expected exactly one positional argument for base data directory",
		{
			received: RAW_ARGS
		}
	)
	throw errors.new(
		"base data directory must be provided as the sole argument (e.g., 'data')"
	)
}

const BASE_DIR_ARG = RAW_ARGS[0]
if (!BASE_DIR_ARG) {
	logger.error("base data directory not provided")
	throw errors.new(
		"base data directory must be provided as the sole argument (e.g., 'data')"
	)
}

const configuredStimulusOptions: StimulusOptions = {}

const OUTPUT_DIR = path.resolve(process.cwd(), BASE_DIR_ARG, "stimulus-out")
const ROOT = path.resolve(process.cwd(), ROOT_DIR)
// ---

// ----------------------
// Utility helpers
// ----------------------

async function runWithConcurrency<T>(
	tasks: Array<() => Promise<T>>,
	limit: number
): Promise<Array<PromiseSettledResult<T>>> {
	const results: Array<PromiseSettledResult<T>> = []
	let index = 0

	async function worker() {
		while (index < tasks.length) {
			const current = index++
			const task = tasks[current]
			if (!task) continue
			const res = await errors.try(task())
			if (res.error) {
				results[current] = { status: "rejected", reason: res.error }
			} else {
				results[current] = { status: "fulfilled", value: res.data }
			}
		}
	}

	const workers = Array(Math.min(limit, tasks.length))
		.fill(null)
		.map(() => worker())
	await Promise.all(workers)
	return results
}

function toKebabCase(str: string): string {
	return str
		.trim()
		.toLowerCase()
		.replace(/[\s._]+/g, "-")
		.replace(/[^a-z0-9-]/g, "")
}

// ----------------------
// Schemas and Types
// ----------------------

const PageDataSchema = z.object({
	title: z.string().optional(),
	mainContent: z
		.object({
			html: z.string().optional(),
			text: z.string().optional()
		})
		.optional()
})

type PageData = z.infer<typeof PageDataSchema>

const DetectedVideoSchema = z.object({
	order: z.number().int(),
	youtubeId: z.string(),
	titleHint: z.string().min(1).optional(),
	contextHtml: z.string().min(1).optional()
})

// ----------------------
// Core processing
// ----------------------

async function processPage(
	pageJsonPath: string,
	outputRoot: string,
	rootDir: string
): Promise<void> {
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
		logger.warn("page-data.json unreadable, skipping", {
			file: pageJsonPath,
			error: jsonResult.error
		})
		return
	}

	const parsed = errors.trySync<unknown>(() => JSON.parse(jsonResult.data))
	if (parsed.error) {
		logger.warn("page-data.json parse failed, skipping", {
			file: pageJsonPath,
			error: parsed.error
		})
		return
	}

	const pd = PageDataSchema.safeParse(parsed.data)
	if (!pd.success) {
		logger.warn("page-data.json schema mismatch, skipping", {
			file: pageJsonPath
		})
		return
	}

	await buildAndWriteStimulus(pd.data, outDir)
}

async function buildAndWriteStimulus(
	page: PageData,
	outDir: string
): Promise<void> {
	const buildResult = buildStimulusFromPageData(page, configuredStimulusOptions)
	if (!buildResult) {
		logger.warn("page missing mainContent.html, skipping", { outDir })
		return
	}

	if (buildResult.issues.length > 0) {
		for (const issue of buildResult.issues) {
			if (issue.severity === "error") {
				logger.error("stimulus issue", {
					code: issue.code,
					message: issue.message,
					severity: issue.severity,
					outDir
				})
				continue
			}
			if (issue.severity === "warning") {
				logger.warn("stimulus issue", {
					code: issue.code,
					message: issue.message,
					severity: issue.severity,
					outDir
				})
				continue
			}
			logger.debug("stimulus issue", {
				code: issue.code,
				message: issue.message,
				severity: issue.severity,
				outDir
			})
		}
		if (buildResult.issues.some((issue) => issue.severity === "error")) {
			logger.error("skipping stimulus due to blocking errors", { outDir })
			return
		}
	}

	const finalizedResult = buildResult
	const videosValidation = DetectedVideoSchema.array().safeParse(
		finalizedResult.videos
	)
	if (!videosValidation.success) {
		logger.error("video manifest schema mismatch", {
			outDir,
			error: videosValidation.error
		})
		throw errors.wrap(videosValidation.error, "video manifest validation")
	}
	const videosData = videosValidation.data

	const outPath = path.join(outDir, "stimulus.html")
	async function writeStimulusFile() {
		await fs.mkdir(outDir, { recursive: true })
		await Bun.write(outPath, finalizedResult.html)
	}
	const writeRes = await errors.try(writeStimulusFile())
	if (writeRes.error) {
		logger.error("failed to write stimulus html", {
			file: outPath,
			error: writeRes.error
		})
	} else {
		logger.info("wrote stimulus html", { file: outPath })
	}

	const videosPath = path.join(outDir, "videos.json")
	async function writeVideosFile() {
		await fs.mkdir(outDir, { recursive: true })
		const serialized = `${JSON.stringify(videosData, null, 2)}\n`
		await Bun.write(videosPath, serialized)
	}
	const videosWrite = await errors.try(writeVideosFile())
	if (videosWrite.error) {
		logger.error("failed to write video manifest", {
			file: videosPath,
			error: videosWrite.error
		})
		throw errors.wrap(videosWrite.error, "video manifest write")
	}
	logger.debug("wrote video manifest", {
		file: videosPath,
		count: videosData.length
	})
}

// ----------------------
// Main orchestration
// ----------------------

async function discoverPages(root: string): Promise<string[]> {
	const files: string[] = []
	const stack = [root]
	while (stack.length > 0) {
		const current = stack.pop()
		if (!current) continue
		const direntsResult = await errors.try(
			fs.readdir(current, { withFileTypes: true })
		)
		if (direntsResult.error) {
			logger.debug("failed reading directory", {
				dir: current,
				error: direntsResult.error
			})
			continue
		}
		for (const d of direntsResult.data) {
			const full = path.join(current, d.name)
			if (d.isDirectory()) {
				if (d.name === "_quiz") continue
				stack.push(full)
			} else if (d.isFile() && d.name === "page-data.json") {
				files.push(full)
			}
		}
	}
	return files
}

async function main() {
	const rootStat = await errors.try(fs.stat(ROOT))
	if (rootStat.error || !rootStat.data.isDirectory()) {
		logger.error("root directory not found", {
			dir: ROOT,
			error: rootStat.error
		})
		throw errors.new("root directory not found")
	}

	const pageJsonFiles = await discoverPages(ROOT)
	logger.info("discovered pages with page-data.json", {
		count: pageJsonFiles.length
	})

	const tasks = pageJsonFiles.map((p) => () => processPage(p, OUTPUT_DIR, ROOT))
	const results = await runWithConcurrency(tasks, CONCURRENCY_LIMIT)

	const failures = results.filter(
		(r): r is PromiseRejectedResult => r.status === "rejected"
	)
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

const result = await errors.try(main())
if (result.error) {
	logger.error("script failed to complete", { error: result.error })
	process.exit(1)
}
