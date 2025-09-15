# @superbuilders/qti-assessment-item-generator

A robust toolkit for generating and compiling QTI 3.0 assessment items from various sources using a structured AI pipeline.

-   **Runtime**: Bun
-   **Package Manager**: Bun

## Install

```bash
bun add @superbuilders/qti-assessment-item-generator
```

## Core Functionality

### Full Pipeline: Perseus JSON to QTI XML

This example demonstrates the primary workflow: converting a Perseus JSON object into a QTI 3.0 XML string. The `buildPerseusEnvelope` helper automatically resolves `web+graphie://` and standard `https://` image URLs, fetches external SVG content, and embeds it for the AI.

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

### Full Pipeline: HTML to QTI XML

This example converts raw HTML into a QTI 3.0 XML string. The `buildHtmlEnvelope` helper is now async and fetches SVG content from external image URLs. Inline `<svg>` embedded in the HTML remains as-is inside the primary HTML context and is not duplicated. `<img>` `src` URLs and the optional `screenshotUrl` are validated: only absolute `http`/`https` URLs are accepted. Invalid `<img>` `src` values are skipped; an invalid `screenshotUrl` will throw. Fetch timeout is 30 seconds.

```ts
import OpenAI from "openai";
import * as logger from "@superbuilders/slog";
import { generateFromEnvelope } from "@superbuilders/qti-assessment-item-generator/structured";
import { compile } from "@superbuilders/qti-assessment-item-generator/compiler";
import { buildHtmlEnvelope } from "@superbuilders/qti-assessment-item-generator/structured/ai-context-builder";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const html = `
  <div>
    <p>Which of these is a prime number?</p>
    <img src="https://example.com/some-diagram.png" alt="Diagram" />
  </div>
`;
// Optional: provide a full screenshot for broader context.
const screenshotUrl = "https://example.com/item-screenshot.png";

// 1. Build the AI context envelope.
const envelope = await buildHtmlEnvelope(html, screenshotUrl);

// 2. Generate the structured AssessmentItemInput object.
const structuredItem = await generateFromEnvelope(openai, logger, envelope, "fourth-grade-math");

// 3. Compile the structured item to QTI XML.
const xml = await compile(structuredItem);

console.log(xml);
```

### AI-Powered Item Differentiation

Generate unique variations of an existing assessment item while preserving its structure and difficulty.

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

### `structured/ai-context-builder`

-   `buildPerseusEnvelope(perseusJson: unknown) => Promise<AiContextEnvelope>`
    -   Creates an envelope from Perseus JSON. Resolves both `web+graphie://` and standard `https://` image URLs, fetches external SVG content, and separates raster/vector URLs for the AI.
-   `buildHtmlEnvelope(html: string, screenshotUrl?: string) => Promise<AiContextEnvelope>`
    -   Creates an envelope from raw HTML. **Breaking change: now async.** Fetches SVG content from external image URLs. Inline `<svg>` remains only in the primary HTML context (not extracted). Only absolute `http`/`https` URLs are accepted; invalid `<img>` `src` values are skipped, while an invalid `screenshotUrl` will throw. Fetch timeout is 30 seconds.

### `structured/differentiator`

-   `differentiateAssessmentItem(openai, logger, item, n) => Promise<AssessmentItemInput[]>`
    -   Generates `n` new variations of a structured `AssessmentItemInput`.

### `compiler`

-   `compile(item: AssessmentItemInput) => Promise<string>`
    -   Compiles a structured `AssessmentItemInput` object into a valid QTI 3.0 XML string.

### `widgets/widget-generator`

-   `generateWidget(widget: Widget) => Promise<string>`
    -   Compiles a single widget's property object into an SVG or HTML string.

### Widget Schemas and Types

You can import individual Zod schemas and TypeScript `input` types for each widget, as well as a unified `WidgetInput` type for any valid widget object. This is ideal for programmatically creating or validating widget configurations.

```ts
import { generateWidget } from "@superbuilders/qti-assessment-item-generator/widgets/widget-generator";
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

## Image URL Policy

-   `buildHtmlEnvelope` accepts only absolute `http`/`https` image URLs.
-   `<img>` elements with invalid/unsupported `src` values are skipped (not thrown).
-   If an optional `screenshotUrl` is provided but invalid or unsupported, it will throw.
-   Inline `<svg>` content embedded in HTML is left as-is inside the primary HTML context; only external `.svg` image URLs are fetched and embedded as text.

## Breaking Changes (v2.0.0)

This version includes breaking changes to the AI context pipeline:

-   **`AiContextEnvelope` interface**: The `imageUrls` field has been renamed to `rasterImageUrls`, and a new `vectorImageUrls` field has been added.
-   **`buildHtmlEnvelope` function**: Now async and performs network fetches for SVG content from `<img>` sources.
-   **Enhanced context**: Both builders now provide richer context with explicit separation of raster and vector images, improving AI accuracy especially for widget mapping.

### Migration Guide

1.  Update `AiContextEnvelope` usage:
    ```ts
    // Before
    const envelope: AiContextEnvelope = {
      context: [...],
      imageUrls: [...]
    }
    
    // After
    const envelope: AiContextEnvelope = {
      context: [...],
      rasterImageUrls: [...],
      vectorImageUrls: [...]
    }
    ```

2.  Make `buildHtmlEnvelope` calls async:
    ```ts
    // Before
    const envelope = buildHtmlEnvelope(html, screenshotUrl);
    
    // After
    const envelope = await buildHtmlEnvelope(html, screenshotUrl);
    ```

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