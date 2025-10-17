#!/usr/bin/env bun

import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { Glob } from "bun"
import OpenAI from "openai"
import { z } from "zod"
import { compile } from "@/compiler/compiler"
import { generateFromEnvelope } from "@/structured/client"
import type {
	AiContextEnvelope,
	PdfPayload,
	RasterImagePayload
} from "@/structured/types"
import { simpleVisualCollection } from "@/widgets/collections/simple-visual"

// Enable debug logging for this script
logger.setDefaultLogLevel(logger.DEBUG)
logger.info("canvas batch generator started with debug logging enabled")

// --- Configuration ---
const ROOT_DIR = "canvas-scrape/English 09, Part 1"
const WIDGET_COLLECTION = simpleVisualCollection
const CONCURRENCY_LIMIT = 250

const BASE_DIR_ARG = process.argv[2]
if (!BASE_DIR_ARG) {
	logger.error("base data directory not provided")
	throw errors.new(
		"base data directory must be provided as first argument (e.g., 'data')"
	)
}
const OUTPUT_DIR = path.resolve(process.cwd(), BASE_DIR_ARG, "quiz-out")
const ROOT = path.resolve(process.cwd(), ROOT_DIR)
// ---

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

	const initialPromises = Array(Math.min(limit, tasks.length))
		.fill(null)
		.map(execute)
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

// ----------------------
// Schemas and Types
// ----------------------

const CanvasOptionSchema = z.object({
	label: z.string().optional(),
	text: z.string().optional()
})

const CanvasBlankSchema = z.object({
	options: z.array(z.string()).optional()
})

const CanvasPairSchema = z.object({
	prompt: z.string(),
	options: z.array(z.string()).optional(),
	answer: z.string().optional()
})

const CanvasQuestionSchema = z.object({
	questionNumber: z.number(),
	questionText: z.string().optional(),
	type: z.string().optional(),
	options: z.array(CanvasOptionSchema).optional(),
	blanks: z.array(CanvasBlankSchema).optional(),
	pairs: z.array(CanvasPairSchema).optional(),
	groupName: z.string().optional(),
	questionId: z.string().optional()
})
export type CanvasQuestion = z.infer<typeof CanvasQuestionSchema>

// Attempted answers schema (answers map contains attempted selections with correctness flags)
const AttemptMatchingPairSchema = z.object({
	prompt: z.string(),
	answer: z.string()
})

const AttemptAnswerBaseSchema = z.object({
	type: z.enum(["multiple-choice", "dropdown", "matching"]),
	reasoning: z.string().optional(),
	correct: z.boolean().optional(),
	state: z.string().optional(),
	grade: z.string().optional()
})

const AttemptAnswerMultipleChoiceSchema = AttemptAnswerBaseSchema.extend({
	type: z.literal("multiple-choice"),
	// Attempt may be label (e.g., "c") or text (e.g., "True") depending on quiz
	answer: z.string().optional()
})

const AttemptAnswerDropdownSchema = AttemptAnswerBaseSchema.extend({
	type: z.literal("dropdown"),
	answers: z.array(z.string()).optional()
})

const AttemptAnswerMatchingSchema = AttemptAnswerBaseSchema.extend({
	type: z.literal("matching"),
	matches: z.array(AttemptMatchingPairSchema).optional()
})

const AttemptAnswerSchema = z.union([
	AttemptAnswerMultipleChoiceSchema,
	AttemptAnswerDropdownSchema,
	AttemptAnswerMatchingSchema
])

type AttemptAnswer = z.infer<typeof AttemptAnswerSchema>

const AnswersMapSchema = z.record(z.string(), AttemptAnswerSchema)

const QuizDataSchema = z.object({
	questions: z.array(CanvasQuestionSchema),
	answers: AnswersMapSchema.optional(),
	timestamp: z.string().optional(),
	cleanedDropdowns: z.boolean().optional()
})
// Type inferred via safeParse usage; no explicit alias needed to avoid unused symbol

const LessonPageDataSchema = z.object({
	mainContent: z
		.object({
			html: z.string().optional()
		})
		.optional()
})

// Image MIME resolver unused after image ingestion removal

/**
 * Escape a string for safe embedding into RegExp.
 */
