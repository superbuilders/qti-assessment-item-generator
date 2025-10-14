import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { BlockContent, InlineContent, InlineContentItem } from "@/core/content"
import { sanitizeXmlAttributeValue } from "./utils/xml-utils"

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

export function renderInlineContent<E extends readonly string[] = readonly string[]>(
	inlineItems: InlineContent<E> | null,
	widgetSlots: Map<string, string>,
	interactionSlots: Map<string, string>
): string {
	if (!inlineItems) return ""
	return inlineItems
		.map((item: InlineContentItem<E>): string => {
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

export function renderBlockContent<E extends readonly string[] = readonly string[]>(
	blockItems: BlockContent<E> | null,
	widgetSlots: Map<string, string>,
	interactionSlots: Map<string, string>
): string {
	if (!blockItems) return ""
	return blockItems
		.map((item): string => {
			switch (item.type) {
				case "paragraph":
					return `<p>${renderInlineContent(item.content, widgetSlots, interactionSlots)}</p>`
				case "tableRich": {
					const tableStyle = "border-collapse: collapse; width: 100%;"
					const thStyle = "border: 1px solid #ddd; padding: 8px 12px; text-align: left; vertical-align: top;"
					const tdStyle = "border: 1px solid #ddd; padding: 8px 12px; vertical-align: top;"
					const renderRow = (row: Array<InlineContent<E> | null>, asHeader = false) =>
						`<tr>${row
							.map((cell) => {
								const tag = asHeader ? "th" : "td"
								const cellStyle = asHeader ? thStyle : tdStyle
								// A cell contains an array of inline content items
								return `<${tag} style="${cellStyle}">${renderInlineContent(cell, widgetSlots, interactionSlots)}</${tag}>`
							})
							.join("")}</tr>`

					const thead = item.header?.length
						? `<thead>${item.header.map((r: Array<InlineContent<E> | null>) => renderRow(r, true)).join("")}</thead>`
						: ""
					let tbodyRows = item.rows.map((r: Array<InlineContent<E> | null>) => renderRow(r)).join("")
					// Footer support removed: do not emit <tfoot>; if footer provided by older data, fold into tbody as a final bold row is no longer supported
					return `<table style="${tableStyle}">${thead}<tbody>${tbodyRows}</tbody></table>`
				}
				case "unorderedList": {
					const itemsXml = item.items
						.map(
							(inline: InlineContent<E>) =>
								`<li><p>${renderInlineContent(inline, widgetSlots, interactionSlots)}</p></li>`
						)
						.join("")
					return `<ul>${itemsXml}</ul>`
				}
				case "orderedList": {
					const itemsXml = item.items
						.map(
							(inline: InlineContent<E>) =>
								`<li><p>${renderInlineContent(inline, widgetSlots, interactionSlots)}</p></li>`
						)
						.join("")
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
