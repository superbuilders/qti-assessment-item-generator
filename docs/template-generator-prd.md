# PRD: Automated QTI Template Generator

## Overview

This document outlines the requirements for an automated workflow, the "Template Generator," designed to convert QTI XML assessment items into self-contained, type-safe TypeScript template files. The current process of manually authoring these templates is inefficient, inconsistent, and requires deep institutional knowledge, acting as a significant bottleneck in scaling our content migration to the new `TemplateModule` contract.

The proposed solution is a pipeline that ingests a raw QTI XML file, treats it as opaque context for an LLM, and orchestrates prompts to generate a TypeScript template. This generated code is then iteratively validated in-process using the TypeScript compiler API until it type-checks, ensuring correctness. This workflow will be exposed as a CLI tool for curriculum engineers and a programmatic API for integration, automating over 80% of the conversion process, drastically reducing manual effort, and ensuring all generated templates are consistent and immediately usable by our runtime.

## Goals

-   **G1: Automated Conversion:** Convert a single QTI 3 XML item and a specified widget into a compilable TypeScript template file that conforms to the `TemplateModule` contract.
-   **G2: Boilerplate Scaffolding:** Automatically generate all necessary imports, type definitions, and module export boilerplate, ensuring the generated code is consistent with repository standards.
-   **G3: Closed-Loop Verification:** Integrate a type-checking loop that uses the TypeScript Compiler API to validate the generated code in-process. If compilation errors occur, the diagnostics are fed back to the LLM for self-correction, bounded by a retry limit.
-   **G4: Developer Tooling & Observability:** Provide robust CLI and programmatic entry points with comprehensive logging of prompts, LLM responses, and TypeScript diagnostics to facilitate review and debugging.

## Non-Goals

-   **XML Parsing:** The generator will not parse the QTI XML. The raw XML is treated as opaque context for the LLM, in line with our existing content generation philosophy.
-   **Multi-Widget Items:** The generator will not support QTI files containing multiple interactions or requiring multiple widgets. The widget must be specified as an input.
-   **Database Integration:** This tool will not persist any metadata to Postgres or handle the publishing of templates. It only generates files to the local filesystem.
-   **Pedagogical Validation:** The generator will not perform any validation of the pedagogical quality, distractor effectiveness, or educational accuracy of the content.
-   **Full QTI Compilation:** The scope is limited to ensuring the generated TypeScript template file type-checks. It does not run the full runtime QTI compilation pipeline.

## Logging & Observability Requirements

-   Every pipeline step accepts a `logger: logger.Logger` as its first argument, mirroring our Go-style dependency injection for observability. No module keeps a hidden global logger.
-   All operations use `@superbuilders/slog` for structured logging and the `@superbuilders/errors` helpers for propagation. Each failure path logs context before returning errors.
-   CLI and programmatic entry points validate inputs (e.g., required flags, environment variables) and log both successful outcomes and failure summaries.
-   Prompt payloads, responses, and TypeScript diagnostics are written to disk and logged at `debug`/`info` for traceability.

## Architecture Highlights

-   Prompt composition is split into dedicated helpers: `composeInitialPrompt` handles the first attempt while `composeRetryPrompt` injects diagnostics for subsequent iterations. Both functions live in `src/template-generator/prompts.ts`.
-   Each prompt embeds curated reference templates that are read directly from disk (currently `src/templates/math/fraction-addition.ts`) so the model always sees real, production-ready examples.
-   A single-responsibility `runGenerationAttempt` helper wraps each OpenAI call, keeping retry control flow out of the orchestrator. It accepts the logger, OpenAI client, model, and prompts, and always returns the raw code string.
-   Type-checking remains isolated in `typeCheckFile`, which exposes a simple `(logger, filePath)` contract and emits structured diagnostics. The orchestrator simply feeds file paths into this helper.
-   The orchestrator now reads as a tight loop: choose prompt helper ➝ invoke `runGenerationAttempt` ➝ persist artifacts ➝ call `typeCheckFile` ➝ repeat on failure. No prompt or OpenAI details leak into the loop body.
-   Generated skeletons always emit a single `export default function generateTemplate`, matching the simplified runtime contract without separate wrapper objects.

---

## Files Changed:

>>>> `package.json`
Add `typescript` to `devDependencies` so the in-process compiler API is always available during generation runs.

>>>> `src/template-generator/types.ts` (new file)
This file defines the core data structures for the template generator, focusing on the structured format for TypeScript diagnostics which is essential for the self-correction loop.

```typescript
// Structured format for TypeScript diagnostic messages
export type TypeScriptDiagnostic = {
	message: string
	line: number
	column: number
	tsCode: number
}
```

