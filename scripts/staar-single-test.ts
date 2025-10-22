#!/usr/bin/env bun

import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import OpenAI from "openai"
import { compile } from "@/compiler/compiler"
import { generateFromEnvelope } from "@/structured/client"
import type { AiContextEnvelope, RasterImagePayload } from "@/structured/types"
import { teksMath4Collection } from "@/widgets/collections/teks-math-4"

// Enable debug logging for this script
logger.setDefaultLogLevel(logger.DEBUG)
logger.info("staar single test generator started with debug logging enabled")

// --- Configuration ---
const WIDGET_COLLECTION = teksMath4Collection

const QUESTION_DIR_ARG = process.argv[2]
const OUTPUT_DIR_ARG = process.argv[3]

if (!QUESTION_DIR_ARG) {
	logger.error("question directory not provided")
	throw errors.new(
		"Usage: bun run scripts/staar-single-test.ts <question-dir> <output-dir>"
	)
}
if (!OUTPUT_DIR_ARG) {
	logger.error("output directory not provided")
	throw errors.new(
		"Usage: bun run scripts/staar-single-test.ts <question-dir> <output-dir>"
	)
}

const QUESTION_DIR: string = path.resolve(process.cwd(), QUESTION_DIR_ARG)
const OUTPUT_DIR: string = path.resolve(process.cwd(), OUTPUT_DIR_ARG)
// ---

/**
 * Finds the primary HTML file in a question directory.
 * @param dir - The absolute path to the question directory.
 * @returns The filename of the HTML file (e.g., "item-01.html").
 */
async function findHtmlFilename(dir: string): Promise<string> {
	const entriesResult = await errors.try(
		fs.readdir(dir, { withFileTypes: true })
	)
	if (entriesResult.error) {
		logger.error("failed to read directory to find html file", {
			dir,
			error: entriesResult.error
		})
		throw errors.wrap(entriesResult.error, "directory read")
	}

	const htmlFile = entriesResult.data.find(
		(e) => e.isFile() && /^item-\d{2}\.html$/i.test(e.name)
	)
	if (!htmlFile) {
		logger.error("no primary html file found in directory", { dir })
		throw errors.new(`no item-XX.html file found in ${dir}`)
	}
	return htmlFile.name
}

/**
 * Processes a single question directory, generating structured JSON and compiled XML.
 * @param dir - The absolute path to the question directory.
 * @param openai - The OpenAI client instance.
 */
