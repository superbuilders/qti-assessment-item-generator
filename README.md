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

Generates a structured `AssessmentItemInput` from Perseus-like data via a 4-shot AI orchestration, then you can compile it to QTI XML.

```ts
import OpenAI from "openai"
import * as logger from "@superbuilders/slog"
import { generateStructuredQtiItem } from "@superbuilders/qti-assessment-item-generator/structured"
import { compile } from "@superbuilders/qti-assessment-item-generator/compiler"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const perseusData = {
	question: {
		content: "What is the answer? [[☃ text_entry 1]]"
	}
}

// Optional: constrain widget types by collection name
// Valid: "math-core" | "simple-visual" | "science" | "fourth-grade-math"
const item = await generateStructuredQtiItem(openai, logger, perseusData, {
	widgetCollectionName: "math-core"
})

// Compile structured item to QTI 3.0 XML
const xml = await compile(item)
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

- Input: Perseus-like JSON (unknown), plus OpenAI client and logger
- Output: `AssessmentItemInput` (typed, schema-constrained)

Error handling
--------------

- Uses `@superbuilders/errors` with `errors.try` + structured logging.
- No silent fallbacks. Missing or invalid data throws.

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

- `generateStructuredQtiItem(openai, logger, perseusData, { widgetCollectionName? }) => Promise<AssessmentItemInput>`
  - `widgetCollectionName` defaults to `"math-core"`. Use to constrain widget mapping/generation.

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

License
-------

0BSD

