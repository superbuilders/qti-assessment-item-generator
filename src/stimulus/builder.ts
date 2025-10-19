import { collectAssets } from "@/stimulus/assets"
import { createDocument } from "@/stimulus/dom"
import { normalizeStructure } from "@/stimulus/normalizers"
import { sanitizeDocument } from "@/stimulus/sanitizers"
import { serializeArticle } from "@/stimulus/serializer"
import { applyInlineStyles } from "@/stimulus/styler"
import type {
	StimulusBuildResult,
	StimulusInput,
	StimulusIssue,
	StimulusOptions
} from "@/stimulus/types"
import { validateHtml } from "@/stimulus/validator"

export type {
	StimulusAsset,
	StimulusBuildResult,
	StimulusIssue,
	StimulusOptions
} from "@/stimulus/types"

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
	const sourceDocument = createDocument(input.html)
	sanitizeDocument(sourceDocument, issues, options)
	const article = normalizeStructure(sourceDocument, issues)

	applyInlineStyles(article, options)
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