async function processQuestionDir(dir: string, openai: OpenAI): Promise<void> {
	const questionDirName = path.basename(dir)
	logger.info("starting question processing", {
		questionDir: questionDirName,
		fullPath: dir
	})

	const htmlFilenameResult = await errors.try(findHtmlFilename(dir))
	if (htmlFilenameResult.error) {
		logger.error("failed to find html filename", {
			questionDir: questionDirName,
			error: htmlFilenameResult.error
		})
		throw htmlFilenameResult.error // Propagate error up
	}
	const htmlFilename = htmlFilenameResult.data
	logger.debug("found html file", {
		questionDir: questionDirName,
		htmlFilename
	})

	const htmlPath = path.join(dir, htmlFilename)
	const svgsDir = path.join(dir, "svgs")

	// 1. Read Primary HTML Content
	const htmlBytesResult = await errors.try(fs.readFile(htmlPath))
	if (htmlBytesResult.error) {
		logger.error("failed to read primary html file", {
			questionDir: questionDirName,
			file: htmlPath,
			error: htmlBytesResult.error
		})
		throw errors.wrap(htmlBytesResult.error, "html read")
	}
	const html = htmlBytesResult.data.toString("utf8")
	logger.debug("loaded html content", {
		questionDir: questionDirName,
		htmlLength: html.length,
		htmlPath
	})

	// 2. Read Supplementary SVG Content
	let supplementaryContent: string[] = []
	const svgEntriesResult = await errors.try(
		fs.readdir(svgsDir, { withFileTypes: true })
	)
	if (svgEntriesResult.error) {
		logger.debug("svgs directory not found or unreadable, skipping", {
			questionDir: questionDirName,
			svgsDir
		})
	} else {
		const svgFiles = svgEntriesResult.data.filter(
			(e) => e.isFile() && e.name.toLowerCase().endsWith(".svg")
		)
		logger.debug("found svg files", {
			questionDir: questionDirName,
			svgFileCount: svgFiles.length,
			svgFiles: svgFiles.map((f) => f.name)
		})

		const svgReads = await Promise.all(
			svgFiles.map(async (f) => {
				const p = path.join(svgsDir, f.name)
				const textResult = await errors.try(fs.readFile(p, "utf8"))
				if (textResult.error) {
					logger.warn("failed to read svg file, skipping", {
						questionDir: questionDirName,
						file: p,
						error: textResult.error
					})
					return null
				}
				logger.debug("loaded svg file", {
					questionDir: questionDirName,
					svgFile: f.name,
					svgLength: textResult.data.length
				})
				return `<!-- NAME: ${f.name} -->\n${textResult.data}`
			})
		)
		supplementaryContent = svgReads.filter(
			(content): content is string => content !== null
		)
		const totalSvgLength = supplementaryContent.reduce(
			(sum, content) => sum + content.length,
			0
		)
		logger.info("loaded supplementary svg content", {
			questionDir: questionDirName,
			svgCount: supplementaryContent.length,
			totalSvgLength,
			avgSvgLength:
				supplementaryContent.length > 0
					? Math.round(totalSvgLength / supplementaryContent.length)
					: 0
		})
	}

	// 2.5. Read screenshot.png for visual context
	const screenshotPath = path.join(dir, "screenshot.png")
	let screenshotPayload: RasterImagePayload | null = null
	const screenshotBytesResult = await errors.try(fs.readFile(screenshotPath))
	if (screenshotBytesResult.error) {
		logger.debug("screenshot.png not found, skipping visual context", {
			questionDir: questionDirName,
			screenshotPath
		})
	} else {
		const buf = screenshotBytesResult.data
		const arrayBuffer = buf.buffer.slice(
			buf.byteOffset,
			buf.byteOffset + buf.byteLength
		)
		screenshotPayload = {
			data: arrayBuffer,
			mimeType: "image/png"
		}
		logger.info("loaded screenshot for visual context", {
			questionDir: questionDirName,
			screenshotSize: screenshotBytesResult.data.length
		})
	}

	// 3. Construct AI Context Envelope
	const envelope: AiContextEnvelope = {
		primaryContent: html,
		supplementaryContent,
		multimodalImageUrls: [],
		multimodalImagePayloads: screenshotPayload ? [screenshotPayload] : [],
		pdfPayloads: []
	}

	const totalTextLength =
		html.length +
		supplementaryContent.reduce((sum, content) => sum + content.length, 0)
	logger.info("constructed ai context envelope", {
		questionDir: questionDirName,
		primaryContentLength: html.length,
		supplementaryContentCount: supplementaryContent.length,
		hasScreenshot: screenshotPayload !== null,
		totalTextLength,
		estimatedTokens: Math.round(totalTextLength / 4) // Rough estimate: ~4 chars per token
	})

	// Debug log the envelope contents for troubleshooting widget mapping issues
	logger.debug("envelope primaryContent", {
		questionDir: questionDirName,
		fullContent: html
	})

	if (supplementaryContent.length > 0) {
		logger.debug("envelope supplementaryContent", {
			questionDir: questionDirName,
			svgCount: supplementaryContent.length,
			allSvgs: supplementaryContent
		})
	}

	// 4. Generate Structured Item from Envelope
	logger.info("calling openai to generate structured item", {
		questionDir: questionDirName,
		collection: WIDGET_COLLECTION.name
	})
	const structuredResult = await errors.try(
		generateFromEnvelope(openai, logger, envelope, WIDGET_COLLECTION)
	)
	if (structuredResult.error) {
		logger.error("failed to generate structured item from envelope", {
			questionDir: questionDirName,
			totalTextLength,
			estimatedTokens: Math.round(totalTextLength / 4),
			error: structuredResult.error
		})
		throw errors.wrap(structuredResult.error, "generate from envelope")
	}
	const structuredItem = structuredResult.data
	logger.info("successfully generated structured item", {
		questionDir: questionDirName
	})

	const structuredJsonPath = path.join(
		OUTPUT_DIR,
		`${questionDirName}-structured-item.json`
	)
	const writeJsonResult = await errors.try(
		fs.writeFile(
			structuredJsonPath,
			JSON.stringify(structuredItem, null, 2),
			"utf8"
		)
	)
	if (writeJsonResult.error) {
		logger.error("failed to write structured item json", {
			questionDir: questionDirName,
			file: structuredJsonPath,
			error: writeJsonResult.error
		})
		throw errors.wrap(writeJsonResult.error, "json write")
	}
	logger.info("wrote structured item json", {
		questionDir: questionDirName,
		file: structuredJsonPath
	})

	// 5. Compile Structured Item to QTI XML
	logger.info("compiling structured item to qti xml", {
		questionDir: questionDirName
	})
	const compileResult = await errors.try(
		compile(structuredItem, WIDGET_COLLECTION)
	)
	if (compileResult.error) {
		logger.error("failed to compile structured item to qti", {
			questionDir: questionDirName,
			error: compileResult.error
		})
		throw errors.wrap(compileResult.error, "qti compilation")
	}
	const compiledXml = compileResult.data
	logger.info("successfully compiled to qti xml", {
		questionDir: questionDirName,
		xmlLength: compiledXml.length
	})

	const compiledXmlPath = path.join(
		OUTPUT_DIR,
		`${questionDirName}-compiled.xml`
	)
	const writeXmlResult = await errors.try(
		fs.writeFile(compiledXmlPath, compiledXml, "utf8")
	)
	if (writeXmlResult.error) {
		logger.error("failed to write compiled xml", {
			questionDir: questionDirName,
			file: compiledXmlPath,
			error: writeXmlResult.error
		})
		throw errors.wrap(writeXmlResult.error, "xml write")
	}
	logger.info("wrote compiled qti xml", {
		questionDir: questionDirName,
		file: compiledXmlPath
	})

	logger.info("completed question processing", { questionDir: questionDirName })
}

