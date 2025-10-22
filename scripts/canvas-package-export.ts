#!/usr/bin/env bun

import "dotenv/config"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"
import {
	type BuildUnit,
	buildCartridgeFromFileMap,
	type CartridgeFileMap,
	type GeneratorInfo
} from "@/cartridge/build/builder"
import type { ResourceVideo } from "@/cartridge/types"
import {
	type VideoMetadata,
	VideoMetadataSchema
} from "@/stimulus/video-metadata"
import {
	fetchYoutubeMetadata,
	type YoutubeMetadata
} from "./lib/youtube-metadata"

const YOUTUBE_REQUESTS_PER_SECOND = 5

// Enable debug logging for this script
logger.setDefaultLogLevel(logger.DEBUG)
logger.info("canvas package export started with debug logging enabled")

// Concurrency constant unused in staged build
const BASE_DIR_ARG = process.argv[2]
if (!BASE_DIR_ARG) {
	logger.error("base data directory not provided")
	throw errors.new(
		"base data directory must be provided as first argument (e.g., 'data')"
	)
}
const DATA_DIR = path.resolve(process.cwd(), BASE_DIR_ARG)
const OUT_CARTRIDGE = path.resolve(DATA_DIR, "course-cartridge-v1.tar.zst")
const EXCLUDED_GROUPS = new Set([
	"how-to-take-this-course",
	"final-exam",
	"course-completion--requesting-a-transcript"
])
async function collectCourseInfo(): Promise<{
	title: string
	subject: string
}> {
	const scrapeRoot = path.resolve(process.cwd(), "canvas-scrape")
	const direntsResult = await errors.try(
		fs.readdir(scrapeRoot, { withFileTypes: true })
	)
	if (direntsResult.error) {
		logger.error("canvas-scrape directory read", {
			dir: scrapeRoot,
			error: direntsResult.error
		})
		throw errors.wrap(direntsResult.error, "directory read")
	}
	const candidates = direntsResult.data
		.filter((d) => d.isDirectory())
		.map((d) => d.name)
		.filter((name) => !name.startsWith("_") && name.trim().length > 0)

	if (candidates.length !== 1) {
		logger.error("expected exactly one course directory in canvas-scrape", {
			count: candidates.length,
			entries: candidates
		})
		throw errors.new("invalid canvas-scrape layout")
	}
	const title = candidates[0]
	const subjMatch = title.match(/^[A-Za-z]+/)
	const subject = subjMatch ? subjMatch[0] : title
	return { title, subject }
}

