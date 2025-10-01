# QTI AI Batch Generation Post‑Mortem (staar-batch-generate)

## Overview

This report analyzes all errors emitted during the latest batch run of the `staar-batch-generate.ts` script, using evidence from `data/logs.txt`, and maps each error to root causes in code with precise citations. It concludes with a prioritized fix list.

## Error Inventory and Evidence

### 1) OpenAI structured output schema errors: widget_content_generator (400)

Representative log entries:
```2556:2561:data/logs.txt
DEBUG generated json schema for openai functionName=generateWidgetContent generatorName=widget_content_generator schema={...}
ERROR generate widget content error=Error: 400 Invalid schema for response_format 'widget_content_generator': In context=('additionalProperties', 'anyOf', '0', 'anyOf', '14'), 'required' is required to be supplied and to be an array including every key in properties. Missing 'shapes'.
ERROR failed to generate structured item from envelope questionDir=question_15 ... error=ai widget generation: 400 Invalid schema for response_format 'widget_content_generator': ... Missing 'shapes'.
ERROR question processing failed questionDir=question_15 ... error=generate from envelope: ai widget generation: 400 Invalid schema ... Missing 'shapes'.
```
Additional occurrences for other questions:
```2560:2561:data/logs.txt
ERROR failed to generate structured item from envelope questionDir=question_15 ... Missing 'shapes'.
```
```2618:2619:data/logs.txt
ERROR failed to generate structured item from envelope questionDir=question_29 ... Missing 'shapes'.
ERROR question processing failed questionDir=question_29 ... Missing 'shapes'.
```
```2629:2630:data/logs.txt
ERROR failed to generate structured item from envelope questionDir=question_23 ... Missing 'shapes'.
ERROR question processing failed questionDir=question_23 ... Missing 'shapes'.
```
```2832:2833:data/logs.txt
ERROR failed to generate structured item from envelope questionDir=question_06 ... Missing 'shapes'.
ERROR question processing failed questionDir=question_06 ... Missing 'shapes'.
```
```2840:2841:data/logs.txt
ERROR failed to generate structured item from envelope questionDir=question_02 ... Missing 'shapes'.
ERROR question processing failed questionDir=question_02 ... Missing 'shapes'.
```
```2852:2853:data/logs.txt
ERROR failed to generate structured item from envelope questionDir=question_08 ... Missing 'shapes'.
ERROR question processing failed questionDir=question_08 ... Missing 'shapes'.
```
```2904:2912:data/logs.txt
ERROR failed to generate structured item from envelope questionDir=question_12 ... Missing 'shapes'.
ERROR failed to generate structured item from envelope questionDir=question_04 ... Missing 'shapes'.
```

Code path causing this:
```431:485:src/structured/client.ts
// Accept any widget id → widget union; enforce required ids below
const WidgetCollectionSchema = z.record(z.string(), WidgetSchema)
const widgetJsonSchema = toJSONSchemaPromptSafe(WidgetCollectionSchema)
...
const widgetParams: ChatCompletionCreateParamsNonStreaming = {
  ...,
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "widget_content_generator",
      schema: widgetJsonSchema as Record<string, unknown>,
      strict: true
    }
  }
}
```
`WidgetSchema` includes widgets like `partitionedShape` which define a required `shapes` property in one branch:
```132:156:src/widgets/generators/partitioned-shape.ts
shapes: z.array(createPartitionShapeSchema()).describe("Shapes to display...")
```
Root cause: Our JSON Schema emitted for the union of all widgets under `additionalProperties.anyOf[...]` has at least one branch where `properties` includes `shapes`, but the top-level schema for that branch is missing a `required` array enumerating all keys, violating OpenAI response_format validator. `toJSONSchemaPromptSafe` enforces `additionalProperties=false` but does not synthesize a `required` array for every object node.

### 2) OpenAI structured output schema errors: feedback_generator (400)

Representative log entries:
```2533:2536:data/logs.txt
DEBUG generated json schema for openai ... generatorName=feedback_generator ...
ERROR generate feedback error=Error: 400 Invalid schema for response_format 'feedback_generator': Expected at most 1000 enum values ... received 1008.
ERROR failed to generate structured item from envelope questionDir=question_32 ... error=generate feedback: 400 Invalid schema ... received 1008.
ERROR question processing failed questionDir=question_32 ... error=generate from envelope: generate feedback: 400 Invalid schema ... received 1008.
```
Also observed again for `question_28`.

