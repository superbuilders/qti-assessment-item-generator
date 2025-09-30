Title: Overall Feedback Plan – Explicit, First-Class Contract (Breaking Change)

Status: Draft for review

Author: Engineering

Summary

- Replace inference-based feedback linking with an explicit, first-class Feedback Plan that defines dimensions, order, mode, and expected identifiers.
- The compiler, schema validation, and structured pipeline will consume the Feedback Plan exclusively. Interactions are cross-checked for consistency only; no inference.
- This is a strict breaking change: existing items must declare a Feedback Plan and update feedback block identifiers accordingly.

Goals

- Deterministic and explicit mapping from interaction responses to `FEEDBACK__OVERALL` values.
- Eliminate brittle parsing of `interactions` and `responseDeclarations` to infer feedback semantics.
- Single source of truth for: (a) nested schema shape, (b) expected feedback block identifiers, (c) response-processing decision tree.

Non-Goals

- Backward compatibility for the previous inference approach.
- Auto-deriving dimensions from interactions. The Plan must be authored explicitly.

Key Concepts

- Overall Outcome: Continue to use a single `FEEDBACK__OVERALL` QTI outcome.
- Modes:
  - Combo mode: All combinations enumerated explicitly; identifiers are `FB__…` derived from dimension keys; max combinations ≤ 32.
  - Fallback mode: Unified binary shape with `CORRECT`/`INCORRECT`.
- Dimensions:
  - Enumerated single-select: explicit `keys` exactly matching choice identifiers (order-preserving).
  - Binary (non-enumerated and enumerated-multiple treated as binary): `CORRECT`/`INCORRECT`.

Data Model (New)

```ts
type FeedbackDimension =
	| { responseIdentifier: string; kind: "enumerated"; keys: string[] }
	| { responseIdentifier: string; kind: "binary" }

interface FeedbackPlan {
	mode: "combo" | "fallback"
	dimensions: FeedbackDimension[] // ordered; defines identifier path order
	expectedIdentifiers: string[] // required hard guard; must equal derived set exactly
}

interface AssessmentItemInput {
	// existing
	identifier: string
	title: string
	responseDeclarations: ResponseDeclaration[]
	interactions: Record<string, AnyInteraction>
	body: BlockContent
	widgets: Record<string, Widget>

	// new
	feedbackPlan: FeedbackPlan
	// BREAKING: feedbackBlocks now a map keyed by identifier; outcome is globally FEEDBACK__OVERALL
	feedbackBlocks: {
		[id in ("CORRECT" | "INCORRECT" | `FB__${string}`)]: BlockContent
	}
}
```

Identifier Derivation (unchanged semantics)

- Use `normalizeIdPart` and `deriveComboIdentifier(pathParts)` as implemented.
- For each dimension in order:
  - enumerated: `RESPONSE_<responseIdentifier>_<KEY>`
  - binary: `RESPONSE_<responseIdentifier>_CORRECT` or `_INCORRECT`
- Leaf identifier: `FB__${pathParts.join("__")}`

Identifier Contract & Normalization

- Type: `type FeedbackIdentifier = "CORRECT" | "INCORRECT" | `FB__${string}``
- Regex enforcement:
  - `OUTCOME_IDENTIFIER_REGEX = /^FEEDBACK__OVERALL$/`
  - `FEEDBACK_BLOCK_IDENTIFIER_REGEX = /^(CORRECT|INCORRECT|FB(__[A-Z0-9_]+)+)$/`
u  - `RESPONSE_IDENTIFIER_REGEX = /^RESPONSE(?:_[A-Za-z0-9_]+)?$/`
- Response identifier scope:
  - Applies to `responseDeclarations[].identifier` and every `interactions[.*].responseIdentifier`.
  - Validation MUST hard fail on any mismatch (no coercion, no fallbacks).