function slugifyName(name: string): string {
	const withoutApostrophes = name.replace(/[’']/g, "")
	return withoutApostrophes.toLowerCase().replace(/[^a-z0-9-]+/g, "-")
}

function normalizeUnitTitle(name: string): string {
	const trimmed = name.trim()
	const match = trimmed.match(/^unit\s*\d+[\s:;\-\u2013\u2014]*/i)
	if (!match) return trimmed
	const remainder = trimmed.slice(match[0].length).trim()
	return remainder.length > 0 ? remainder : trimmed
}

function hasOptionalTitle(value: unknown): value is { title?: unknown } {
	return typeof value === "object" && value !== null && "title" in value
}

async function collectPrettyMaps(courseTitle: string): Promise<{
	unitTitleBySlug: Record<string, string>
	lessonTitleByGroupAndSlug: Record<string, Record<string, string>>
}> {
	const root = path.resolve(process.cwd(), "canvas-scrape", courseTitle)
	const unitTitleBySlug: Record<string, string> = {}
	const lessonTitleByGroupAndSlug: Record<string, Record<string, string>> = {}

	const unitsDirents = await errors.try(
		fs.readdir(root, { withFileTypes: true })
	)
	if (unitsDirents.error) {
		logger.error("canvas course directory read", {
			dir: root,
			error: unitsDirents.error
		})
		throw errors.wrap(unitsDirents.error, "directory read")
	}
	for (const u of unitsDirents.data) {
		if (!u.isDirectory()) continue
		const unitPretty = u.name
		const unitSlug = slugifyName(unitPretty)
		unitTitleBySlug[unitSlug] = normalizeUnitTitle(unitPretty)
		const unitPath = path.join(root, unitPretty)
		const pagesDirents = await errors.try(
			fs.readdir(unitPath, { withFileTypes: true })
		)
		if (pagesDirents.error) continue
		for (const p of pagesDirents.data) {
			if (!p.isDirectory()) continue
			const pagePretty = p.name
			const pageSlug = slugifyName(pagePretty)
			const metaPath = path.join(unitPath, pagePretty, "metadata.json")
			const metaRead = await errors.try(fs.readFile(metaPath, "utf8"))
			let pageTitle = pagePretty
			if (!metaRead.error) {
				const metaParse = errors.trySync<unknown>(() =>
					JSON.parse(metaRead.data)
				)
				if (!metaParse.error && hasOptionalTitle(metaParse.data)) {
					const maybeTitle = metaParse.data.title
					if (typeof maybeTitle === "string" && maybeTitle.trim().length > 0) {
						pageTitle = maybeTitle
					}
				}
			}
			if (!lessonTitleByGroupAndSlug[unitSlug])
				lessonTitleByGroupAndSlug[unitSlug] = {}
			lessonTitleByGroupAndSlug[unitSlug][pageSlug] = pageTitle
		}
	}
	return { unitTitleBySlug, lessonTitleByGroupAndSlug }
}

function numericTokens(str: string): number[] {
	const tokens: number[] = []
	const parts = str.split(/[^0-9]+/)
	for (const p of parts) {
		if (p.length === 0) continue
		const n = Number(p)
		if (Number.isFinite(n)) tokens.push(n)
	}
	return tokens
}

function sortLessonDirs(a: string, b: string): number {
	// Prefer numeric-leading tokens like "1-1-..." or "2-4-..."
	const at = numericTokens(path.basename(a))
	const bt = numericTokens(path.basename(b))
	const len = Math.max(at.length, bt.length)
	for (let i = 0; i < len; i++) {
		const av = at[i]
		const bv = bt[i]
		if (av === undefined && bv === undefined) break
		if (av === undefined) return -1
		if (bv === undefined) return 1
		if (av !== bv) return av - bv
	}
	return a.localeCompare(b)
}

function sortTopGroups(a: string, b: string): number {
	// Heuristic ordering: how-to-* first, then units by number, final-exam next, course-completion last
	const aBase = path.basename(a)
	const bBase = path.basename(b)
	const aIsHow = /^how-to-/.test(aBase)
	const bIsHow = /^how-to-/.test(bBase)
	if (aIsHow && !bIsHow) return -1
	if (!aIsHow && bIsHow) return 1
	const aUnit = aBase.match(/^unit-(\d+)/)
	const bUnit = bBase.match(/^unit-(\d+)/)
	if (aUnit && bUnit) return Number(aUnit[1]) - Number(bUnit[1])
	if (aUnit && !bUnit) return -1
	if (!aUnit && bUnit) return 1
	const aIsFinal = /^final-exam$/.test(aBase)
	const bIsFinal = /^final-exam$/.test(bBase)
	if (aIsFinal && !bIsFinal) return 1
	if (!aIsFinal && bIsFinal) return -1
	const aIsCourseCompletion = /^course-completion-/.test(aBase)
	const bIsCourseCompletion = /^course-completion-/.test(bBase)
	if (aIsCourseCompletion && !bIsCourseCompletion) return 1
	if (!aIsCourseCompletion && bIsCourseCompletion) return -1
	return aBase.localeCompare(bBase)
}

const IndexQuestionSchema = z.object({
	number: z.number(),
	xml: z.string(),
	json: z.string()
})

const IndexAssessmentSchema = z.object({
	id: z.string(),
	path: z.string(),
	questions: z.array(IndexQuestionSchema)
})

const ExtractedVideoSchema = z
	.object({
		order: z.number().int(),
		youtubeId: z.string(),
		titleHint: z.string().optional(),
		contextHtml: z.string().optional()
	})
	.strict()

type ExtractedVideo = z.infer<typeof ExtractedVideoSchema>

// ----------------------
// Packaging Steps
// ----------------------

async function collectStimulus(): Promise<
	Array<{
		group: string
		pages: Array<{
			slug: string
			path: string
			diskPath: string
			videos: ExtractedVideo[]
		}>
	}>
> {
	const stimulusRoot = path.join(DATA_DIR, "stimulus-out")
	const statResult = await errors.try(fs.stat(stimulusRoot))
	if (statResult.error || !statResult.data.isDirectory()) {
		logger.error("stimulus-out directory missing", {
			dir: stimulusRoot,
			error: statResult.error
		})
		throw errors.new("stimulus-out directory missing")
	}

	const groups: Array<{
		group: string
		pages: Array<{
			slug: string
			path: string
			diskPath: string
			videos: ExtractedVideo[]
		}>
	}> = []
	const groupDirentsResult = await errors.try(
		fs.readdir(stimulusRoot, { withFileTypes: true })
	)
	if (groupDirentsResult.error) {
		logger.error("stimulus-out directory read", {
			dir: stimulusRoot,
			error: groupDirentsResult.error
		})
		throw errors.wrap(groupDirentsResult.error, "directory read")
	}
	const groupDirs = groupDirentsResult.data
		.filter((d) => d.isDirectory())
		.map((d) => path.join(stimulusRoot, d.name))
		.filter((full) => !EXCLUDED_GROUPS.has(path.basename(full)))
	groupDirs.sort(sortTopGroups)

	for (const groupDir of groupDirs) {
		const pages: Array<{
			slug: string
			path: string
			diskPath: string
			videos: ExtractedVideo[]
		}> = []
		const pageDirentsResult = await errors.try(
			fs.readdir(groupDir, { withFileTypes: true })
		)
		if (pageDirentsResult.error) {
			logger.error("group directory read", {
				dir: groupDir,
				error: pageDirentsResult.error
			})
			throw errors.wrap(pageDirentsResult.error, "directory read")
		}
		const pageDirs = pageDirentsResult.data
			.filter((d) => d.isDirectory())
			.map((d) => path.join(groupDir, d.name))
		pageDirs.sort(sortLessonDirs)
		for (const pageDir of pageDirs) {
			const htmlPath = path.join(pageDir, "stimulus.html")
			const htmlStat = await errors.try(fs.stat(htmlPath))
			if (htmlStat.error || !htmlStat.data.isFile()) {
				logger.debug("stimulus missing, skipping page", { dir: pageDir })
				continue
			}
			const videosPath = path.join(pageDir, "videos.json")
			const videosRead = await errors.try(fs.readFile(videosPath, "utf8"))
			if (videosRead.error) {
				logger.error("videos manifest read failed", {
					file: videosPath,
					error: videosRead.error
				})
				throw errors.wrap(videosRead.error, "video manifest read")
			}
			const videosParsed = errors.trySync<unknown>(() =>
				JSON.parse(videosRead.data)
			)
			if (videosParsed.error) {
				logger.error("videos manifest parse failed", {
					file: videosPath,
					error: videosParsed.error
				})
				throw errors.wrap(videosParsed.error, "video manifest parse")
			}
			const videosValidation = ExtractedVideoSchema.array().safeParse(
				videosParsed.data
			)
			if (!videosValidation.success) {
				logger.error("videos manifest schema invalid", {
					file: videosPath,
					error: videosValidation.error
				})
				throw errors.wrap(videosValidation.error, "video manifest validate")
			}
			const videosSorted = [...videosValidation.data].sort(
				(a, b) => a.order - b.order
			)
			const relativePath = path.relative(stimulusRoot, htmlPath)
			const cartridgePath = path
				.join("content", relativePath)
				.split(path.sep)
				.join("/")
			pages.push({
				slug: path.basename(pageDir),
				path: cartridgePath,
				diskPath: htmlPath,
				videos: videosSorted
			})
		}
		groups.push({ group: path.basename(groupDir), pages })
	}
	return groups
}

function extractQuestionNumber(fileName: string): number | undefined {
	const m = fileName.match(/^question-(\d+)\./)
	if (!m || !m[1]) return undefined
	const n = Number(m[1])
	return Number.isFinite(n) ? n : undefined
}

async function collectAssessments(): Promise<{
	quizzes: Array<z.infer<typeof IndexAssessmentSchema>>
	tests: Array<z.infer<typeof IndexAssessmentSchema>>
}> {
	const direntsResult = await errors.try(
		fs.readdir(DATA_DIR, { withFileTypes: true })
	)
	if (direntsResult.error) {
		logger.error("failed to read data directory", {
			dir: DATA_DIR,
			error: direntsResult.error
		})
		throw errors.wrap(direntsResult.error, "data directory read")
	}
	const entries = direntsResult.data
	const quizzes: Array<z.infer<typeof IndexAssessmentSchema>> = []
	const tests: Array<z.infer<typeof IndexAssessmentSchema>> = []

	for (const de of entries) {
		if (!de.isDirectory()) continue
		const name = de.name
		if (/^quiz-\d+-\d+$/.test(name)) {
			const a = await buildAssessment(
				path.join(DATA_DIR, name),
				path.join("quizzes", name)
			)
			quizzes.push(a)
			continue
		}
		if (/^unit-\d+-test$/.test(name)) {
			const a = await buildAssessment(
				path.join(DATA_DIR, name),
				path.join("tests", name)
			)
			tests.push(a)
		}
	}

	// Sort quizzes by unit and quiz number
	quizzes.sort((a, b) => {
		const at = numericTokens(a.id)
		const bt = numericTokens(b.id)
		const len = Math.max(at.length, bt.length)
		for (let i = 0; i < len; i++) {
			const av = at[i]
			const bv = bt[i]
			if (av === undefined && bv === undefined) break
			if (av === undefined) return -1
			if (bv === undefined) return 1
			if (av !== bv) return av - bv
		}
		return a.id.localeCompare(b.id)
	})
	// Sort tests by unit number
	tests.sort((a, b) => {
		const at = numericTokens(a.id)
		const bt = numericTokens(b.id)
		if (at[0] !== undefined && bt[0] !== undefined) return at[0] - bt[0]
		return a.id.localeCompare(b.id)
	})

	return { quizzes, tests }
}

async function buildAssessment(
	sourceDir: string,
	destRelBase: string
): Promise<z.infer<typeof IndexAssessmentSchema>> {
	const id = path.basename(sourceDir)
	const questions: Array<z.infer<typeof IndexQuestionSchema>> = []
	const direntsResult = await errors.try(
		fs.readdir(sourceDir, { withFileTypes: true })
	)
	if (direntsResult.error) {
		logger.error("assessment directory read", {
			dir: sourceDir,
			error: direntsResult.error
		})
		throw errors.wrap(direntsResult.error, "directory read")
	}
	const files = direntsResult.data.filter((d) => d.isFile()).map((d) => d.name)
	// Group by question number
	const numbers = new Set<number>()
	for (const f of files) {
		const n = extractQuestionNumber(f)
		if (n !== undefined) numbers.add(n)
	}
	const sortedNumbers = Array.from(numbers).sort((a, b) => a - b)
	for (const n of sortedNumbers) {
		const numStr = String(n).padStart(2, "0")
		const xmlName = `question-${numStr}.xml`
		const jsonName = `question-${numStr}-structured.json`
		const xmlExists = files.includes(xmlName)
		const jsonExists = files.includes(jsonName)
		if (!xmlExists || !jsonExists) {
			logger.error("question missing required files", {
				assessment: id,
				questionNumber: n,
				xmlExists,
				jsonExists
			})
			throw errors.new("question missing required xml or json")
		}
		questions.push({
			number: n,
			xml: path.join(destRelBase, xmlName),
			json: path.join(destRelBase, jsonName)
		})
	}
	return { id, path: destRelBase, questions }
}

// ----------------------
// Hierarchical Index Construction (Units → Lessons → Resources)
// ----------------------

type ArticleResource = {
	id: string
	title: string
	type: "article"
	path: string
}
type VideoResourcePlan = {
	id: string
	order: number
	youtubeId: string
	metadataPath: string
	titleHint?: string
	contextHtml?: string
}
type QuizResource = {
	id: string
	title: string
	type: "quiz"
	path: string
	questionCount: number
	questions: Array<z.infer<typeof IndexQuestionSchema>>
}
type LessonRecord = {
	unitId: string
	lessonId: string
	lessonNumber: number
	title: string
	articles: Array<{ resource: ArticleResource; videos: VideoResourcePlan[] }>
	quizzes: QuizResource[]
}
type UnitTestRecord = {
	id: string
	title: string
	path: string
	questionCount: number
	questions: Array<z.infer<typeof IndexQuestionSchema>>
}
type UnitRecord = {
	unitId: string
	unitNumber: number
	title: string
	lessons: LessonRecord[]
	unitTest?: UnitTestRecord
}

function toUnitIdFromGroup(group: string): { unitId: string; unitNum: number } {
	const m = group.match(/^unit-(\d+)/)
	if (m?.[1]) {
		const n = Number(m[1])
		if (Number.isFinite(n)) return { unitId: `unit-${n}`, unitNum: n }
	}
	logger.error("group name does not contain numeric unit prefix", { group })
	throw errors.new("invalid unit group name; expected unit-<n>")
}

function toLessonId(
	unitNum: number,
	slug: string
): { lessonId: string; lessonNumber: number } {
	const nums = numericTokens(slug)
	if (nums.length >= 2 && nums[0] === unitNum) {
		const lessonNum = nums[1]
		return {
			lessonId: `lesson-${unitNum}-${lessonNum}`,
			lessonNumber: lessonNum
		}
	}
	// Handle non-numbered study guides deterministically: place before lesson 1 as 0
	const sg = slug.match(/^unit-(\d+)-study-guide$/)
	if (sg && Number(sg[1]) === unitNum) {
		return { lessonId: `lesson-${unitNum}-0`, lessonNumber: 0 }
	}
	logger.error("page slug does not encode unit and lesson numbers", {
		unitNum,
		slug
	})
	throw errors.new("invalid lesson slug; expected <unit>-<lesson> prefix")
}

function buildHierarchy(
	stimGroups: Array<{
		group: string
		pages: Array<{
			slug: string
			path: string
			diskPath: string
			videos: ExtractedVideo[]
		}>
	}>,
	assessments: {
		quizzes: Array<z.infer<typeof IndexAssessmentSchema>>
		tests: Array<z.infer<typeof IndexAssessmentSchema>>
	},
	pretty: {
		unitTitleBySlug: Record<string, string>
		lessonTitleByGroupAndSlug: Record<string, Record<string, string>>
	}
): UnitRecord[] {
	const unitsMap = new Map<string, UnitRecord>()

	// Seed units and lessons from stimulus (articles)
	for (const g of stimGroups) {
		const { unitId, unitNum } = toUnitIdFromGroup(g.group)
		let unit = unitsMap.get(unitId)
		if (!unit) {
			const prettyUnitTitle = pretty.unitTitleBySlug[g.group]
			if (!prettyUnitTitle) {
				logger.error("missing pretty unit title", { groupSlug: g.group })
				throw errors.new("missing pretty unit title")
			}
			unit = {
				unitId,
				unitNumber: unitNum,
				title: prettyUnitTitle,
				lessons: []
			}
			unitsMap.set(unitId, unit)
		}
		for (const p of g.pages) {
			const { lessonId, lessonNumber } = toLessonId(unitNum, p.slug)
			const prettyLessonTitle =
				pretty.lessonTitleByGroupAndSlug[g.group]?.[p.slug]
			if (!prettyLessonTitle) {
				logger.error("missing pretty lesson title", {
					groupSlug: g.group,
					pageSlug: p.slug
				})
				throw errors.new("missing pretty lesson title")
			}
			let lesson = unit.lessons.find((l) => l.lessonId === lessonId)
			if (!lesson) {
				lesson = {
					unitId,
					lessonId,
					lessonNumber,
					title: prettyLessonTitle,
					articles: [],
					quizzes: []
				}
				unit.lessons.push(lesson)
			}
			const articleId = `article-${g.group}-${p.slug}`.replace(
				/[^a-z0-9-]/g,
				"-"
			)
			const existingVideoCount = lesson.articles.reduce((sum, entry) => {
				return sum + entry.videos.length
			}, 0)
			const videosForArticle: VideoResourcePlan[] = []
			for (let idx = 0; idx < p.videos.length; idx++) {
				const video = p.videos[idx]
				const ordinal = existingVideoCount + idx + 1
				const paddedOrdinal = String(ordinal).padStart(2, "0")
				const videoId = `${lessonId}-video-${paddedOrdinal}`
				const metadataPath = path.posix.join(
					"videos",
					g.group,
					p.slug,
					`${videoId}.json`
				)
				videosForArticle.push({
					id: videoId,
					order: ordinal,
					youtubeId: video.youtubeId,
					metadataPath,
					titleHint: video.titleHint,
					contextHtml: video.contextHtml
				})
			}
			lesson.articles.push({
				resource: {
					id: articleId,
					title: prettyLessonTitle,
					type: "article",
					path: p.path
				},
				videos: videosForArticle
			})
		}
	}

	// Attach quizzes into lessons by unit/lesson numbers
	for (const q of assessments.quizzes) {
		const m = q.id.match(/^quiz-(\d+)-(\d+)$/)
		if (!m) continue
		const unitNum = Number(m[1])
		const lessonNum = Number(m[2])
		const unitId = `unit-${unitNum}`
		const unitSlugKey = Object.keys(pretty.unitTitleBySlug).find((k) =>
			k.startsWith(`unit-${unitNum}`)
		)
		const prettyUnitTitle = unitSlugKey
			? pretty.unitTitleBySlug[unitSlugKey]
			: undefined
		const lessonMap = unitSlugKey
			? pretty.lessonTitleByGroupAndSlug[unitSlugKey]
			: undefined
		let unit = unitsMap.get(unitId)
		if (!unit) {
			if (!prettyUnitTitle) {
				logger.error("missing pretty unit title for injected unit", { unitNum })
				throw errors.new("missing pretty unit title")
			}
			unit = {
				unitId,
				unitNumber: unitNum,
				title: prettyUnitTitle,
				lessons: []
			}
			unitsMap.set(unitId, unit)
		}
		let lesson = unit.lessons.find((l) => l.lessonNumber === lessonNum)
		if (!lesson) {
			const targetPrefix = `${unitNum}-${lessonNum}-`
			const pageKey = lessonMap
				? Object.keys(lessonMap).find((k) => k.startsWith(targetPrefix))
				: undefined
			const prettyLessonTitle = pageKey ? lessonMap?.[pageKey] : undefined
			if (!prettyLessonTitle) {
				logger.error("missing pretty lesson title for injected lesson", {
					unitNum,
					lessonNum
				})
				throw errors.new("missing pretty lesson title")
			}
			lesson = {
				unitId,
				lessonId: `lesson-${unitNum}-${lessonNum}`,
				lessonNumber: lessonNum,
				title: prettyLessonTitle,
				articles: [],
				quizzes: []
			}
			unit.lessons.push(lesson)
		}
		const quizTitle = lessonMap?.[q.id]
		if (!quizTitle) {
			logger.error("missing pretty quiz title", {
				unitNum,
				lessonNum,
				quizId: q.id
			})
			throw errors.new("missing pretty quiz title")
		}
		lesson.quizzes.push({
			id: q.id,
			title: quizTitle,
			type: "quiz",
			path: q.path,
			questionCount: q.questions.length,
			questions: q.questions
		})
	}

	// Attach unit tests to their units only
	for (const t of assessments.tests) {
		const m = t.id.match(/^unit-(\d+)-test$/)
		if (!m) continue
		const unitNum = Number(m[1])
		const unitId = `unit-${unitNum}`
		const unitSlugKey = Object.keys(pretty.unitTitleBySlug).find((k) =>
			k.startsWith(`unit-${unitNum}`)
		)
		const prettyUnitTitle = unitSlugKey
			? pretty.unitTitleBySlug[unitSlugKey]
			: undefined
		let unit = unitsMap.get(unitId)
		if (!unit) {
			if (!prettyUnitTitle) {
				logger.error("missing pretty unit title for unit test", { unitNum })
				throw errors.new("missing pretty unit title")
			}
			unit = {
				unitId,
				unitNumber: unitNum,
				title: prettyUnitTitle,
				lessons: []
			}
			unitsMap.set(unitId, unit)
		}
		const lessonMap = unitSlugKey
			? pretty.lessonTitleByGroupAndSlug[unitSlugKey]
			: undefined
		const prettyTestTitle = lessonMap ? lessonMap[t.id] : undefined
		if (!prettyTestTitle) {
			logger.error("missing pretty unit test title", { unitNum, testId: t.id })
			throw errors.new("missing pretty unit test title")
		}
		unit.unitTest = {
			id: t.id,
			title: prettyTestTitle,
			path: t.path,
			questionCount: t.questions.length,
			questions: t.questions
		}
	}

	// Sort lessons within units
	for (const u of unitsMap.values()) {
		u.lessons.sort((a, b) => a.lessonNumber - b.lessonNumber)
		for (const l of u.lessons) {
			l.quizzes.sort((q1, q2) => q1.id.localeCompare(q2.id))
		}
	}

	// Sort units: numeric units first by number, then others lexicographically
	let units = Array.from(unitsMap.values())
	units.sort((a, b) => a.unitNumber - b.unitNumber)
	return units
}

// removed safeName helper; names are used as-is for in-memory paths

// removed legacy toCartridgeInput; staging build constructs units directly

// ----------------------
// Main
// ----------------------

async function main() {
	const dataStat = await errors.try(fs.stat(DATA_DIR))
	if (dataStat.error || !dataStat.data.isDirectory()) {
		logger.error("data directory not found", {
			dir: DATA_DIR,
			error: dataStat.error
		})
		throw errors.new("data directory not found")
	}

	logger.info("collecting course metadata")
	const course = await collectCourseInfo()
	const prettyMaps = await collectPrettyMaps(course.title)

	logger.info("collecting stimulus content")
	const contentGroups = await collectStimulus()

	logger.info("collecting assessments")
	const assessments = await collectAssessments()

	logger.info("collecting file paths for on-disk staging")

	// Build hierarchical Units → Lessons → Resources, and write split JSON files
	const hierarchy = buildHierarchy(contentGroups, assessments, prettyMaps)

	// Read package.json for generator info
	const pkgJsonPath = path.join(process.cwd(), "package.json")
	const pkgRes = await errors.try(fs.readFile(pkgJsonPath, "utf8"))
	let generator: GeneratorInfo | undefined
	if (!pkgRes.error) {
		const pkgParsed = errors.trySync(() => JSON.parse(pkgRes.data))
		if (!pkgParsed.error) {
			const pkg = pkgParsed.data
			if (typeof pkg.name === "string" && typeof pkg.version === "string") {
				generator = { name: pkg.name, version: pkg.version }
			}
		}
	}

	if (!generator) {
		logger.error("generator info missing in package.json")
		throw errors.new("generator info missing")
	}
	// Build a file map: destination path inside cartridge -> absolute source path on disk
	const fileMap: CartridgeFileMap = {}
	for (const g of contentGroups) {
		for (const p of g.pages) {
			fileMap[p.path.split(path.sep).join("/")] = p.diskPath
		}
	}
	for (const q of assessments.quizzes) {
		for (const entry of q.questions) {
			fileMap[entry.xml] = path.join(
				DATA_DIR,
				path.basename(q.path),
				path.basename(entry.xml)
			)
			fileMap[entry.json] = path.join(
				DATA_DIR,
				path.basename(q.path),
				path.basename(entry.json)
			)
		}
	}
	for (const t of assessments.tests) {
		for (const entry of t.questions) {
			fileMap[entry.xml] = path.join(
				DATA_DIR,
				path.basename(t.path),
				path.basename(entry.xml)
			)
			fileMap[entry.json] = path.join(
				DATA_DIR,
				path.basename(t.path),
				path.basename(entry.json)
			)
		}
	}

	async function writeVideoMetadataFile(
		metadata: VideoMetadata
	): Promise<string> {
		const validated = VideoMetadataSchema.safeParse(metadata)
		if (!validated.success) {
			logger.error("video metadata schema invalid", {
				path: metadata.path,
				error: validated.error
			})
			throw errors.wrap(validated.error, "video metadata validation")
		}
		const normalized = validated.data
		const absolute = path.join(DATA_DIR, ...normalized.path.split("/"))
		const directory = path.dirname(absolute)
		const mkdirResult = await errors.try(
			fs.mkdir(directory, { recursive: true })
		)
		if (mkdirResult.error) {
			logger.error("video metadata directory creation failed", {
				directory,
				error: mkdirResult.error
			})
			throw errors.wrap(mkdirResult.error, "video metadata directory")
		}
		const serialized = `${JSON.stringify(normalized, null, 2)}\n`
		const writeResult = await errors.try(
			fs.writeFile(absolute, serialized, "utf8")
		)
		if (writeResult.error) {
			logger.error("video metadata write failed", {
				file: absolute,
				error: writeResult.error
			})
			throw errors.wrap(writeResult.error, "video metadata write")
		}
		logger.debug("wrote video metadata", {
			file: normalized.path,
			bytes: Buffer.byteLength(serialized)
		})
		return absolute
	}

	async function fetchYoutubeMetadataBatch(
		youtubeIds: string[],
		perSecond: number
	): Promise<Map<string, YoutubeMetadata>> {
		const results = new Map<string, YoutubeMetadata>()
		if (youtubeIds.length === 0) {
			return results
		}
		for (let i = 0; i < youtubeIds.length; i += perSecond) {
			const chunk = youtubeIds.slice(i, i + perSecond)
			const fetched = await Promise.all(
				chunk.map(async (youtubeId) => {
					logger.info("fetching youtube metadata", { youtubeId })
					const metadata = await fetchYoutubeMetadata(youtubeId)
					return { youtubeId, metadata }
				})
			)
			for (const { youtubeId, metadata } of fetched) {
				results.set(youtubeId, metadata)
			}
			if (i + perSecond < youtubeIds.length) {
				await new Promise((resolve) => setTimeout(resolve, 1000))
			}
		}
		return results
	}

	const pendingVideoTasks: Array<{
		lessonResources: Array<ArticleResource | QuizResource | ResourceVideo>
		articleResource: ArticleResource
		plan: VideoResourcePlan
		lesson: LessonRecord
		unit: UnitRecord
	}> = []
	const uniqueYoutubeIds = new Set<string>()

	const buildUnits: BuildUnit[] = []
	for (const unit of hierarchy) {
		const lessonBuilds = []
		for (const lesson of unit.lessons) {
			const lessonResources: Array<
				ArticleResource | QuizResource | ResourceVideo
			> = []
			for (const articleEntry of lesson.articles) {
				lessonResources.push(articleEntry.resource)
				const sortedVideos = [...articleEntry.videos].sort(
					(a, b) => a.order - b.order
				)
				for (const videoPlan of sortedVideos) {
					pendingVideoTasks.push({
						lessonResources,
						articleResource: articleEntry.resource,
						plan: videoPlan,
						lesson,
						unit
					})
					uniqueYoutubeIds.add(videoPlan.youtubeId)
				}
			}
			for (const quiz of lesson.quizzes) {
				lessonResources.push(quiz)
			}
			lessonBuilds.push({
				id: lesson.lessonId,
				unitId: unit.unitId,
				lessonNumber: lesson.lessonNumber,
				title: lesson.title,
				resources: lessonResources
			})
		}
		buildUnits.push({
			id: unit.unitId,
			unitNumber: unit.unitNumber,
			title: unit.title,
			lessons: lessonBuilds,
			unitTest: unit.unitTest
		})
	}

	const metadataById = await fetchYoutubeMetadataBatch(
		Array.from(uniqueYoutubeIds),
		YOUTUBE_REQUESTS_PER_SECOND
	)
	const articleInsertionCounts = new Map<ArticleResource, number>()

	for (const task of pendingVideoTasks) {
		const metadata = metadataById.get(task.plan.youtubeId)
		if (!metadata) {
			logger.error("youtube metadata missing", {
				youtubeId: task.plan.youtubeId
			})
			throw errors.new("youtube metadata missing")
		}
		const videoMetadata: VideoMetadata = {
			id: task.plan.id,
			type: "video",
			youtubeId: task.plan.youtubeId,
			path: task.plan.metadataPath,
			title: metadata.title,
			description: metadata.description,
			durationSeconds: metadata.durationSeconds,
			lessonId: task.lesson.lessonId,
			unitId: task.unit.unitId,
			order: task.plan.order
		}
		if (task.plan.titleHint !== undefined) {
			videoMetadata.titleHint = task.plan.titleHint
		}
		if (task.plan.contextHtml !== undefined) {
			videoMetadata.contextHtml = task.plan.contextHtml
		}
		const metadataAbsolutePath = await writeVideoMetadataFile(videoMetadata)
		fileMap[videoMetadata.path] = metadataAbsolutePath
		const videoResource: ResourceVideo = {
			id: task.plan.id,
			title: metadata.title,
			type: "video",
			path: task.plan.metadataPath,
			youtubeId: task.plan.youtubeId,
			durationSeconds: metadata.durationSeconds,
			description: metadata.description
		}
		const articleIndex = task.lessonResources.indexOf(task.articleResource)
		const alreadyInserted =
			articleInsertionCounts.get(task.articleResource) ?? 0
		const insertIndex =
			articleIndex >= 0
				? Math.min(
						articleIndex + 1 + alreadyInserted,
						task.lessonResources.length
					)
				: task.lessonResources.length
		task.lessonResources.splice(insertIndex, 0, videoResource)
		articleInsertionCounts.set(task.articleResource, alreadyInserted + 1)
	}

	logger.info(
		"building zstd-compressed cartridge (tar.zst) via on-disk staging"
	)
	await buildCartridgeFromFileMap(
		{ generator, course, units: buildUnits, files: fileMap },
		OUT_CARTRIDGE
	)
	logger.info("package export complete", {
		cartridge: OUT_CARTRIDGE,
		compression: "zstd"
	})
}

const result = await errors.try(main())
if (result.error) {
	logger.error("package export failed", { error: result.error })
	process.exit(1)
}