/**
 * Main function to process a single question directory.
 */
async function main() {
	if (!process.env.OPENAI_API_KEY) {
		logger.error("openai api key not set")
		throw errors.new("OPENAI_API_KEY environment variable is not set")
	}

	logger.info("validating directories", {
		questionDir: QUESTION_DIR,
		outputDir: OUTPUT_DIR
	})

	const questionDirResult = await errors.try(
		fs.access(QUESTION_DIR, fs.constants.F_OK)
	)
	if (questionDirResult.error) {
		logger.error("question directory does not exist", {
			questionDir: QUESTION_DIR,
			error: questionDirResult.error
		})
		throw errors.wrap(questionDirResult.error, "question directory validation")
	}

	const outputDirResult = await errors.try(
		fs.access(OUTPUT_DIR, fs.constants.F_OK)
	)
	if (outputDirResult.error) {
		logger.error("output directory does not exist", {
			outputDir: OUTPUT_DIR,
			error: outputDirResult.error
		})
		throw errors.wrap(outputDirResult.error, "output directory validation")
	}

	const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

	logger.info("starting single question test", {
		questionDir: QUESTION_DIR,
		collection: WIDGET_COLLECTION.name
	})

	const result = await errors.try(processQuestionDir(QUESTION_DIR, openai))
	if (result.error) {
		logger.error("question processing failed", {
			questionDir: QUESTION_DIR,
			error: result.error
		})
		throw result.error
	}

	logger.info("test completed successfully!")
}

// --- Script Execution ---
const result = await errors.try(main())
if (result.error) {
	logger.error("script failed to complete", { error: result.error })
	process.exit(1)
}

