import * as errors from "@superbuilders/errors"
import { XMLParser } from "fast-xml-parser"
import * as he from "he"
import { VOID_ELEMENTS } from "./constants"
import { createDocument } from "./dom"
import type { StimulusIssue } from "./types"

const ALLOWED_NAMED_ENTITIES = new Set(["amp", "lt", "gt", "quot", "apos"])
const NAMED_ENTITY_PATTERN = /&([a-zA-Z][a-zA-Z0-9]+);/g
const NUMERIC_ENTITY_PATTERN = /&#(?:x[0-9a-fA-F]+|\d+);/g

const xmlParser = new XMLParser({
	ignoreAttributes: false,
	allowBooleanAttributes: false,
	trimValues: false,
	processEntities: true
})

export function validateHtml(html: string): StimulusIssue[] {
	const documentResult = errors.trySync(() => createDocument(html))
	if (documentResult.error) {
		const message = getErrorMessage(documentResult.error)
		return [
			{
				severity: "error",
				code: "html-parse-error",
				message: `HTML validation failed: ${message}`
			}
		]
	}

	const doc = documentResult.data
	const body = doc.body
	if (!body) {
		return [
			{
				severity: "error",
				code: "html-parse-error",
				message: "Parsed HTML does not contain a body element."
			}
		]
	}

	const article = body.querySelector("article")
	if (!article) {
		return [
			{
				severity: "error",
				code: "html-missing-article",
				message: "Stimulus output must contain a top-level <article> element."
			}
		]
	}

	if (article !== body.firstElementChild || body.childElementCount !== 1) {
		return [
			{
				severity: "error",
				code: "html-extra-content",
				message: "Stimulus output must contain exactly one <article> as the root element."
			}
		]
	}

	const issues: StimulusIssue[] = []
	issues.push(...collectEntityIssues(html))
	if (containsCdata(article)) {
		issues.push({
			severity: "error",
			code: "cdata-not-allowed",
			message: "Found CDATA section in stimulus HTML; CDATA is not permitted."
		})
	}

	const xmlString = `<?xml version="1.0" encoding="UTF-8"?>${serializeElementToXml(article)}`
	const xmlParseResult = errors.trySync(() => xmlParser.parse(xmlString))
	if (xmlParseResult.error) {
		const message = getErrorMessage(xmlParseResult.error)
		issues.push({
			severity: "error",
			code: "xml-parse-error",
			message: `XML validation failed: ${message}`
		})
	}

	return issues
}

function collectEntityIssues(html: string): StimulusIssue[] {
	const issues: StimulusIssue[] = []
	const numericEntities = new Set<string>()
	for (
		let numericMatch = NUMERIC_ENTITY_PATTERN.exec(html);
		numericMatch;
		numericMatch = NUMERIC_ENTITY_PATTERN.exec(html)
	) {
		numericEntities.add(numericMatch[0])
	}
	for (
		let namedMatch = NAMED_ENTITY_PATTERN.exec(html);
		namedMatch;
		namedMatch = NAMED_ENTITY_PATTERN.exec(html)
	) {
		const entity = namedMatch[0]
		if (numericEntities.has(entity)) {
			continue
		}
		const name = namedMatch[1]
		if (!ALLOWED_NAMED_ENTITIES.has(name)) {
			issues.push({
				severity: "error",
				code: "disallowed-html-entity",
				message: `Found disallowed HTML entity: ${entity}`
			})
		}
	}
	return issues
}

function serializeElementToXml(element: Element): string {
	const tag = element.tagName.toLowerCase()
	const attrs = Array.from(element.attributes)
		.map((attr) => `${attr.name}="${escapeXmlAttribute(attr.value)}"`)
		.join(" ")
	const attrString = attrs.length > 0 ? ` ${attrs}` : ""

	if (VOID_ELEMENTS.has(tag)) {
		return `<${tag}${attrString} />`
	}

	const childXml = Array.from(element.childNodes)
		.map((child) => serializeNodeToXml(child))
		.join("")
	return `<${tag}${attrString}>${childXml}</${tag}>`
}

function serializeNodeToXml(node: Node): string {
	if (node instanceof Element) {
		return serializeElementToXml(node)
	}
	if (node instanceof Text) {
		return escapeXmlText(node.nodeValue ?? "")
	}
	if (node instanceof CDATASection) {
		return escapeXmlText(node.data)
	}
	return ""
}

function escapeXmlAttribute(value: string): string {
	return he.encode(value, { useNamedReferences: false })
}

function escapeXmlText(value: string): string {
	return he.encode(value, { useNamedReferences: false })
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error)
}

function containsCdata(root: Node): boolean {
	if (root instanceof CDATASection) {
		return true
	}
	for (const child of Array.from(root.childNodes)) {
		if (containsCdata(child)) {
			return true
		}
	}
	return false
}