function escapeForRegExp(input: string): string {
	return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Extracts a quiz number like "1.1" from a directory name e.g. "Quiz 1.1".
 */
function extractQuizNumberFromDirName(dirName: string): string | undefined {
	const match = dirName.match(/\b(\d+\.\d+)\b/)
	return match ? match[1] : undefined
}

/**
 * Extracts a unit number like "1" or "2" from a directory name e.g. "Unit 1 Test".
 */
function extractUnitNumberFromDirName(dirName: string): string | undefined {
	const match = dirName.match(/\bUnit\s+(\d+)\b/i)
	return match ? match[1] : undefined
}

/**
 * Resolves the sibling lesson directories for a given quiz directory.
 * - For regular quizzes (e.g., "Quiz 1.1"), matches the single lesson "1.1 ...".
 * - For unit tests (e.g., "Unit 1 Test"), collects all lessons matching "1.X ...".
 * - For other quizzes (e.g., "MANDATORY QUIZ"), returns empty.
 */
async function resolveLessonDirsForQuiz(
	quizDir: string
): Promise<{
	lessonDirs: string[]
	unitDir?: string
	quizRootDir: string
	quizDirName: string
}> {
	const quizRootDir = path.dirname(quizDir)
	const unitDir = path.dirname(quizRootDir)
	const quizDirName = path.basename(quizRootDir)

	const direntsResult = await errors.try(
		fs.readdir(unitDir, { withFileTypes: true })
	)
	if (direntsResult.error) {
		logger.debug("failed listing unit directory", {
			unitDir,
			error: direntsResult.error
		})
		return { lessonDirs: [], unitDir, quizRootDir, quizDirName }
	}
	const dirents = direntsResult.data

	// Check if this is a unit test (e.g., "Unit 1 Test")
	const unitNum = extractUnitNumberFromDirName(quizDirName)
	if (unitNum) {
		// Collect all lessons matching "N.X ..." for the unit
		const lessonDirs: string[] = []
		const pattern = new RegExp(
			`^${escapeForRegExp(unitNum)}\\.(\\d+)(\\b|\\s|[-:_])`,
			"i"
		)
		for (const d of dirents) {
			if (!d.isDirectory()) continue
			if (pattern.test(d.name)) {
				lessonDirs.push(path.join(unitDir, d.name))
			}
		}
		logger.debug("resolved unit test lessons", {
			quizDirName,
			lessonCount: lessonDirs.length
		})
		return { lessonDirs, unitDir, quizRootDir, quizDirName }
	}

	// Check if this is a regular quiz (e.g., "Quiz 1.1")
	const num = extractQuizNumberFromDirName(quizDirName)
	if (num) {
		const pattern = new RegExp(`^${escapeForRegExp(num)}(\\b|\\s|[-:_])`, "i")
		for (const d of dirents) {
			if (!d.isDirectory()) continue
			if (d.name === quizDirName) continue
			if (pattern.test(d.name)) {
				const candidate = path.join(unitDir, d.name)
				logger.debug("resolved lesson directory for quiz", {
					quizDirName,
					lessonDir: candidate
				})
				return { lessonDirs: [candidate], unitDir, quizRootDir, quizDirName }
			}
		}
		logger.debug("no sibling lesson directory matched quiz number", {
			quizDirName,
			num
		})
		return { lessonDirs: [], unitDir, quizRootDir, quizDirName }
	}

	// No pattern matched (e.g., MANDATORY QUIZ)
	logger.debug("could not extract quiz or unit number from directory name", {
		quizDirName
	})
	return { lessonDirs: [], quizRootDir, quizDirName }
}

// Metadata helper removed; we just JSON.stringify directly

/**
 * Gathers supplementary content for a quiz from its associated lesson directories and metadata.
 * - For regular quizzes: includes single lesson page-data and metadata
 * - For unit tests: includes all unit lessons (e.g., 2.1, 2.2, ..., 2.6 for Unit 2 Test)
 * - Includes unit and quiz metadata
 */
async function gatherSupplementaryContent(quizDir: string): Promise<{
	content: string[]
	lessonDirs: string[]
	unitDir?: string
	quizRootDir: string
	filesIncluded: string[]
}> {
	const content: string[] = []
	const filesIncluded: string[] = []
	const resolved = await resolveLessonDirsForQuiz(quizDir)
	const quizRootDir = resolved.quizRootDir
	const unitDir = resolved.unitDir
	const lessonDirs = resolved.lessonDirs

	for (const lessonDir of lessonDirs) {
		const pageDataPath = path.join(lessonDir, "page-data.json")
		const pageDataResult = await errors.try(Bun.file(pageDataPath).json())
		if (pageDataResult.error) {
			logger.debug("no lesson page-data.json found or unreadable", {
				file: pageDataPath,
				error: pageDataResult.error
			})
		} else {
			const parsed = LessonPageDataSchema.safeParse(pageDataResult.data)
			if (!parsed.success) {
				logger.debug("lesson page-data.json did not match expected schema", {
					file: pageDataPath
				})
			} else {
				if (parsed.data.mainContent?.html) {
					const html = parsed.data.mainContent.html
					if (html.length > 0) {
						content.push(html)
						filesIncluded.push(pageDataPath)
						logger.debug("included lesson page-data.json", {
							file: pageDataPath,
							htmlLength: html.length
						})
					}
				}
			}
		}
		// lesson metadata
		const lessonMetaPath = path.join(lessonDir, "metadata.json")
		const lessonMetaResult = await errors.try(Bun.file(lessonMetaPath).json())
		if (!lessonMetaResult.error) {
			content.push(
				`Lesson metadata:\n${JSON.stringify(lessonMetaResult.data, null, 2)}`
			)
			filesIncluded.push(lessonMetaPath)
			logger.debug("included lesson metadata.json", { file: lessonMetaPath })
		} else {
			logger.debug("no lesson metadata.json found or unreadable", {
				file: lessonMetaPath,
				error: lessonMetaResult.error
			})
		}
	}

	// unit metadata (if available)
	if (unitDir) {
		const unitMetaPath = path.join(unitDir, "metadata.json")
		const unitMetaResult = await errors.try(Bun.file(unitMetaPath).json())
		if (!unitMetaResult.error) {
			content.push(
				`Unit metadata:\n${JSON.stringify(unitMetaResult.data, null, 2)}`
			)
			filesIncluded.push(unitMetaPath)
			logger.debug("included unit metadata.json", { file: unitMetaPath })
		} else {
			logger.debug("no unit metadata.json found or unreadable", {
				file: unitMetaPath,
				error: unitMetaResult.error
			})
		}
	}

	// quiz metadata (quiz folder, one level above _quiz)
	const quizMetaPath = path.join(quizRootDir, "metadata.json")
	const quizMetaResult = await errors.try(Bun.file(quizMetaPath).json())
	if (!quizMetaResult.error) {
		content.push(
			`Quiz metadata:\n${JSON.stringify(quizMetaResult.data, null, 2)}`
		)
		filesIncluded.push(quizMetaPath)
		logger.debug("included quiz metadata.json", { file: quizMetaPath })
	} else {
		logger.debug("no quiz metadata.json found or unreadable", {
			file: quizMetaPath,
			error: quizMetaResult.error
		})
	}

	return { content, lessonDirs, unitDir, quizRootDir, filesIncluded }
}

/**
 * Gathers strictly scoped image payloads for a single question.
 */
/**
 * Gathers raster image payloads from _images directory for a single question.
 */
async function gatherImagePayloads(
	quizDir: string,
	questionNumber: number
): Promise<{ payloads: RasterImagePayload[]; filesIncluded: string[] }> {
	const payloads: RasterImagePayload[] = []
	const filesIncluded: string[] = []
	const imagesDir = path.join(quizDir, "_images")

	const statResult = await errors.try(fs.stat(imagesDir))
	if (!statResult.error && statResult.data.isDirectory()) {
		const glob = new Glob(`q${questionNumber}-*.png`)
		for await (const fileName of glob.scan(imagesDir)) {
			const filePath = path.join(imagesDir, fileName)
			const file = Bun.file(filePath)
			if (!(await file.exists())) {
				logger.debug("image not found, skipping", { file: filePath })
				continue
			}
			const dataResult = await errors.try(file.arrayBuffer())
			if (dataResult.error) {
				logger.warn("failed to read image file", {
					file: filePath,
					error: dataResult.error
				})
				continue
			}
			if (dataResult.data) {
				let mimeType: "image/png" | "image/jpeg" | "image/webp" | "image/gif"
				switch (file.type) {
					case "image/png":
						mimeType = "image/png"
						break
					case "image/jpeg":
						mimeType = "image/jpeg"
						break
					case "image/webp":
						mimeType = "image/webp"
						break
					case "image/gif":
						mimeType = "image/gif"
						break
					default:
						mimeType = "image/png"
				}
				payloads.push({ data: dataResult.data, mimeType })
				filesIncluded.push(filePath)
				logger.debug("included image from _images", {
					file: filePath,
					mimeType,
					byteLength: dataResult.data.byteLength
				})
			}
		}
	} else {
		logger.debug("_images directory not found, skipping image ingestion", {
			dir: imagesDir
		})
	}

	return { payloads, filesIncluded }
}

/**
 * Deterministically discovers and loads referenced PDF reading passages.
 */
async function discoverAndLoadPdfs(
	question: CanvasQuestion,
	supplementaryContent: string[],
	resourceBaseDirs: string[]
): Promise<PdfPayload[]> {
	const normalize = (s: string) =>
		s
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, " ")
			.replace(/\s+/g, " ")
			.trim()

	const textNormalized = normalize(
		[JSON.stringify(question), ...supplementaryContent].join(" ")
	)

	// Discover PDFs at runtime from the actual scraped data in provided base dirs
	const candidates: Array<{ path: string; name: string; phrase: string }> = []
	for (const baseDir of resourceBaseDirs) {
		const resourceDir = path.join(baseDir, "_resources")
		const statResult = await errors.try(fs.stat(resourceDir))
		if (statResult.error || !statResult.data.isDirectory()) {
			logger.debug("resources directory not found, skipping", {
				dir: resourceDir
			})
			continue
		}
		const pdfGlob = new Glob(path.join(resourceDir, "*.pdf"))
		for await (const pdfPath of pdfGlob.scan(".")) {
			const name = path.basename(pdfPath)
			const base = name.replace(/\.pdf$/i, "")
			// Derive a normalized phrase from filename: drop non-alphanumerics and standalone digits
			const phraseTokens = normalize(base)
				.split(" ")
				.filter((t) => t.length > 0 && !/^\d+$/.test(t))
			const phrase = phraseTokens.join(" ")
			if (phrase.length === 0) continue
			candidates.push({ path: pdfPath, name, phrase })
		}
	}

	logger.debug("discovered pdf candidates", {
		candidateCount: candidates.length,
		candidates: candidates.map((c) => ({ name: c.name, phrase: c.phrase }))
	})

	const matched: Array<{ path: string; name: string }> = []
	for (const c of candidates) {
		// Simple, deterministic containment check against question + lesson text
		if (c.phrase.length >= 6 && textNormalized.includes(c.phrase)) {
			matched.push({ path: c.path, name: c.name })
			logger.debug("pdf matched via phrase containment", {
				name: c.name,
				phrase: c.phrase
			})
		}
	}

	logger.debug("pdf matching complete", {
		matchedCount: matched.length,
		matchedNames: matched.map((m) => m.name)
	})

	if (matched.length === 0) return []

	const payloads: PdfPayload[] = []
	for (const m of matched) {
		const file = Bun.file(m.path)
		if (!(await file.exists())) {
			logger.error(
				"referenced pdf not found on disk, this is a critical invariant",
				{
					file: m.path
				}
			)
			throw errors.new("referenced pdf not found")
		}
		const dataResult = await errors.try(file.arrayBuffer())
		if (dataResult.error) {
			logger.error("failed to read pdf file", {
				file: m.path,
				error: dataResult.error
			})
			throw errors.wrap(dataResult.error, "pdf file read")
		}
		if (dataResult.data) {
			// Preserve original filename exactly
			payloads.push({ name: m.name, data: dataResult.data })
			logger.debug("loaded pdf file", {
				name: m.name,
				byteLength: dataResult.data.byteLength
			})
		}
	}
	logger.info("pdf loading complete", {
		pdfCount: payloads.length,
		pdfNames: payloads.map((p) => p.name)
	})
	return payloads
}

