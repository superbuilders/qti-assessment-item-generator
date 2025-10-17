import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import * as he from "he"
import { VOID_ELEMENTS } from "./constants"

export function serializeArticle(article: Element): string {
	const clone = article.cloneNode(true)
	if (!(clone instanceof Element)) {
		return serializeNode(article)
	}
	return serializeNode(clone)
}

function serializeNode(node: Node): string {
	if (node instanceof Element) {
		return serializeElement(node)
	}
	if (node instanceof Text) {
		const value = readTextValue(node, "serializeNode:text")
		return he.encode(value, {
			useNamedReferences: false
		})
	}
	if (node instanceof CDATASection) {
		return he.encode(node.data, {
			useNamedReferences: false
		})
	}
	return ""
}

function serializeElement(element: Element): string {
	const tag = element.tagName.toLowerCase()
	const attrs: string[] = []
	for (const attr of Array.from(element.attributes)) {
		const name = attr.name
		const value = attr.value
		attrs.push(`${name}="${escapeAttribute(value)}"`)
	}
	const attrString = attrs.length > 0 ? ` ${attrs.join(" ")}` : ""
	if (VOID_ELEMENTS.has(tag)) {
		return `<${tag}${attrString} />`
	}
	const children = Array.from(element.childNodes)
	const childString = children.map(serializeNode).join("")
	return `<${tag}${attrString}>${childString}</${tag}>`
}

function escapeAttribute(value: string): string {
	return he.encode(value, {
		useNamedReferences: false
	})
}

function readTextValue(node: Text, context: string): string {
	const value = node.nodeValue
	if (value === null) {
		logger.error("serializeNode encountered text node without value", { context })
		throw errors.new("serializeNode: text node missing value")
	}
	return value
}
