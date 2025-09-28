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

export function renderInlineContent(
	inlineItems: InlineContent | null,
	widgetSlots: Map<string, string>,
	interactionSlots: Map<string, string>
): string {
	if (!inlineItems) return ""
	return inlineItems
		.map((item) => {
			switch (item.type) {
				case "text":
					return escapeXmlText(item.content)
				case "math":
					return `<math xmlns="http://www.w3.org/1998/Math/MathML">${item.mathml}</math>`
				case "inlineWidgetRef": {
					const content = widgetSlots.get(item.widgetId)
					if (content === undefined) {
						logger.error("content for inline widget ref not found", {
							widgetId: item.widgetId,
							availableSlots: Array.from(widgetSlots.keys())
						})
						throw errors.new("content for inline widget ref not found")
					}
					return content
				}
				case "inlineInteractionRef": {
					const content = interactionSlots.get(item.interactionId)
					if (content === undefined) {
						logger.error("content for inline interaction ref not found", {
							interactionId: item.interactionId,
							availableSlots: Array.from(interactionSlots.keys())
						})
						throw errors.new("content for inline interaction ref not found")
					}
					return content
				}
				case "gap": {
					return `<qti-gap identifier="${item.gapId}"/>`
				}
				default:
					logger.error("unsupported inline content type", { item })
					throw errors.new("unsupported inline content type")
			}
		})
		.join("")
}

export function renderBlockContent(
	blockItems: BlockContent | null,
	widgetSlots: Map<string, string>,
	interactionSlots: Map<string, string>
): string {
	if (!blockItems) return ""
	return blockItems
		.map((item) => {
			switch (item.type) {
				case "paragraph":
					return `<p>${renderInlineContent(item.content, widgetSlots, interactionSlots)}</p>`
				case "codeBlock":
					return `<pre><code>${escapeXmlText(item.code)}</code></pre>`
				case "tableRich": {
					const renderRow = (row: Array<InlineContent | null>, asHeader = false) =>
						`<tr>${row
						.map((cell) => {
								const tag = asHeader ? "th" : "td"
								// A cell contains an array of inline content items
								return `<${tag}>${renderInlineContent(cell, widgetSlots, interactionSlots)}</${tag}>`
							})
							.join("")}</tr>`

					const thead = item.header?.length ? `<thead>${item.header.map(r => renderRow(r, true)).join("")}</thead>` : ""
					let tbodyRows = item.rows.map(r => renderRow(r)).join("")
					// Footer support removed: do not emit <tfoot>; if footer provided by older data, fold into tbody as a final bold row is no longer supported
					return `<table>${thead}<tbody>${tbodyRows}</tbody></table>`
				}
				case "unorderedList": {
					const itemsXml = item.items.map((inline) => `<li><p>${renderInlineContent(inline, widgetSlots, interactionSlots)}</p></li>`).join("")
					return `<ul>${itemsXml}</ul>`
				}
				case "orderedList": {
					const itemsXml = item.items.map((inline) => `<li><p>${renderInlineContent(inline, widgetSlots, interactionSlots)}</p></li>`).join("")
					return `<ol>${itemsXml}</ol>`
				}
				case "widgetRef": {
					const content = widgetSlots.get(item.widgetId)
					if (content === undefined) {
						logger.error("content for widget ref not found", {
							widgetId: item.widgetId,
							availableSlots: Array.from(widgetSlots.keys())
						})
						throw errors.new("content for widget ref not found")
					}
					return content
				}
				case "interactionRef": {
					const content = interactionSlots.get(item.interactionId)
					if (content === undefined) {
						logger.error("content for interaction ref not found", {
							interactionId: item.interactionId,
							availableSlots: Array.from(interactionSlots.keys())
						})
						throw errors.new("content for interaction ref not found")
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
