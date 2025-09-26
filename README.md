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

### Full Pipeline: HTML to QTI XML (Network-Enabled)

This example converts raw HTML into a QTI 3.0 XML string. The `buildMathacademyEnvelope` helper is async and fetches SVG content from external image URLs. Inline `<svg>` embedded in the HTML remains as-is inside the primary HTML context and is not duplicated. `<img>` `src` URLs and the optional `screenshotUrl` are validated: only absolute `http`/`https` URLs are accepted. Invalid `<img>` `src` values are skipped; an invalid `screenshotUrl` will throw. Fetch timeout is 30 seconds.

```ts
import OpenAI from "openai";
import * as logger from "@superbuilders/slog";
import { generateFromEnvelope } from "@superbuilders/qti-assessment-item-generator/structured";
import { compile } from "@superbuilders/qti-assessment-item-generator/compiler";
import { buildMathacademyEnvelope } from "@superbuilders/qti-assessment-item-generator/structured/ai-context-builder";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const html = `
  <div>
    <p>Which of these is a prime number?</p>
    <img src="https://example.com/some-diagram.png" alt="Diagram" />
  </div>
`;
// Optional: provide a full screenshot for broader context.
const screenshotUrl = "https://example.com/item-screenshot.png";

// 1. Build the AI context envelope. This builder performs network requests.
const envelope = await buildMathacademyEnvelope(html, screenshotUrl);

// 2. Generate the structured AssessmentItemInput object.
const structuredItem = await generateFromEnvelope(openai, logger, envelope, "fourth-grade-math");

// 3. Compile the structured item to QTI XML.
const xml = await compile(structuredItem);

console.log(xml);
```

### Full Pipeline: Offline HTML to QTI XML (No Network)

For use cases where network requests are forbidden, you can construct the `AiContextEnvelope` manually. This approach allows you to provide raster images as in-memory binary payloads or `data:` URLs, ensuring a completely offline workflow.

```ts
import fs from "fs/promises";
import OpenAI from "openai";
import * as logger from "@superbuilders/slog";
import { generateFromEnvelope } from "@superbuilders/qti-assessment-item-generator/structured";
import { compile } from "@superbuilders/qti-assessment-item-generator/compiler";
import type { AiContextEnvelope, RasterImagePayload } from "@superbuilders/qti-assessment-item-generator/structured/types";

// ---
// In an offline pipeline (e.g., TEKS STAAR), you load all assets from a local source.
// ---

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// 1. Load primary HTML and supplementary SVG content from disk.
const html = await fs.readFile("/abs/path/to/item.html", "utf8");
const svgText = await fs.readFile("/abs/path/to/diagram.svg", "utf8");

// 2. Load a raster image (e.g., a screenshot) and create a payload.
const screenshotBytes = await fs.readFile("/abs/path/to/screenshot.png");
const screenshotPayload: RasterImagePayload = {
  data: new Blob([screenshotBytes]),
  mimeType: "image/png",
};

// 3. Manually build the offline envelope. No network calls will be made.
const envelope: AiContextEnvelope = {
  primaryContent: html,
  supplementaryContent: [svgText],
  multimodalImageUrls: [], // Can also include data: URLs here
  multimodalImagePayloads: [screenshotPayload],
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
import type { AssessmentItemInput } from "@superbuilders/qti-assessment-item-generator/compiler/schemas";

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

### `structured/ai-context-builder`

-   `buildPerseusEnvelope(perseusJson: unknown) => Promise<AiContextEnvelope>`
    -   Creates an envelope from Perseus JSON. Returns an object with `primaryContent`, `supplementaryContent`, `multimodalImageUrls`, and an empty `multimodalImagePayloads`.
-   `buildMathacademyEnvelope(html: string, screenshotUrl?: string) => Promise<AiContextEnvelope>`
    -   Creates an envelope from raw HTML. Fetches external `.svg` files and collects raster image URLs. Returns an object with `primaryContent`, `supplementaryContent`, `multimodalImageUrls`, and an empty `multimodalImagePayloads`. Only absolute `http`/`https` URLs are accepted.

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

## Image URL and Payload Policy

-   **`buildMathacademyEnvelope`** (Network-Enabled): Accepts only absolute `http`/`https` image URLs. `<img>` elements with invalid `src` values are skipped. An invalid `screenshotUrl` will throw.
-   **Offline Manual Construction**: The `multimodalImageUrls` array accepts both `http`/`https` URLs and `data:` URLs. The `multimodalImagePayloads` array accepts raw binary image data as `Blob` objects with a specified MIME type.
-   Vector graphics (`.svg`) must be provided as raw string content in the `supplementaryContent` array.

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