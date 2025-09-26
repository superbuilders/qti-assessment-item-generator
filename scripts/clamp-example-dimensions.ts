#!/usr/bin/env bun

import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import {
	SVG_DIAGRAM_HEIGHT_MAX,
	SVG_DIAGRAM_HEIGHT_MIN,
	SVG_DIAGRAM_WIDTH_MAX,
	SVG_DIAGRAM_WIDTH_MIN
} from "../src/utils/constants"

/**
 * Script to clamp all width/height values in example files to respect
 * the min/max constants defined in src/utils/constants.ts
 */

function clampValue(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value))
}

function processExampleFile(filePath: string): void {
	logger.info("processing example file", { filePath })

	const contentResult = errors.trySync(() => readFileSync(filePath, "utf-8"))
	if (contentResult.error) {
		logger.error("failed to read file", { error: contentResult.error, filePath })
		throw errors.wrap(contentResult.error, "file read")
	}

	let content = contentResult.data
	let modified = false

	// Match width: <number> patterns (both with and without quotes)
	const widthRegex = /(\s+(?:")?width(?:")?\s*:\s*)(\d+(?:\.\d+)?)([,\s])/g
	content = content.replace(widthRegex, (_match, prefix, widthStr, suffix) => {
		const originalWidth = Number.parseFloat(widthStr)
		const clampedWidth = clampValue(originalWidth, SVG_DIAGRAM_WIDTH_MIN, SVG_DIAGRAM_WIDTH_MAX)

		if (originalWidth !== clampedWidth) {
			logger.debug("clamping width", {
				filePath,
				original: originalWidth,
				clamped: clampedWidth
			})
			modified = true
		}

		return `${prefix}${clampedWidth}${suffix}`
	})

	// Match height: <number> patterns (both with and without quotes)
	const heightRegex = /(\s+(?:")?height(?:")?\s*:\s*)(\d+(?:\.\d+)?)([,\s])/g
	content = content.replace(heightRegex, (_match, prefix, heightStr, suffix) => {
		const originalHeight = Number.parseFloat(heightStr)
		const clampedHeight = clampValue(originalHeight, SVG_DIAGRAM_HEIGHT_MIN, SVG_DIAGRAM_HEIGHT_MAX)

		if (originalHeight !== clampedHeight) {
			logger.debug("clamping height", {
				filePath,
				original: originalHeight,
				clamped: clampedHeight
			})
			modified = true
		}

		return `${prefix}${clampedHeight}${suffix}`
	})

	if (modified) {
		const writeResult = errors.trySync(() => writeFileSync(filePath, content, "utf-8"))
		if (writeResult.error) {
			logger.error("failed to write file", { error: writeResult.error, filePath })
			throw errors.wrap(writeResult.error, "file write")
		}
		logger.info("updated file with clamped dimensions", { filePath })
	} else {
		logger.debug("no changes needed", { filePath })
	}
}

function main(): void {
	logger.info("starting dimension clamping", {
		widthMin: SVG_DIAGRAM_WIDTH_MIN,
		widthMax: SVG_DIAGRAM_WIDTH_MAX,
		heightMin: SVG_DIAGRAM_HEIGHT_MIN,
		heightMax: SVG_DIAGRAM_HEIGHT_MAX
	})

	// Process examples directory
	const examplesDir = join(process.cwd(), "examples")

	const readExamplesDirResult = errors.trySync(() => readdirSync(examplesDir))
	if (readExamplesDirResult.error) {
		logger.error("failed to read examples directory", { error: readExamplesDirResult.error })
		throw errors.wrap(readExamplesDirResult.error, "directory read")
	}

	const exampleFiles = readExamplesDirResult.data.filter((file) => file.endsWith(".ts"))
	logger.info("found example files", { count: exampleFiles.length })

	let processedCount = 0
	for (const file of exampleFiles) {
		const filePath = join(examplesDir, file)
		processExampleFile(filePath)
		processedCount++
	}

	// Process test files
	const testWidgetsDir = join(process.cwd(), "tests", "widgets")

	const readTestDirResult = errors.trySync(() => readdirSync(testWidgetsDir))
	if (readTestDirResult.error) {
		logger.error("failed to read test widgets directory", { error: readTestDirResult.error })
		throw errors.wrap(readTestDirResult.error, "directory read")
	}

	const testFiles = readTestDirResult.data.filter((file) => file.endsWith(".test.ts"))
	logger.info("found test files", { count: testFiles.length })

	for (const file of testFiles) {
		const filePath = join(testWidgetsDir, file)
		processExampleFile(filePath)
		processedCount++
	}

	logger.info("dimension clamping completed", { processedCount })
}

// run the script
const result = errors.trySync(() => main())
if (result.error) {
	logger.error("script failed", { error: result.error })
	process.exit(1)
}
