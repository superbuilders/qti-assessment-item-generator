import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import {
	ALLOWED_GLOBAL_ATTRIBUTES,
	DEFAULT_REMOVAL_SELECTORS,
	TAG_ATTRIBUTE_WHITELIST
} from "@/stimulus/constants"
import { isCommentNode, isElementNode, isTextNode } from "@/stimulus/dom-utils"
import type { StimulusIssue, StimulusOptions } from "@/stimulus/types"

const BOOLEAN_ATTRIBUTES = new Set(["allowfullscreen"])

const DISALLOWED_ELEMENTS = new Set([
	"style",
	"script",
	"link",
	"input",
	"button"
])

const NODE_FILTER = {
	SHOW_ELEMENT: 1,
	SHOW_TEXT: 4,
	SHOW_COMMENT: 128
} as const

export function sanitizeDocument(
	document: Document,
	issues: StimulusIssue[],
	options: StimulusOptions | undefined
): void {
	const selectors =
		options && Array.isArray(options.removeSelectors)
			? options.removeSelectors
			: DEFAULT_REMOVAL_SELECTORS
	if (!options || options.removeSelectors === undefined) {
		logger.debug("sanitizeDocument using default removal selectors")
	}
	for (const selector of selectors) {
		for (const node of Array.from(document.querySelectorAll(selector))) {
			node.remove()
		}
	}

	stripComments(document)
	stripDisallowedElements(document, issues)
	stripDisallowedAttributes(document, issues)
	collapseWhitespace(document.body)
}

function stripDisallowedElements(document: Document, issues: StimulusIssue[]) {
	for (const tag of DISALLOWED_ELEMENTS) {
		for (const element of Array.from(document.querySelectorAll(tag))) {
			const parentTag = element.parentElement?.tagName.toLowerCase()
			element.remove()
			issues.push({
				severity: "info",
				code: "element-removed",
				message: parentTag
					? `Removed disallowed <${tag}> element from <${parentTag}>.`
					: `Removed disallowed <${tag}> element.`
			})
		}
	}
}

const PRESERVE_WHITESPACE_TAGS = new Set(["pre", "code"])

function isWithinPreformatted(node: Node | null): boolean {
	let current: Node | null = node ? node.parentNode : null
	while (current) {
		if (isElementNode(current)) {
			const tag = current.tagName.toLowerCase()
			if (PRESERVE_WHITESPACE_TAGS.has(tag)) {
				return true
			}
		}
		current = current.parentNode
	}
	return false
}

function collapseWhitespace(root: Element | null) {
	if (!root) return
	const ownerDocument = root.ownerDocument
	if (!ownerDocument) return
	const walker = ownerDocument.createTreeWalker(root, NODE_FILTER.SHOW_TEXT)
	const nodes: Text[] = []
	let current = walker.nextNode()
	while (current) {
		if (isTextNode(current)) {
			nodes.push(current)
		}
		current = walker.nextNode()
	}
	for (const node of nodes) {
		if (isWithinPreformatted(node)) {
			continue
		}
		const value = node.nodeValue
		if (value === null) {
			logger.error("text node missing value during whitespace collapse")
			throw errors.new("text node missing value")
		}
		const normalized = value.replace(/\u00a0/g, " ").replace(/\s+/g, " ")
		if (normalized.trim().length === 0) {
			node.nodeValue = ""
			continue
		}
		let nextValue = normalized
		if (nextValue.startsWith(" ") && !hasPreviousContent(node)) {
			nextValue = nextValue.replace(/^ +/, "")
		}
		if (nextValue.endsWith(" ") && !hasNextContent(node)) {
			nextValue = nextValue.replace(/ +$/, "")
		}
		node.nodeValue = nextValue
	}
}

function hasPreviousContent(node: Node): boolean {
	let sibling: Node | null = node.previousSibling
	while (sibling) {
		if (isTextNode(sibling)) {
			const text = sibling.nodeValue
			if (text === null) {
				logger.error("text sibling missing value during whitespace collapse")
				throw errors.new("text sibling missing value")
			}
			if (text.trim().length > 0) {
				return true
			}
		} else if (isElementNode(sibling)) {
			if (sibling.textContent?.trim().length) {
				return true
			}
		}
		sibling = sibling.previousSibling
	}
	return false
}

function hasNextContent(node: Node): boolean {
	let sibling: Node | null = node.nextSibling
	while (sibling) {
		if (isTextNode(sibling)) {
			const text = sibling.nodeValue
			if (text === null) {
				logger.error("text sibling missing value during whitespace collapse")
				throw errors.new("text sibling missing value")
			}
			if (text.trim().length > 0) {
				return true
			}
		} else if (isElementNode(sibling)) {
			if (sibling.textContent?.trim().length) {
				return true
			}
		}
		sibling = sibling.nextSibling
	}
	return false
}

function stripComments(document: Document) {
	const walker = document.createTreeWalker(document, NODE_FILTER.SHOW_COMMENT)
	const nodes: Comment[] = []
	let current = walker.nextNode()
	while (current) {
		if (isCommentNode(current)) {
			nodes.push(current)
		}
		current = walker.nextNode()
	}
	for (const comment of nodes) {
		comment.remove()
	}
}

function stripDisallowedAttributes(
	document: Document,
	issues: StimulusIssue[]
) {
	const walker = document.createTreeWalker(document, NODE_FILTER.SHOW_ELEMENT)
	let current = walker.nextNode()
	while (current) {
		if (!isElementNode(current)) {
			current = walker.nextNode()
			continue
		}
		const element = current
		const tag = element.tagName.toLowerCase()
		const allowed =
			TAG_ATTRIBUTE_WHITELIST[tag] !== undefined
				? TAG_ATTRIBUTE_WHITELIST[tag]
				: new Set<string>()
		for (const attr of Array.from(element.attributes)) {
			const name = attr.name.toLowerCase()
			const keep = allowed.has(name) || ALLOWED_GLOBAL_ATTRIBUTES.has(name)
			if (!keep) {
				element.removeAttribute(attr.name)
				issues.push({
					severity: "info",
					code: "attribute-stripped",
					message: `Removed attribute ${attr.name} from <${tag}>`
				})
				continue
			}
			if (BOOLEAN_ATTRIBUTES.has(name)) {
				element.setAttribute(name, name)
			}
		}
		current = walker.nextNode()
	}
}
