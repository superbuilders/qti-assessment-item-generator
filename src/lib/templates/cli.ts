import "dotenv/config"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { createAi } from "@/templates/ai"
import { parseStructuredInput } from "@/templates/input"
import { generateTemplate } from "@/templates/orchestrator"

async function main() {
	const rawArgs = Bun.argv.slice(2)
	logger.debug("parsed cli arguments", { args: rawArgs })

	const debugFiles = rawArgs.includes("--debug-files")
	const args = rawArgs.filter((arg) => arg !== "--debug-files")

	const qtiPath = args.find((arg) => arg.startsWith("--qti="))?.split("=")[1]
	const outputPath = args.find((arg) => arg.startsWith("--out="))?.split("=")[1]

	if (!qtiPath || !outputPath) {
		logger.error("missing required arguments", {
			usage:
				"bun src/lib/templates/cli.ts --qti <structured-item.json> --out <output.ts> [--debug-files]"
		})
		process.exit(1)
	}

	const inputPath = path.resolve(qtiPath)
	const rawInputResult = await errors.try(fs.readFile(inputPath, "utf-8"))
	if (rawInputResult.error) {
		logger.error("failed to read structured item file", {
			file: qtiPath,
			error: rawInputResult.error
		})
		throw errors.wrap(rawInputResult.error, "cli: read structured item file")
	}
	logger.debug("loaded structured item json", {
		bytes: rawInputResult.data.length
	})

	const structuredInput = parseStructuredInput(logger, rawInputResult.data)
	const { sourceContext, allowedWidgets } = structuredInput

	logger.info("starting template generation from cli", {
		qtiPath,
		allowedWidgets,
		outputPath,
		debugFiles
	})

	const apiKey = process.env.OPENAI_API_KEY
	if (!apiKey) {
		logger.error("openai api key not set")
		throw errors.new("OPENAI_API_KEY environment variable is not set")
	}

	const ai = createAi(logger, apiKey)
	logger.info("constructed ai client for template generator")

	const generationResult = await errors.try(
		generateTemplate(logger, ai, {
			sourceContext,
			allowedWidgets,
			outputFilePath: path.resolve(outputPath),
			debugArtifacts: debugFiles
		})
	)
	if (generationResult.error) {
		logger.error("template generation failed", {
			error: generationResult.error
		})
		process.exit(1)
	}

	const result = generationResult.data
	if (!result) {
		logger.error("template generation returned empty result")
		process.exit(1)
	}

	if (!result.success) {
		logger.error("failed to generate template after max retries", {
			iterations: result.iterations,
			model: result.model,
			diagnostics: result.diagnostics
		})
		process.exit(1)
	}

	logger.info("template generated successfully", {
		filePath: result.filePath,
		iterations: result.iterations,
		model: result.model
	})
}

const mainResult = await errors.try(main())
if (mainResult.error) {
	logger.error("template generator cli exited with error", {
		error: mainResult.error
	})
	process.exit(1)
}
