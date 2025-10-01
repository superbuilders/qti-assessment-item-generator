Of course. Here is the revised `README.md` that removes the documentation for the helper builders and focuses exclusively on the direct `AiContextEnvelope` workflow, as requested.

---

# @superbuilders/qti-assessment-item-generator

A robust toolkit for generating and compiling QTI 3.0 assessment items from various sources using a structured AI pipeline.

-   **Runtime**: Bun
-   **Package Manager**: Bun

## Install

```bash
bun add @superbuilders/qti-assessment-item-generator
```

## Core Functionality

### Full Pipeline: Generating QTI from an AI Context Envelope

The primary workflow involves creating an `AiContextEnvelope` object and passing it to the `generateFromEnvelope` function. This envelope is a self-contained representation of the source content, including primary HTML or JSON, supplementary vector graphics, and any raster images.

This approach gives you full control and supports completely offline generation by allowing you to provide raster images as in-memory binary payloads or `data:` URLs, eliminating all network dependencies.

```ts
import fs from "fs/promises";
import OpenAI from "openai";
import * as logger from "@superbuilders/slog";
import { generateFromEnvelope } from "@superbuilders/qti-assessment-item-generator/structured";
import { compile } from "@superbuilders/qti-assessment-item-generator/compiler";
import type { AiContextEnvelope, RasterImagePayload } from "@superbuilders/qti-assessment-item-generator/structured/types";

// ---
// In an offline pipeline, you load all assets from a local, trusted source.
// ---

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// 1. Load primary HTML and supplementary SVG content from disk.
const html = await fs.readFile("/abs/path/to/item.html", "utf8");
const svgText = await fs.readFile("/abs/path/to/diagram.svg", "utf8");

// 2. Load a raster image (e.g., a screenshot) and create a payload.
const screenshotBytes = await fs.readFile("/abs/path/to/screenshot.png");
const screenshotPayload: RasterImagePayload = {
  data: new Blob([screenshotBytes]), // Bun and Node provide Blob globally
  mimeType: "image/png",
};

// You can also include images as data URLs.
const extraImageBytes = await fs.readFile("/path/to/figure.png");
const extraImageDataUrl = `data:image/png;base64,${extraImageBytes.toString("base64")}`;

// 3. Manually build the offline envelope. No network calls will be made by the library.
const envelope: AiContextEnvelope = {
  primaryContent: html,
  supplementaryContent: [svgText], // Vector graphics go here as raw text
  multimodalImageUrls: [extraImageDataUrl], // Raster images can be data: URLs
  multimodalImagePayloads: [screenshotPayload], // Or raw binary payloads
};

// 4. Generate the structured item.
const structuredItem = await generateFromEnvelope(openai, logger, envelope, "fourth-grade-math");

// 5. Compile to QTI XML.
const xml = await compile(structuredItem);

console.log(xml);
```

### AI-Powered Item Differentiation

Generate unique variations of an existing assessment item using a robust, two-shot pipeline that separates content planning from visual generation. This process is fully independent of the `AiContextEnvelope` used for initial item creation.

```ts
import OpenAI from "openai";
import * as logger from "@superbuilders/slog";
import { differentiateAssessmentItem } from "@superbuilders/qti-assessment-item-generator/structured/differentiator";
import type { AssessmentItemInput } from "@superbuilders/qti-assessment-item-generator/core/item";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Assume `sourceItem` is a valid AssessmentItemInput object you already have.
const sourceItem: AssessmentItemInput = { /* ... */ };

// To generate 3 new variations of the source item; Shot 2 will generate widgets via LLM using authoritative schemas:
const items = await differentiateAssessmentItem(openai, logger, sourceItem, 3);
// `items` is now an array of up to 3 valid AssessmentItemInput objects.
console.log(`Generated ${items.length} new items with regenerated widgets.`);
```

### Standalone Widget Compilation

Compile a widget configuration directly into an SVG or HTML string without using the AI pipeline. This is useful for rendering visual aids independently.

```ts
import { generateWidget } from "@superbuilders/qti-assessment-item-generator/widgets/widget-generator";
import type { BarChartProps } from "@superbuilders/qti-assessment-item-generator/widgets/registry";
import { BarChartPropsSchema } from "@superbuilders/qti-assessment-item-generator/widgets/registry";
import type { Widget } from "@superbuilders/qti-assessment-item-generator/widgets/registry";

// 1. Define the properties for the widget you want to compile.
const barChartProps: BarChartProps = {
  type: "barChart",
  width: 480,
  height: 340,
  title: "Games Won Last Summer",
  xAxisLabel: "Team",
  yAxis: {
    label: "Games Won",
    min: 0,
    max: 16,
    tickInterval: 2
  },
  data: [
    { label: "Lions", value: 14, state: "normal" },
    { label: "Tigers", value: 2, state: "normal" },
    { label: "Bears", value: 7, state: "normal" }
  ],
  barColor: "#4285F4"
};

// 2. Validate the configuration against the specific Zod schema
const validationResult = BarChartPropsSchema.safeParse(barChartProps);
if (!validationResult.success) {
  throw validationResult.error;
}

// 3. Pass the validated data to the generator (Widget union type)
const svgString = await generateWidget(validationResult.data as unknown as Widget);

console.log(svgString);
```

