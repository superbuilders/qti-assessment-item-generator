# Typed Feedback Plan Enforcement Proposal

## Summary

We can push a large class of runtime feedback errors into compile‑time by tightening the TypeScript contract for `AuthoringFeedbackOverall`. The idea is to discriminate on the shape of the `FeedbackPlan`:

- When the plan’s dimensions and combinations are known at type level (e.g. combo mode with string literal identifiers), we require the template to emit the fully nested `AuthoringNestedNode` version of `AuthoringFeedbackOverall`.
- When the plan is too dynamic (e.g. anonymous `string` identifiers, fallback mode), we fall back to the current `{ CORRECT, INCORRECT }` leaf structure.

This keeps the AI—and any human authoring templates—aligned with the richer, dimension-aware feedback experience whenever the plan provides enough information, while preserving type safety for truly dynamic plans.

## Motivation

Our validation telemetry shows a recurring class of failures:

- Templates that default to `{ CORRECT, INCORRECT }` even when the plan specifies multiple dimensions.
- Templates that build nested objects, but with missing leaves (`content` missing) or badly-shaped nodes (arrays instead of nested dictionaries).

Every one of these failures shows up at runtime, after the whole generation pipeline has run. If we encode the plan structure into the type system we can stop most of these at the authoring step.

## Current Type

```ts
export type AuthoringFeedbackOverall<
	P extends FeedbackPlan,
	E extends readonly string[] = readonly string[],
	ContentT = FeedbackContent<E>
> =
	| {
			CORRECT: AuthoringNestedLeaf<E, ContentT>
			INCORRECT: AuthoringNestedLeaf<E, ContentT>
	  }
	| AuthoringNestedNode<P, E, ContentT>
```

This union gives both shapes equal priority. Nothing prevents a template from choosing the easy fallback even if the plan is a rich combo.

## Proposed Type Refinement

Introduce a conditional helper that inspects the plan:

```ts
type PlanRequiresNested<P extends FeedbackPlan> =
	P["mode"] extends "combo"
		? P["combinations"] extends readonly [infer First, ...infer Rest]
			? First extends { id: string; path: readonly string[] }
				? Rest extends readonly any[] // literal tuple
					? true
					: false
				: false
			: false
		: false

type StrictAuthoringFeedbackOverall<
	P extends FeedbackPlan,
	E extends readonly string[] = readonly string[],
	ContentT = FeedbackContent<E>
> = PlanRequiresNested<P> extends true
	? AuthoringNestedNode<P, E, ContentT>
	: {
			CORRECT: AuthoringNestedLeaf<E, ContentT>
			INCORRECT: AuthoringNestedLeaf<E, ContentT>
	  }
```

We would then update any consumer of `AuthoringFeedbackOverall`—notably `AssessmentItemInput` and `createDynamicAssessmentItemSchema`—to depend on `StrictAuthoringFeedbackOverall`.

### Optional Enhancements

- Replace the boolean helper with a recursive mapped type that produces the full nested tree from the plan’s `dimensions` array. That would give autocomplete for every valid path.
- Allow opt-in overrides for tests or unusual plans via a branded plan type (`LooseFeedbackPlan`) that deliberately disables the strict enforcement.

## Developer Ergonomics

- **AI Prompting:** We should augment the feedback prompt section (see `packages/lib/src/templates/prompts/sections/feedback-guidance.ts`) to explain the stricter rules and include a code skeleton that iterates over `feedbackPlan.combinations`.
- **Human Authoring:** The stricter type produces immediate compiler errors that point at the missing branches. Authors get concrete keys to fill instead of runtime diagnostics.

## Impact

- **Compilation:** TypeScript will now fail candidate generation when feedback is incomplete. This is desirable—bad templates will never reach persistence.
- **Runtime:** No schema or runtime code change is required; `createDynamicAssessmentItemSchema` already expects the nested object.
- **Structured pipeline alignment:** `buildFeedbackPlanFromInteractions` currently falls back to `{ CORRECT, INCORRECT }` whenever the computed combination count exceeds 64 (see `packages/lib/src/core/feedback/plan/builder.ts`). To satisfy the stricter types we will delete that numeric fallback path and always surface the full combination set; the type layer will determine whether the author can emit nested feedback.
- **Risk:** If we misclassify a plan as “strict” when it isn’t, we could force authors to enumerate an effectively infinite domain. We mitigate this by only opting into strict builds when the plan’s identifiers are literal tuples (the compiler already knows when that’s safe).

## Required Structured Pipeline Change

The structured feedback builder currently short-circuits to fallback mode when the inferred combination space is “large.” This logic lives in `packages/lib/src/core/feedback/plan/builder.ts`:

```ts
const combinationCount = dimensions.reduce<number>(
	(acc, dim) => acc * (dim.kind === "enumerated" ? dim.keys.length : 2),
	1
)
const mode =
	combinationCount > 64 || dimensions.length === 0 ? "fallback" : "combo"

// ...

if (mode === "fallback") {
	combinations.push(
		{ id: "CORRECT", path: [] },
		{ id: "INCORRECT", path: [] }
	)
	combinationIds.add("CORRECT")
	combinationIds.add("INCORRECT")
} else {
	// build full paths...
}
```

To make the stricter typing viable we plan to **remove this numeric fallback** so that combo plans always emit their full path tree. The TypeScript change will then enforce nested feedback (or allow fallback) based on the explicit plan shape rather than an internal heuristic.

## Next Steps

1. Prototype the conditional type in a branch and retrofit `AssessmentItemInput`.
2. Update prompt sections to highlight the new requirements.
3. Run AI generation against a handful of templates to verify diagnostics become type errors.
4. Document escape hatches (e.g. branded plan type) if any edge cases appear.

With this in place we reduce the largest source of feedback-related validation failures and give both AI and humans a clear contract to follow.***
