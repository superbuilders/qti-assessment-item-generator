import { existsSync, readFileSync } from "node:fs"
import { resolveLibPath } from "@/internal/paths"

const ITEM_TYPES_PATH = resolveLibPath("core/item/types.ts")
const CONTENT_TYPES_PATH = resolveLibPath("core/content/types.ts")
const INTERACTION_TYPES_PATH = resolveLibPath("core/interactions/types.ts")

let cachedItemTypes: string | null = null
let cachedContentTypes: string | null = null
let cachedInteractionTypes: string | null = null

function renderSection(
	label: string,
	tag: string,
	path: string,
	getCache: () => string | null,
	setCache: (value: string | null) => void,
	caution: string
): string {
	let contents = getCache()

	if (contents === null) {
		if (!existsSync(path)) {
			setCache(null)
			return ""
		}
		contents = readFileSync(path, "utf-8")
		setCache(contents)
	}

	return `### ${label}
<${tag} source="${path}" caution="${caution}">
${contents}
</${tag}>`
}

export function createAssessmentItemTypesSection(): string {
	return renderSection(
		"ASSESSMENT_ITEM_TYPES",
		"assessment_item_types",
		ITEM_TYPES_PATH,
		() => cachedItemTypes,
		(value) => {
			cachedItemTypes = value
		},
		"Author output must conform to these exact TypeScript structures; do not introduce new variants."
	)
}

export function createContentTypesSection(): string {
	return renderSection(
		"CONTENT_TYPES",
		"content_types",
		CONTENT_TYPES_PATH,
		() => cachedContentTypes,
		(value) => {
			cachedContentTypes = value
		},
		"Inline and block content must match these unions; every entry requires the literal `type` values shown."
	)
}

export function createInteractionTypesSection(): string {
	return renderSection(
		"INTERACTION_TYPES",
		"interaction_types",
		INTERACTION_TYPES_PATH,
		() => cachedInteractionTypes,
		(value) => {
			cachedInteractionTypes = value
		},
		"Interaction definitions must use these shapes exactly, including literal `shuffle` values."
	)
}
