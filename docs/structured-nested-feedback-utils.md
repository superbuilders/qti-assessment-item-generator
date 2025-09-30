## Structured Nested Feedback Utilities (Authoring Schema → Compiler Map)

Purpose
- Define a reusable, first-class nested exact-object schema for overall feedback authoring (AI/templates) and a deterministic normalization path into the compiler’s canonical shape.
- Cleanly separate structured authoring input from compiler input: authoring uses a nested object; compiler consumes `feedbackPlan` + `feedbackBlocks` map keyed by identifiers.

Non-Goals
- Do not change the compiler model (no parsing; continue using `feedbackPlan.dimensions` + `feedbackPlan.combinations` and a map of `feedbackBlocks`).
- Do not reintroduce any inference in the compiler.

Why
- The nested exact-object is the most reliable way to force complete coverage from AI and to support template authoring. It eliminates missing branches and ambiguous arrays.
- The compiler requires explicit, ordered, identifier-keyed inputs for determinism, fast lookups, strong validation, and zero parsing. That is precisely what `feedbackPlan` + `feedbackBlocks` provide.

Summary of Proposed Utilities
File: `src/structured/feedback-nested-schema.ts`

Exports
- `createNestedFeedbackZodSchema(feedbackPlan: FeedbackPlan, collection: WidgetCollection): z.ZodType<{ feedback: { FEEDBACK__OVERALL: ... } }>`
  - Builds the nested exact-object authoring schema strictly from the `FeedbackPlan` (no inference):
    - Fallback mode: `{ FEEDBACK__OVERALL: { CORRECT: { content }, INCORRECT: { content } } }`
    - Combo mode: recursively nests by `dimensions` in order; for non-enumerated dims use keys `["CORRECT", "INCORRECT"]`.
    - Leaf type is `{ content: BlockContent }`, where `BlockContent` is collection-scoped.

- `validateNestedFeedback(nested: unknown, feedbackPlan: FeedbackPlan, collection: WidgetCollection): { feedback: { FEEDBACK__OVERALL: ... } }`
  - Validates `nested` against the schema above using `.safeParse()` and the standard error-handling contract (log + throw).

- `convertNestedFeedbackToBlocks(nested: { feedback: { FEEDBACK__OVERALL: ... } }, feedbackPlan: FeedbackPlan): Record<string, BlockContent>`
  - Deterministically flattens the nested object to a map keyed by `feedbackPlan.combinations[i].id`.
  - Uses exact path matching (`responseIdentifier` + `key`) to locate each leaf’s content.
  - Hard-fails on missing/extra branches or unresolvable paths.

- `buildEmptyNestedFeedback(feedbackPlan: FeedbackPlan): { feedback: { FEEDBACK__OVERALL: ... } }`
  - Produces an empty, structurally complete nested object (all leaves `{ content: [] }`).
  - Useful for templating, preview UIs, or initializing authoring state.

- `createNestedFeedbackPromptArtifacts(feedbackPlan: FeedbackPlan, collection: WidgetCollection): { FeedbackSchema: z.ZodType<...>, jsonSchema: BaseSchema }`
  - Returns both the Zod schema and a prompt-safe JSON Schema via `toJSONSchemaPromptSafe` for use in LLM calls.

Implementation Details
1) Extract the schema builder
   - Current logic lives in `src/structured/schemas.ts > createCollectionScopedFeedbackSchema`.
   - Move into `createNestedFeedbackZodSchema` without semantic changes.
   - Keep a thin wrapper or re-export in `schemas.ts` temporarily to avoid a large diff; remove after call sites are updated.

2) Co-locate the converter
   - Move `convertNestedFeedbackToBlocks` from `src/structured/feedback-converter.ts` into this module.
   - Keep a re-export from `feedback-converter.ts` for compatibility during migration.

3) Add empty builder and validator
   - `buildEmptyNestedFeedback` recursively builds the nested shape based on `feedbackPlan.dimensions`.
   - `validateNestedFeedback` calls `createNestedFeedbackZodSchema(...).safeParse(...)` and follows our error-handling rules (`logger.error` + `errors.wrap`).

4) Add prompt artifacts helper
   - Compose the Zod schema with `toJSONSchemaPromptSafe` and return both for prompt assembly.

5) Update structured pipeline call sites
   - `src/structured/prompts/feedback.ts`:
     - Replace direct schema creation with `createNestedFeedbackPromptArtifacts`.
   - `src/structured/client.ts`:
     - Replace in-place schema creation/validation with `validateNestedFeedback`.
     - Replace converter import with one from the new module.
   - Tests:
     - `tests/structured/feedback-converter.test.ts`: import converter from new module.
     - `tests/structured/schemas.test.ts`: import schema builder from new module.

6) Optional template helper for research/templates
   - Add `buildFeedbackFromNestedForTemplate(
       interactions: Record<string, AnyInteraction>,
       responseDeclarations: ResponseDeclaration[],
       nested: { feedback: { FEEDBACK__OVERALL: ... } },
       collection: WidgetCollection
     ): { feedbackPlan: FeedbackPlan, feedbackBlocks: Record<string, BlockContent> }`
     - Steps:
       - `const plan = buildFeedbackPlanFromInteractions(interactions, responseDeclarations)`
       - `validateNestedFeedback(nested, plan, collection)`
       - `const blocks = convertNestedFeedbackToBlocks(nested.feedback, plan)`
       - `return { feedbackPlan: plan, feedbackBlocks: blocks }`
   - Location: same module for cohesion.

