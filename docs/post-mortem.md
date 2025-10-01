## QTI STAAR Batch Generation — Post‑Mortem (2025-10-01)

### Executive summary

- 19 questions failed (see failures summary emitted by the batch script).
- The failures cluster into 5 root causes:
  - JSON Schema rejection for widget content (Missing 'rotation' in required) → 12 questions
  - JSON Schema rejection for feedback (enum count > 1000) → 2 questions
  - QTI compiler rejection due to raw currency/percent text → 2 questions
  - OpenAI request timeouts during assessment shell generation → 2 questions
  - Feedback schema validation (nested feedback shape) → 1 question

The highest-impact fix is to correct our JSON Schema emitted for the widget content generation (ensure required lists include every property) or set strict=false for that shot. Addressing that unblocks 12/19 failures (~63%).

---

### Evidence and categorization

#### 1) JSON Schema rejected for widget content (Missing 'rotation')

- Impact: 12 questions failed: question_02, 06, 08, 10, 11, 12, 13, 15, 22, 23, 25, 27

Log excerpts:

```2626:2628:data/logs.txt
ERROR generate widget content error=Error: 400 Invalid schema for response_format 'widget_content_generator': In context=('additionalProperties', 'anyOf', '0', 'anyOf', '4'), 'required' is required to be supplied and to be an array including every key in properties. Missing 'rotation'.
ERROR failed to generate structured item from envelope questionDir=question_11 totalTextLength=20987 estimatedTokens=5247 error=ai widget generation: 400 Invalid schema for response_format 'widget_content_generator': In context=('additionalProperties', 'anyOf', '0', 'anyOf', '4'), 'required' is required to be supplied and to be an array including every key in properties. Missing 'rotation'.
ERROR question processing failed questionDir=question_11 fullPath=/Users/bjorn/Documents/Code/qti-assessment-item-generator/teks-staar-scrape/staar_test_scrape/question_11 error=generate from envelope: ai widget generation: 400 Invalid schema for response_format 'widget_content_generator': In context=('additionalProperties', 'anyOf', '0', 'anyOf', '4'), 'required' is required to be supplied and to be an array including every key in properties. Missing 'rotation'.
```

Root cause analysis:

- We send OpenAI a JSON Schema with response_format strict: true for widget generation:

```463:476:src/structured/client.ts
const widgetParams: ChatCompletionCreateParamsNonStreaming = {
    model: OPENAI_MODEL,
    messages: [
        { role: "system", content: widgetPrompt.systemInstruction },
        { role: "user", content: widgetPrompt.userContent }
    ],
    response_format: {
        type: "json_schema",
        json_schema: {
            name: "widget_content_generator",
            schema: widgetJsonSchema as Record<string, unknown>,
            strict: true
        }
    },
    stream: false
}
```

- Our JSON Schema conversion removes propertyNames and normalizes additionalProperties, but does not ensure that every object schema contains a required array listing all keys. OpenAI’s structured outputs require that required include every key.

```153:176:src/core/json-schema/to-json-schema.ts
export function toJSONSchemaPromptSafe(schema: z.ZodType): BaseSchema {
    const options: Parameters<typeof z.toJSONSchema>[1] = {
        target: "draft-2020-12",
        io: "input",
        unrepresentable: "any",
    }

    const result = errors.trySync(() => z.toJSONSchema(schema, options))
    if (result.error) {
        logger.error("json schema prompt-safe conversion", { error: result.error })
        throw errors.wrap(result.error, "json schema prompt-safe conversion")
    }
    const json = result.data
    if (!isBaseSchema(json)) {
        logger.error("json schema prompt-safe conversion produced invalid schema")
        throw errors.new("json schema conversion invalid")
    }

    // Remove propertyNames to satisfy OpenAI response_format validator
    stripPropertyNames(json)
    ensureEmptyProperties(json)
    return json
}
```

- Example widget schemas clearly define a rotation property (so the property exists), e.g. `circleDiagram` and `circleAngleDiagram`:

