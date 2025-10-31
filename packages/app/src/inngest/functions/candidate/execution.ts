import { existsSync, rmSync } from "node:fs"
import { mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import * as path from "node:path"
import { pathToFileURL } from "node:url"
import * as errors from "@superbuilders/errors"
import { and, eq } from "drizzle-orm"
import type { Logger } from "inngest"
import type { ZodType } from "zod"
import { FeedbackPlanSchema } from "@/core/feedback"
import { createDynamicAssessmentItemSchema } from "@/core/item/schema"
import { validateAndSanitizeHtmlFields } from "@/structured/validator"
import { typedSchemas } from "@/widgets/registry"
import { db } from "../../../db/client"
import {
	templateCandidateExecutions,
	templateCandidates,
	templates
} from "../../../db/schema"
import { inngest } from "../../client"

type CandidateRecord = {
	id: string
	templateId: string
	source: string
	validatedAt: Date | null
	allowedWidgets: readonly string[]
}

type WidgetResources = {
	widgetSchemas: Record<string, ZodType>
	widgetMapping: Record<string, string>
}

type WidgetRegistry = typeof typedSchemas
type ModuleWithDefault = { default: unknown }
type WidgetContainer = { widgets?: unknown }
type FeedbackContainer = { feedbackPlan: unknown }

const ALIAS_ROOT = path.resolve(process.cwd(), "../lib/src")
const ALIAS_EXTENSIONS = [
	"",
	".ts",
	".tsx",
	".mts",
	".cts",
	".js",
	".mjs",
	".cjs"
]

function isPlainRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

function hasWidgetSchema(
	registry: WidgetRegistry,
	widgetType: string
): widgetType is keyof WidgetRegistry {
	return Object.hasOwn(registry, widgetType)
}

function hasDefaultExport(value: unknown): value is ModuleWithDefault {
	return typeof value === "object" && value !== null && "default" in value
}

function hasWidgets(value: unknown): value is WidgetContainer {
	return typeof value === "object" && value !== null && "widgets" in value
}

function hasFeedbackPlan(value: unknown): value is FeedbackContainer {
	return typeof value === "object" && value !== null && "feedbackPlan" in value
}

function hasTypeProperty(
	value: Record<string, unknown>
): value is Record<string, unknown> & { type: unknown } {
	return Object.hasOwn(value, "type")
}

function resolveAliasSpecifier(
	logger: Logger,
	templateCandidateId: string,
	specifier: string
): string {
	const cleanSpecifier = specifier.replace(/^\//, "")
	const attempts: string[] = []
	const pushAttempt = (candidate: string) => {
		attempts.push(candidate)
		return candidate
	}

	for (const ext of ALIAS_EXTENSIONS) {
		const candidate = pushAttempt(
			path.join(ALIAS_ROOT, `${cleanSpecifier}${ext}`)
		)
		if (existsSync(candidate)) {
			logger.debug("resolved alias import", {
				templateCandidateId,
				specifier,
				resolvedPath: candidate
			})
			return pathToFileURL(candidate).href
		}
	}
	const indexCandidate = pushAttempt(
		path.join(ALIAS_ROOT, cleanSpecifier, "index.ts")
	)
	if (existsSync(indexCandidate)) {
		logger.debug("resolved alias import (index.ts)", {
			templateCandidateId,
			specifier,
			resolvedPath: indexCandidate
		})
		return pathToFileURL(indexCandidate).href
	}
	logger.warn("alias import could not be resolved; falling back", {
		templateCandidateId,
		specifier,
		attempts
	})
	return pathToFileURL(path.join(ALIAS_ROOT, cleanSpecifier)).href
}

function rewriteAliasImports(
	logger: Logger,
	templateCandidateId: string,
	source: string
): string {
	const replaceSpecifier = (match: string, specifier: string) => {
		const resolved = resolveAliasSpecifier(
			logger,
			templateCandidateId,
			specifier
		)
		return match.replace(`@/${specifier}`, resolved)
	}

	return source
		.replace(/from\s+["']@\/([^"']+)["']/g, (full, spec) =>
			replaceSpecifier(full, spec)
		)
		.replace(/import\s+["']@\/([^"']+)["']/g, (full, spec) =>
			replaceSpecifier(full, spec)
		)
		.replace(/import\(\s*["']@\/([^"']+)["']\s*\)/g, (full, spec) =>
			replaceSpecifier(full, spec)
		)
		.replace(/export\s+\*\s+from\s+["']@\/([^"']+)["']/g, (full, spec) =>
			replaceSpecifier(full, spec)
		)
}

async function fetchCandidateRecord(
	templateCandidateId: string
): Promise<CandidateRecord | null> {
	const rows = await db
		.select({
			id: templateCandidates.id,
			templateId: templateCandidates.templateId,
			source: templateCandidates.source,
			validatedAt: templateCandidates.validatedAt,
			allowedWidgets: templates.allowedWidgets
		})
		.from(templateCandidates)
		.innerJoin(templates, eq(templates.id, templateCandidates.templateId))
		.where(eq(templateCandidates.id, templateCandidateId))
		.limit(1)

	return rows[0] ?? null
}

function deriveWidgetResources(
	logger: Logger,
	allowedWidgets: readonly string[],
	itemWidgets: Record<string, unknown> | null
): WidgetResources {
	const widgetSchemas: Record<string, ZodType> = {}
	const widgetMapping: Record<string, string> = {}

	for (const widgetType of allowedWidgets) {
		if (!hasWidgetSchema(typedSchemas, widgetType)) {
			logger.error("widget schema missing for allowed widget", { widgetType })
			throw errors.new(`no widget schema available for ${widgetType}`)
		}
		const schema = typedSchemas[widgetType]
		widgetSchemas[widgetType] = schema
	}

	if (!itemWidgets) {
		return { widgetSchemas, widgetMapping }
	}

	const allowedSet = new Set(allowedWidgets)

	for (const [widgetId, widgetCandidate] of Object.entries(itemWidgets)) {
		if (!isPlainRecord(widgetCandidate)) {
			logger.error("widget missing type during execution validation", {
				widgetId
			})
			throw errors.new(`widget ${widgetId} missing type`)
		}
		if (!hasTypeProperty(widgetCandidate)) {
			logger.error("widget missing type during execution validation", {
				widgetId
			})
			throw errors.new(`widget ${widgetId} missing type`)
		}
		const widgetTypeValue = widgetCandidate.type
		if (typeof widgetTypeValue !== "string") {
			logger.error("widget missing type during execution validation", {
				widgetId
			})
			throw errors.new(`widget ${widgetId} missing type`)
		}
		if (!allowedSet.has(widgetTypeValue)) {
			logger.error("widget type not permitted for template", {
				widgetId,
				widgetType: widgetTypeValue,
				allowedWidgets
			})
			throw errors.new(
				`widget ${widgetId} uses type ${widgetTypeValue}, which is not allowed`
			)
		}
		widgetMapping[widgetId] = widgetTypeValue
	}

	return { widgetSchemas, widgetMapping }
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
		if (normalizedSeed < 0n) {
			return fail("seed must be non-negative")
		}

		const candidateRecord = await fetchCandidateRecord(templateCandidateId)
		if (!candidateRecord) {
			return fail("template candidate not found")
		}

		logger.debug("fetched template candidate record", {
			templateCandidateId,
			templateId: candidateRecord.templateId,
			allowedWidgetCount: candidateRecord.allowedWidgets.length,
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

		const transformedSource = rewriteAliasImports(
			logger,
			templateCandidateId,
			candidateRecord.source
		)
		const aliasOccurrences = (candidateRecord.source.match(/@\/\S+/g) ?? [])
			.length
		const aliasRemaining = (transformedSource.match(/@\/\S+/g) ?? []).length
		logger.debug("candidate source alias rewrite summary", {
			templateCandidateId,
			aliasOccurrences,
			aliasRemaining,
			transformedLength: transformedSource.length
		})
		const writeResult = await errors.try(
			writeFile(tempFilePath, transformedSource, "utf8")
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

		const generationResult = await errors.try(
			Promise.resolve().then(() => generator(parsedSeed))
		)
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

		const rawItem = generationResult.data
		if (!isPlainRecord(rawItem)) {
			return fail("template candidate execution returned invalid result")
		}

		if (!hasFeedbackPlan(rawItem)) {
			return fail(
				"template candidate execution result missing feedbackPlan property"
			)
		}

		let widgetSource: Record<string, unknown> | null = null
		if (hasWidgets(rawItem)) {
			const candidateWidgets = rawItem.widgets
			if (candidateWidgets === null || candidateWidgets === undefined) {
				widgetSource = null
			} else if (isPlainRecord(candidateWidgets)) {
				widgetSource = candidateWidgets
			} else {
				return fail(
					"template candidate execution widgets must be an object map"
				)
			}
		}

		const widgetResourcesResult = errors.trySync(() =>
			deriveWidgetResources(
				logger,
				candidateRecord.allowedWidgets,
				widgetSource
			)
		)
		if (widgetResourcesResult.error) {
			return fail(widgetResourcesResult.error.toString())
		}

		const { widgetSchemas, widgetMapping } = widgetResourcesResult.data
		logger.debug("derived widget resources", {
			templateCandidateId,
			widgetSchemaCount: Object.keys(widgetSchemas).length,
			widgetMappingCount: Object.keys(widgetMapping).length
		})
		const feedbackPlanResult = FeedbackPlanSchema.safeParse(
			rawItem.feedbackPlan
		)
		if (!feedbackPlanResult.success) {
			return fail(
				"template candidate execution result has invalid feedbackPlan",
				{ validationErrors: feedbackPlanResult.error.issues }
			)
		}
		const feedbackPlan = feedbackPlanResult.data

		const itemSchemaResult = errors.trySync(() =>
			createDynamicAssessmentItemSchema(
				widgetMapping,
				candidateRecord.allowedWidgets,
				widgetSchemas,
				feedbackPlan
			)
		)
		if (itemSchemaResult.error) {
			return fail(itemSchemaResult.error.toString())
		}

		const itemSchema = itemSchemaResult.data.AssessmentItemSchema
		const validation = itemSchema.safeParse(rawItem)
		if (!validation.success) {
			return fail(validation.error.toString(), {
				validationErrors: validation.error.issues
			})
		}

		const sanitizedResult = errors.trySync(() =>
			validateAndSanitizeHtmlFields(validation.data, logger)
		)
		if (sanitizedResult.error) {
			return fail(sanitizedResult.error.toString())
		}
		logger.debug("sanitized item", {
			templateCandidateId,
			bodyPresent: Boolean(sanitizedResult.data.body),
			interactionCount: sanitizedResult.data.interactions
				? Object.keys(sanitizedResult.data.interactions).length
				: 0
		})

		const persistResult = await errors.try(
			persistExecution(
				templateCandidateId,
				normalizedSeed,
				sanitizedResult.data
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