## API Reference

### `structured`

-   `generateFromEnvelope(openai, logger, envelope, widgetCollectionName) => Promise<AssessmentItemInput>`
    -   The main entry point for the AI pipeline. Converts an `AiContextEnvelope` into a structured `AssessmentItemInput` object.
    -   `widgetCollectionName` is **required** and specifies which set of widgets the AI can use.

### `structured/differentiator`

-   `differentiateAssessmentItem(openai, logger, item, n) => Promise<AssessmentItemInput[]>`
    -   The main entry point for the AI differentiation pipeline. Generates `n` new variations of a structured `AssessmentItemInput` using a two-shot process: content planning (Shot 1) and widget generation via LLM using authoritative schemas (Shot 2).
    -   This function is completely independent of `AiContextEnvelope` and `widgetCollectionName`.

### `compiler`

-   `compile(item: AssessmentItemInput) => Promise<string>`
    -   Compiles a structured `AssessmentItemInput` object into a valid QTI 3.0 XML string.

### `widgets/widget-generator`

-   `generateWidget(widget: Widget) => Promise<string>`
    -   Compiles a single widget's property object into an SVG or HTML string.

### Widget Schemas and Types

You can import individual Zod schemas and TypeScript types for each domain directly from the `@superbuilders/qti-assessment-item-generator/core` entry point. This is ideal for programmatically creating or validating configurations.

**Breaking Change:**

**Old Import:**
```ts
import { type AssessmentItemInput } from "@superbuilders/qti-assessment-item-generator/compiler/schemas";
```

**New Import:**
```ts
import { type AssessmentItemInput } from "@superbuilders/qti-assessment-item-generator/core/item";
```

You can also import content, feedback, and interaction types:

```ts
import { generateWidget } from "@superbuilders/qti-assessment-item-generator/widgets/widget-generator";
import { compile } from "@superbuilders/qti-assessment-item-generator/compiler";
import {
  type AssessmentItemInput,
  createDynamicAssessmentItemSchema
} from "@superbuilders/qti-assessment-item-generator/core/item";
import {
  BarChartPropsSchema,
  type BarChartProps,
  type WidgetInput,
  type Widget
} from "@superbuilders/qti-assessment-item-generator/widgets/registry";

// Example of creating a specific widget with full type-safety
const myBarChart: BarChartProps = {
  type: "barChart",
  width: 480,
  height: 340,
  title: "Games Won Last Summer",
  xAxisLabel: "Team",
  yAxis: {
    label: "Games Won",
    min: 0,
    max: 16,
    tickInterval: 2
  },
  data: [
    { label: "Lions", value: 14, state: "normal" },
    { label: "Tigers", value: 2, state: "normal" },
    { label: "Bears", value: 7, state: "normal" }
  ],
  barColor: "#4285F4"
};

// Validate the configuration against the specific Zod schema
const validationResult = BarChartPropsSchema.safeParse(myBarChart);
if (!validationResult.success) {
  throw validationResult.error;
}

// The `generateWidget` function accepts a `Widget` (runtime-inferred union)
const svg = await generateWidget(validationResult.data as unknown as Widget);
```

## Image and Content Policy

The `AiContextEnvelope` object separates content by type to ensure proper processing:

-   **`primaryContent`**: The main HTML or Perseus JSON content for the assessment item.
-   **`supplementaryContent`**: An array of strings, where each string is the full text content of a vector graphic (e.g., an entire `.svg` or `.xml` file).
-   **`multimodalImageUrls`**: An array of strings for raster images. Each URL must be an absolute `http`/`https` URL or a `data:` URL.
-   **`multimodalImagePayloads`**: An array of `RasterImagePayload` objects for providing raster images as in-memory binary data. This is the recommended approach for fully offline workflows. Each payload must contain the raw `Blob` data and its corresponding MIME type (e.g., `image/png`, `image/jpeg`).

## Configuration

-   **`OPENAI_API_KEY`**: An OpenAI API key must be available as an environment variable.

## Troubleshooting

-   **`Error: primaryContent cannot be empty`**: You called `generateFromEnvelope` with an `AiContextEnvelope` that had no primary content. Ensure the `primaryContent` string is not empty.
-   **`Error: Model returned no parsed content`**: The OpenAI API call succeeded but returned an empty or unparsable response. Check your API key, model access, and inspect the logs for more details.
-   **`Error: Slot declaration mismatch detected...`**: This is an internal AI error where the generated plan is inconsistent with the generated content. This error is typically non-retriable for the given input.
-   **`Error: ...must have at least 2 choices...`**: An interaction like a multiple-choice or ordering question was generated with fewer than two choices, which is invalid.
-   **`Error: pipe characters banned...` or `Error: caret characters banned...`**: The compiler detected a `|` or `^` in plain text. This is a strict rule. Use a `dataTable` widget to create tables, and use MathML (`<msup>`) for exponents.
-   **`Error: duplicate response identifier found...`**: The compiler found the same `responseIdentifier` used for multiple interactions or input fields within the same item. All response identifiers must be unique.
-   **`Error: duplicate choice identifiers within interaction...`**: The compiler found the same `identifier` used for multiple choices within a single interaction. Choice identifiers must be unique within their parent interaction.

## License

0BSD