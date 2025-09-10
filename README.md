@superbuilders/qti-assessment-item-generator
===========================================

QTI 3.0 assessment item generator and compiler with an AI-powered structured pipeline and an AI differentiation engine.

- Runtime: Bun
- Package manager: Bun

Install
-------

```bash
bun install @superbuilders/qti-assessment-item-generator
```

At a glance
-----------

- **Structured AI Pipeline**: Convert Perseus-like input into a fully-typed structured assessment item, then compile to QTI XML.
- **Differentiation**: Generate N structurally identical variants of an assessment item at the same difficulty.
- **Safety-first**: No fallbacks; strict validation and explicit error handling.

Usage: Structured AI Pipeline
----------------------------

Generates a structured `AssessmentItemInput` from source data via a 4-shot AI orchestration, then you can compile it to QTI XML.

```ts
import OpenAI from "openai"
import * as logger from "@superbuilders/slog"
import { generateFromEnvelope } from "@superbuilders/qti-assessment-item-generator/structured"
import { compile } from "@superbuilders/qti-assessment-item-generator/compiler"
import { buildPerseusEnvelope, buildHtmlEnvelope } from "@superbuilders/qti-assessment-item-generator/structured/ai-context-builder"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

// Example A: Perseus-like JSON source
const perseusData = { /* ... unknown input ... */ }
const envelopeA = await buildPerseusEnvelope(perseusData)
const itemA = await generateFromEnvelope(openai, logger, envelopeA, "math-core")
const xmlA = await compile(itemA)

// Example B: Raw HTML + optional screenshot
const html = "<div>...</div>"
const screenshotUrl = "https://example.com/screenshot.png"
const envelopeB = buildHtmlEnvelope(html, screenshotUrl)
const itemB = await generateFromEnvelope(openai, logger, envelopeB, "simple-visual")
const xmlB = await compile(itemB)
```

### Migration: Perseus compatibility

- Before (removed):
```ts
import { generateStructuredQtiItem } from "@superbuilders/qti-assessment-item-generator/structured"

const item = await generateStructuredQtiItem(openai, logger, perseusData, {
	widgetCollectionName: "math-core"
})
```

- After (required):
```ts
import { generateFromEnvelope } from "@superbuilders/qti-assessment-item-generator/structured"
import { buildPerseusEnvelope } from "@superbuilders/qti-assessment-item-generator/structured/ai-context-builder"

const envelope = await buildPerseusEnvelope(perseusData)
const item = await generateFromEnvelope(openai, logger, envelope, "math-core")
```

What the pipeline does
----------------------

1. Shell generation (content structure and plan)
2. Slot-to-widget mapping within a selected collection
3. Interaction content generation
4. Widget content generation
5. Merge and return `AssessmentItemInput`

Inputs and outputs
------------------

- Input: `AiContextEnvelope` (with context blocks and image URLs), widget collection name (required), plus OpenAI client and logger
- Output: `AssessmentItemInput` (typed, schema-constrained)

Error handling
--------------

- Uses `@superbuilders/errors` with `errors.try` + structured logging.
- No silent fallbacks. Missing or invalid data throws.
- API performs boundary validation and throws on invalid envelopes or invalid `widgetCollectionName`. No defaults, no fallbacks.

Usage: AI Differentiation
-------------------------

Generate N variations of a structured item with identical schema and difficulty.

```ts
import OpenAI from "openai"
import * as logger from "@superbuilders/slog"
import { differentiateAssessmentItem } from "@superbuilders/qti-assessment-item-generator/structured/differentiator"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const items = await differentiateAssessmentItem(openai, logger, item, 3)
// items: AssessmentItemInput[] of length 3
```

Differentiation guarantees:

- Identical JSON structure to the original
- Same difficulty and pedagogical intent
- Valid MathML and sanitized content

API Reference
-------------

### structured

- `generateFromEnvelope(openai, logger, envelope, widgetCollectionName) => Promise<AssessmentItemInput>`
  - `widgetCollectionName` is REQUIRED; there is no default.

### Helper builders

- `buildPerseusEnvelope(perseusJson: unknown) => Promise<AiContextEnvelope>`
- `buildHtmlEnvelope(html: string, screenshotUrl?: string) => AiContextEnvelope`

### compiler

- `compile(item: AssessmentItemInput) => Promise<string>`
  - Returns QTI 3.0 item XML string.

### differentiator

- `differentiateAssessmentItem(openai, logger, item, n) => Promise<AssessmentItemInput[]>`
  - Returns `n` items with identical structure and same difficulty.

Configuration & Environment
---------------------------

- Requires `OPENAI_API_KEY` in environment.
- Bun scripts:
  - `bun install`
  - `bun typecheck`

Safety rules (critical)
-----------------------

- No fallbacks (`||`, `??`, default params) for critical values
- Always validate inputs and fail fast on missing/invalid data
- Always log and throw on errors; never swallow exceptions

Troubleshooting
---------------

- Model returns no parsed content: ensure API key and model access; inspect logs.
- Slot mismatch error: your content references slots not declared in the shell; fix source content.
- Interaction choice count error: ensure at least 2 choices for choice/order interactions.
- MathML issues: the sanitizer enforces valid operators and bans deprecated tags.
- Empty envelope context error: the API requires non-empty context array; no defaults provided.

License
-------

0BSD

