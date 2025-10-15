import { createHash } from "node:crypto"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import { PassThrough } from "node:stream"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import tar from "tar-stream"
import { z } from "zod"
import { IndexV1Schema, IntegritySchema, LessonSchema, QuestionRefSchema, UnitSchema } from "@/cartridge/schema"

export type GeneratorInfo = { name: string; version: string; commit?: string }

// Runtime schemas for strict validation (no extra fields allowed)
const GeneratorInfoSchema = z.object({ name: z.string(), version: z.string(), commit: z.string().optional() }).strict()

const UnitTestSchema = z
	.object({
		id: z.string(),
		path: z.string(),
		questionCount: z.number(),
		questions: z.array(QuestionRefSchema)
	})
	.strict()

const NumericUnitId = z.string().regex(/^unit-\d+$/)
const NonNumericUnitId = z
	.string()
	.refine((v) => !/^unit-\d+$/.test(v), { message: "non-numeric unit id must not match unit-<n>" })

const BuildUnitNumericSchema = z
	.object({
		id: NumericUnitId,
		unitNumber: z.number(),
		title: z.string().optional(),
		lessons: z.array(LessonSchema),
		unitTest: UnitTestSchema.optional()
	})
	.strict()

const BuildUnitNonNumericSchema = z
	.object({
		id: NonNumericUnitId,
		title: z.string().optional(),
		lessons: z.array(LessonSchema),
		unitTest: UnitTestSchema.optional()
	})
	.strict()

export const BuildUnitSchema = z.union([BuildUnitNumericSchema, BuildUnitNonNumericSchema])
export type BuildUnit = z.infer<typeof BuildUnitSchema>

const CartridgePathSchema = z
	.string()
	.refine((p) => !p.startsWith("/") && !p.includes("\\"), { message: "paths must be POSIX relative" })

export const CartridgeBuildInputSchema = z
	.object({
		generator: GeneratorInfoSchema,
		units: z.array(BuildUnitSchema).min(1),
		files: z.record(CartridgePathSchema, z.instanceof(Uint8Array))
	})
	.strict()

export type CartridgeBuildInput = {
	generator: GeneratorInfo
	units: BuildUnit[]
	files: Record<string, Uint8Array<ArrayBufferLike>>
}

function stringifyJson(data: unknown): string {
	return `${JSON.stringify(data, null, 2)}\n`
}

function computeIntegrity(files: Record<string, Uint8Array | string>): z.infer<typeof IntegritySchema> {
	const out: Record<string, { size: number; sha256: string }> = {}
	for (const [p, v] of Object.entries(files)) {
		const bytes = typeof v === "string" ? new TextEncoder().encode(v) : v
		const hash = createHash("sha256").update(bytes).digest("hex")
		out[p] = { size: bytes.byteLength, sha256: hash }
	}
	return { algorithm: "sha256", files: out }
}

function assert(condition: boolean, msg: string): void {
	if (!condition) {
		logger.error("assertion failed", { message: msg })
		throw errors.new(msg)
	}
}