>>>> `src/template-generator/skeleton.ts` (new file)
This module provides functions to generate the static boilerplate for a default-exported template function. It ensures that all required imports, type definitions, and export contracts are correctly scaffolded, leaving only the dynamic template logic to be filled in by the LLM.

```typescript
import * as errors from "@superbuilders/errors"
import type * as logger from "@superbuilders/slog"

export function buildTemplateSkeleton(
	logger: logger.Logger,
	widgetKey: string
): string {
	logger.info("building template skeleton", { widgetKey })

	if (!widgetKey) {
		logger.error("widgetKey is required to build skeleton")
		throw errors.new("skeleton builder: missing widgetKey")
	}

	const header = `
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import type { FeedbackContent } from "@/core/content"
import type { FeedbackPlan } from "@/core/feedback"
import type { AssessmentItemInput } from "@/core/item"
import { createSeededRandom } from "@/templates/seeds"

export type TemplateWidgets = readonly ["${widgetKey}"]
`

	const body = `
export default function generateTemplate(
	seed: bigint
): AssessmentItemInput<TemplateWidgets> {
	const random = createSeededRandom(seed)
	void random

	// TODO: generated template body
	const feedbackPlan = {} as FeedbackPlan
	const overallFeedback: FeedbackContent<TemplateWidgets> = {
		preamble: { content: [] },
		steps: []
	}

	const assessmentItem: AssessmentItemInput<TemplateWidgets> = {
		identifier: "REPLACE_ME",
		title: "REPLACE_ME",
		responseDeclarations: [],
		body: null,
		widgets: null,
		interactions: null,
		feedbackPlan,
		feedback: {
			FEEDBACK__OVERALL: {
				content: overallFeedback
			}
		}
	}

	return assessmentItem
}
`

	return `${header.trim()}\n${body.trim()}\n`
}
```

>>>> `src/template-generator/reference-templates.ts` (new file)
Defines the curated list of on-disk templates to surface in prompts and provides a loader that reads the full source for LLM consumption.

```typescript
import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as errors from "@superbuilders/errors"
import type * as logger from "@superbuilders/slog"

export type ReferenceTemplate = { name: string; code: string }

const REFERENCE_TEMPLATE_PATHS: ReadonlyArray<{ name: string; path: string }> = [
	{
		name: "math/fraction-addition",
		path: path.resolve("src/templates/math/fraction-addition.ts")
	}
]

export async function loadReferenceTemplates(
	logger: logger.Logger
): Promise<ReferenceTemplate[]> {
	logger.info("loading reference templates for prompt", {
		count: REFERENCE_TEMPLATE_PATHS.length
	})

	const results: ReferenceTemplate[] = []
	for (const ref of REFERENCE_TEMPLATE_PATHS) {
		const fileResult = await errors.try(fs.readFile(ref.path, "utf-8"))
		if (fileResult.error) {
			logger.error("failed to read reference template", {
				name: ref.name,
				path: ref.path,
				error: fileResult.error
			})
			throw errors.wrap(fileResult.error, "load reference template")
		}
		const code = fileResult.data
		results.push({ name: ref.name, code })
	}

	logger.info("loaded reference templates", { count: results.length })
	return results
}
```

>>>> `src/template-generator/prompts.ts` (new file)
Encapsulates prompt construction. Separate helpers handle the first attempt and subsequent retries, each building on the shared skeleton.

```typescript
import type * as logger from "@superbuilders/slog"
import type { ReferenceTemplate } from "@/template-generator/reference-templates"
import type { TypeScriptDiagnostic } from "@/template-generator/types"
import { buildTemplateSkeleton } from "@/template-generator/skeleton"

type PromptArtifacts = {
	systemPrompt: string
	userPrompt: string
}

const BASE_SYSTEM_PROMPT = `You are an expert TypeScript developer tasked with converting QTI XML assessment items into self-contained, deterministic template functions. Your output must be a single TypeScript code block. You must interpret the provided QTI XML context and generate code that conforms precisely to the provided skeleton and contract.
- Logic must be self-contained and deterministic, using only the provided 'seed' for randomness via 'createSeededRandom'.
- Do not use external libraries or APIs other than the provided helpers.
- Ensure the final returned object matches the 'AssessmentItemInput' type.
- Pay close attention to TypeScript diagnostics on retry attempts and fix them precisely.`

export function composeInitialPrompt(
	logger: logger.Logger,
	widgetKey: string,
	qtiXml: string,
	referenceTemplates: ReadonlyArray<ReferenceTemplate>
): PromptArtifacts {
	logger.debug("composing initial prompt", { widgetKey })
	const skeleton = buildTemplateSkeleton(logger, widgetKey)

	let referenceSection = ""
	if (referenceTemplates.length > 0) {
		const renderedReferences = referenceTemplates
			.map(
				(ref) => `- ${ref.name}\n\`\`\`typescript
${ref.code}
\`\`\``
				)
				.join("\n\n")
		referenceSection = `\n**Reference Templates (from repository):**\n${renderedReferences}\n`
	}

