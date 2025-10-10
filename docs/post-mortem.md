## STAAR Batch Generation Post-Mortem (staar-batch-generate.ts)

This document summarizes failures observed in `data/logs.txt` from a run of `scripts/staar-batch-generate.ts`, identifies root causes by reading the code paths, and lists concrete fixes.

### Scope and Evidence

- Script: `scripts/staar-batch-generate.ts`
- Collection: `teks-math-4`
- Inputs: `teks-staar-scrape/staar_test_scrape/question_XX/`
- Outputs present in `data/`: compiled/structured for many items; missing for others.
- Log excerpts indicate nine failures; representative lines:
  - `generate assessment shell: ai shell generation: Request timed out.`
  - `sharded feedback generation: one or more feedback shards failed to generate`
  - `missing feedback content for combination FB__...`
  - `generate feedback shard ... 400 Invalid 'response_format.json_schema.name': string too long ...`

### Failure Categories and Root Causes

1) OpenAI shell generation timeouts
- Evidence (examples):
  - `question_04`, `question_05`, `question_11`, `question_16`, `question_19` failed with `generate assessment shell: ai shell generation: Request timed out.`
- Code path:
  - `generateFromEnvelope` → `generateAssessmentShell` in `src/structured/client.ts` calls `openai.chat.completions.create(params)` with `response_format: json_schema` and no explicit timeout.
  - `question_04` had extremely large input (`totalTextLength≈229,277; estimatedTokens≈57,319`), which increases model latency and risk of timeout.
- Causes:
  - Very large `Primary Content` and supplementary SVG text bloating the prompt.
  - No per-request `timeout` or retry policy; no reduction/ablation of prompt size.

2) Sharded feedback generation hard failures (all shards rejected)
- Evidence (examples):
  - `question_09` and `question_28`: `sharded feedback generation: one or more feedback shards failed to generate`.
  - Logs also show many `generate feedback shard` errors with HTTP 400.
- Code path:
  - `runShardedFeedbackNested` builds one OpenAI request per feedback combination and calls `generateFeedbackForOutcomeNested` with `response_format.json_schema`.
  - If any shard rejects (`PromiseSettledResult` rejected), code throws `one or more feedback shards failed to generate`.
- Causes observed:
  - OpenAI 400 due to `response_format.json_schema.name` exceeding 64 characters. We use `name: feedback_${combination.id.toLowerCase()}`. Some `combination.id` strings are very long (derived from response identifiers and keys), exceeding the API limit.
  - Result: all shards for those items fail immediately with 400; the batch aborts that item.

3) Missing feedback content for a required combination
- Evidence (examples):
  - `question_14`: `missing feedback content for combination FB__RESPONSE_RULE_NUM_N2__RESPONSE_RULE_OP_OP_ADD`
  - `question_32`: `missing feedback content for combination FB__RESPONSE_KM_KM_0__RESPONSE_M_M_20`
- Code path:
  - In `generateFromEnvelope`, after sharded generation, we assemble a nested feedback object. If a combination is missing, we throw with context: `missing feedback content for combination <ID>`.
  - Downstream in the compiler, we also guard for missing leaves (`ErrMissingFeedbackContent`) and extra keys.
- Causes:
  - Model failed to return content for at least one required combination. Reasons include: schema name 400s (see #2), validation failures, or the model producing an empty/incorrect path for one shard.

### Why specific questions were missing

- `question_04` (missing outputs): timeout during shell generation due to very large prompt size.
- `question_05`, `question_11`, `question_16`, `question_19` (missing): shell timeouts, similar cause.
- `question_09`, `question_28` (missing): feedback sharding failed because json_schema.name exceeded length limit, causing all shards to 400.
- `question_14`, `question_32` (missing): at least one required feedback combination missing after sharding; in practice likely the same root as #2 for affected combinations, or a validation failure for a shard that caused it to be rejected.

Note: The scrape listing shows `question_10` had structured-item.json but no compiled.xml in the scrape folder; however `data/` includes `question_10-compiled.xml`, indicating the script wrote outputs to `data/OUTPUT_DIR_ARG`. The current run’s missing items align with the nine failures logged above.

### Concrete Fixes

A) OpenAI request stability and timeouts
- Add explicit client-side timeout and retry with backoff for `openai.chat.completions.create` across shell/interaction/feedback calls using `errors.try` + logging.
- Reduce prompt size:
  - Truncate or summarize massive `Primary Content` JSON (e.g., limit length, strip unused Perseus fields, collapse whitespace) before embedding in prompts.
  - Trim/limit supplementary SVG text length, while still including essential vector info.
  - Consider switching to `fourth-grade-math` collection when appropriate to reduce schema size in prompts, or dynamically include only schemas for widget types detected from the Perseus widgets used.
