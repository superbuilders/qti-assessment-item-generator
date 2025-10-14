import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { BlockContent, FeedbackContent, InlineContent, InlineContentItem, StepBlock } from "@/core/content"
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
				case "blockquote": {
					const inline = renderInlineContent(item.content, widgetSlots, interactionSlots)
					const attr = item.attribution ? renderInlineContent(item.attribution, widgetSlots, interactionSlots) : ""
					const footer = attr
						? `<footer class="qti-blockquote-footer" style="margin-top:6px; color:#6B7280; font-style:italic;">${attr}</footer>`
						: ""
					return `<blockquote class="qti-blockquote" style="margin:12px 0; padding:12px 16px; border-left:4px solid #D1D5DB; background:#F9FAFB; color:#111827;">${inline}${footer}</blockquote>`
				}
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

export function renderFeedbackContent<E extends readonly string[]>(
	feedback: FeedbackContent<E> | null,
	widgetSlots: Map<string, string>,
	interactionSlots: Map<string, string>
): string {
	if (!feedback) return ""

	const preambleCorrectness = feedback.preamble.correctness
	const preambleBg = preambleCorrectness === "correct" ? "#ECFDF5" : "#FEF2F2"
	const preambleBorder = preambleCorrectness === "correct" ? "#A7F3D0" : "#FECACA"
	const preambleColor = preambleCorrectness === "correct" ? "#065F46" : "#991B1B"
	const preambleHeadline = preambleCorrectness === "correct" ? "Correct! Fantastic work." : "Not quite! Try again."

	const preambleSummary = renderInlineContent(feedback.preamble.summary, widgetSlots, interactionSlots)
	const preambleHtml = `<div class="qti-feedback-preamble" data-correctness="${preambleCorrectness}" style="border:1px solid ${preambleBorder}; background:${preambleBg}; color:${preambleColor}; border-radius:12px; padding:12px 16px; margin-bottom:16px;">
      <p style="margin:0; font-weight:700;">${preambleHeadline}</p>
      <p style="margin:8px 0 0 0;">${preambleSummary}</p>
    </div>`

	const palette = [
		{ accent: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
		{ accent: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
		{ accent: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
		{ accent: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE" },
		{ accent: "#EF4444", bg: "#FEF2F2", border: "#FECACA" }
	]

	const stepItems = feedback.steps
		.map((step: StepBlock<E>, idx: number) => {
			const colors = palette[idx % palette.length]
			const title = renderInlineContent(step.title, widgetSlots, interactionSlots)
			const content = renderBlockContent(step.content, widgetSlots, interactionSlots)
			return `<li class="qti-step" style="position:relative; margin:16px 0; padding:16px 16px 16px 56px; border:1px solid ${colors.border}; border-left:6px solid ${colors.accent}; border-radius:12px; background:${colors.bg}; box-shadow:0 1px 2px rgba(0,0,0,0.04);">
        <span class="qti-step-index" style="position:absolute; left:16px; top:16px; width:28px; height:28px; border-radius:9999px; background:${colors.accent}; color:#FFFFFF; display:inline-flex; align-items:center; justify-content:center; font-weight:700; font-size:14px;">${idx + 1}</span>
        <p class="qti-step-title" style="margin:0 0 8px 0; font-weight:700; font-size:16px; color:#111827;">${title}</p>
        ${content}
      </li>`
		})
		.join("")

	const stepsHtml = `<ol class="qti-steps" style="margin:16px 0; padding:0; list-style:none; counter-reset: qti-step;">${stepItems}</ol>`

	return preambleHtml + stepsHtml
}
