import { existsSync, rmSync } from "node:fs"
import { mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import * as path from "node:path"
import { pathToFileURL } from "node:url"
import * as errors from "@superbuilders/errors"
import { and, eq } from "drizzle-orm"
import type { Logger } from "inngest"
import { db } from "../../../db/client"
import {
	templateCandidateExecutions,
	templateCandidates
} from "../../../db/schema"
import { inngest } from "../../client"

type CandidateRecord = {
	id: string
	templateId: string
	source: string
	validatedAt: Date | null
}

type ModuleWithDefault = { default: unknown }

const ALIAS_EXTENSIONS = [
	"",
	".ts",
	".tsx",
	".mts",
	".cts",
	".js",
	".mjs",
	".cjs",
	".json"
]
const ALIAS_IMPORT_REGEX = /(['"`])@\/([^'"`]+)\1/g
const RAW_ALIAS_TARGETS = [
	path.resolve(process.cwd(), "../lib/src"),
	path.resolve(process.cwd(), "packages/lib/src"),
	path.resolve(process.cwd(), "../../packages/lib/src")
]
const SLASH_ALIAS_TARGETS = RAW_ALIAS_TARGETS.filter(
	(candidate, index, array) =>
		existsSync(candidate) && array.indexOf(candidate) === index
)

function hasDefaultExport(value: unknown): value is ModuleWithDefault {
	return typeof value === "object" && value !== null && "default" in value
}

async function fetchCandidateRecord(
	templateCandidateId: string
): Promise<CandidateRecord | null> {
	const rows = await db
		.select({
			id: templateCandidates.id,
			templateId: templateCandidates.templateId,
			source: templateCandidates.source,
			validatedAt: templateCandidates.validatedAt
		})
		.from(templateCandidates)
		.where(eq(templateCandidates.id, templateCandidateId))
		.limit(1)

	return rows[0] ?? null
}

async function persistExecution(
	templateCandidateId: string,
	seed: bigint,
	body: unknown
) {
	return db
		.insert(templateCandidateExecutions)
		.values({
			templateCandidateId,
			seed,
			body
		})
		.onConflictDoUpdate({
			target: [
				templateCandidateExecutions.templateCandidateId,
				templateCandidateExecutions.seed
			],
			set: { body }
		})
		.returning({ id: templateCandidateExecutions.id })
}

function disposeStack(
	logger: Logger,
	templateCandidateId: string,
	stack: DisposableStack,
	context: "failure" | "success"
) {
	const disposalResult = errors.trySync(() => stack.dispose())
	if (disposalResult.error) {
		logger.error("template candidate cleanup failed", {
			templateCandidateId,
			context,
			error: disposalResult.error
		})
		throw errors.wrap(disposalResult.error, "template candidate cleanup")
	}
}

export const executeTemplateCandidate = inngest.createFunction(
	{
		id: "template-candidate-execution",
		name: "Template Candidate Execution",
		idempotency: "event",
		concurrency: [
			{ scope: "fn", key: "event.data.templateCandidateId", limit: 1 }
		]
	},
	{ event: "template/candidate.execution.requested" },
	async ({ event, step, logger }) => {
		const { templateCandidateId, seed } = event.data
		logger.info("template candidate execution requested", {
			templateCandidateId,
			seed
		})

		const cleanupStack = new DisposableStack()

		const fail = async (
			reason: string,
			extra?: Record<string, unknown>
		): Promise<{ status: "failed"; reason: string }> => {
			logger.error("template candidate execution failed", {
				templateCandidateId,
				seed,
				reason,
				...extra
			})
			const failureEventResult = await errors.try(
				step.sendEvent("template-candidate-execution-failed", {
					name: "template/candidate.execution.failed",
					data: { templateCandidateId, seed, reason }
				})
			)
			if (failureEventResult.error) {
				const disposalResult = errors.trySync(() => cleanupStack.dispose())
				if (disposalResult.error) {
					logger.error("template candidate cleanup failed", {
						templateCandidateId,
						context: "failure",
						error: disposalResult.error
					})
					throw errors.wrap(disposalResult.error, "template candidate cleanup")
				}
				logger.error(
					"template candidate execution failure event emission failed",
					{
						templateCandidateId,
						seed,
						reason,
						error: failureEventResult.error
					}
				)
				throw errors.wrap(
					failureEventResult.error,
					`template candidate execution failure event ${templateCandidateId}`
				)
			}

			disposeStack(logger, templateCandidateId, cleanupStack, "failure")
			return { status: "failed" as const, reason }
		}

		const parsedSeedResult = errors.trySync(() => BigInt(seed))
		if (parsedSeedResult.error) {
			return fail(`seed must be a base-10 integer string, received: ${seed}`)
		}
		const parsedSeed = parsedSeedResult.data
		const normalizedSeed = parsedSeedResult.data
		if (normalizedSeed < BigInt(0)) {
			return fail("seed must be non-negative")
		}

		const candidateRecord = await fetchCandidateRecord(templateCandidateId)
		if (!candidateRecord) {
			return fail("template candidate not found")
		}

		logger.debug("fetched template candidate record", {
			templateCandidateId,
			templateId: candidateRecord.templateId,
			sourceLength: candidateRecord.source.length,
			validatedAt: candidateRecord.validatedAt?.toISOString() ?? null
		})

		if (!candidateRecord.validatedAt) {
			return fail("template candidate has not been validated")
		}

		const existingExecution = await db
			.select({ id: templateCandidateExecutions.id })
			.from(templateCandidateExecutions)
			.where(
				and(
					eq(
						templateCandidateExecutions.templateCandidateId,
						templateCandidateId
					),
					eq(templateCandidateExecutions.seed, normalizedSeed)
				)
			)
			.limit(1)

		if (existingExecution[0]) {
			const executionId = existingExecution[0].id
			logger.info("template candidate execution reused existing record", {
				templateCandidateId,
				seed,
				executionId
			})

			const completionEventResult = await errors.try(
				step.sendEvent("template-candidate-execution-completed-existing", {
					name: "template/candidate.execution.completed",
					data: { templateCandidateId, seed, executionId }
				})
			)
			if (completionEventResult.error) {
				logger.error("template candidate execution completion event failed", {
					templateCandidateId,
					seed,
					executionId,
					error: completionEventResult.error
				})
				throw errors.wrap(
					completionEventResult.error,
					`template candidate execution completion event ${templateCandidateId}`
				)
			}

			disposeStack(logger, templateCandidateId, cleanupStack, "success")
			return { status: "already-exists" as const, executionId }
		}

		const tempDirResult = await errors.try(
			mkdtemp(path.join(tmpdir(), "template-candidate-exec-"))
		)
		if (tempDirResult.error) {
			return fail(tempDirResult.error.toString())
		}

		const tempDir = tempDirResult.data
		const tempFilePath = path.join(tempDir, "candidate.ts")
		logger.debug("created candidate execution temp dir", {
			templateCandidateId,
			tempDir,
			tempFilePath
		})
		cleanupStack.defer(() => {
			const removalResult = errors.trySync(() =>
				rmSync(tempDir, { recursive: true, force: true })
			)
			if (removalResult.error) {
				logger.error("template candidate cleanup failed", {
					templateCandidateId,
					context: "disposal",
					error: removalResult.error
				})
				throw errors.wrap(
					removalResult.error,
					"template candidate cleanup removal"
				)
			}
		})

		const transformedSourceResult = errors.trySync(() =>
			rewriteAliasImports(logger, templateCandidateId, candidateRecord.source)
		)
		if (transformedSourceResult.error) {
			logger.error("candidate alias rewrite failed", {
				templateCandidateId,
				error: transformedSourceResult.error,
				stack:
					transformedSourceResult.error instanceof Error
						? transformedSourceResult.error.stack
						: null
			})
			return fail(transformedSourceResult.error.toString())
		}

		const writeResult = await errors.try(
			writeFile(tempFilePath, transformedSourceResult.data, "utf8")
		)
		if (writeResult.error) {
			return fail(writeResult.error.toString())
		}

		const importResult = await errors.try(
			import(pathToFileURL(tempFilePath).href)
		)
		if (importResult.error) {
			logger.error("candidate module import failed", {
				templateCandidateId,
				tempFilePath,
				error: importResult.error,
				stack:
					importResult.error instanceof Error ? importResult.error.stack : null
			})
			return fail(importResult.error.toString())
		}

		const moduleExports = importResult.data
		logger.debug("candidate module imported", {
			templateCandidateId,
			exportKeys:
				moduleExports && typeof moduleExports === "object"
					? Object.keys(moduleExports)
					: typeof moduleExports
		})
		let generatorCandidate: unknown = moduleExports
		if (
			typeof generatorCandidate !== "function" &&
			hasDefaultExport(moduleExports)
		) {
			generatorCandidate = moduleExports.default
		}
		if (typeof generatorCandidate !== "function") {
			return fail("template candidate module must export a default function")
		}
		const generator = generatorCandidate

		const asyncResult = errors.trySync(() => generator(parsedSeed))
		if (asyncResult.error) {
			logger.error("candidate generator threw error", {
				templateCandidateId,
				error: asyncResult.error,
				stack:
					asyncResult.error instanceof Error ? asyncResult.error.stack : null
			})
			return fail(asyncResult.error.toString())
		}

		if (!(asyncResult.data instanceof Promise)) {
			logger.error("candidate generator returned non-promise result", {
				templateCandidateId,
				resultType: typeof asyncResult.data
			})
			return fail("template candidate execution must return a Promise")
		}

		const generationResult = await errors.try(asyncResult.data)
		if (generationResult.error) {
			logger.error("candidate generator threw error", {
				templateCandidateId,
				error: generationResult.error,
				stack:
					generationResult.error instanceof Error
						? generationResult.error.stack
						: null
			})
			return fail(generationResult.error.toString())
		}

		if (typeof generationResult.data !== "string") {
			logger.error("candidate generator returned non-string payload", {
				templateCandidateId,
				resultType: typeof generationResult.data
			})
			return fail("template candidate execution must resolve to a string")
		}

		const persistResult = await errors.try(
			persistExecution(
				templateCandidateId,
				normalizedSeed,
				generationResult.data
			)
		)
		if (persistResult.error) {
			return fail(persistResult.error.toString())
		}

		const executionId = persistResult.data[0]?.id
		if (!executionId) {
			return fail("template candidate execution ID missing after persistence")
		}

		disposeStack(logger, templateCandidateId, cleanupStack, "success")

		logger.info("template candidate execution completed", {
			templateCandidateId,
			seed,
			executionId
		})

		const completionEventResult = await errors.try(
			step.sendEvent("template-candidate-execution-completed", {
				name: "template/candidate.execution.completed",
				data: { templateCandidateId, seed, executionId }
			})
		)
		if (completionEventResult.error) {
			logger.error("template candidate execution completion event failed", {
				templateCandidateId,
				seed,
				executionId,
				error: completionEventResult.error
			})
			throw errors.wrap(
				completionEventResult.error,
				`template candidate execution completion event ${templateCandidateId}`
			)
		}

		return { status: "execution-succeeded" as const, executionId }
	}
)

function resolveAliasSpecifier(
	logger: Logger,
	templateCandidateId: string,
	specifier: string
): string {
	if (SLASH_ALIAS_TARGETS.length === 0) {
		logger.error("no alias targets available for '@/'' resolution", {
			templateCandidateId,
			specifier
		})
		throw errors.new("path alias '@/…' is not configured")
	}

	const cleanSpecifier = specifier.replace(/^\//, "")
	const attempts: string[] = []

	for (const baseDir of SLASH_ALIAS_TARGETS) {
		const baseCandidate = path.join(baseDir, cleanSpecifier)
		for (const extension of ALIAS_EXTENSIONS) {
			const candidatePath =
				extension.length > 0 ? `${baseCandidate}${extension}` : baseCandidate
			attempts.push(candidatePath)
			if (existsSync(candidatePath)) {
				return pathToFileURL(candidatePath).href
			}
		}

		for (const extension of ALIAS_EXTENSIONS) {
			const indexCandidate = path.join(
				baseDir,
				cleanSpecifier,
				`index${extension}`
			)
			attempts.push(indexCandidate)
			if (existsSync(indexCandidate)) {
				return pathToFileURL(indexCandidate).href
			}
		}
	}

	logger.error("failed to resolve alias import", {
		templateCandidateId,
		specifier,
		attempts
	})
	throw errors.new(`unable to resolve alias import @/${cleanSpecifier}`)
}

function rewriteAliasImports(
	logger: Logger,
	templateCandidateId: string,
	source: string
): string {
	let rewriteCount = 0
	const transformed = source.replace(
		ALIAS_IMPORT_REGEX,
		(_match, quote: string, specifier: string) => {
			rewriteCount += 1
			const resolved = resolveAliasSpecifier(
				logger,
				templateCandidateId,
				specifier
			)
			return `${quote}${resolved}${quote}`
		}
	)

	if (rewriteCount > 0) {
		logger.debug("candidate alias imports rewritten", {
			templateCandidateId,
			rewriteCount
		})
	}

	return transformed
}