- Normalization rules (applied to path parts before joining):
  - Uppercase all letters
  - Replace any character outside `[A-Z0-9_]` with `_`
  - Examples:
    - `response` → `RESPONSE`
    - `text-correct` → `TEXT_CORRECT`
    - `x y` → `X_Y`
  - Banned characters are replaced, never dropped; collisions are detected by exact equality of the final id set.

Compiler Changes

1) Validation (schemas)

- Add `feedbackPlan` to `AssessmentItemInput` schema.
- Validate:
  - All response identifiers match `RESPONSE_IDENTIFIER_REGEX`.
  - Every `feedbackPlan.dimensions[n].responseIdentifier` exists in `responseDeclarations`.
  - For `kind:"enumerated"`: referenced interaction is single-select enumerated; `keys` exactly match `choices[].identifier` including order and length.
  - For `kind:"binary"`: the base type/cardinality is evaluable for correctness.
  - Compute `combinationCount` from `dimensions`:
    - If `mode === "combo"`: require `0 < combinations ≤ 32`.
    - If `mode === "fallback"`: require `combinations === 0` or `combinations > 32`.
  - Derive expected identifiers:
    - Combo: full Cartesian product → `FB__…` ids.
    - Fallback: `{ CORRECT, INCORRECT }`.
- Verify `feedbackBlocks` keys are an exact set-match with `expectedIdentifiers`.
- Verify `expectedIdentifiers` equals the derived identifiers exactly (order-insensitive set match).

Canonical Ordering & Determinism

- Rendering order is defined strictly by `feedbackPlan.expectedIdentifiers` sequence.
- Dimension order is exactly the author-provided order in `feedbackPlan.dimensions`.
- The compiler must never infer order from JSON object property order or perform any reordering.

2) Response Processing

- Consume only `feedbackPlan` to generate logic:
  - Combo: build a decision tree by iterating dimensions in order.
    - enumerated: `<qti-match><qti-variable identifier="RESPONSE_X"/><qti-base-value base-type="identifier">KEY</qti-base-value></qti-match>`
    - binary: `<qti-match><qti-variable identifier="RESPONSE_X"/><qti-correct identifier="RESPONSE_X"/></qti-match>`
  - Leaves set `<qti-set-outcome-value identifier="FEEDBACK__OVERALL">` with derived `FB__…`.
  - Fallback: set `FEEDBACK__OVERALL` to `CORRECT` only when all dimensions evaluate to correct; else `INCORRECT`.
- Keep score logic unchanged.
- Structured logging: info-start with `mode` and `combinationCount`.

Binary Evaluation Policies

- For `kind: "binary"`, authors may specify evaluation flags to make correctness explicit and portable (example list; implementation subset allowed):
  - `textNormalization: "raw" | "lowercase" | "trim" | "collapseWhitespace" | "numeric-eq"`
  - `numericTolerance: number | null` (only with `numeric-eq`)
- The schema validates flag compatibility and response processing emits appropriate QTI comparisons.

3) Compiler (blocks)

- Continue to render feedback blocks with `outcome-identifier="FEEDBACK__OVERALL"`.
- Rendering order is defined by `feedbackPlan.expectedIdentifiers`; for each id, fetch content from `feedbackBlocks[id]`. If missing, log error and throw.
- Disallow interactions inside feedback content (as implemented).

Rationale for Map shape

- Eliminates duplicates by construction; no ambiguity about ordering.
- O(1) lookup by identifier in the compiler and converters.
- Strict, explicit separation of concerns: order lives in the plan; storage is a pure key→content map. Aligns with no-fallbacks.

Structured Pipeline Changes

- Zod schema builder for the nested shape uses `feedbackPlan.dimensions` exclusively:
  - Combo: nested exact-object keyed by `keys`/`CORRECT|INCORRECT` in declared order.
  - Fallback: `{ CORRECT: BlockContent, INCORRECT: BlockContent }`.
- Converter `convertNestedFeedbackToBlocks` traverses according to the plan and outputs a map `{ [id]: BlockContent }` keyed by derived `FB__…` (or CORRECT/INCORRECT in fallback).
- Always use `.safeParse` with error wrapping per rules.