Code path causing this:
```381:401:src/structured/client.ts
const feedbackJsonSchema = toJSONSchemaPromptSafe(FeedbackSchema)
...
response_format: { type: "json_schema", json_schema: { name: "feedback_generator", schema: feedbackJsonSchema as Record<string, unknown>, strict: true } }
```
Feedback schema construction inflates enum counts via nested discriminated unions of `BlockContent` and `InlineContent` repeated across every leaf:
```35:91:src/core/feedback/authoring/schema.ts
export function createNestedFeedbackZodSchema(...) {
  const ScopedBlockContentSchema = createBlockContentSchema(widgetTypeKeys)
  const LeafNodeSchema = z.object({ content: ScopedBlockContentSchema }).strict()
  // builds nested objects for every outcome path (A,B,C... and nested combos)
}
```
Root cause: The prompt JSON Schema includes many duplicated discriminated unions (paragraph, codeBlock, etc.) for each feedback leaf, pushing OpenAI’s limit of "at most 1000 enum values in total" over the threshold (1008). This is cumulative across `anyOf` branches.

### 3) Upstream OpenAI transient failures (502 Bad Gateway)

Representative log entries:
```2656:2669:data/logs.txt
ERROR ai shell generation error=Error: 502 <html> ... cloudflare ...
ERROR generate assessment shell error=ai shell generation: 502 <html> ...
ERROR failed to generate structured item from envelope questionDir=question_18 ... 502 ...
ERROR question processing failed questionDir=question_18 ... 502 ...
```
Code path:
```108:131:src/structured/client.ts
const response = await errors.try(openai.chat.completions.create(params))
if (response.error) {
  logger.error("ai shell generation", { error: response.error })
  throw errors.wrap(response.error, "ai shell generation")
}
```
Root cause: External service returned HTTP 502 (Cloudflare). Our code fails fast (correct), but we lack retry/backoff specifically for transient 5xx in this step.

### 4) QTI compilation rejects raw currency/percent in text (pre-validator)

Representative log entries:
```2764:2767:data/logs.txt
ERROR raw currency/percent in text content context=item.feedbackBlocks[FB__RESPONSE_A].paragraph text=... earns $15,106.
ERROR failed to compile structured item to qti questionDir=question_31 error=currency and percent must be expressed in MathML, not raw text ...
ERROR question processing failed questionDir=question_31 ... error=qti compilation: currency and percent must be expressed in MathML ...
```
```2894:2896:data/logs.txt
ERROR raw currency/percent in text content context=item.feedbackBlocks[FB__RESPONSE_A].paragraph text=... Marta starts with $60.36 ...
ERROR failed to compile structured item to qti questionDir=question_01 error=currency and percent must be expressed in MathML ...
```
Code enforcing this:
```84:97:src/compiler/pre-validator.ts
const hasDollarNumber = /\$(?=\s*\d)/.test(item.content)
const hasNumberPercent = /\d\s*%/.test(item.content)
if (hasCurrencySpan || hasDollarNumber || hasNumberPercent) {
  logger.error("raw currency/percent in text content", { context: _context, text: item.content.substring(0, 120) })
  throw errors.new("currency and percent must be expressed in MathML, not raw text ...")
}
```
Root cause: The AI output included raw currency/percent in text nodes. Our widget prompt includes a currency ban, but feedback/shell prompts also need explicit guidance, and/or a sanitizer should convert `$` and `%` into MathML tokens before validation.

### 5) Feedback schema validation: banned caret/pipe characters in text

Representative log entries:
```2768:2804:data/logs.txt
ERROR feedback schema validation error=[ ... "message": "Text content cannot contain '^' or '|' characters." ... ]
ERROR failed to generate structured item from envelope questionDir=question_17 ... error=feedback schema validation: [ ... ]
ERROR question processing failed questionDir=question_17 ... error=generate from envelope: feedback schema validation: [ ... ]
```
Validation rule:
```6:10:src/core/content/schema.ts
const BannedCharsRegex = /[\^|]/
const SafeTextSchema = z.string().refine((val) => !BannedCharsRegex.test(val), {
  message: "Text content cannot contain '^' or '|' characters."
})
```
Root cause: AI produced caret/pipe in plain text. Our prompts prohibit LaTeX and include a caret-ban section for widgets, but the feedback and shell prompts need the same ban and examples. A pre-sanitize step could also strip/replace these characters in text content.

## Tally of Error Types (from the run)

- Widget content schema (Missing 'shapes'): observed in at least 8 question directories: `question_15`, `question_29`, `question_23`, `question_06`, `question_02`, `question_08`, `question_12`, `question_04`.
- Feedback schema enum limit (1008 enums): observed in at least 2 question directories: `question_32`, `question_28`.
- 502 Bad Gateway during shell generation: at least 1 question: `question_18`.
- Currency/percent raw text rejection: at least 2 questions: `question_31`, `question_01`.
- Caret/pipe text ban violations: at least 1 question prominently (`question_17`), multiple repeated validation messages in the log.