/**
 * Processes a single question, creating its QTI files.
 */
async function processQuestion(
	question: CanvasQuestion,
	assessmentDirs: { quizDir: string; outputDir: string },
	openai: OpenAI,
	answersMap?: Record<string, AttemptAnswer>
): Promise<void> {
	const questionNumber = question.questionNumber
	const questionNumberStr = String(questionNumber).padStart(2, "0")
	const kebabCaseName = path.basename(assessmentDirs.outputDir)
	const questionId = `${kebabCaseName}-q${questionNumberStr}`
	logger.info("processing question", {
		assessmentName: kebabCaseName,
		questionNumber: questionNumberStr
	})

	const primaryContent = JSON.stringify(question, null, 2)
	const gathered = await gatherSupplementaryContent(assessmentDirs.quizDir)
	let supplementaryContent = gathered.content

	logger.info("gathered supplementary content for question", {
		questionId,
		lessonDirsCount: gathered.lessonDirs.length,
		lessonDirs: gathered.lessonDirs.map((d) => path.basename(d)),
		filesIncluded: gathered.filesIncluded
	})

	// Attach attempted answer context (do not assume correctness; only report attempt + flag)
	const questionKey = String(questionNumber)
	const attempt = answersMap ? answersMap[questionKey] : undefined
	if (attempt) {
		// Build a concise, deterministic summary string for the attempt
		const attemptLines: string[] = []
		let correctFlag = "unknown"
		if (attempt.correct === true) correctFlag = "true"
		else if (attempt.correct === false) correctFlag = "false"
		attemptLines.push(`Attempt: type=${attempt.type} correct=${correctFlag}`)

		if (attempt.type === "multiple-choice") {
			const raw = attempt.answer
			// Try to resolve label -> text if possible
			let resolvedText: string | undefined
			if (raw && question.options && question.options.length > 0) {
				const byLabel = question.options.find(
					(opt) => opt.label && opt.label === raw
				)
				const byText = question.options.find(
					(opt) => opt.text && opt.text === raw
				)
				if (byLabel && typeof byLabel.text === "string") {
					resolvedText = byLabel.text
				} else if (byText && typeof byText.text === "string") {
					resolvedText = byText.text
				}
			}
			let selectedRendered = ""
			if (typeof raw === "string" && raw.length > 0) {
				selectedRendered = `${raw}${resolvedText ? ` -> ${resolvedText}` : ""}`
			} else {
				selectedRendered = "(no selection provided)"
			}
			attemptLines.push(`Selected: ${selectedRendered}`)
		} else if (attempt.type === "dropdown") {
			const raws = attempt.answers
			attemptLines.push(
				`Selected: ${raws && raws.length > 0 ? JSON.stringify(raws) : "[]"}`
			)
		} else if (attempt.type === "matching") {
			const pairs = attempt.matches
			if (pairs && pairs.length > 0) {
				const joined = pairs
					.map((p) => `${p.prompt} => ${p.answer}`)
					.join(" | ")
				attemptLines.push(`Selected: ${joined}`)
			} else {
				attemptLines.push("Selected: []")
			}
		}
		if (attempt.reasoning && attempt.reasoning.trim().length > 0) {
			attemptLines.push(`Reasoning: ${attempt.reasoning}`)
		}
		// Append semantics guidance so the model interprets attempts correctly
		const semanticsGuidance = [
			"Attempt semantics:",
			"- The 'answer' / 'answers' fields shown here are the learner's attempted selection(s), not authoritative ground truth.",
			"- The 'correct' boolean indicates whether that attempt is correct.",
			"- If correct is false, DO NOT choose the attempted selection(s). Determine the correct option(s)/mapping(s) from the question text and options.",
			"- If correct is true, the attempted selection is known correct.",
			"- For dropdowns, the 'answers' array is in blank order; for matching, 'matches' pairs reflect attempted prompt -> option mappings.",
			"",
			"CONCRETE EXAMPLES:",
			"",
			"Example 1 - WRONG attempt (correct=false):",
			"Question: Which type of panels are below? Options: a) montage, b) image specific, c) word specific",
			"Attempt: type=multiple-choice correct=false",
			"Selected: a -> montage",
			"❌ WRONG: Do NOT select 'a' or 'montage' as your answer.",
			"✅ CORRECT: Analyze the question and determine the actual correct answer is 'b' or 'c'.",
			"",
			"Example 2 - CORRECT attempt (correct=true):",
			"Question: Comics are sequential art. Options: a) sequential, b) dramatic",
			"Attempt: type=dropdown correct=true",
			'Selected: ["sequential", "vessel (container)"]',
			"✅ CORRECT: Use these attempted selections as your answer keys; they are known correct.",
			"",
			"Example 3 - WRONG matching (correct=false):",
			"Attempt: type=matching correct=false",
			"Selected: Prompt A => Wrong Option | Prompt B => Wrong Option",
			"❌ WRONG: Do NOT use these mappings.",
			"✅ CORRECT: Re-map each prompt to the correct option from the available choices."
		].join("\n")
		supplementaryContent.push(
			[attemptLines.join("\n"), semanticsGuidance].join("\n\n")
		)
		logger.debug("included quiz-data attempt context", {
			questionId,
			correct: attempt.correct === true,
			type: attempt.type
		})
	}

	const imageGatherResult = await gatherImagePayloads(
		assessmentDirs.quizDir,
		questionNumber
	)
	const multimodalImagePayloads = imageGatherResult.payloads

	// Unit 1 Test fallback: if this question is a stub (added due to missing quiz-data.json entry),
	// require the presence of _quiz/question-<N>.png and attach it. Hard-fail the entire run if missing.
	const isUnit1TestAssessment = kebabCaseName === "unit-1-test"
	const isFallbackStub =
		!question.type &&
		!question.questionText &&
		(!question.options || question.options.length === 0) &&
		(!question.blanks || question.blanks.length === 0) &&
		(!question.pairs || question.pairs.length === 0)

	if (isUnit1TestAssessment && isFallbackStub) {
		const fallbackPng = path.join(
			assessmentDirs.quizDir,
			`question-${questionNumber}.png`
		)
		const pngFile = Bun.file(fallbackPng)
		if (!(await pngFile.exists())) {
			logger.error("unit 1 test fallback screenshot missing", {
				questionId,
				file: fallbackPng
			})
			throw errors.new("unit 1 test fallback screenshot missing")
		}
		const pngDataResult = await errors.try(pngFile.arrayBuffer())
		if (pngDataResult.error) {
			logger.error("unit 1 test fallback screenshot unreadable", {
				questionId,
				file: fallbackPng,
				error: pngDataResult.error
			})
			throw errors.wrap(
				pngDataResult.error,
				"unit 1 test fallback screenshot read"
			)
		}
		let mimeType: "image/png" | "image/jpeg" | "image/webp" | "image/gif"
		switch (pngFile.type) {
			case "image/png":
				mimeType = "image/png"
				break
			case "image/jpeg":
				mimeType = "image/jpeg"
				break
			case "image/webp":
				mimeType = "image/webp"
				break
			case "image/gif":
				mimeType = "image/gif"
				break
			default:
				mimeType = "image/png"
		}
		multimodalImagePayloads.push({ data: pngDataResult.data, mimeType })
		logger.info("included unit 1 test fallback screenshot", {
			questionId,
			file: fallbackPng
		})
	}
	if (imageGatherResult.filesIncluded.length > 0) {
		logger.info("included images from _images directory", {
			questionId,
			imageCount: imageGatherResult.payloads.length,
			imageFiles: imageGatherResult.filesIncluded
		})
	}

	const pdfSearchDirs: string[] = [...gathered.lessonDirs, gathered.quizRootDir]
	logger.debug("searching for pdfs in directories", {
		questionId,
		pdfSearchDirs
	})
	const pdfPayloadsResult = await errors.try(
		discoverAndLoadPdfs(question, supplementaryContent, pdfSearchDirs)
	)
	if (pdfPayloadsResult.error) {
		logger.error(
			"failed to process pdfs for question, stopping this question",
			{
				questionId,
				error: pdfPayloadsResult.error
			}
		)
		return
	}
	const pdfPayloads = pdfPayloadsResult.data

	logger.info("prepared ai context for question", {
		questionId,
		primaryContentLength: primaryContent.length,
		supplementaryContentCount: supplementaryContent.length,
		imagePayloadCount: multimodalImagePayloads.length,
		pdfPayloadCount: pdfPayloads.length,
		pdfNames: pdfPayloads.map((p) => p.name),
		filesIncluded: [
			...gathered.filesIncluded,
			...imageGatherResult.filesIncluded
		]
	})

	const envelope: AiContextEnvelope = {
		primaryContent,
		supplementaryContent,
		multimodalImageUrls: [],
		multimodalImagePayloads,
		pdfPayloads
	}

	const structuredResult = await errors.try(
		generateFromEnvelope(openai, logger, envelope, WIDGET_COLLECTION)
	)
	if (structuredResult.error) {
		if (
			structuredResult.error instanceof Error &&
			"status" in structuredResult.error &&
			structuredResult.error.status === 400
		) {
			const totalBytes = multimodalImagePayloads.reduce(
				(sum, p) => sum + p.data.byteLength,
				0
			)
			logger.error(
				"provider rejected payload (400), failing fast for this question",
				{
					questionId,
					error: structuredResult.error,
					diagnostics: {
						imageCount: multimodalImagePayloads.length,
						pdfCount: pdfPayloads.length,
						totalBytes
					}
				}
			)
			return
		}
		logger.error("failed to generate structured item", {
			questionId,
			error: structuredResult.error
		})
		return
	}
	const structuredItem = structuredResult.data

	const jsonPath = path.join(
		assessmentDirs.outputDir,
		`question-${questionNumberStr}-structured.json`
	)
	const writeJsonResult = await errors.try(
		Bun.write(jsonPath, JSON.stringify(structuredItem, null, 2))
	)
	if (writeJsonResult.error) {
		logger.error("failed to write structured json", {
			file: jsonPath,
			error: writeJsonResult.error
		})
		return
	}

	const compileResult = await errors.try(
		compile(structuredItem, WIDGET_COLLECTION)
	)
	if (compileResult.error) {
		logger.error("failed to compile qti xml", {
			questionId,
			error: compileResult.error
		})
		return
	}

	const xmlPath = path.join(
		assessmentDirs.outputDir,
		`question-${questionNumberStr}.xml`
	)
	const writeXmlResult = await errors.try(
		Bun.write(xmlPath, compileResult.data)
	)
	if (writeXmlResult.error) {
		logger.error("failed to write compiled xml", {
			file: xmlPath,
			error: writeXmlResult.error
		})
	}
}