Zod Schema Snippets (authoring)

```ts
import { z } from "zod"

export const FeedbackDimensionSchema = z.union([
	z.object({
		responseIdentifier: z.string(),
		kind: z.literal("enumerated"),
		keys: z.array(z.string()).min(1)
	}).strict(),
	z.object({
		responseIdentifier: z.string(),
		kind: z.literal("binary")
	}).strict()
])

export const FeedbackPlanSchema = z
	.object({
		mode: z.union([z.literal("combo"), z.literal("fallback")]),
		dimensions: z.array(FeedbackDimensionSchema).min(1),
		expectedIdentifiers: z.array(z.string()).min(1)
	})
	.strict()

export const FeedbackBlocksMapSchema = z.record(
	z.union([z.literal("CORRECT"), z.literal("INCORRECT"), z.string()]),
	/* BlockContent schema here */ z.any()
)
```

Breaking Changes / Migration

- Existing items must:
  - Add `feedbackPlan` with explicit dimensions and mode.
  - Replace array-shaped `feedbackBlocks` with a map keyed by identifiers.
  - Ensure `feedbackBlocks` keys match the plan-derived set exactly.
  - Update any tests/snapshots to the new identifiers if previously inferred.

Authoring Checklist

1) List dimensions (in final evaluation order) and define each as `enumerated` with exact `keys` or `binary` with any evaluation flags.
2) Compute the Cartesian product and write `expectedIdentifiers` in canonical order.
3) Fill `feedbackBlocks` map with every identifier from `expectedIdentifiers`.
4) Validate: keys(feedbackBlocks) and `expectedIdentifiers` must be an exact set-match.
5) Keep `responseDeclarations`/interactions consistent with dimensions (types and choices).

Acceptance Criteria

- Compiler rejects any item lacking `feedbackPlan`.
- Schema validation enforces all constraints listed above.
- Response processing is generated solely from `feedbackPlan` and produces the correct `FEEDBACK__OVERALL` values.
- Structured pipeline successfully validates and converts nested feedback using the plan.
- Extensive tests:
  - Unit: identifier derivation, schema validation errors, decision tree generation for various dimension mixes.
  - Integration: end-to-end compile for representative items (single enumerated, mixed enumerated + binary, fallback boundary cases).

Out of Scope

- Alternative outcomes beyond `FEEDBACK__OVERALL`.
- Automated backfill of `feedbackPlan` for legacy items.

Risks & Mitigations

- Risk: Authors forget to keep `keys` in the same order as choices.
  - Mitigation: Strict equality check with clear error messages and structured logs.
- Risk: Large items incorrectly choose `combo` with > 32 combos.
  - Mitigation: Hard enforcement with actionable error and log.

Error Taxonomy (names/messages)

- `ErrMissingFeedbackPlan`: item missing `feedbackPlan`
- `ErrInvalidModeForCombinationCount`: mode/combinationCount mismatch
- `ErrMissingDimensionResponseIdentifier`: `responseIdentifier` not found in declarations
- `ErrInvalidEnumeratedKeys`: keys mismatch with interaction choices (order/length)
- `ErrInvalidBinaryPolicy`: invalid or incompatible binary evaluation flags
- `ErrIdentifierSetMismatch`: map keys vs `expectedIdentifiers` mismatch
- `ErrUnexpectedFeedbackIdentifier`: identifier not in expected set
- `ErrMissingFeedbackContent`: missing map value for an expected identifier
- `ErrInteractionInFeedbackContent`: interaction found inside feedback content

Telemetry & Logging

- Log (info): `compiling response processing`, attributes `{ mode, itemIdentifier, combinationCount }`.
- Log (error) before throws for violations (missing dimension, mismatch keys, invalid mode/combinations, identifier mismatches).

Open Questions

- Should we add a CLI helper to generate the identifiers from a plan for authoring convenience (non-runtime)?