```108:126:src/widgets/generators/circle-diagram.ts
export const CircleDiagramPropsSchema = z
    .object({
        type: z
            .literal("circleDiagram")
            .describe("Widget type identifier for circle-based geometric diagrams and visualizations."),
        shape: z
            .enum(["circle", "semicircle", "quarter-circle"])
            .describe(
                "Base geometric shape to display. 'circle' shows full 360° circle, 'semicircle' shows 180° half-circle, 'quarter-circle' shows 90° quarter section. Affects which portion of the circle is visible."
            ),
        rotation: z
            .number()
            .describe(
                "Rotation angle in degrees for the entire shape. 0° means no rotation. For semicircle: 0° = flat edge at bottom, 90° = flat edge at left. Positive values rotate counter-clockwise."
            ),
        width: createWidthSchema(),
        height: createHeightSchema(),
```

Conclusion: The OpenAI validator fails because our emitted schema for strict structured outputs lacks required arrays containing every defined property name. The error surfaces as “Missing 'rotation'” for one of the union members.

Remediation options:

- Preferred: Post-process the JSON Schema in `toJSONSchemaPromptSafe` to attach `required: Object.keys(properties)` on every object schema (including objects inside anyOf/oneOf/allOf and additionalProperties when schema-typed). Keep `additionalProperties: false`.
- Fast unblock: Set `strict: false` for the widget content shot only (keeps other shots strict). This relaxes OpenAI’s enforcement and should immediately unblock these 12 failures.

#### 2) JSON Schema rejected for feedback (enum limit exceeded)

- Impact: 2 questions failed: question_28, question_32

Log excerpts:

```2542:2544:data/logs.txt
ERROR generate feedback error=Error: 400 Invalid schema for response_format 'feedback_generator': Expected at most 1000 enum values in total within a single schema when using structured outputs, but received 1008. Consider reducing the number of enums, or use 'strict: false' to opt out of structured outputs.
ERROR failed to generate structured item from envelope questionDir=question_28 totalTextLength=17661 estimatedTokens=4415 error=generate feedback: 400 Invalid schema for response_format 'feedback_generator': Expected at most 1000 enum values in total within a single schema when using structured outputs, but received 1008. Consider reducing the number of enums, or use 'strict: false' to opt out of structured outputs.
ERROR question processing failed questionDir=question_28 fullPath=/Users/bjorn/Documents/Code/qti-assessment-item-generator/teks-staar-scrape/staar_test_scrape/question_28 error=generate from envelope: generate feedback: 400 Invalid schema for response_format 'feedback_generator': Expected at most 1000 enum values in total within a single schema when using structured outputs, but received 1008. Consider reducing the number of enums, or use 'strict: false' to opt out of structured outputs.
```

Root cause analysis:

- We send feedback schema with strict structured outputs:

```381:394:src/structured/client.ts
const feedbackParams: ChatCompletionCreateParamsNonStreaming = {
    model: OPENAI_MODEL,
    messages: [
        { role: "system", content: feedbackSystem },
        { role: "user", content: feedbackUser }
    ],
    response_format: {
        type: "json_schema",
        json_schema: {
            name: "feedback_generator",
            schema: feedbackJsonSchema as Record<string, unknown>,
            strict: true
        }
    },
    stream: false
}
```

- The generated feedback schema is large. Dynamic nested feedback plus a broad `BlockContent`/`InlineContent` union with many discriminants inflates OpenAI’s internal enum count to 1008 (>1000 cap). The conversion step currently only strips `propertyNames` but doesn’t reduce discriminant cardinality.

Remediation options:

- Preferred near-term: Set `strict: false` for feedback only to bypass the enum cap.
- Structural: Reduce the prompt-time feedback schema to a smaller subset for LLM output (e.g., limit block/inline types for feedback generation), then validate and expand internally. Alternatively, break feedback generation into multiple smaller calls (per-combination or per-dimension batch) to keep per-call schema complexity below the cap.

#### 3) QTI compilation failed: currency/percent must be MathML

- Impact: 2 questions failed: question_01, question_31

Log excerpts:

