import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { sanitizeXmlAttributeValue } from "../utils/xml-utils"
import type { BlockContent, InlineContent } from "./schemas"

/**
 * Escapes text content for safe inclusion in XML PCDATA.
 */
function escapeXmlText(text: string): string {
	const sanitized = sanitizeXmlAttributeValue(text)
	return sanitized
		.replace(/&/g, "&amp;") // Must be first to avoid double-escaping
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
}

export function renderInlineContent(inlineItems: InlineContent | null | undefined, slots: Map<string, string>): string {
	if (!inlineItems) return ""
	return inlineItems
		.map((item) => {
			switch (item.type) {
				case "text":
					return escapeXmlText(item.content)
				case "math":
					// Ensure MathML is properly wrapped and namespaced
					return `<math xmlns="http://www.w3.org/1998/Math/MathML">${item.mathml}</math>`
				case "inlineSlot": {
					const content = slots.get(item.slotId)
					if (content === undefined) {
						logger.error("content for inline slot not found", {
							slotId: item.slotId,
							availableSlots: Array.from(slots.keys())
						})
						throw errors.new(`Compiler Error: Content for inline slot '${item.slotId}' not found.`)
					}
					return content // Render directly, no wrapper
				}
				case "gap": {
					// Render gap element for gap match interaction
					return `<qti-gap identifier="${item.gapId}"/>`
				}
				default:
					logger.error("unsupported inline content type", { item })
					throw errors.new("unsupported inline content type")
			}
		})
		.join("")
}

export function renderBlockContent(blockItems: BlockContent | null | undefined, slots: Map<string, string>): string {
	if (!blockItems) return ""
	return blockItems
		.map((item) => {
			switch (item.type) {
				case "paragraph":
					return `<p>${renderInlineContent(item.content, slots)}</p>`
				case "codeBlock":
					return `<pre><code>${escapeXmlText(item.code)}</code></pre>`
				case "table": {
					const classAttr = item.className ? ` class="${sanitizeXmlAttributeValue(item.className)}"` : ""
					const headerCells = item.header.map((h) => `<th>${escapeXmlText(h)}</th>`).join("")
					const thead = item.header.length > 0 ? `<thead><tr>${headerCells}</tr></thead>` : ""
					const tbodyRows = item.rows
						.map((row) => {
							const cells = row.map((c) => `<td>${escapeXmlText(String(c))}</td>`).join("")
							return `<tr>${cells}</tr>`
						})
						.join("")
					return `<table${classAttr}>${thead}<tbody>${tbodyRows}</tbody></table>`
				}
				case "unorderedList": {
					const itemsXml = item.items.map((inline) => `<li><p>${renderInlineContent(inline, slots)}</p></li>`).join("")
					return `<ul>${itemsXml}</ul>`
				}
				case "blockSlot": {
					const content = slots.get(item.slotId)
					if (content === undefined) {
						logger.error("content for block slot not found", {
							slotId: item.slotId,
							availableSlots: Array.from(slots.keys())
						})
						throw errors.new(`Compiler Error: Content for block slot '${item.slotId}' not found.`)
					}
					return content
				}
				default:
					logger.error("unsupported block content type", { item })
					throw errors.new("unsupported block content type")
			}
		})
		.join("\n        ")
}