const userPrompt = `Please generate a default-exported template function that implements the logic from the QTI XML provided below, using the '${widgetKey}' widget. Your response should only be a single TypeScript code block.

**QTI XML Input:**
\`\`\`xml
${qtiXml}
\`\`\`

**Template Skeleton to Fill:**
\`\`\`typescript
${skeleton}
\`\`\`
${referenceSection}
`

	return { systemPrompt: BASE_SYSTEM_PROMPT, userPrompt }
}

export function composeRetryPrompt(
	logger: logger.Logger,
	widgetKey: string,
	qtiXml: string,
	previousCode: string,
	diagnostics: TypeScriptDiagnostic[],
	referenceTemplates: ReadonlyArray<ReferenceTemplate>
): PromptArtifacts {
	logger.debug("composing retry prompt", {
		widgetKey,
		diagnosticsCount: diagnostics.length
	})
	const skeleton = buildTemplateSkeleton(logger, widgetKey)
	const diagnosticList = diagnostics
		.map((d) => `- (${d.line},${d.column}): ${d.message} (TS${d.tsCode})`)
		.join("\n")
	let referenceSection = ""
	if (referenceTemplates.length > 0) {
		const renderedReferences = referenceTemplates
			.map(
				(ref) => `- ${ref.name}\n\`\`\`typescript
${ref.code}
\`\`\``
				)
				.join("\n\n")
		referenceSection = `\n**Reference Templates (from repository):**\n${renderedReferences}\n`
	}

const userPrompt = `The previous attempt failed with the following TypeScript errors. Please analyze the errors and the flawed code, then generate a corrected version that is fully type-safe.

**TypeScript Errors:**
${diagnosticList}

**Previous Code (with errors):**
\`\`\`typescript
${previousCode}
\`\`\`

**Original Request:**
Please generate a default-exported template function that implements the logic from the QTI XML provided below, using the '${widgetKey}' widget.

**QTI XML Input:**
\`\`\`xml
${qtiXml}
\`\`\`

**Template Skeleton:**
\`\`\`typescript
${skeleton}
\`\`\`
${referenceSection}
`

	return { systemPrompt: BASE_SYSTEM_PROMPT, userPrompt }
}
```

>>>> `src/template-generator/generation.ts` (new file)
Wraps a single LLM attempt (initial or retry) so the orchestrator loop can stay focused on control flow.

```typescript
import * as errors from "@superbuilders/errors"
import type * as logger from "@superbuilders/slog"
import OpenAI from "openai"
import { callOpenAIWithRetry } from "@/structured/utils/openai"

type GenerationAttempt = {
	logger: logger.Logger
	openai: OpenAI
	model: string
	systemPrompt: string
	userPrompt: string
}

export async function runGenerationAttempt({
	logger,
	openai,
	model,
	systemPrompt,
	userPrompt
}: GenerationAttempt): Promise<string> {
	logger.debug("invoking openai", { model })

	const response = await callOpenAIWithRetry("template-generator", async () =>
		openai.chat.completions.create({
			model,
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt }
			],
			temperature: 0.1
		})
	)

	const codeContent = response.choices[0]?.message?.content
	if (!codeContent) {
		logger.error("openai response missing content")
		throw errors.new("generation attempt: empty openai response")
	}

	const match = codeContent.match(/```typescript\n([\s\S]*?)\n```/)
	const code = match ? match[1] : codeContent
	logger.debug("openai returned code", { characterCount: code.length })
	return code
}
```

>>>> `src/template-generator/type-checker.ts` (new file)
This module encapsulates the logic for running the TypeScript compiler programmatically using the `typescript` library. It creates an in-memory compilation, retrieves semantic diagnostics, and formats them into a structured array. This in-process approach is more efficient and robust than spawning a CLI subprocess.

```typescript
import * as path from "node:path"
import * as ts from "typescript"
import * as errors from "@superbuilders/errors"
import type * as logger from "@superbuilders/slog"
import type { TypeScriptDiagnostic } from "@/template-generator/types"

