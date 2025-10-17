import { describe, expect, test } from "bun:test"
import * as fs from "node:fs"
import * as path from "node:path"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { CanvasPageData } from "@/stimulus/builder"
import { buildStimulusFromPageData } from "@/stimulus/builder"

interface StimulusFixture {
	slugPath: string
	page: CanvasPageData
}

function collectStimulusFixtures(): StimulusFixture[] {
	const fixturesRoot = path.resolve(
		process.cwd(),
		"tests/fixtures/stimulus/page-data"
	)
	if (!fs.existsSync(fixturesRoot)) {
		logger.error("stimulus fixtures missing", { fixturesRoot })
		throw errors.new(
			"stimulus fixtures directory missing; run fixture sync or restore test assets"
		)
	}

	const pageDataFiles: string[] = []
	const stack: string[] = [fixturesRoot]
	while (stack.length > 0) {
		const current = stack.pop()
		if (!current) continue
		const dirents = fs.readdirSync(current, { withFileTypes: true })
		for (const dirent of dirents) {
			const fullPath = path.join(current, dirent.name)
			if (dirent.isDirectory()) {
				stack.push(fullPath)
			} else if (dirent.isFile() && dirent.name === "page-data.json") {
				pageDataFiles.push(fullPath)
			}
		}
	}

	pageDataFiles.sort()

	return pageDataFiles.map((filePath) => {
		const raw = fs.readFileSync(filePath, "utf8")
		const parsedResult = errors.trySync<unknown>(() => JSON.parse(raw))
		if (parsedResult.error) {
			logger.error("stimulus fixture parse failed", {
				filePath,
				error: parsedResult.error
			})
			throw errors.wrap(parsedResult.error, `failed to parse ${filePath}`)
		}
		const parsedValue = parsedResult.data
		if (!isCanvasPageData(parsedValue)) {
			logger.error("stimulus fixture schema mismatch", { filePath })
			throw errors.new(`fixture ${filePath} is not valid CanvasPageData`)
		}
		const slugPath = path
			.relative(fixturesRoot, path.dirname(filePath))
			.split(path.sep)
			.filter(Boolean)
			.join("/")
		return { slugPath, page: parsedValue }
	})
}

const stimulusFixtures = collectStimulusFixtures()

describe("Canvas stimulus HTML generation", () => {
	test("discovered stimulus page-data fixtures", () => {
		expect(stimulusFixtures.length).toBeGreaterThan(0)
	})

	for (const fixture of stimulusFixtures) {
		test(`renders HTML for ${fixture.slugPath}`, () => {
			const result = buildStimulusFromPageData(fixture.page)
			expect(result).toBeDefined()
			if (!result) return

			const fatalIssues = result.issues.filter(
				(issue) => issue.severity === "error"
			)
			expect(fatalIssues).toHaveLength(0)

			const warnings = result.issues.filter(
				(issue) => issue.severity === "warning"
			)
			expect(warnings).toHaveLength(0)

			expect(result.html.startsWith("<article")).toBeTrue()
			const articleOpenIndex = result.html.indexOf("<article")
			expect(articleOpenIndex).toBe(0)
			const articleCloseIndex = result.html.lastIndexOf("</article>")
			expect(articleCloseIndex).toBeGreaterThan(articleOpenIndex)
		})
	}
})

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null
}

function isCanvasPageData(value: unknown): value is CanvasPageData {
	if (!isRecord(value)) return false
	if (
		"title" in value &&
		value.title !== undefined &&
		typeof value.title !== "string"
	) {
		return false
	}
	if (!("mainContent" in value) || value.mainContent === undefined) {
		return true
	}
	const mainContent = value.mainContent
	if (!isRecord(mainContent)) return false
	if (
		"html" in mainContent &&
		mainContent.html !== undefined &&
		typeof mainContent.html !== "string"
	) {
		return false
	}
	if (
		"text" in mainContent &&
		mainContent.text !== undefined &&
		typeof mainContent.text !== "string"
	) {
		return false
	}
	return true
}
