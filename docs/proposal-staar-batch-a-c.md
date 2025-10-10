## STAAR Batch Generation Reliability Proposal (A–C only)

This proposal addresses only items A–C from the post-mortem: request stability (timeouts + retries), json_schema name violations on feedback shards, and missing feedback content due to shard failures. D (prompt ablation for very large items) is intentionally excluded here.

### Scope
- Applies to the entire pipeline: all OpenAI calls in `src/structured/*` (shell, interactions, feedback shards, differentiator, and any future generators) — not just the STAAR script.
- No fallback values; strict error propagation and structured logging are preserved.

### Problem Summary (from logs)
- generate assessment shell: ai shell generation: Request timed out (e.g., question_04, 05, 11, 16, 19)
- sharded feedback generation: one or more feedback shards failed to generate (e.g., question_09, 28)
  - Root 400 errors: Invalid `response_format.json_schema.name` (length > 64) on multiple shards
- missing feedback content for combination ... (e.g., question_14, 32)
  - Often a downstream symptom of shard failures or validation issues

## A) Request Stability: Timeouts and Retries

#### Design
- Introduce a single OpenAI call wrapper with:
  - Hardcoded infinite exponential backoff with jitter for retriable errors (408/429/5xx, timeouts, network resets)
  - Hardcoded per-request timeout budget
  - Hardcoded base backoff and max sleep cap
- No configuration knobs or environment variables. Library behavior is fixed and safe by default.
- Observability: structured logs on every failure, backoff, and recovery; no silent catch.
- Safety: never return defaults; either succeed or retry forever (for retriable errors) or fail loudly on non-retriable errors.

#### Implementation Changes
- New utility: `src/structured/utils/openai.ts`
  - `callOpenAIWithRetry(label, fn)` implements classification, infinite backoff, and retries using `errors.try` and `@superbuilders/slog`.
- Replace direct OpenAI calls with wrapper across the entire pipeline:
  - `src/structured/client.ts` — `generateAssessmentShell`, `generateInteractionContent`, `generateFeedbackForOutcomeNested`
  - `src/structured/differentiator.ts` — all OpenAI calls
  - Any future OpenAI calls in `src/structured/*`

#### Global SHOUTY_CONSTANTS (no env)
- `OPENAI_REQUEST_TIMEOUT_MS = 60000`
- `OPENAI_RETRY_BASE_MS = 1000`
- `OPENAI_RETRY_MAX_SLEEP_MS = 60000`
- `OPENAI_RETRY_FOREVER = true` (infinite for retriable errors)
- `FEEDBACK_JSON_SCHEMA_NAME = "feedback_single_path"`
- `FEEDBACK_CONCURRENCY = 4`

#### Example (new utility skeleton)
```ts
// src/structured/utils/openai.ts
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"

const OPENAI_REQUEST_TIMEOUT_MS = 60000
const OPENAI_RETRY_BASE_MS = 1000
const OPENAI_RETRY_MAX_SLEEP_MS = 60000
const OPENAI_RETRY_FOREVER = true

function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)) }

function classify(e: unknown): { retriable: boolean; reason: string } {
	const text = String(e ?? "")
	if (/\b(408|429|500|502|503|504)\b/.test(text)) return { retriable: true, reason: "http-transient" }
	if (/timeout|ETIMEDOUT|ENETUNREACH|ECONNRESET|EAI_AGAIN/i.test(text)) return { retriable: true, reason: "network-timeout" }
	return { retriable: false, reason: "non-retriable" }
}

export async function callOpenAIWithRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
	let attempt = 0
	// eslint-disable-next-line no-constant-condition
	while (true) {
		attempt++
		const result = await errors.try(fn())
		if (!result.error) {
			if (attempt > 1) logger.info("openai recovered after retries", { label, attempt })
			return result.data
		}
		const c = classify(result.error)
		logger.warn("openai request failed", { label, attempt, reason: c.reason, error: result.error })
		if (!c.retriable) throw result.error
		const exp = Math.min(OPENAI_RETRY_MAX_SLEEP_MS, OPENAI_RETRY_BASE_MS * 2 ** (attempt - 1))
		const jitter = Math.max(0, Math.round(exp * (0.8 + Math.random() * 0.4)))
		logger.info("backing off before retry", { label, attempt, delayMs: jitter })
		await sleep(jitter)
	}
}
```

