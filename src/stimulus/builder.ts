import { collectAssets } from "./assets"
import { createDocument } from "./dom"
import { normalizeStructure } from "./normalizers"
import { sanitizeDocument } from "./sanitizers"
import { serializeArticle } from "./serializer"
import type { StimulusBuildResult, StimulusInput, StimulusIssue, StimulusOptions } from "./types"
import { validateHtml } from "./validator"

export type { StimulusAsset, StimulusBuildResult, StimulusIssue, StimulusOptions } from "./types"

export interface CanvasPageData {
	title?: string
	mainContent?: {
		html?: string
		text?: string
	}
}

export function buildStimulusFromHtml(
	input: StimulusInput,
	options?: StimulusOptions
): StimulusBuildResult {
	const issues: StimulusIssue[] = []
	const document = createDocument(input.html)
	sanitizeDocument(document, issues, options)
	const article = normalizeStructure(document, issues)
	const html = serializeArticle(article)
	const validationIssues = validateHtml(html)
	const assets = collectAssets(article)
	return {
		html,
		issues: [...issues, ...validationIssues],
		assets
	}
}

export function buildStimulusFromPageData(
	page: CanvasPageData,
	options?: StimulusOptions
): StimulusBuildResult | undefined {
	const html = page.mainContent?.html
	if (!html || html.trim().length === 0) {
		return undefined
	}
	return buildStimulusFromHtml({ html, title: page.title }, options)
}
