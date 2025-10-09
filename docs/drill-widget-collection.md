# Proposal: Drill the Widget Collection (Eliminate Name-Only APIs)

## Problem

We currently have a mix of APIs that accept a `widgetCollectionName` (string) and others that accept a full `WidgetCollection` object. Passing only the name forces call sites and library internals to:
- Look up the collection in a global `widgetCollections` registry.
- Branch behavior based on string names.
- Lose type guarantees for widget schemas and generators until the lookup happens.

This divergence also keeps “allWidgetsCollection” usage around in scripts/tests and as a default path, which makes it easy to bypass proper scoping.

## Principle (New Standard)
- Always pass the full `WidgetCollection` object to functions.
- Never pass `widgetCollectionName` or perform lookups inside the function.
- Eliminate global, hardcoded `allWidgetsCollection` in runtime paths; use explicitly-drilled collections in all entry points.

Benefits:
- Compile-time type safety for widget schemas and generators.
- Clear contract boundaries; no hidden global lookups.
- Easier local reasoning and testing (just construct/pass a collection).
- Built-in access to generators and schemas via the passed collection.

## Inventory: Current Violations

1) structured/widget-mapping.ts
- Function: `createWidgetMappingPrompt(perseusJson, assessmentBody, slotNames, widgetCollectionName)`
- Violations:
  - Accepts `widgetCollectionName` instead of a `WidgetCollection`.
  - Looks up `const collection = widgetCollections[widgetCollectionName]`.
  - Has a name-based branch: `if (widgetCollectionName === "simple-visual") { ... }`.

2) structured/prompts/widgets.ts (new version)
- Function: `createWidgetContentPrompt(envelope, assessmentShell, widgetMapping, generatedInteractions, widgetCollectionName, imageContext)`
- Violations:
  - Accepts `widgetCollectionName` and then performs `widgetCollections[widgetCollectionName]`.

3) structured/widgets.ts (legacy prompt helper kept for some flows)
- Function: `createWidgetContentPrompt(perseusJson, assessmentShell, widgetMapping, generatedInteractions, widgetCollectionName, imageContext)`
- Violations:
  - Accepts `widgetCollectionName` and then performs `widgetCollections[widgetCollectionName]`.
  - Also validates unknown names at runtime (which becomes unnecessary if a collection is passed).

4) README.md
- Mentions `generateFromEnvelope(openai, logger, envelope, widgetCollectionName)` as the top-level API. The implementation already uses a `WidgetCollection` object, so the README needs updating to reflect the object-based signature and remove name-based wording.

5) Global default usage of allWidgetsCollection
- Found in multiple tests and scripts (e.g., scripts/test-template-poc.ts; tests and example scripts). While tests may keep a default for convenience, the standard should prefer passing an explicit collection into entry points and helpers (no implicit defaulting).

## Non-Violations (Already Compliant)
- structured/client.ts
  - `generateFromEnvelope(openai, logger, envelope, widgetCollection)` is already object-based and drills schemas/generators from the collection.
- compiler/compiler.ts
  - `compile(item, widgetCollection)` already drills the collection.

## Proposed Changes

### A. API Redesign: Accept Collections Everywhere

- Replace function parameters of the form `(widgetCollectionName: WidgetCollectionName)` with `(widgetCollection: WidgetCollection<...>)`.
- Remove all internal lookups of `widgetCollections[widgetCollectionName]`.
- Replace string-name branches with capability flags that are properties of the collection (e.g., computed booleans or feature switches derived from `collection.name` during construction or exported constants alongside the collection).

Concretely:
- structured/widget-mapping.ts
  - Change signature to:
    ```ts
    createWidgetMappingPrompt(
      perseusJson: string,
      assessmentBody: string,
      slotNames: string[],
      widgetCollection: WidgetCollection<any, readonly string[]>
    )
    ```
  - Replace name-based rule blocks (e.g., `simple-visual`) with capability flags or a helper like `supportsSimpleVisual(collection)`. Prefer data-driven rules tied to `collection.widgetTypeKeys` or dedicated metadata on the collection.

- structured/prompts/widgets.ts (both versions)
  - Change signatures to accept `widgetCollection` instead of the name.
  - Remove lookups and unknown-name guards (unnecessary when object is passed).

- structured/widgets.ts (legacy)
  - Same treatment as above; consider merging/superseding with `structured/prompts/widgets.ts` to avoid duplication.

### B. Eliminate Implicit Defaults

- Remove direct imports and dispatch through hardcoded `allWidgetsCollection` from runtime code paths.
- Keep `allWidgetsCollection` for tests and examples only, where test scaffolding explicitly passes it.
- Update `widgets/widget-generator.ts`:
  - Prefer the generic dispatcher `generateWidget(collection, type, data)`.
  - Mark `generateWidgetLegacy` as deprecated (already) and limit usage to tests only until removal.

### C. Documentation and Examples

- Update README.md:
  - Change the `generateFromEnvelope` docs to reflect object-based collection parameter.
  - Provide examples showing how to import a specific collection and pass it down.
  - Remove mentions of `widgetCollectionName` as a public parameter; replace with `widgetCollection`.

### D. Tests and Scripts Migration

- Replace imports/uses of `allWidgetsCollection` with explicit collection arguments at each call site:
  - tests/compiler/*.test.ts, tests/structured/*.test.ts, scripts/*.ts
  - Accept passing `allWidgetsCollection` explicitly as an argument to tested functions (this is OK in tests; the principle is to pass the object explicitly, not use a hidden default).
- For the tests that rely on name-based behavior (e.g., simple-visual conditional), translate the logic into capability flags on the collection or collection metadata and update tests accordingly.

## Implementation Plan

1) Introduce updated function signatures (add new overloads accepting `WidgetCollection`, keep the name-based signature temporarily but mark deprecated). Internally, new implementations should only use the object and avoid lookups.
2) Update all call sites across `src/structured/*` and `scripts/*` to pass `widgetCollection` objects.
3) Remove the name-based overloads after call site migration is complete (follow-up PR).
4) Replace name branches with capability-driven logic.
5) Update README and other docs to reflect the new standard.
6) Restrict `allWidgetsCollection` usage to tests/examples only; never rely on it implicitly inside library functions.

## Safety & Observability

- No fallbacks: failing to provide a collection object should be a hard error at call sites (compile-time in TS and explicit runtime guard if necessary for external consumers).
- Logging: add a single info log at boundary entry points (client/generator) with `collectionName: collection.name` to aid traceability.
- Type safety: drilling the object maximizes generic enforcement (schemas/generators keyed by `widgetTypeKeys`).

## Rollout Strategy

- Phase 1 (non-breaking): Add object-based signatures, keep name-based ones deprecated. Migrate internal callers.
- Phase 2: Remove deprecated name-based signatures, update docs, and cut a major version.
- Phase 3: Audit tests/scripts to ensure all paths explicitly pass the collection object and no hidden defaults are used.

## Appendix: Affected Files

- src/structured/widget-mapping.ts (signature + internals)
- src/structured/prompts/widgets.ts (signature + internals)
- src/structured/widgets.ts (signature + internals; consider consolidation)
- README.md (API docs update)
- scripts/test-template-poc.ts (explicit collection injection preferred)
- tests/* (replace name-based flows and allWidgetsCollection defaults with explicit collection parameters)

This unifies and hardens the design: call sites always provide `WidgetCollection`, enabling clear typing and eliminating hidden global lookups or name-based branches.
