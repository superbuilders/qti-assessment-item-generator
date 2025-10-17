import {
	ALLOWED_GLOBAL_ATTRIBUTES,
	DEFAULT_REMOVAL_SELECTORS,
	TAG_ATTRIBUTE_WHITELIST
} from "./constants"
import type { StimulusIssue, StimulusOptions } from "./types"

const BOOLEAN_ATTRIBUTES = new Set(["allowfullscreen"])

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
	const selectors = options?.removeSelectors ?? DEFAULT_REMOVAL_SELECTORS
	for (const selector of selectors) {
		for (const node of Array.from(document.querySelectorAll(selector))) {
			node.remove()
		}
	}

	stripComments(document)
	stripDisallowedAttributes(document, issues)
	collapseWhitespace(document.body)
}

function stripComments(document: Document) {
	const walker = document.createTreeWalker(document, NODE_FILTER.SHOW_COMMENT)
	const nodes: Comment[] = []
	let current = walker.nextNode()
	while (current) {
		if (current instanceof Comment) {
			nodes.push(current)
		}
		current = walker.nextNode()
	}
	for (const comment of nodes) {
		comment.remove()
	}
}

function stripDisallowedAttributes(document: Document, issues: StimulusIssue[]) {
	const walker = document.createTreeWalker(document, NODE_FILTER.SHOW_ELEMENT)
	let current = walker.nextNode()
	while (current) {
		if (!(current instanceof Element)) {
			current = walker.nextNode()
			continue
		}
		const element = current
		const tag = element.tagName.toLowerCase()
		const allowed = TAG_ATTRIBUTE_WHITELIST[tag] ?? new Set<string>()
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

function collapseWhitespace(root: Element | null) {
	if (!root) return
	const ownerDocument = root.ownerDocument
	if (!ownerDocument) return
	const walker = ownerDocument.createTreeWalker(root, NODE_FILTER.SHOW_TEXT)
	const nodes: Text[] = []
	let current = walker.nextNode()
	while (current) {
		if (current instanceof Text) {
			nodes.push(current)
		}
		current = walker.nextNode()
	}
	for (const node of nodes) {
		const value = node.nodeValue ?? ""
		const normalized = value.replace(/\u00a0/g, " ").replace(/\s+/g, " ")
		if (normalized.trim().length === 0) {
			node.nodeValue = normalized.includes(" ") ? " " : ""
		} else {
			node.nodeValue = normalized
		}
	}
}
