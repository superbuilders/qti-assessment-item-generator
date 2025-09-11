# @superbuilders/qti-assessment-item-generator

A robust toolkit for generating and compiling QTI 3.0 assessment items. This library uses a powerful AI pipeline to convert source content, such as Perseus JSON or HTML, into structured, valid QTI 3.0 XML. It also includes an AI-powered differentiation engine to create multiple variations of an assessment item.

-   **Runtime**: Bun
-   **Package Manager**: Bun

## Features

-   **Structured AI Conversion**: Transform Perseus-like JSON or raw HTML into a fully-typed, structured assessment item object.
-   **AI-Powered Differentiation**: Generate multiple, structurally identical variations of an assessment item that maintain the same difficulty and pedagogical intent.
-   **Robust QTI 3.0 Compiler**: Compile the structured item object into a hardened, valid QTI 3.0 XML string.
-   **Safety-First Design**: The library is built on a principle of strict validation and explicit error handling. It avoids silent fallbacks to ensure data integrity and reliable output.

## Install

```bash
bun install @superbuilders/qti-assessment-item-generator
```

## Core Concepts

The primary workflow of the library follows a clear, three-step process:

1.  **Create an `Envelope`**: Your source content (e.g., Perseus JSON) is first wrapped in an `AiContextEnvelope`. This object contains the context the AI will use for generation. Helper functions are provided to make this easy.
2.  **Generate a `Structured Item`**: The envelope is passed to the AI pipeline, which returns a fully-typed `AssessmentItemInput` object. This is a predictable, structured JSON representation of the assessment item.
3.  **Compile to `XML`**: The `AssessmentItemInput` object is passed to the compiler, which produces a valid QTI 3.0 XML string.

## Usage

### Generating a Single Assessment Item

This is the most common use case. You start with your source data, create an envelope, and then generate the structured item.

#### Example A: From Perseus-like JSON

Use the `buildPerseusEnvelope` helper to prepare your Perseus data. It automatically resolves `web+graphie://` URLs and embeds any fetched SVG content into the context for the AI.

```ts
import OpenAI from "openai";
import * as logger from "@superbuilders/slog";
import { generateFromEnvelope } from "@superbuilders/qti-assessment-item-generator/structured";
import { compile } from "@superbuilders/qti-assessment-item-generator/compiler";
import { buildPerseusEnvelope } from "@superbuilders/qti-assessment-item-generator/structured/ai-context-builder";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Your Perseus-like JSON data
const perseusData = { /* ... your perseus item JSON ... */ };

// 1. Build the AI context envelope from the source data.
const envelope = await buildPerseusEnvelope(perseusData);

// 2. Generate the structured AssessmentItemInput object.
//    The `widgetCollectionName` tells the AI which set of visual widgets to use.
const structuredItem = await generateFromEnvelope(openai, logger, envelope, "math-core");

// 3. Compile the structured item to QTI XML.
const xml = await compile(structuredItem);

console.log(xml);
```

#### Example B: From Raw HTML

Use the `buildHtmlEnvelope` helper for raw HTML content. You can also provide a URL to a screenshot for additional visual context.

```ts
import OpenAI from "openai";
import * as logger from "@superbuilders/slog";
import { generateFromEnvelope } from "@superbuilders/qti-assessment-item-generator/structured";
import { compile } from "@superbuilders/qti-assessment-item-generator/compiler";
import { buildHtmlEnvelope } from "@superbuilders/qti-assessment-item-generator/structured/ai-context-builder";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const html = "<div><p>Which of these is a prime number?</p>...</div>";
const screenshotUrl = "https://example.com/item-screenshot.png"; // Optional

// 1. Build the AI context envelope.
const envelope = buildHtmlEnvelope(html, screenshotUrl);

// 2. Generate the structured AssessmentItemInput object.
const structuredItem = await generateFromEnvelope(openai, logger, envelope, "fourth-grade-math");

// 3. Compile the structured item to QTI XML.
const xml = await compile(structuredItem);

console.log(xml);
```

### Generating Item Variations (AI Differentiation)

Once you have a structured `AssessmentItemInput` object, you can use the differentiation engine to create multiple unique, but equivalent, versions of it.

```ts
import OpenAI from "openai";
import * as logger from "@superbuilders/slog";
import { differentiateAssessmentItem } from "@superbuilders/qti-assessment-item-generator/structured/differentiator";
import type { AssessmentItemInput } from "@superbuilders/qti-assessment-item-generator/compiler/schemas";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Assume `sourceItem` is a valid AssessmentItemInput object you already have.
const sourceItem: AssessmentItemInput = { /* ... */ };

// Generate 3 new variations of the source item.
const items = await differentiateAssessmentItem(openai, logger, sourceItem, 3);
// `items` is now an array of 3 AssessmentItemInput objects.

console.log(`Generated ${items.length} new items.`);
```

## API Reference

The library's functions are organized into logical modules.

### `structured`

-   `generateFromEnvelope(openai, logger, envelope, widgetCollectionName) => Promise<AssessmentItemInput>`
    -   The main entry point for the AI pipeline. Converts an `AiContextEnvelope` into a structured `AssessmentItemInput` object.
    -   `widgetCollectionName` is **required** and specifies which set of widgets the AI can use.

### `structured/ai-context-builder`

-   `buildPerseusEnvelope(perseusJson: unknown) => Promise<AiContextEnvelope>`
    -   Creates an envelope from Perseus JSON, resolving `web+graphie://` URLs automatically.
-   `buildHtmlEnvelope(html: string, screenshotUrl?: string) => AiContextEnvelope`
    -   Creates an envelope from raw HTML and an optional screenshot URL.

### `structured/differentiator`

-   `differentiateAssessmentItem(openai, logger, item, n) => Promise<AssessmentItemInput[]>`
    -   Generates `n` new variations of a structured `AssessmentItemInput` with identical structure and the same difficulty.

### `compiler`

-   `compile(item: AssessmentItemInput) => Promise<string>`
    -   Compiles a structured `AssessmentItemInput` object into a valid QTI 3.0 item XML string.

## Configuration

-   **`OPENAI_API_KEY`**: An OpenAI API key must be available as an environment variable.

## Troubleshooting

-   **`Error: envelope context cannot be empty`**: You called `generateFromEnvelope` with an `AiContextEnvelope` that had no content. Ensure the `context` array is not empty.
-   **`Error: Model returned no parsed content`**: The OpenAI API call succeeded but returned an empty or unparsable response. Check your API key, model access, and inspect the logs for more details.
-   **`Error: Slot declaration mismatch detected...`**: This is an internal AI error where the generated plan is inconsistent with the generated content. This error is typically non-retriable for the given input.
-   **`Error: ...must have at least 2 choices...`**: An interaction like a multiple-choice or ordering question was generated with fewer than two choices, which is invalid.
-   **`Error: pipe characters banned...` or `Error: caret characters banned...`**: The compiler detected a `|` or `^` in plain text. This is a strict rule. Use a `dataTable` widget to create tables, and use MathML (`<msup>`) for exponents.
-   **`Error: duplicate response identifier found...`**: The compiler found the same `responseIdentifier` used for multiple interactions or input fields within the same item. All response identifiers must be unique.
-   **`Error: duplicate choice identifiers within interaction...`**: The compiler found the same `identifier` used for multiple choices within a single interaction. Choice identifiers must be unique within their parent interaction.

## License

0BSD