export async function buildCartridgeToBytes(input: CartridgeBuildInput): Promise<Uint8Array> {
	// Validate full input strictly
	const inputValidation = CartridgeBuildInputSchema.safeParse(input)
	if (!inputValidation.success) {
		logger.error("cartridge build input invalid", { error: inputValidation.error })
		throw errors.wrap(inputValidation.error, "cartridge build input validation")
	}
	const validated = inputValidation.data

	// Cross-check files coverage
	const requiredPaths = new Set<string>()
	for (const u of validated.units) {
		for (const l of u.lessons) {
			for (const r of l.resources) {
				if (r.type === "article") requiredPaths.add(r.path)
				if (r.type === "quiz") {
					for (const q of r.questions) {
						requiredPaths.add(q.xml)
						requiredPaths.add(q.json)
					}
				}
			}
		}
		if (u.unitTest) {
			for (const q of u.unitTest.questions) {
				requiredPaths.add(q.xml)
				requiredPaths.add(q.json)
			}
		}
	}
	for (const p of requiredPaths) {
		assert(p in validated.files, `missing file payload: ${p}`)
	}
	// No extras: every provided file must be referenced
	const extras = Object.keys(validated.files).filter((p) => !requiredPaths.has(p))
	if (extras.length > 0) {
		logger.error("unexpected file inputs", { count: extras.length, extras })
		throw errors.new("unexpected file inputs")
	}

	// Build JSON files
	const files: Record<string, Uint8Array | string> = {}

	// Lessons
	for (const u of validated.units) {
		for (const l of u.lessons) {
			const lessonJson = {
				id: l.id,
				unitId: l.unitId,
				lessonNumber: l.lessonNumber,
				title: l.title,
				resources: l.resources
			}
			const lessonPath = `lessons/${u.id}/${l.id}.json`
			const lv = LessonSchema.safeParse(lessonJson)
			if (!lv.success) {
				logger.error("lesson schema invalid", { unitId: u.id, lessonId: l.id, error: lv.error })
				throw errors.wrap(lv.error, "lesson schema validation")
			}
			files[lessonPath] = stringifyJson(lv.data)
		}
	}

	// Units
	for (const u of validated.units) {
		const lessonRefs = u.lessons.map((l) => ({
			id: l.id,
			lessonNumber: l.lessonNumber,
			title: l.title,
			path: `lessons/${u.id}/${l.id}.json`
		}))
		const lessonCount = u.lessons.length
		const resourceCount = u.lessons.reduce((sum, l) => sum + l.resources.length, 0)
		const quizQuestionCount = u.lessons.reduce((sum, l) => {
			let lessonQuizQuestions = 0
			for (const r of l.resources) {
				if (r.type === "quiz") {
					lessonQuizQuestions += r.questionCount
				}
			}
			return sum + lessonQuizQuestions
		}, 0)
		const unitTestQuestionCount = u.unitTest ? u.unitTest.questionCount : 0
		const counts = { lessonCount, resourceCount, questionCount: quizQuestionCount + unitTestQuestionCount }

		const unitJson = {
			id: u.id,
			unitNumber: "unitNumber" in u ? u.unitNumber : undefined,
			title: u.title,
			lessons: lessonRefs,
			unitTest: u.unitTest,
			counts
		}
		const uv = UnitSchema.safeParse(unitJson)
		if (!uv.success) {
			logger.error("unit schema invalid", { unitId: u.id, error: uv.error })
			throw errors.wrap(uv.error, "unit schema validation")
		}
		files[`units/${u.id}.json`] = stringifyJson(uv.data)
	}

	// Index
	const index = {
		version: 1 as const,
		generatedAt: new Date().toISOString(),
		generator: validated.generator,
		units: validated.units.map((u) => ({
			id: u.id,
			unitNumber: "unitNumber" in u ? u.unitNumber : undefined,
			title: u.title,
			path: `units/${u.id}.json`
		}))
	}
	const iv = IndexV1Schema.safeParse(index)
	if (!iv.success) {
		logger.error("index schema invalid", { error: iv.error })
		throw errors.wrap(iv.error, "index schema validation")
	}
	files["index.json"] = stringifyJson(iv.data)

	// Attach content files
	for (const [p, bytes] of Object.entries(input.files)) {
		files[p] = bytes
	}

	// Integrity
	const integrity = computeIntegrity(files)
	const integV = IntegritySchema.safeParse(integrity)
	if (!integV.success) {
		logger.error("integrity schema invalid", { error: integV.error })
		throw errors.wrap(integV.error, "integrity schema validation")
	}
	files["integrity.json"] = stringifyJson(integV.data)

	// Pack tar in-memory
	const pack = tar.pack()
	const chunks: Buffer[] = []
	const sink = new PassThrough()
	sink.on("data", (c) => chunks.push(Buffer.from(c)))

	// Write entries
	for (const [p, v] of Object.entries(files)) {
		const content = typeof v === "string" ? Buffer.from(v, "utf8") : Buffer.from(v)
		await new Promise<void>((resolve, reject) => {
			pack.entry({ name: p, size: content.length, type: "file" }, content, (err) => {
				if (err) return reject(errors.wrap(err, "tar entry"))
				resolve()
			})
		})
	}
	pack.finalize()

	// Compress with bzip2 via Bun.spawn (no temp files on success path)
	const tarBytes = await new Promise<Uint8Array>((resolve, reject) => {
		const bufs: Buffer[] = []
		pack.on("data", (c) => bufs.push(Buffer.from(c)))
		pack.on("end", () => resolve(Buffer.concat(bufs)))
		pack.on("error", (err) => reject(errors.wrap(err, "tar finalize")))
	})

	const proc = Bun.spawn({ cmd: ["bzip2", "-c"], stdin: "pipe", stdout: "pipe", stderr: "pipe" })
	// Write tar to stdin
	await proc.stdin.write(tarBytes)
	proc.stdin.end()
	const waited = await errors.try(proc.exited)
	if (waited.error || proc.exitCode !== 0) {
		const stderrText = await new Response(proc.stderr).text()
		logger.error("bzip2 compression failed", { exitCode: proc.exitCode, stderr: stderrText })
		throw errors.new("bzip2 compression failure")
	}
	const bz2 = new Uint8Array(await new Response(proc.stdout).arrayBuffer())
	return bz2
}

export async function buildCartridgeToFile(input: CartridgeBuildInput, outFile: string): Promise<void> {
	const bytes = await buildCartridgeToBytes(input)
	const dir = path.dirname(outFile)
	const mk = await errors.try(fs.mkdir(dir, { recursive: true }))
	if (mk.error) {
		logger.error("directory creation", { dir, error: mk.error })
		throw errors.wrap(mk.error, "directory creation")
	}
	const wr = await errors.try(fs.writeFile(outFile, bytes))
	if (wr.error) {
		logger.error("file write", { file: outFile, error: wr.error })
		throw errors.wrap(wr.error, "file write")
	}
}
