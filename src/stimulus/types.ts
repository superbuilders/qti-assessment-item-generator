export type IssueSeverity = "info" | "warning" | "error"

export interface StimulusIssue {
	severity: IssueSeverity
	code: string
	message: string
	details?: Record<string, unknown>
}

export interface StimulusInput {
	html: string
	title?: string
	sourcePath?: string
}

export interface StimulusOptions {
	removeSelectors?: string[]
	strict?: boolean
}

export interface StimulusAsset {
	type: "image" | "iframe" | "link" | "other"
	url: string
}

export interface StimulusBuildResult {
	html: string
	issues: StimulusIssue[]
	assets: StimulusAsset[]
}