/**
 * Processes a single assessment directory.
 */
async function processAssessmentDir(
	dir: string,
	openai: OpenAI
): Promise<void> {
	const assessmentName = path.basename(dir)

	// Skip MANDATORY QUIZ (course rules, not actual content)
	if (assessmentName.toLowerCase().includes("mandatory")) {
		logger.info("skipping mandatory quiz (not content-related)", {
			assessmentName
		})
		return
	}

	const quizDir = path.join(dir, "_quiz")
	const assessmentOutputDir = path.join(OUTPUT_DIR, toKebabCase(assessmentName))

	logger.info("processing assessment directory", { assessmentName })

	const quizDataPath = path.join(quizDir, "quiz-data.json")
	const quizDataJsonResult = await errors.try(fs.readFile(quizDataPath, "utf8"))
	if (quizDataJsonResult.error) {
		logger.warn("quiz-data.json not found, skipping assessment", {
			assessmentName,
			error: quizDataJsonResult.error
		})
		return
	}

	const quizDataUnknown = errors.trySync(() =>
		JSON.parse(quizDataJsonResult.data)
	)
	if (quizDataUnknown.error) {
		logger.warn("failed to parse quiz-data.json, skipping", {
			assessmentName,
			error: quizDataUnknown.error
		})
		return
	}
	const quizDataParsed = QuizDataSchema.safeParse(quizDataUnknown.data)
	if (!quizDataParsed.success) {
		logger.warn("quiz-data.json did not match expected schema, skipping", {
			assessmentName
		})
		return
	}

	await fs.mkdir(assessmentOutputDir, { recursive: true })

	const sortedQuestions = quizDataParsed.data.questions.sort(
		(a, b) => a.questionNumber - b.questionNumber
	)

	// Special-case: Only for Unit 1 Test, supplement missing questions from per-question screenshots
	let allQuestions: CanvasQuestion[] = [...sortedQuestions]
	if (assessmentName === "Unit 1 Test") {
		const existingNumbers = new Set<number>(
			allQuestions.map((q) => q.questionNumber)
		)
		const dirEntriesResult = await errors.try(
			fs.readdir(quizDir, { withFileTypes: true })
		)
		if (dirEntriesResult.error) {
			logger.debug("failed reading quiz directory for fallback discovery", {
				dir: quizDir,
				error: dirEntriesResult.error
			})
		} else {
			const imageQuestionNumbers: number[] = []
			const re = /^question-(\d+)\.png$/
			for (const de of dirEntriesResult.data) {
				if (!de.isFile()) continue
				const m = de.name.match(re)
				if (m?.[1]) {
					const n = Number(m[1])
					if (Number.isFinite(n)) imageQuestionNumbers.push(n)
				}
			}
			const missing = imageQuestionNumbers
				.filter((n) => !existingNumbers.has(n))
				.sort((a, b) => a - b)
			if (missing.length > 0) {
				logger.info("using screenshot fallback for missing questions", {
					assessmentName,
					missingCount: missing.length,
					questionNumbers: missing
				})
				const fallbackQuestions: CanvasQuestion[] = missing.map((n) => ({
					questionNumber: n
				}))
				allQuestions = [...allQuestions, ...fallbackQuestions].sort(
					(a, b) => a.questionNumber - b.questionNumber
				)
			}
		}
	}

	const questionTasks = allQuestions.map(
		(q: CanvasQuestion) => () =>
			processQuestion(
				q,
				{ quizDir, outputDir: assessmentOutputDir },
				openai,
				// For Unit 1 Test fallback stubs (no JSON), there is no authoritative answer.
				// We pass through the existing answers map (may be undefined or only partial) as-is.
				quizDataParsed.data.answers
			)
	)

	const questionResults = await runWithConcurrency(
		questionTasks,
		CONCURRENCY_LIMIT
	)
	const questionFailures = questionResults.filter(
		(r): r is PromiseRejectedResult => r.status === "rejected"
	)
	if (questionFailures.length > 0) {
		// If any question in Unit 1 Test failed due to missing fallback screenshot, hard-fail this assessment.
		const unit1FallbackFailure =
			assessmentName === "Unit 1 Test" &&
			questionFailures.some((f) =>
				String(f.reason).includes("unit 1 test fallback screenshot missing")
			)
		if (unit1FallbackFailure) {
			logger.error("unit 1 test: aborting due to missing fallback screenshot", {
				failureCount: questionFailures.length
			})
			throw errors.new("unit 1 test fallback screenshot missing")
		}
	}
}

