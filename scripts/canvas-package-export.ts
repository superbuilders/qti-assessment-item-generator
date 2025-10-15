#!/usr/bin/env bun

import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { z } from "zod"
import { writeJsonStrict, computeIntegrityManifest, createTarBz2 } from "@/cartridge/build/helpers"

// Enable debug logging for this script
logger.setDefaultLogLevel(logger.DEBUG)
logger.info("canvas package export started with debug logging enabled")

// --- Configuration ---
const CONCURRENCY_LIMIT = 200

const BASE_DIR_ARG = process.argv[2]
if (!BASE_DIR_ARG) {
	logger.error("base data directory not provided")
	throw errors.new("base data directory must be provided as first argument (e.g., 'data')")
}
const DATA_DIR = path.resolve(process.cwd(), BASE_DIR_ARG)
const OUT_DIR = path.resolve(DATA_DIR, "package-out")
const OUT_CONTENT_DIR = path.join(OUT_DIR, "content")
const OUT_QUIZZES_DIR = path.join(OUT_DIR, "quizzes")
const OUT_TESTS_DIR = path.join(OUT_DIR, "tests")
const OUT_UNITS_DIR = path.join(OUT_DIR, "units")
const OUT_LESSONS_DIR = path.join(OUT_DIR, "lessons")
// Excluded non-content groups to omit entirely from package
const EXCLUDED_GROUPS = new Set([
	"how-to-take-this-course",
	"final-exam",
	"course-completion--requesting-a-transcript",
])
// ---

// ----------------------
// Canvas-Specific Validation Helpers
// ----------------------

function parseQuestionNumberFromFilename(p: string): number | undefined {
	const m = p.match(/question-(\d{2})(-structured)?\./)
	if (!m || !m[1]) return undefined
	const n = Number(m[1])
	return Number.isFinite(n) ? n : undefined
}

function isSortedAscending<T>(arr: T[], proj: (x: T) => number): boolean {
	for (let i = 1; i < arr.length; i++) {
		if (proj(arr[i - 1]) > proj(arr[i])) return false
	}
	return true
}

function validateUnitRecord(u: {
	unitId: string
	unitNumber?: number
	lessons: Array<{
		lessonId: string
		lessonNumber?: number
		resources: Array<
			| { type: "article"; id: string; path: string }
			| {
					type: "quiz"
					id: string
					path: string
					questionCount: number
					questions: Array<{ number: number; xml: string; json: string }>
			  }
		>
	}>
	unitTest?: {
		id: string
		path: string
		questionCount: number
		questions: Array<{ number: number; xml: string; json: string }>
	}
}): void {
	// Lessons with numeric lessonNumber must be sorted ascending
	// and must precede lessons without numbers
	let lastLessonNumber: number | undefined = undefined
	let encounteredLessonWithoutNumber = false
	for (const lesson of u.lessons) {
		if (lesson.lessonNumber === undefined) {
			encounteredLessonWithoutNumber = true
			continue
		}
		if (encounteredLessonWithoutNumber) throw errors.new("lessons order invalid")
		if (lastLessonNumber !== undefined && lesson.lessonNumber < lastLessonNumber)
			throw errors.new("lessons not sorted")
		lastLessonNumber = lesson.lessonNumber
	}
	for (const l of u.lessons) {
		let seenQuiz = false
		for (const r of l.resources) {
			if (r.type === "quiz") seenQuiz = true
			if (seenQuiz && r.type === "article") throw errors.new("resource order invalid")
			if (r.type === "quiz") {
				if (r.questionCount !== r.questions.length) throw errors.new("question count mismatch")
				if (!isSortedAscending(r.questions, (q) => q.number))
					throw errors.new("questions not sorted")
				for (const q of r.questions) {
					const nx = parseQuestionNumberFromFilename(q.xml)
					const nj = parseQuestionNumberFromFilename(q.json)
					if (nx !== q.number || nj !== q.number) throw errors.new("question number mismatch")
				}
			}
		}
	}
	if (u.unitTest) {
		if (u.unitTest.questionCount !== u.unitTest.questions.length)
			throw errors.new("unit test count mismatch")
		if (!isSortedAscending(u.unitTest.questions, (q) => q.number))
			throw errors.new("unit test questions not sorted")
	}
}

