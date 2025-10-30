import * as errors from "@superbuilders/errors"
import { and, desc, eq, isNotNull } from "drizzle-orm"
import type { Logger } from "inngest"
import { db } from "../../../db/client"
import { templateCandidates } from "../../../db/schema"
import { inngest } from "../../client"

type TemplateCandidateLookup = {
	id: string
	validatedAt: Date
}

async function findLatestValidatedCandidate(
	logger: Logger,
	templateId: string
): Promise<TemplateCandidateLookup | null> {
	const candidates = await db
		.select({
			id: templateCandidates.id,
			validatedAt: templateCandidates.validatedAt
		})
		.from(templateCandidates)
		.where(
			and(
				eq(templateCandidates.templateId, templateId),
				isNotNull(templateCandidates.validatedAt)
			)
		)
		.orderBy(desc(templateCandidates.validatedAt))
		.limit(1)

	const record = candidates[0]
	if (!record) {
		logger.error("no validated template candidates available for execution", {
			templateId
		})
		return null
	}

	if (!record.validatedAt) {
		logger.error("validated candidate missing validatedAt timestamp", {
			templateId,
			templateCandidateId: record.id
		})
		throw errors.new("validated template candidate missing timestamp")
	}

	return {
		id: record.id,
		validatedAt: record.validatedAt
	}
}

export const executeTemplate = inngest.createFunction(
	{
		id: "template-execution",
		name: "Template Execution",
		idempotency: "event",
		concurrency: [{ scope: "fn", key: "event.data.templateId", limit: 1 }]
	},
	{ event: "template/template.execution.requested" },
	async ({ event, step, logger }) => {
		const { templateId, seed } = event.data
		logger.info("template execution requested", { templateId, seed })

		const candidate = await findLatestValidatedCandidate(logger, templateId)
		if (!candidate) {
			const reason = "no validated template candidate available"
			const failureEventResult = await errors.try(
				step.sendEvent("template-execution-failed-no-candidate", {
					name: "template/template.execution.failed",
					data: { templateId, seed, reason }
				})
			)
			if (failureEventResult.error) {
				logger.error("failed to emit template execution failure event", {
					templateId,
					seed,
					reason,
					error: failureEventResult.error
				})
				throw errors.wrap(
					failureEventResult.error,
					"emit template execution failure event"
				)
			}
			return { status: "failed" as const, reason }
		}

		logger.info("dispatching candidate execution", {
			templateId,
			templateCandidateId: candidate.id,
			seed
		})
		const dispatchResult = await errors.try(
			step.sendEvent("template-execution-dispatch", {
				name: "template/candidate.execution.requested",
				data: { templateCandidateId: candidate.id, seed }
			})
		)
		if (dispatchResult.error) {
			logger.error("failed to dispatch candidate execution", {
				templateId,
				templateCandidateId: candidate.id,
				seed,
				error: dispatchResult.error
			})
			throw errors.wrap(
				dispatchResult.error,
				"dispatch template candidate execution"
			)
		}

		const waitForCompletion = step
			.waitForEvent("wait-template-execution-completed", {
				event: "template/candidate.execution.completed",
				timeout: "30m",
				if: `async.data.templateCandidateId == "${candidate.id}" && async.data.seed == "${seed}"`
			})
			.then((evt) => ({ kind: "completed" as const, evt }))
		const waitForFailure = step
			.waitForEvent("wait-template-execution-failed", {
				event: "template/candidate.execution.failed",
				timeout: "30m",
				if: `async.data.templateCandidateId == "${candidate.id}" && async.data.seed == "${seed}"`
			})
			.then((evt) => ({ kind: "failed" as const, evt }))

		const outcome = await Promise.race([waitForCompletion, waitForFailure])

		if (!outcome.evt) {
			const reason = "template candidate execution timeout"
			logger.error("candidate execution did not produce an event", {
				templateId,
				templateCandidateId: candidate.id,
				seed
			})
			const failureEventResult = await errors.try(
				step.sendEvent("template-execution-timeout", {
					name: "template/template.execution.failed",
					data: { templateId, seed, reason }
				})
			)
			if (failureEventResult.error) {
				logger.error("failed to emit template execution timeout", {
					templateId,
					templateCandidateId: candidate.id,
					seed,
					error: failureEventResult.error
				})
				throw errors.wrap(
					failureEventResult.error,
					"emit template execution timeout"
				)
			}
			return { status: "failed" as const, reason }
		}

		if (outcome.kind === "completed") {
			const executionId = outcome.evt.data.executionId
			const completionEventResult = await errors.try(
				step.sendEvent("template-execution-completed", {
					name: "template/template.execution.completed",
					data: {
						templateId,
						templateCandidateId: candidate.id,
						seed,
						executionId
					}
				})
			)
			if (completionEventResult.error) {
				logger.error("failed to emit template execution completion", {
					templateId,
					templateCandidateId: candidate.id,
					seed,
					executionId,
					error: completionEventResult.error
				})
				throw errors.wrap(
					completionEventResult.error,
					"emit template execution completion"
				)
			}
			return {
				status: "completed" as const,
				templateCandidateId: candidate.id,
				executionId
			}
		}

		const reason =
			outcome.evt.data.reason ?? "template candidate execution failed"
		const failureEventResult = await errors.try(
			step.sendEvent("template-execution-failed", {
				name: "template/template.execution.failed",
				data: { templateId, seed, reason }
			})
		)
		if (failureEventResult.error) {
			logger.error("failed to emit template execution failure", {
				templateId,
				templateCandidateId: candidate.id,
				seed,
				reason,
				error: failureEventResult.error
			})
			throw errors.wrap(
				failureEventResult.error,
				"emit template execution failure"
			)
		}

		return { status: "failed" as const, reason }
	}
)