export async function typeCheckFile(
	logger: logger.Logger,
	filePath: string
): Promise<TypeScriptDiagnostic[]> {
	logger.info("running in-process tsc on generated file", { filePath })

	const configPathResult = errors.trySync(() => ts.findConfigFile(process.cwd(), ts.sys.fileExists, "tsconfig.json"))
	if (configPathResult.error || !configPathResult.data) {
		logger.error("could not find tsconfig.json", { error: configPathResult.error })
		throw errors.new("tsconfig.json not found")
	}
	const configPath = configPathResult.data

	const configFileResult = errors.trySync(() => ts.readConfigFile(configPath, ts.sys.readFile))
	if (configFileResult.error || configFileResult.data.error) {
		logger.error("failed to read or parse tsconfig.json", { error: configFileResult.error || configFileResult.data.error })
		throw errors.new("failed to read or parse tsconfig.json")
	}

	const parsedConfig = ts.parseJsonConfigFileContent(configFileResult.data.config, ts.sys, path.dirname(configPath))
	if (parsedConfig.errors.length > 0) {
		logger.error("errors parsing tsconfig.json", { errors: parsedConfig.errors })
		throw errors.new("errors parsing tsconfig.json")
	}

	const program = ts.createProgram([filePath], parsedConfig.options)
	const allDiagnostics = ts.getPreEmitDiagnostics(program)

	const diagnostics: TypeScriptDiagnostic[] = []
	for (const diagnostic of allDiagnostics) {
		if (diagnostic.file && diagnostic.start) {
			const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start)
			const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
			diagnostics.push({
				message,
				line: line + 1,
				column: character + 1,
				tsCode: diagnostic.code
			})
		}
	}

	if (diagnostics.length > 0) {
		logger.warn("tsc reported diagnostics", {
			filePath,
			diagnosticsCount: diagnostics.length
		})
		logger.debug("tsc diagnostics detail", { diagnostics })
	} else {
		logger.info("tsc completed successfully", { filePath })
	}

	return diagnostics
}
```

>>>> `src/template-generator/orchestrator.ts` (new file)
This is the core of the Template Generator, orchestrating the entire pipeline from raw QTI input to final file output. It constructs the prompts for the LLM by treating the QTI XML as opaque context, manages the retry loop with programmatic type-checking feedback, and handles all file system operations. Prompt construction and LLM execution are delegated to dedicated helpers so the loop stays readable. It owns the model selection via a constant so callers do not pass model names around; the resolved model string is returned in the result payload for logging/analytics.

```typescript
import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as errors from "@superbuilders/errors"
import type * as logger from "@superbuilders/slog"
import OpenAI from "openai"
import {
	composeInitialPrompt,
	composeRetryPrompt
} from "@/template-generator/prompts"
import { loadReferenceTemplates } from "@/template-generator/reference-templates"
import { runGenerationAttempt } from "@/template-generator/generation"
import { typeCheckFile } from "@/template-generator/type-checker"
import type { TypeScriptDiagnostic } from "@/template-generator/types"

const MAX_RETRIES = 4
const OUTPUT_DIR = "src/templates/generated"
const LOG_DIR = "data/template-generator"
const TEMPLATE_GENERATION_MODEL = "gpt-4.1"

type GenerateTemplateOptions = {
	qtiXml: string
	widgetKey: string
}

type GenerationResult = {
	success: boolean
	filePath: string | null
	iterations: number
	model: string
	diagnostics: TypeScriptDiagnostic[]
}

