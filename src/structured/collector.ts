import type {
	AssessmentItemInput,
	BlockContent,
	InlineContent,
	AnyInteraction
} from "../compiler/schemas"

function walkInline(inline: InlineContent | null, out: Set<string>): void {
	if (!inline) {
		return
	}
	for (const node of inline) {
		if (node.type === "inlineWidgetRef") {
			out.add(node.widgetId)
		}
	}
}

function walkBlock(blocks: BlockContent | null, out: Set<string>): void {
	if (!blocks) {
		return
	}
	for (const node of blocks) {
		if (node.type === "widgetRef") {
			out.add(node.widgetId)
		} else if (node.type === "paragraph") {
			walkInline(node.content, out)
		} else if (node.type === "unorderedList") {
			node.items.forEach((item) => walkInline(item, out))
		}
	}
}

function walkInteractions(
	interactions: Record<string, AnyInteraction> | null,
	out: Set<string>
): void {
	if (!interactions) {
		return
	}
	for (const interaction of Object.values(interactions)) {
		switch (interaction.type) {
			case "choiceInteraction":
			case "orderInteraction":
				walkInline(interaction.prompt, out)
				interaction.choices.forEach((choice) => walkBlock(choice.content, out))
				break
			case "inlineChoiceInteraction":
				interaction.choices.forEach((choice) => walkInline(choice.content, out))
				break
			case "gapMatchInteraction":
				walkBlock(interaction.content, out)
				interaction.gapTexts.forEach((gt) => walkInline(gt.content, out))
				break
		}
	}
}

/**
 * Collects all unique widget slot IDs from every location within an assessment item structure.
 * This includes the body, feedback blocks, interactions, and inline content within dataTable widgets.
 *
 * @param item - An object conforming to the structure of an AssessmentItemInput.
 * @returns A sorted, de-duplicated array of all found widget slot IDs.
 */
export function collectAllWidgetSlotIds(item: {
	body: BlockContent | null
	feedbackBlocks: Array<{ content: BlockContent }> | null
	interactions: Record<string, AnyInteraction> | null
	widgets: AssessmentItemInput["widgets"] | null
}): string[] {
	const out = new Set<string>()

	walkBlock(item.body, out)
	if (item.feedbackBlocks) {
		item.feedbackBlocks.forEach((fb) => walkBlock(fb.content, out))
	}
	walkInteractions(item.interactions, out)

	// Special case: Scan for inline content within dataTable cells
	if (item.widgets) {
		for (const widget of Object.values(item.widgets)) {
			if (widget.type === "dataTable" && widget.data) {
				for (const row of widget.data) {
					for (const cell of row) {
						if (cell.type === "inline") {
							walkInline(cell.content, out)
						}
					}
				}
			}
		}
	}

	return Array.from(out).sort()
}
