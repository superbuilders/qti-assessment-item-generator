import { readFileSync, existsSync } from "node:fs"
import * as path from "node:path"
import type { Logger } from "@superbuilders/slog"

const WIDGET_GENERATORS_ROOT = path.resolve("src/widgets/generators")

const WIDGET_PATH_OVERRIDES: Record<string, string> = {
	threeDIntersectionDiagram: "3d-intersection-diagram"
}

const widgetSourceCache = new Map<string, string>()

function camelToKebab(value: string): string {
	return value
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/_/g, "-")
		.toLowerCase()
}

function resolveGeneratorPath(widgetType: string): string {
	const override = WIDGET_PATH_OVERRIDES[widgetType]
	if (override) {
		return path.join(WIDGET_GENERATORS_ROOT, `${override}.ts`)
	}
	const kebab = camelToKebab(widgetType)
	return path.join(WIDGET_GENERATORS_ROOT, `${kebab}.ts`)
}

function loadWidgetSource(widgetType: string, logger: Logger): string | null {
	if (widgetSourceCache.has(widgetType)) {
		return widgetSourceCache.get(widgetType) ?? null
	}
	const generatorPath = resolveGeneratorPath(widgetType)
	if (!existsSync(generatorPath)) {
		logger.warn("widget generator source not found", {
			widgetType,
			generatorPath
		})
		widgetSourceCache.set(widgetType, "")
		return null
	}
	const source = readFileSync(generatorPath, "utf-8")
	widgetSourceCache.set(widgetType, source)
	return source
}

export function createWidgetHelperSections(
	logger: Logger,
	allowedWidgets: readonly string[]
): string[] {
	const uniqueWidgets = Array.from(new Set(allowedWidgets))
	const sections: string[] = []
	for (const widget of uniqueWidgets) {
		const source = loadWidgetSource(widget, logger)
		if (!source) continue
		sections.push(
			`### WIDGET_HELPER_${widget.toUpperCase()}
<widget_helper type="${widget}">
${source.trim()}
</widget_helper>`
		)
	}
	return sections
}