- If token estimate exceeds a threshold (e.g., >20k chars), log and pre-ablate context before calling the model.

B) json_schema.name length violation in feedback shards
- Current code: `name: \
  json_schema: { name: \`feedback_${combination.id.toLowerCase()}\`, schema: jsonSchema, strict: true }`
- Fix: ensure the `name` is short and stable ≤64 chars. For example:
  - Use a hashed or truncated name: `feedback_${hash(combination.id).slice(0,12)}` or `feedback_${i.toString(36)}` where `i` is the shard index.
  - The `name` is only metadata; shortening it does not affect validation.
- Also sanitize `name` to `[a-z0-9_\-]` and enforce the length limit before the API call.

C) Missing feedback for combination
- Primary fix: after B) resolves the 400s, shards should succeed. Additionally:
  - Add a single retry for any shard that fails validation or returns empty content, with a brief clarification message appended (e.g., “Return JSON exactly matching schema; do not include extra keys.”). Keep retries minimal to avoid cost/time blowups.
  - In combo mode, keep `QTI_FEEDBACK_CONCURRENCY` at a moderate number (e.g., 2–4). Excessive concurrency can increase transient failures.
  - Optionally implement partial salvage: if 1–2 shards fail, retry only those shards; only fail the item after the retry attempt.

D) Guardrails for very large items (e.g., question_04)
- Add a preflight size check prior to shell generation. If content is oversized:
  - Strip non-referenced Perseus widget definitions (we already instruct the model to ignore unused, but we should remove them from the prompt proactively).
  - Drop non-essential long text blocks (e.g., large HTML/SVG comments, duplicated textual artifacts).
  - If still too large, split vector content to a summarized description for the shell shot while keeping full content for a later widget shot.

### Exact Code Changes To Make

1) Limit json_schema.name length (feedback shards)
- File: `src/structured/client.ts` in `generateFeedbackForOutcomeNested`.
- Replace dynamic name with a safe truncated slug or a short hash based on `combination.id`.
  - Example approach (conceptual):
    - Compute `const safeName = `feedback_${sha1(combination.id).slice(0, 16)}`;`
    - Use `safeName` in `json_schema.name`.
  - Also normalize to lowercase and `[a-z0-9_-]` and ensure ≤64 chars.

2) Add request timeout and retry utility
- File: `src/structured/utils/openai.ts` (new): implement `callWithRetry(createParams)` that:
  - Accepts `timeoutMs` (e.g., 45–60s), `maxRetries` (e.g., 2), exponential backoff.
  - Wraps with `errors.try` and logs at warn level on transient errors/timeouts.
- Use this for shell, interaction, and feedback calls in `src/structured/client.ts`.

3) Prompt ablation for large inputs
- File: `scripts/staar-batch-generate.ts` before constructing `envelope`:
  - Add a function that strips unused Perseus widget definitions (based on scanning `[[☃ ...]]` placeholders).
  - Limit supplementary SVG total length (e.g., cap cumulative length to N chars with an ellipsis note).
  - Log the pre/post lengths.

4) Targeted retries for missing feedback combinations
- File: `src/structured/client.ts` in `runShardedFeedbackNested`:
  - After first pass, collect rejected shards; for each, perform one retry call (using the retry wrapper) before deciding failure.
  - Keep `QTI_FEEDBACK_CONCURRENCY` honored for retries.

5) Optional: dynamically narrow widget schemas included in prompts
- File: `src/structured/prompts/shared.ts` `createWidgetSelectionPromptSection`:
  - Instead of dumping all collection schemas, pre-compute likely needed widget types from the shell (e.g., from reserved `widgetRef`s) and include only those schemas to reduce prompt size.

### Operational Recommendations

- Set `QTI_FEEDBACK_CONCURRENCY=3` for balanced throughput and stability.
- Re-run failed questions individually after applying fixes to confirm resolution:
  - Shell timeouts should drop dramatically with timeouts+retries and ablation.
  - Feedback shard 400 errors should disappear once the `json_schema.name` is shortened.
  - “Missing feedback content” should resolve as shards succeed or retry.

### Affected Questions Summary

- Shell timeouts (needs prompt ablation + retry): `04`, `05`, `11`, `16`, `19`.
- Feedback shards 400 name too long (needs short `json_schema.name` + shard retry): `09`, `28`.
- Missing feedback combination (likely fixed by shards fix): `14`, `32`.

### Closing Notes

The errors were not due to local file I/O or missing inputs; the failures are upstream OpenAI API behaviors under large prompts and strict response format rules. The fixes above keep our strict error-handling stance (no fallbacks), improve robustness, and should address the most common failures observed in the logs without compromising safety or type guarantees.