Note: Counts reflect explicit matches shown above and may be lower bounds; the log indicates recurring patterns.

## Root Cause Analysis and Code Citations

- Widget generation JSON Schema formation relies on `toJSONSchemaPromptSafe`:
```153:177:src/core/json-schema/to-json-schema.ts
export function toJSONSchemaPromptSafe(schema: z.ZodType): BaseSchema {
  const json = z.toJSONSchema(...)
  stripPropertyNames(json)
  ensureEmptyProperties(json)
  return json
}
```
This does not synthesize `required` arrays for object nodes; OpenAI validator expects `required` to list all property keys for strict schemas. The error pinpoints a specific nested union branch requiring `'shapes'`.

- Feedback JSON Schema explosion is driven by repeating `BlockContent` unions for every leaf in `createNestedFeedbackZodSchema`, multiplied by the number of combinations in the feedback plan, culminating above OpenAI’s enum cap.

- Pre-validator guards correctly block unsafe content; the AI prompts need to better constrain outputs (and optionally a sanitizer pass before validation) to avoid rejections.

## Prioritized Fix Plan

1. High: Fix JSON Schema generation to include `required` arrays for object schemas used in response_format.
   - Update `toJSONSchemaPromptSafe` to post-process every `type: "object"` node by setting `required = Object.keys(properties)` when `additionalProperties === false` and properties is present.
   - Validate locally by converting `WidgetSchema` and checking for required arrays on properties like `shapes`.

2. High: Reduce feedback schema enum count below 1000.
   - Strategy A: Collapse repeated `BlockContent` definitions by refactoring feedback schema to reference a single shared definition (may not be supported by OpenAI validator if it rejects `$ref`).
   - Strategy B: Reduce discriminant space: for feedback, replace nested per-dimension discriminated objects with a flat map keyed by combination IDs:
     - Change the emitted prompt schema for feedback leaves from nested objects to: `{ feedback: { FEEDBACK__OVERALL: { "<COMBO_ID>": { content: BlockContent } ... } } }`.
     - This avoids duplicating unions for each nested branch.
   - Strategy C: Split generation into multiple calls per subset of combos to stay under limits, then merge and validate.

3. Med: Add robust retries with backoff for 5xx responses in OpenAI calls.
   - Wrap `openai.chat.completions.create` with a retry utility (e.g., exponential backoff, jitter), only for idempotent generation steps.

4. Med: Harden prompts to prevent currency/percent and caret/pipe in all stages.
   - Extend bans and examples from `createWidgetContentPrompt` to assessment shell and feedback prompts.
   - Add a conservative pre-sanitize filter before validation: transform `$123` → MathML, and replace `|`/`^` with textual alternatives or escape within MathML as appropriate. Keep this opt-in or guarded by logs to avoid masking mistakes.

5. Low: Add more granular logging of which widget types triggered schema complaints.
   - Log the offending branch path when OpenAI rejects schema; optionally reduce the global widget union to only the types present in `widgetMapping` for the item, not `WidgetSchema` for all widgets.

## Specific Code Changes Proposed (high level)

- `src/core/json-schema/to-json-schema.ts`: augment `ensureEmptyProperties` with `ensureRequiredArrays(node)` to compute `required` for object nodes; apply recursively alongside the existing passes.
- `src/structured/client.ts` (feedback shot): change FeedbackSchema structure to a flat map keyed by combination IDs or split the request by subset of combinations to remain under 1000 enums.
- Retry wrapper utility around all OpenAI calls in `src/structured/client.ts` shots 1–4 and in `src/structured/differentiator.ts`.
- Extend caret/pipe and currency/percent bans into `src/structured/prompts/feedback.ts` and `src/structured/prompts/shell.ts`; optionally add a sanitizer step pre-`compile`.

## Additional Evidence Snippets

- Feedback prompt construction site:
```375:401:src/structured/client.ts
... createFeedbackPrompt(...) -> toJSONSchemaPromptSafe(FeedbackSchema) -> response_format strict true
```
- Banned text characters enforcement:
```6:10:src/core/content/schema.ts
const BannedCharsRegex = /[\^|]/
...
```
- Currency/percent guard:
```84:97:src/compiler/pre-validator.ts
if (hasCurrencySpan || hasDollarNumber || hasNumberPercent) throw errors.new("currency and percent must be expressed in MathML ...")
```

## Conclusion

Most failures stem from OpenAI response_format schema compatibility: missing `required` arrays for object branches in the widget union and enum-count overflow in the feedback schema. Secondary issues are transient 5xx errors and strict content validation conflicts (currency/percent, caret/pipe). Implementing the schema post‑processing for `required`, reducing feedback schema complexity or splitting requests, and hardening prompts plus retries will eliminate the majority of failures in the next run.