// ----------------------
// Utilities
// ----------------------

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

		const promise = (async () => {
			const res = await errors.try(task())
			if (res.error) {
				results[currentIndex] = { status: "rejected", reason: res.error }
			} else {
				results[currentIndex] = { status: "fulfilled", value: res.data }
			}
		})()

		executing.push(promise)
		await promise
		executing.splice(executing.indexOf(promise), 1)

		await execute()
	}

	const initialPromises = Array(Math.min(limit, tasks.length))
		.fill(null)
		.map(execute)
	await Promise.all(initialPromises)

	return results
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
	json: z.string(),
})

const IndexAssessmentSchema = z.object({
	id: z.string(),
	path: z.string(),
	questions: z.array(IndexQuestionSchema)
})

// ----------------------
// Packaging Steps
// ----------------------

async function collectStimulus(): Promise<Array<{ group: string; pages: Array<{ slug: string; path: string }> }>> {
	const stimulusRoot = path.join(DATA_DIR, "stimulus-out")
	const statResult = await errors.try(fs.stat(stimulusRoot))
	if (statResult.error || !statResult.data.isDirectory()) {
		logger.error("stimulus-out directory missing", { dir: stimulusRoot, error: statResult.error })
		throw errors.new("stimulus-out directory missing")
	}

	const groups: Array<{ group: string; pages: Array<{ slug: string; path: string }> }> = []
	const groupDirentsResult = await errors.try(fs.readdir(stimulusRoot, { withFileTypes: true }))
	if (groupDirentsResult.error) {
		logger.error("stimulus-out directory read", { dir: stimulusRoot, error: groupDirentsResult.error })
		throw errors.wrap(groupDirentsResult.error, "directory read")
	}
    const groupDirs = groupDirentsResult.data
        .filter((d) => d.isDirectory())
        .map((d) => path.join(stimulusRoot, d.name))
        .filter((full) => !EXCLUDED_GROUPS.has(path.basename(full)))
	groupDirs.sort(sortTopGroups)

	for (const groupDir of groupDirs) {
		const pages: Array<{ slug: string; path: string }> = []
		const pageDirentsResult = await errors.try(fs.readdir(groupDir, { withFileTypes: true }))
		if (pageDirentsResult.error) {
			logger.error("group directory read", { dir: groupDir, error: pageDirentsResult.error })
			throw errors.wrap(pageDirentsResult.error, "directory read")
		}
		const pageDirs = pageDirentsResult.data.filter((d) => d.isDirectory()).map((d) => path.join(groupDir, d.name))
		pageDirs.sort(sortLessonDirs)
		for (const pageDir of pageDirs) {
			const stimPath = path.join(pageDir, "stimulus.html")
			const es = await errors.try(fs.stat(stimPath))
			if (es.error || !es.data.isFile()) {
				logger.debug("stimulus missing, skipping page", { file: stimPath, error: es.error })
				continue
			}
			pages.push({ slug: path.basename(pageDir), path: path.join("content", path.relative(stimulusRoot, stimPath)) })
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

async function collectAssessments(): Promise<{ quizzes: Array<z.infer<typeof IndexAssessmentSchema>>; tests: Array<z.infer<typeof IndexAssessmentSchema>> }> {
	const direntsResult = await errors.try(fs.readdir(DATA_DIR, { withFileTypes: true }))
	if (direntsResult.error) {
		logger.error("failed to read data directory", { dir: DATA_DIR, error: direntsResult.error })
		throw errors.wrap(direntsResult.error, "data directory read")
	}
	const entries = direntsResult.data
	const quizzes: Array<z.infer<typeof IndexAssessmentSchema>> = []
	const tests: Array<z.infer<typeof IndexAssessmentSchema>> = []

	for (const de of entries) {
		if (!de.isDirectory()) continue
		const name = de.name
		if (/^quiz-\d+-\d+$/.test(name)) {
			const a = await buildAssessment(path.join(DATA_DIR, name), path.join("quizzes", name))
			quizzes.push(a)
			continue
		}
		if (/^unit-\d+-test$/.test(name)) {
			const a = await buildAssessment(path.join(DATA_DIR, name), path.join("tests", name))
			tests.push(a)
			continue
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

async function buildAssessment(sourceDir: string, destRelBase: string): Promise<z.infer<typeof IndexAssessmentSchema>> {
	const id = path.basename(sourceDir)
	const questions: Array<z.infer<typeof IndexQuestionSchema>> = []
    const direntsResult = await errors.try(fs.readdir(sourceDir, { withFileTypes: true }))
    if (direntsResult.error) {
        logger.error("assessment directory read", { dir: sourceDir, error: direntsResult.error })
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
				jsonExists,
			})
			throw errors.new("question missing required xml or json")
		}
		questions.push({
			number: n,
			xml: path.join(destRelBase, xmlName),
			json: path.join(destRelBase, jsonName),
		})
	}
	return { id, path: destRelBase, questions }
}

async function ensureDir(dir: string): Promise<void> {
	const mk = await errors.try(fs.mkdir(dir, { recursive: true }))
	if (mk.error) {
		logger.error("failed to create directory", { dir, error: mk.error })
		throw errors.wrap(mk.error, "directory creation")
	}
}

async function copyFileStrict(src: string, dest: string): Promise<void> {
	const statRes = await errors.try(fs.stat(src))
	if (statRes.error || !statRes.data.isFile()) {
		logger.error("source file missing", { file: src, error: statRes.error })
		throw errors.new("source file missing")
	}
	await ensureDir(path.dirname(dest))
	const readRes = await errors.try(fs.readFile(src))
	if (readRes.error) {
		logger.error("failed to read source file", { file: src, error: readRes.error })
		throw errors.wrap(readRes.error, "file read")
	}
	const writeRes = await errors.try(fs.writeFile(dest, readRes.data))
	if (writeRes.error) {
		logger.error("failed to write destination file", { file: dest, error: writeRes.error })
		throw errors.wrap(writeRes.error, "file write")
	}
}

async function copyStimulusToPackage(groups: Array<{ group: string; pages: Array<{ slug: string; path: string }> }>): Promise<void> {
	const tasks: Array<() => Promise<void>> = []
	for (const g of groups) {
		for (const p of g.pages) {
			const src = path.join(DATA_DIR, "stimulus-out", g.group, p.slug, "stimulus.html")
			const dest = path.join(OUT_CONTENT_DIR, g.group, p.slug, "stimulus.html")
			tasks.push(() => copyFileStrict(src, dest))
		}
	}
    const results = await runWithConcurrency(tasks, CONCURRENCY_LIMIT)
    const failures = results.filter((r) => r.status === "rejected")
    if (failures.length > 0) {
        logger.error("some stimulus files failed to copy", { failureCount: failures.length })
        throw errors.new("stimulus copy failure")
    }
}

async function copyAssessmentsToPackage(a: { quizzes: Array<z.infer<typeof IndexAssessmentSchema>>; tests: Array<z.infer<typeof IndexAssessmentSchema>> }): Promise<void> {
	const tasks: Array<() => Promise<void>> = []
	for (const q of a.quizzes) {
		for (const entry of q.questions) {
			if (entry.xml) {
				const src = path.join(DATA_DIR, path.basename(q.path), path.basename(entry.xml))
				const dest = path.join(OUT_DIR, entry.xml)
				tasks.push(() => copyFileStrict(src, dest))
			}
			if (entry.json) {
				const src = path.join(DATA_DIR, path.basename(q.path), path.basename(entry.json))
				const dest = path.join(OUT_DIR, entry.json)
				tasks.push(() => copyFileStrict(src, dest))
			}
		}
	}
	for (const t of a.tests) {
		for (const entry of t.questions) {
			if (entry.xml) {
				const src = path.join(DATA_DIR, path.basename(t.path), path.basename(entry.xml))
				const dest = path.join(OUT_DIR, entry.xml)
				tasks.push(() => copyFileStrict(src, dest))
			}
			if (entry.json) {
				const src = path.join(DATA_DIR, path.basename(t.path), path.basename(entry.json))
				const dest = path.join(OUT_DIR, entry.json)
				tasks.push(() => copyFileStrict(src, dest))
			}
		}
	}
    const results = await runWithConcurrency(tasks, CONCURRENCY_LIMIT)
    const failures = results.filter((r) => r.status === "rejected")
    if (failures.length > 0) {
        logger.error("some assessment files failed to copy", { failureCount: failures.length })
        throw errors.new("assessment copy failure")
    }
}


// ----------------------
// Hierarchical Index Construction (Units → Lessons → Resources)
// ----------------------

type ArticleResource = { id: string; type: "article"; path: string }
type QuizResource = {
	id: string
	type: "quiz"
	path: string
	questionCount: number
	questions: Array<z.infer<typeof IndexQuestionSchema>>
}
type LessonRecord = {
	unitId: string
	lessonId: string
	lessonNumber?: number
	title?: string
	resources: Array<ArticleResource | QuizResource>
}
type UnitTestRecord = {
	id: string
	path: string
	questionCount: number
	questions: Array<z.infer<typeof IndexQuestionSchema>>
}
type UnitRecord = {
	unitId: string
	unitNumber?: number
	title?: string
	lessons: LessonRecord[]
	unitTest?: UnitTestRecord
}

function toUnitIdFromGroup(group: string): { unitId: string; unitNum?: number } {
	const m = group.match(/^unit-(\d+)/)
	if (m && m[1]) {
		const n = Number(m[1])
		if (Number.isFinite(n)) return { unitId: `unit-${n}`, unitNum: n }
	}
	// Non-unit groups become their own units with stable ids
	return { unitId: `unit-${group.replace(/[^a-z0-9-]/g, "-")}` }
}

function toLessonId(unitNum: number | undefined, slug: string): { lessonId: string; lessonNumber?: number } {
	const nums = numericTokens(slug)
	if (unitNum !== undefined && nums.length >= 2 && nums[0] === unitNum) {
		const lessonNum = nums[1]
		return { lessonId: `lesson-${unitNum}-${lessonNum}`, lessonNumber: lessonNum }
	}
	return { lessonId: `lesson-${slug.replace(/[^a-z0-9-]/g, "-")}` }
}

function buildHierarchy(
	stimGroups: Array<{ group: string; pages: Array<{ slug: string; path: string }> }>,
	assessments: { quizzes: Array<z.infer<typeof IndexAssessmentSchema>>; tests: Array<z.infer<typeof IndexAssessmentSchema>> }
): UnitRecord[] {
	const unitsMap = new Map<string, UnitRecord>()

	// Seed units and lessons from stimulus (articles)
	for (const g of stimGroups) {
		const { unitId, unitNum } = toUnitIdFromGroup(g.group)
		let unit = unitsMap.get(unitId)
		if (!unit) {
			unit = { unitId, unitNumber: unitNum, title: g.group, lessons: [] }
			unitsMap.set(unitId, unit)
		}
		for (const p of g.pages) {
			const { lessonId, lessonNumber } = toLessonId(unitNum, p.slug)
			let lesson = unit.lessons.find((l) => l.lessonId === lessonId)
			if (!lesson) {
				lesson = { unitId, lessonId, lessonNumber, title: p.slug, resources: [] }
				unit.lessons.push(lesson)
			}
			lesson.resources.push({
				id: `article-${g.group}-${p.slug}`.replace(/[^a-z0-9-]/g, "-"),
				type: "article",
				path: p.path,
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
		let unit = unitsMap.get(unitId)
		if (!unit) {
			unit = { unitId, unitNumber: unitNum, lessons: [] }
			unitsMap.set(unitId, unit)
		}
		let lesson = unit.lessons.find((l) => l.lessonNumber === lessonNum)
		if (!lesson) {
			lesson = {
				unitId,
				lessonId: `lesson-${unitNum}-${lessonNum}`,
				lessonNumber: lessonNum,
				resources: [],
			}
			unit.lessons.push(lesson)
		}
		lesson.resources.push({
			id: q.id,
			type: "quiz",
			path: q.path,
			questionCount: q.questions.length,
			questions: q.questions,
		})
	}

	// Attach unit tests to their units only
	for (const t of assessments.tests) {
		const m = t.id.match(/^unit-(\d+)-test$/)
		if (!m) continue
		const unitNum = Number(m[1])
		const unitId = `unit-${unitNum}`
		let unit = unitsMap.get(unitId)
		if (!unit) {
			unit = { unitId, unitNumber: unitNum, lessons: [] }
			unitsMap.set(unitId, unit)
		}
		unit.unitTest = { id: t.id, path: t.path, questionCount: t.questions.length, questions: t.questions }
	}

	// Sort lessons within units
	for (const u of unitsMap.values()) {
		u.lessons.sort((a, b) => {
			if (a.lessonNumber !== undefined && b.lessonNumber !== undefined) return a.lessonNumber - b.lessonNumber
			if (a.lessonNumber !== undefined) return -1
			if (b.lessonNumber !== undefined) return 1
			return a.lessonId.localeCompare(b.lessonId)
		})
		for (const l of u.lessons) {
			l.resources.sort((r1, r2) => {
				if (r1.type !== r2.type) return r1.type === "article" ? -1 : 1
				return r1.id.localeCompare(r2.id)
			})
		}
	}

    // Sort units: numeric units first by number, then others lexicographically
    let units = Array.from(unitsMap.values())
    // Exclude non-content units entirely by explicit title match only
    units = units.filter((u) => {
    	const baseTitle = u.title
    	if (baseTitle === undefined) return true
    	const key = baseTitle.replace(/^unit-/, "")
    	return !EXCLUDED_GROUPS.has(key)
    })
	units.sort((a, b) => {
		const an = a.unitId.match(/^unit-(\d+)$/)
		const bn = b.unitId.match(/^unit-(\d+)$/)
		if (an && bn) return Number(an[1]) - Number(bn[1])
		if (an && !bn) return -1
		if (!an && bn) return 1
		return a.unitId.localeCompare(b.unitId)
	})
	return units
}

function safeName(name: string): string {
	return name.replace(/[^a-z0-9-]/g, "-")
}

async function writeHierarchy(units: UnitRecord[]): Promise<void> {
	await ensureDir(OUT_UNITS_DIR)
	await ensureDir(OUT_LESSONS_DIR)
	for (const u of units) {
		const unitDirName = safeName(u.unitId)
		const unitLessonsDir = path.join(OUT_LESSONS_DIR, unitDirName)
		await ensureDir(unitLessonsDir)
		// Write lessons
		const lessonRefs: Array<{ id: string; lessonNumber?: number; title?: string; path: string }> = []
		for (const l of u.lessons) {
			const lessonFile = `${safeName(l.lessonId)}.json`
			const lessonPath = path.join(unitLessonsDir, lessonFile)
			const relPath = path.relative(OUT_DIR, lessonPath).split(path.sep).join("/")
			const lessonJson = {
				id: l.lessonId,
				unitId: u.unitId,
				lessonNumber: l.lessonNumber,
				title: l.title,
				resources: l.resources,
			}
			await writeJsonStrict(lessonPath, lessonJson)
			lessonRefs.push({ id: l.lessonId, lessonNumber: l.lessonNumber, title: l.title, path: relPath })
		}
		
		// Compute counts for this unit
		const lessonCount = u.lessons.length
		const resourceCount = u.lessons.reduce((sum, l) => sum + l.resources.length, 0)
		const quizQuestionCount = u.lessons.reduce((sum, l) => {
			const quizResources = l.resources.filter((r) => r.type === "quiz")
			return sum + quizResources.reduce((qsum, qr) => qsum + qr.questionCount, 0)
		}, 0)
		const unitTestQuestionCount = u.unitTest ? u.unitTest.questionCount : 0
		const questionCount = quizQuestionCount + unitTestQuestionCount

		// Write unit json
		const unitFile = `${unitDirName}.json`
		const unitPath = path.join(OUT_UNITS_DIR, unitFile)
		const unitJson = {
			id: u.unitId,
			unitNumber: u.unitNumber,
			title: u.title,
			lessons: lessonRefs,
			unitTest: u.unitTest,
			counts: { lessonCount, resourceCount, questionCount },
		}
		
		// Validate before writing
		validateUnitRecord(u)
		
		await writeJsonStrict(unitPath, unitJson)
	}
	
	// Write top-level index.json with generator info
	const unitRefs = units.map((u) => ({
		id: u.unitId,
		unitNumber: u.unitNumber,
		title: u.title,
		path: path.relative(OUT_DIR, path.join(OUT_UNITS_DIR, `${safeName(u.unitId)}.json`)).split(path.sep).join("/"),
	}))
	
	// Read package.json for generator info
	const pkgJsonPath = path.join(process.cwd(), "package.json")
	const pkgRes = await errors.try(fs.readFile(pkgJsonPath, "utf8"))
	let generator: { name: string; version: string; commit?: string } | undefined
	if (!pkgRes.error) {
		const pkgParsed = errors.trySync(() => JSON.parse(pkgRes.data))
		if (!pkgParsed.error) {
			const pkg = pkgParsed.data
			if (typeof pkg.name === "string" && typeof pkg.version === "string") {
				generator = { name: pkg.name, version: pkg.version }
			}
		}
	}
	
	const index = { version: 1, generatedAt: new Date().toISOString(), generator, units: unitRefs }
	await writeJsonStrict(path.join(OUT_DIR, "index.json"), index)
}

// ----------------------
// Main
// ----------------------

async function main() {
	const dataStat = await errors.try(fs.stat(DATA_DIR))
	if (dataStat.error || !dataStat.data.isDirectory()) {
		logger.error("data directory not found", { dir: DATA_DIR, error: dataStat.error })
		throw errors.new("data directory not found")
	}

	logger.info("collecting stimulus content")
	const contentGroups = await collectStimulus()

	logger.info("collecting assessments")
	const assessments = await collectAssessments()

	logger.info("copying files into package-out")
	await ensureDir(OUT_CONTENT_DIR)
	await ensureDir(OUT_QUIZZES_DIR)
	await ensureDir(OUT_TESTS_DIR)
	await copyStimulusToPackage(contentGroups)
	await copyAssessmentsToPackage(assessments)

	// Build hierarchical Units → Lessons → Resources, and write split JSON files
	const hierarchy = buildHierarchy(contentGroups, assessments)
	await writeHierarchy(hierarchy)

	// Generate and write integrity manifest (must be done AFTER all other files are written)
	logger.info("computing integrity manifest")
	const integrityManifest = await computeIntegrityManifest(OUT_DIR)
	await writeJsonStrict(path.join(OUT_DIR, "integrity.json"), integrityManifest)
	logger.info("integrity manifest written", { fileCount: Object.keys(integrityManifest.files).length })

	// Recompute integrity to include integrity.json itself
	logger.info("recomputing integrity to include integrity.json")
	const finalIntegrityManifest = await computeIntegrityManifest(OUT_DIR)
	await writeJsonStrict(path.join(OUT_DIR, "integrity.json"), finalIntegrityManifest)
	logger.info("final integrity manifest written", {
		fileCount: Object.keys(finalIntegrityManifest.files).length,
	})

	// Create tar.bz2 archive
	logger.info("creating tar.bz2 archive")
	const cartridgePath = path.join(DATA_DIR, "course-cartridge-v1.tar.bz2")
	await createTarBz2(OUT_DIR, cartridgePath)
	logger.info("package export complete", { outDir: OUT_DIR, cartridge: cartridgePath })
}

const result = await errors.try(main())
if (result.error) {
	logger.error("package export failed", { error: result.error })
	process.exit(1)
}