```2638:2640:data/logs.txt
ERROR raw currency/percent in text content context=item.feedbackBlocks[FB__RESPONSE_A].paragraph text=Therefore, the team earns $15,106 from ticket sales.
ERROR failed to compile structured item to qti questionDir=question_31 error=currency and percent must be expressed in MathML, not raw text (use <mo>$</mo><mn>n</mn> and <mn>n</mn><mo>%</mo>)
ERROR question processing failed questionDir=question_31 fullPath=/Users/bjorn/Documents/Code/qti-assessment-item-generator/teks-staar-scrape/staar_test_scrape/question_31 error=qti compilation: currency and percent must be expressed in MathML, not raw text (use <mo>$</mo><mn>n</mn> and <mn>n</mn><mo>%</mo>)
```

Root cause analysis:

- The compiler explicitly rejects raw currency/percent text during pre-validation:

```85:97:src/compiler/pre-validator.ts
// Strict currency/percent enforcement: raw text currency/percent are banned.
// Require MathML tokens instead (e.g., <mo>$</mo><mn>50</mn> and <mn>5</mn><mo>%</mo>).
const hasCurrencySpan = /<span\s+class\s*=\s*["']currency["']\s*>/i.test(item.content)
const hasDollarNumber = /\$(?=\s*\d)/.test(item.content)
const hasNumberPercent = /\d\s*%/.test(item.content)
if (hasCurrencySpan || hasDollarNumber || hasNumberPercent) {
    logger.error("raw currency/percent in text content", {
        context: _context,
        text: item.content.substring(0, 120)
    })
    throw errors.new(
        "currency and percent must be expressed in MathML, not raw text (use <mo>$</mo><mn>n</mn> and <mn>n</mn><mo>%</mo>)"
    )
}
```

Remediation options:

- Prompting: Emphasize currency/percent MathML production in all user/system instructions for interaction and feedback generation.
- Normalization step: Add a compile-time transformer to convert `$123` and `45%` into the required MathML tokens prior to validation. This is deterministic (not a fallback) and preserves semantics.

#### 4) OpenAI request timeouts during assessment shell generation

- Impact: 2 questions failed: question_03, question_29

Log excerpts:

```2955:2959:data/logs.txt
ERROR ai shell generation error=Error: Request timed out.
ERROR generate assessment shell error=ai shell generation: Request timed out.
ERROR failed to generate structured item from envelope questionDir=question_03 totalTextLength=10276 estimatedTokens=2569 error=generate assessment shell: ai shell generation: Request timed out.
ERROR question processing failed questionDir=question_03 fullPath=/Users/bjorn/Documents/Code/qti-assessment-item-generator/teks-staar-scrape/staar_test_scrape/question_03 error=generate from envelope: generate assessment shell: ai shell generation: Request timed out.
```

Root cause analysis:

- Large envelopes (e.g., question_29 with ~9.6k estimated tokens) coupled with strict JSON schema likely increase latency. We currently use a single non-streaming call:

```101:122:src/structured/client.ts
logger.debug("calling openai for assessment shell with multimodal input")
const params: ChatCompletionCreateParamsNonStreaming = {
    model: OPENAI_MODEL,
    messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: messageContent }
    ],
    response_format: {
        type: "json_schema",
        json_schema: {
            name: "assessment_shell_generator",
            schema: jsonSchema as Record<string, unknown>,
            strict: true
        }
    },
    stream: false
}
```

Remediation options:

- Reduce input size: strip boilerplate HTML, comments, and de-duplicate SVGs prior to the call.
- Retries/backoff: add retry with jitter on timeouts.
- Streaming or chunking: switch to a streaming parse or split the task into smaller sub-requests.

#### 5) Feedback schema validation (nested feedback shape)

- Impact: 1 question failed: question_09

Log excerpts:

```2790:2826:data/logs.txt
ERROR feedback schema validation error=[
ERROR failed to generate structured item from envelope questionDir=question_09 totalTextLength=11463 estimatedTokens=2866 error=feedback schema validation: [
ERROR question processing failed questionDir=question_09 fullPath=/Users/bjorn/Documents/Code/qti-assessment-item-generator/teks-staar-scrape/staar_test_scrape/question_09 error=generate from envelope: feedback schema validation: [
```

Root cause analysis:

- We validate the LLM output against a dynamically constructed, strict nested schema derived from the `FeedbackPlan`:

```114:121:src/core/feedback/authoring/schema.ts
export function validateNestedFeedback<P extends FeedbackPlan, const E extends WidgetTypeTuple>(
    nested: unknown,
    feedbackPlan: P,
    widgetTypeKeys: E
): NestedFeedbackAuthoring<P, E> {
    const schema = createNestedFeedbackZodSchema(feedbackPlan, widgetTypeKeys)
    const result = schema.safeParse(nested)

    if (!result.success) {
        logger.error("feedback schema validation", { error: result.error })
        throw errors.wrap(result.error, "feedback schema validation")
    }
```

- The constructed schema is exact-object (`.strict()`) at each level:

```89:91:src/core/feedback/authoring/schema.ts
const FeedbackMapSchema = z.object({ FEEDBACK__OVERALL: OverallSchema }).strict()
const Schema = z.object({ feedback: FeedbackMapSchema }).strict()
return Schema
```

Remediation options:

- Prompting: provide precise few-shot structures that match the plan for the specific item.
- Structural: for LLM-facing schema only, allow `.passthrough()` on the outermost objects or relax certain unions; still re-validate strictly later before compile.

---

### Tally and prioritization

- Totals by category (questions impacted):
  - Widget content JSON Schema (Missing 'rotation' required): 12
  - Feedback JSON Schema (enum > 1000): 2
  - Compiler currency/percent MathML enforcement: 2
  - OpenAI timeouts: 2
  - Feedback schema validation: 1
  - Sum: 19

Prioritized fix list (highest ROI first):

1) Fix schema strictness for widget content generation (12/19)
   - Add required arrays to all object schemas in `toJSONSchemaPromptSafe` (deep traversal), or set `strict: false` for widget shot.
2) Reduce feedback schema complexity or disable strict for feedback (2/19)
   - Set `strict: false` for feedback shot to bypass enum cap; or narrow `BlockContent`/`InlineContent` for feedback generation.
3) Prevent raw currency/percent in outputs (2/19)
   - Strengthen prompting; add deterministic pre-compile normalizer from `$n`/`n%` to MathML tokens.
4) Address timeouts (2/19)
   - Reduce envelope size; add retry strategy; consider streaming or chunked generation for shells.
5) Improve feedback nested shape success (1/19)
   - Tighten prompt examples to match `FeedbackPlan`; optionally relax outer `.strict()` for LLM outputs only.

---

### Appendix: additional supporting snippets

- Feedback shot schema generation and logging:

```375:380:src/structured/client.ts
const feedbackJsonSchema = toJSONSchemaPromptSafe(FeedbackSchema)
logger.debug("generated json schema for openai", {
    functionName: "generateFeedback",
    generatorName: "feedback_generator",
    schema: feedbackJsonSchema
})
```

- Widget shot schema generation and logging:

```454:461:src/structured/client.ts
const WidgetCollectionSchema = z.record(z.string(), WidgetSchema)
const widgetJsonSchema = toJSONSchemaPromptSafe(WidgetCollectionSchema)
logger.debug("generated json schema for openai", {
    functionName: "generateWidgetContent",
    generatorName: "widget_content_generator",
    schema: widgetJsonSchema
})
```

- Confirmation of failures summary line in logs:

```3024:3041:data/logs.txt
ERROR some questions failed to process failureCount=19 failedResults=[{"reason":generate from envelope: ai widget generation: 400 Invalid schema for response_format 'widget_content_generator': ...},{"reason":qti compilation: currency and percent must be expressed in MathML, ...},{"reason":generate from envelope: generate feedback: 400 Invalid schema for response_format 'feedback_generator': ...}, ... ]
```

---

### Actions recommended

- Implement deep schema post-processing to add `required` arrays everywhere (widget and feedback); retain `additionalProperties: false`.
- Flip `strict: false` for the feedback and widget shots as a tactical unblock while the deep schema fix is implemented.
- Enhance prompts to forbid raw currency/percent and add a pre-compile normalizer for `$` and `%` usages.
- Trim/normalize envelope content (minify HTML, drop redundant SVGs), and add retries/backoff for timeouts.
- Provide more specific few-shots for feedback nested shapes matching the generated `FeedbackPlan`.