export async function generateTemplate(
	logger: logger.Logger,
	openai: OpenAI,
	options: GenerateTemplateOptions
): Promise<GenerationResult> {
	const { qtiXml, widgetKey } = options
	const model = TEMPLATE_GENERATION_MODEL
	const runTimestamp = new Date().toISOString().replace(/:/g, "-")
	const runLogDir = path.join(LOG_DIR, `template-run-${runTimestamp}`)

	await fs.mkdir(runLogDir, { recursive: true })
	logger.info("initialized generation run directory", { runLogDir })
	const referenceTemplates = await loadReferenceTemplates(logger)

	let lastCode = ""
	let lastDiagnostics: TypeScriptDiagnostic[] = []
	let iteration = 0

	while (iteration < MAX_RETRIES) {
		iteration++
		logger.info("generation iteration starting", { iteration })

		let systemPrompt: string
		let userPrompt: string
		if (lastDiagnostics.length === 0 && lastCode.length === 0) {
			const initial = composeInitialPrompt(logger, widgetKey, qtiXml, referenceTemplates)
			systemPrompt = initial.systemPrompt
			userPrompt = initial.userPrompt
		} else {
			const retry = composeRetryPrompt(
				logger,
				widgetKey,
				qtiXml,
				lastCode,
				lastDiagnostics,
				referenceTemplates
			)
			systemPrompt = retry.systemPrompt
			userPrompt = retry.userPrompt
		}

		logger.debug("persisting prompt to disk", {
			iteration,
			runLogDir,
			promptLength: userPrompt.length
		})
		await fs.writeFile(path.join(runLogDir, `iteration-${iteration}-prompt.md`), userPrompt)

		const code = await runGenerationAttempt({
			logger,
			openai,
			model,
			systemPrompt,
			userPrompt
		})

		await fs.writeFile(path.join(runLogDir, `iteration-${iteration}-response.ts`), code)
		logger.debug("persisted openai response to disk", {
			iteration,
			runLogDir,
			fileSize: code.length
		})

		const tempFilePath = path.join(runLogDir, "candidate-template.ts")
		await fs.writeFile(tempFilePath, code)
		logger.info("wrote candidate template file", {
			iteration,
			tempFilePath
		})

		const diagnostics = await typeCheckFile(logger, tempFilePath)
		lastCode = code
		lastDiagnostics = diagnostics

		if (diagnostics.length === 0) {
			logger.info("type-check successful", { iteration })
			const finalFileName = `generated-template-${runTimestamp}.ts`
			const finalPath = path.join(OUTPUT_DIR, finalFileName)
			await fs.mkdir(OUTPUT_DIR, { recursive: true })
			const existingCheck = await errors.try(fs.stat(finalPath))
			if (!existingCheck.error) {
				logger.error("template file already exists", { file: finalPath })
				throw errors.new("cannot overwrite existing template without --force")
			}
			await fs.rename(tempFilePath, finalPath)
			logger.info("final template written", { file: finalPath })

			return {
				success: true,
				filePath: finalPath,
				iterations: iteration,
				model,
				diagnostics: []
			}
		}

		logger.warn("type-check failed", { diagnosticsCount: diagnostics.length, iteration })
	}

	logger.error("max retries reached, generation failed", { maxRetries: MAX_RETRIES })
	return {
		success: false,
		filePath: null,
		iterations: iteration,
		model,
		diagnostics: lastDiagnostics
	}
}
```

>>>> `src/template-generator/cli.ts` (new file)
This file provides the command-line interface for the Template Generator. It parses command-line arguments, reads the input QTI file, invokes the orchestrator with the raw XML content, and logs the final result to the console, making it easy for developers to run the generation process from their terminal.

```typescript
import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import OpenAI from "openai"
import { generateTemplate } from "@/template-generator/orchestrator"

async function main() {
	const args = Bun.argv.slice(2)
	logger.debug("parsed cli arguments", { args })
	const qtiPath = args.find(arg => arg.startsWith("--qti="))?.split("=")[1]
	const widgetKey = args.find(arg => arg.startsWith("--widget="))?.split("=")[1]

	if (!qtiPath || !widgetKey) {
		logger.error("missing required arguments", {
			usage: "bun src/template-generator/cli.ts --qti <path> --widget <key>"
		})
		process.exit(1)
	}

	logger.info("starting template generation from cli", { qtiPath, widgetKey })

	const qtiXmlResult = await errors.try(fs.readFile(path.resolve(qtiPath), "utf-8"))
	if (qtiXmlResult.error) {
		logger.error("failed to read qti file", { path: qtiPath, error: qtiXmlResult.error })
		throw errors.wrap(qtiXmlResult.error, "cli: read qti file")
	}
	logger.debug("loaded qti xml", { bytes: qtiXmlResult.data.length })

	if (!process.env.OPENAI_API_KEY) {
		logger.error("missing OPENAI_API_KEY environment variable")
		throw errors.new("OPENAI_API_KEY is required")
	}

	const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
	logger.info("constructed openai client for template generator")

	const generationResult = await errors.try(
		generateTemplate(logger, openai, {
			qtiXml: qtiXmlResult.data,
			widgetKey
		})
	)

	if (generationResult.error) {
		logger.error("template generation failed", { error: generationResult.error })
		process.exit(1)
	}

	if (generationResult.data.success) {
		logger.info("template generated successfully", {
			filePath: generationResult.data.filePath,
			iterations: generationResult.data.iterations,
			model: generationResult.data.model
		})
	} else {
		logger.error("failed to generate template after max retries", {
			iterations: generationResult.data.iterations,
			model: generationResult.data.model,
			diagnostics: generationResult.data.diagnostics
		})
		process.exit(1)
	}
}

const mainResult = await errors.try(main())
if (mainResult.error) {
	logger.error("cli tool exited with an error", { error: mainResult.error })
	process.exit(1)
}
```

---

`feat(content): Add automated QTI to TemplateModule generator`