Contracts and Guarantees
- The nested schema is derived strictly from `FeedbackPlan`; there is no inference or parsing.
- Validation uses `.safeParse()` and our error-handling (`@error-handling.mdc`).
- No fallbacks: all branches must be provided; missing data fails fast (`@no-fallbacks-save-human-lives.mdc`).
- Structured logging throughout (`@structured-logging.mdc`).
- Types are precise; no `any` or `as` (`@type-safety.mdc`).

Rationale Recap
- Authoring (AI/templates): nested exact-object maximizes reliability and completeness.
- Compilation: `feedbackPlan` + map keyed by IDs maximizes determinism and eliminates brittle parsing.
- Centralizing schema/conversion utilities lets us reuse them in the structured pipeline and templates without duplicating logic.

Future Candidates for Extraction
- Array/object shape transforms (`src/structured/shape-helpers.ts`) already generic; consider indexing under `src/structured/utils/`.
- Runtime Zod generator (`src/structured/zod-runtime-generator.ts`) remains standalone and reusable.
- `buildFeedbackPlanFromInteractions` is the only inference site—keep it isolated but document alongside these utilities for authoring flows.

Migration Steps (incremental)
1. Add new module with all exports.
2. Switch `prompts/feedback.ts` and `client.ts` to use the new exports.
3. Update tests to import from the new module.
4. Leave re-exports in place temporarily; remove after downstream updates.

Appendix: Minimal Type Signatures
```
export function createNestedFeedbackZodSchema(
  feedbackPlan: FeedbackPlan,
  collection: WidgetCollection
): z.ZodType<{ feedback: { FEEDBACK__OVERALL: unknown } }>

export function validateNestedFeedback(
  nested: unknown,
  feedbackPlan: FeedbackPlan,
  collection: WidgetCollection
): { feedback: { FEEDBACK__OVERALL: unknown } }

export function convertNestedFeedbackToBlocks(
  nested: { feedback: { FEEDBACK__OVERALL: unknown } },
  feedbackPlan: FeedbackPlan
): Record<string, BlockContent>

export function buildEmptyNestedFeedback(
  feedbackPlan: FeedbackPlan
): { feedback: { FEEDBACK__OVERALL: unknown } }

export function createNestedFeedbackPromptArtifacts(
  feedbackPlan: FeedbackPlan,
  collection: WidgetCollection
): { FeedbackSchema: z.ZodType<unknown>, jsonSchema: BaseSchema }
```

Error taxonomy and exported error constants
- Export these constants from `src/structured/feedback-nested-schema.ts` and use them consistently (log + throw) per `@error-handling.mdc`:

```
// Creation-only constants (use directly with throw errors.new(...))
export const ErrFeedbackMissingOverall = errors.new("feedback must contain FEEDBACK__OVERALL")
export const ErrFeedbackOverallNotObject = errors.new("FEEDBACK__OVERALL must be an object")
export const ErrFeedbackLeafAtRoot = errors.new("feedback leaf node cannot be at the root")
export const ErrFeedbackInvalidNode = errors.new("feedback tree contains non-object node")
export const ErrFeedbackNoCombinationForPath = errors.new("no combination found for path")
export const ErrFeedbackExtraKeys = errors.new("feedback contains extra keys")
export const ErrFeedbackMissingLeaves = errors.new("feedback is missing required leaves")

// Validation wrapper (Zod): wrap external errors to preserve chain
export const ErrFeedbackSchemaValidation = errors.new("feedback schema validation")
```

Where to throw
- `validateNestedFeedback`:
  - On `safeParse` failure: `logger.error("feedback schema validation", { error: result.error })` then `throw errors.wrap(result.error, ErrFeedbackSchemaValidation)`
- `convertNestedFeedbackToBlocks`:
  - Missing `FEEDBACK__OVERALL`: log `nestedFeedback`, throw `ErrFeedbackMissingOverall`
  - Non-object `FEEDBACK__OVERALL`: log `overallFeedback`, throw `ErrFeedbackOverallNotObject`
  - Leaf at root: log the `node`, throw `ErrFeedbackLeafAtRoot`
  - Non-object node: log `node` and `pathSegments`, throw `ErrFeedbackInvalidNode`
  - No matching combination for a path: log `pathSegments`, throw `ErrFeedbackNoCombinationForPath`
  - After traversal, perform exact-set check vs `feedbackPlan.combinations`:
    - Extra keys in produced blocks: log `producedIds` and `expectedIds`, throw `ErrFeedbackExtraKeys`
    - Missing ids: log `producedIds` and `expectedIds`, throw `ErrFeedbackMissingLeaves`

Structured logging fields
- Always include compact, high-signal attributes:
  - `dimensionCount`, `combinationCount`
  - `expectedIds` (slice/head), `producedIds` (slice/head)
  - `pathSegments` for path-related errors
  - Avoid logging full BlockContent; log counts instead



