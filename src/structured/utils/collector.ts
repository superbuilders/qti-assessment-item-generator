import type { BlockContent, InlineContent } from "@core/content"
import type { AnyInteraction } from "@core/interactions"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { WidgetTypeTuple } from "../../widgets/collections/types"

function walkInline<E extends WidgetTypeTuple>(inline: InlineContent<E> | null, out: Map<string, string>): void {
	if (!inline) return
	for (const node of inline) {
		if (node.type === "inlineWidgetRef") {
			const existing = out.get(node.widgetId)
			if (existing && existing !== node.widgetType) {
				logger.error("conflicting widgetType for same widgetId", {
					widgetId: node.widgetId,
					existingType: existing,
					newType: node.widgetType
				})
				throw errors.new("conflicting widgetType values for same widgetId")
			}
			out.set(node.widgetId, node.widgetType)
		}
	}
}

function walkBlock<E extends WidgetTypeTuple>(blocks: BlockContent<E> | null, out: Map<string, string>): void {
	if (!blocks) return
	for (const node of blocks) {
		switch (node.type) {
			case "widgetRef": {
				const existing = out.get(node.widgetId)
				if (existing && existing !== node.widgetType) {
					logger.error("conflicting widgetType for same widgetId", {
						widgetId: node.widgetId,
						existingType: existing,
						newType: node.widgetType
					})
					throw errors.new("conflicting widgetType values for same widgetId")
				}
				out.set(node.widgetId, node.widgetType)
				break
			}
			case "paragraph":
				walkInline(node.content, out)
				break
			case "unorderedList":
			case "orderedList":
				for (const item of node.items) {
					walkInline(item, out)
				}
				break
			case "tableRich": {
				const walkRows = (rows: Array<Array<InlineContent<E> | null>> | null) => {
					if (!rows) return
					for (const row of rows) {
						for (const cell of row) {
							walkInline(cell, out)
						}
					}
				}
				walkRows(node.header)
				walkRows(node.rows)
				break
			}
			case "codeBlock":
			case "interactionRef":
				break
		}
	}
}

function walkInteractions<E extends WidgetTypeTuple>(
	interactions: Record<string, AnyInteraction<E>> | null,
	out: Map<string, string>
): void {
	if (!interactions) return
	for (const interaction of Object.values(interactions)) {
		switch (interaction.type) {
			case "choiceInteraction":
			case "orderInteraction":
				walkInline(interaction.prompt, out)
				for (const choice of interaction.choices) {
					walkBlock(choice.content, out)
				}
				break
			case "inlineChoiceInteraction":
				for (const choice of interaction.choices) {
					walkInline(choice.content, out)
				}
				break
			case "gapMatchInteraction":
				walkBlock(interaction.content, out)
				for (const gt of interaction.gapTexts) {
					walkInline(gt.content, out)
				}
				break
			case "textEntryInteraction":
			case "unsupportedInteraction":
				break
		}
	}
}

/**
 * Collects all widget references with their types from every location within an assessment item structure.
 * This includes the body, feedback blocks, interactions (prompts, choices, gap texts), and any nested inline content.
 *
 * @param item - An object conforming to the structure of an AssessmentItemInput.
 * @returns A Map from widgetId to widgetType. Throws if the same widgetId has conflicting types.
 */
export function collectWidgetRefs<E extends WidgetTypeTuple>(item: {
	body: BlockContent<E> | null
	feedbackBlocks: Record<string, BlockContent<E>> | null
	interactions: Record<string, AnyInteraction<E>> | null
}): Map<string, string> {
	const out = new Map<string, string>()

	walkBlock(item.body, out)
	if (item.feedbackBlocks) {
		for (const content of Object.values(item.feedbackBlocks)) {
			walkBlock(content, out)
		}
	}
	walkInteractions(item.interactions, out)

	return out
}

/**
 * Legacy function for backward compatibility - collects just the IDs
 */
export function collectAllWidgetSlotIds<E extends WidgetTypeTuple>(item: {
	body: BlockContent<E> | null
	feedbackBlocks: Record<string, BlockContent<E>> | null
	interactions: Record<string, AnyInteraction<E>> | null
}): string[] {
	const refs = collectWidgetRefs(item)
	return Array.from(refs.keys()).sort()
}