## B) json_schema.name Violations on Feedback Shards

#### Design
- Stop embedding `combination.id` in `json_schema.name`. Use a short constant for all feedback shard requests (e.g., `"feedback_single_path"`).
- Rationale:
  - The OpenAI API enforces a max-length of 64 chars for `name`.
  - Uniqueness is not required; the schema content enforces shape, not the `name`.
  - Deterministic merging does not depend on `name`; we already carry `combination` at the call site.

#### Implementation Changes
- In `generateFeedbackForOutcomeNested` (client.ts) replace:
  - `json_schema: { name: \`feedback_${combination.id.toLowerCase()}\`, schema: jsonSchema, strict: true }`
  - with `json_schema: { name: FEEDBACK_JSON_SCHEMA_NAME, schema: jsonSchema, strict: true }`

#### Deterministic Merge
- Keep `combination.id` as an internal key to map the shard’s BlockContent to the correct slot.
- Assembly order remains `feedbackPlan.combinations` order; compiler expectations unchanged.

## C) Missing Feedback Content for Some Combinations

#### Design
- Treat shard failures (timeout/transient/validation) as retriable and re-issue calls for only failed shards.
- Two retry layers now exist:
  1) Per-request retry (A) inside `generateFeedbackForOutcomeNested`
  2) Targeted shard retry loop in `runShardedFeedbackNested`
- In infinite mode, keep retrying until all shards succeed; in finite mode, fail loudly after budget is exhausted.
- No partial results are emitted; strictly all-or-error.

#### Implementation Changes
- `runShardedFeedbackNested`:
  - First pass: run all shards with concurrency (`FEEDBACK_CONCURRENCY`).
  - Collect rejected shards or ones with invalid/empty content; schedule a second pass for only these shards.
  - Continue retrying failing shards until all succeed (infinite for retriable errors).
  - Maintain structured logs: failureCount, reasons, retry pass number.

#### Validation Prompt Nudge (Optional)
- On validation failures, append a small clarification suffix to the prompt (same schema, no format change):
  - “Return a single JSON object conforming exactly to the provided schema. Do not include extra keys.”
- This reduces model drift; still no fallbacks.

## Files to Modify
- Add `src/structured/utils/openai.ts` (retry wrapper)
- Edit `src/structured/client.ts`:
  - Use `callOpenAIWithRetry` in shell, interaction, and feedback shard calls
  - Set feedback shard `json_schema.name` to `FEEDBACK_JSON_SCHEMA_NAME`
  - Replace `process.env.QTI_FEEDBACK_CONCURRENCY` with `FEEDBACK_CONCURRENCY`
  - Add targeted shard retry logic in `runShardedFeedbackNested`
- Edit `src/structured/differentiator.ts`:
  - Wrap all OpenAI calls with `callOpenAIWithRetry`

## Configuration
- None. Behavior is hardcoded via SHOUTY_CONSTANTS in code.

## Testing & Acceptance Criteria
- Unit tests:
  - Retry wrapper classification/backoff paths (simulate retriable vs non-retriable errors)
  - Ensure infinite mode loops and logs appropriately (use capped iterations in tests)
- Integration tests (mock OpenAI):
  - Force 429/500/timeouts; verify retries and eventual success
  - Force schema name change; verify no 400s on feedback shards
  - Force one shard to fail initially; verify targeted retry recovers and full item compiles
- Acceptance:
  - No occurrences of `Invalid 'response_format.json_schema.name'` in logs
  - Significant drop in shell timeout failures
  - No `missing feedback content for combination` when infinite retry is enabled (unless permanently non-retriable)

## Operational Guidance
- No toggles. The pipeline retries forever for retriable errors and fails loudly on non-retriable errors.
- Monitor logs for `openai request failed`, `backing off before retry`, and `openai recovered after retries`.

## Risks and Trade-offs
- Infinite retry can run indefinitely if a non-transient but misclassified error persists. Mitigate via monitoring and optional hard timeouts.
- Increased cost/time due to retries; offset by dramatically higher completion rate.
- Concurrency tuning may be needed depending on OpenAI rate limits.

## Rollout Plan
- Implement wrapper and schema-name change across the entire pipeline.
- Smoke test on a small subset (e.g., questions 09, 28 for shard errors; 11 for timeout) to confirm fixes.
- Full re-run for stability; adjust `FEEDBACK_CONCURRENCY` constant in code if needed.


