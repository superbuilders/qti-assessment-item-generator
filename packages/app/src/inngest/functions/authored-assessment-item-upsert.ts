import { createHash } from "node:crypto"
import * as errors from "@superbuilders/errors"
import type { Logger } from "inngest"
import { db } from "../../db/client"
import { authoredAssessmentItems } from "../../db/schema/index"
import { inngest } from "../client"

type UpsertResult = { hash: string }

async function performAuthoredAssessmentItemUpsert({
	authoredItemId,
	structuredItem,
	logger
}: {
	authoredItemId: string
	structuredItem: unknown
	logger: Logger
}): Promise<UpsertResult> {
	const stringifiedItem = JSON.stringify(structuredItem)
	const hash = createHash("sha256").update(stringifiedItem).digest("hex")

	logger.debug("upserting authored item", { authoredItemId, hash })

	await db
		.insert(authoredAssessmentItems)
		.values({ id: authoredItemId, hash, body: structuredItem })
		.onConflictDoUpdate({
			target: authoredAssessmentItems.id,
			set: { hash, body: structuredItem }
		})

	return { hash }
}

export const authoredAssessmentItemUpsertRequestedFunction =
	inngest.createFunction(
		{
			id: "authored-assessment-item-upsert-requested",
			name: "Authored Assessment Item Upsert Requested",
			idempotency: "event"
		},
		{ event: "template/authored.assessment.item.upsert.requested" },
		async ({ event, step, logger }) => {
			const { authoredItemId, structuredItem } = event.data
			logger.info("starting authored item upsert", { authoredItemId })

			const operationResult = await errors.try(
				performAuthoredAssessmentItemUpsert({
					authoredItemId,
					structuredItem,
					logger
				})
			)
			if (operationResult.error) {
				const reason = operationResult.error.toString()
				if (reason.trim().length === 0) {
					logger.error("authored item upsert failure missing reason", {
						authoredItemId,
						error: operationResult.error
					})
					throw errors.wrap(
						operationResult.error,
						`authored item upsert ${authoredItemId}: missing reason`
					)
				}
				logger.error("authored item upsert failed", {
					authoredItemId,
					reason,
					error: operationResult.error
				})

				const failureEventResult = await errors.try(
					step.sendEvent("send-failure-event", {
						name: "template/authored.assessment.item.upsert.failed",
						data: { authoredItemId, reason }
					})
				)
				if (failureEventResult.error) {
					logger.error(
						"authored item upsert failure event emission failed; aborting",
						{
							authoredItemId,
							reason,
							error: failureEventResult.error
						}
					)
					throw errors.wrap(
						failureEventResult.error,
						`authored item upsert failure event ${authoredItemId}`
					)
				}

				logger.error("authored item upsert error; aborting", {
					authoredItemId,
					reason
				})
				throw errors.wrap(
					operationResult.error,
					`upserting authored item ${authoredItemId}`
				)
			}

			const completionEventResult = await errors.try(
				step.sendEvent("send-completion-event", {
					name: "template/authored.assessment.item.upsert.completed",
					data: { authoredItemId }
				})
			)
			if (completionEventResult.error) {
				logger.error(
					"authored item upsert completion event emission failed; aborting",
					{
						authoredItemId,
						error: completionEventResult.error
					}
				)
				throw errors.wrap(
					completionEventResult.error,
					`authored item upsert completion event ${authoredItemId}`
				)
			}

			logger.info("authored item upsert completed", { authoredItemId })

			return {
				authoredItemId,
				hash: operationResult.data.hash,
				status: "completed"
			}
		}
	)