/**
 * Main orchestration function.
 */
async function main() {
	if (!process.env.OPENAI_API_KEY) {
		logger.error("OPENAI_API_KEY environment variable not set")
		throw errors.new("OPENAI_API_KEY is not set")
	}

	const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
	const assessmentDirs = new Set<string>()

	// Use fs.readdir recursively to find _quiz directories (Glob has issues with spaces in paths)
	const findQuizDirs = async (dir: string): Promise<string[]> => {
		const results: string[] = []
		const direntsResult = await errors.try(
			fs.readdir(dir, { withFileTypes: true })
		)
		if (direntsResult.error) {
			logger.debug("failed reading directory", {
				dir,
				error: direntsResult.error
			})
			return results
		}
		for (const dirent of direntsResult.data) {
			if (!dirent.isDirectory()) continue
			const fullPath = path.join(dir, dirent.name)
			if (dirent.name === "_quiz") {
				results.push(fullPath)
			} else {
				const nested = await findQuizDirs(fullPath)
				results.push(...nested)
			}
		}
		return results
	}

	const quizDirs = await findQuizDirs(ROOT)
	for (const quizDir of quizDirs) {
		assessmentDirs.add(path.dirname(quizDir))
	}

	const assessmentDirList = Array.from(assessmentDirs).sort()
	logger.info("starting canvas batch generation", {
		count: assessmentDirList.length,
		collection: WIDGET_COLLECTION.name,
		concurrency: CONCURRENCY_LIMIT
	})

	const tasks = assessmentDirList.map(
		(dir) => () => processAssessmentDir(dir, openai)
	)
	const results = await runWithConcurrency(tasks, CONCURRENCY_LIMIT)

	const failures = results.filter(
		(r): r is PromiseRejectedResult => r.status === "rejected"
	)
	if (failures.length > 0) {
		logger.error("some assessment directories failed to process", {
			failureCount: failures.length,
			reasons: failures.map((f) => f.reason)
		})
		// Hard fail the entire script if any failure indicates the unit 1 test fallback condition
		const hardFail = failures.some((f) =>
			String(f.reason).includes("unit 1 test fallback screenshot missing")
		)
		if (hardFail) {
			logger.error("unit 1 test: hard fail due to missing fallback screenshot")
			throw errors.new("unit 1 test fallback screenshot missing")
		}
	}

	logger.info("batch generation complete", {
		total: assessmentDirList.length,
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
