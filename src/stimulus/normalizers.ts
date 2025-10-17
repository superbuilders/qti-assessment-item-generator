import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { BLOCK_ELEMENTS, INLINE_ELEMENTS, VOID_ELEMENTS } from "@/stimulus/constants"
import { createDocument } from "@/stimulus/dom"
import { isElementNode, isTextNode } from "@/stimulus/dom-utils"
import type { StimulusIssue } from "@/stimulus/types"

const NODE_FILTER = {
	SHOW_ELEMENT: 1
} as const

export function normalizeStructure(
	document: Document,
	issues: StimulusIssue[]
): Element {
	const sourceRoot = resolveSourceRoot(document)

	removeEmptyElements(sourceRoot)
	fixParagraphChildren(sourceRoot, issues)
	normalizeLists(sourceRoot, issues)
	unwrapRedundantContainers(sourceRoot, issues)
	normalizeIframes(sourceRoot)

	const articleDoc = createDocument("<article></article>")
	const article = resolveArticleContainer(articleDoc)
	const articleDocument = article.ownerDocument

	for (const child of Array.from(sourceRoot.childNodes)) {
		if (isTextNode(child)) {
			const text = readTextValue(child, "normalizeStructure:sourceRootChild")
			if (text.trim().length === 0) continue
		}
		const imported = articleDocument.importNode(child, true)
		article.appendChild(imported)
	}

	if (!article.hasChildNodes()) {
		article.appendChild(articleDocument.createElement("p"))
		issues.push({
			severity: "warning",
			code: "empty-article",
			message: "Article content was empty; inserted placeholder paragraph."
		})
	}

	return article
}

const PRESERVE_IF_EMPTY = new Set(["iframe", "svg", "math", "video", "audio", "canvas"])

function removeEmptyElements(root: Element) {
	const walker = root.ownerDocument.createTreeWalker(
		root,
		NODE_FILTER.SHOW_ELEMENT
	)
	const empty: Element[] = []
	let current = walker.nextNode()
	while (current) {
		if (isElementNode(current)) {
			const tag = current.tagName.toLowerCase()
			const hasNoChildren = current.childNodes.length === 0
			const hasOnlyEmptyText =
				current.childNodes.length === 1 &&
				isTextNode(current.firstChild) &&
				readTextValue(
					current.firstChild,
					"removeEmptyElements:firstChild"
				).trim().length === 0

			if (!hasNoChildren && !hasOnlyEmptyText) {
				current = walker.nextNode()
				continue
			}

			const hasAttributes = current.attributes.length > 0
			const isVoid = VOID_ELEMENTS.has(tag)
			const isPreserved = hasAttributes || isVoid || PRESERVE_IF_EMPTY.has(tag)

			if (isPreserved) {
				current = walker.nextNode()
				continue
			}

			if (hasNoChildren) {
				empty.push(current)
				current = walker.nextNode()
				continue
			}

			if (hasOnlyEmptyText) {
				empty.push(current)
			}
		}

		current = walker.nextNode()
	}
	for (const node of empty) {
		if (node.tagName.toLowerCase() === "body") continue
		node.remove()
	}
}

function fixParagraphChildren(root: Element, issues: StimulusIssue[]) {
	for (const p of Array.from(root.querySelectorAll("p"))) {
		let containsBlock = false
		for (const child of Array.from(p.childNodes)) {
			if (!isElementNode(child)) continue
			const tag = child.tagName.toLowerCase()
			if (BLOCK_ELEMENTS.has(tag) && tag !== "a" && tag !== "span") {
				containsBlock = true
				break
			}
		}
		if (!containsBlock) continue
		const replacement = root.ownerDocument.createElement("div")
		for (const attr of Array.from(p.attributes)) {
			replacement.setAttribute(attr.name, attr.value)
		}
		while (p.firstChild) {
			replacement.appendChild(p.firstChild)
		}
		p.replaceWith(replacement)
		issues.push({
			severity: "info",
			code: "paragraph-block-children",
			message: "Replaced paragraph containing block-level content with a <div>."
		})
	}
}

function normalizeLists(root: Element, issues: StimulusIssue[]) {
	for (const list of Array.from(root.querySelectorAll("ul,ol"))) {
		const needsWrap: Element[] = []
		for (const child of Array.from(list.children)) {
			if (child.tagName.toLowerCase() !== "li") {
				needsWrap.push(child)
			}
		}
		if (needsWrap.length === 0 && list.children.length > 0) continue
		const replacement: Element[] = []
		for (const child of Array.from(list.childNodes)) {
			if (isTextNode(child)) {
				const value = readTextValue(child, "normalizeLists:listChild")
				if (value.trim().length === 0) continue
				const li = root.ownerDocument.createElement("li")
				li.textContent = value.trim()
				replacement.push(li)
				child.remove()
				continue
			}
			if (isElementNode(child)) {
				if (child.tagName.toLowerCase() === "li") continue
				const li = root.ownerDocument.createElement("li")
				li.appendChild(child)
				replacement.push(li)
			}
		}
		for (const li of replacement) {
			list.appendChild(li)
		}
		if (needsWrap.length > 0 || replacement.length > 0) {
			issues.push({
				severity: "info",
				code: "list-normalized",
				message: "Normalized list structure to ensure valid HTML."
			})
		}
	}
}

function unwrapRedundantContainers(root: Element, issues: StimulusIssue[]) {
	for (const div of Array.from(root.querySelectorAll("div"))) {
		if (div.childElementCount === 1 && div.textContent?.trim().length === 0) {
			const child = div.firstElementChild
			if (
				child &&
				(BLOCK_ELEMENTS.has(child.tagName.toLowerCase()) ||
					INLINE_ELEMENTS.has(child.tagName.toLowerCase()))
			) {
				div.replaceWith(child)
				issues.push({
					severity: "info",
					code: "div-unwrap",
					message: "Unwrapped redundant <div> container."
				})
			}
		}
	}
}

function normalizeIframes(root: Element) {
	for (const iframe of Array.from(root.querySelectorAll("iframe"))) {
		if (!iframe.getAttribute("title")) {
			iframe.setAttribute("title", "Embedded media")
		}
		iframe.setAttribute("allowfullscreen", "allowfullscreen")
	}
}

function resolveSourceRoot(document: Document): Element {
	if (document.body) return document.body
	if (document.documentElement) return document.documentElement
	logger.error("document missing root element")
	throw errors.new("normalizeStructure: document missing root element")
}

function resolveArticleContainer(document: Document): Element {
	const article = document.querySelector("article")
	if (article) return article
	logger.error("article container missing in generated document")
	throw errors.new("normalizeStructure: article container missing")
}

function readTextValue(node: Text, context: string): string {
	const value = node.nodeValue
	if (value === null) {
		logger.error("text node missing value", { context })
		throw errors.new(`normalizeStructure: ${context} text node missing value`)
	}
	return value
}
