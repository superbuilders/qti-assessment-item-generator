## Collection-Typed Widget Content: TODOs

Short-term (strict typing and removal of duplication)
- Unify tuple type: create a single `WidgetTypeTuple` in `src/widgets/collections/types.ts` and remove any local duplicates in other modules.
- Replace all remaining imports/exports of unparameterized `BlockContent` and `BlockContentItem` with generic `BlockContent<E>` and `BlockContentItem<E>`.
- Update all Zod builders to tuple-based variants:
  - Inline (if needed): `createInlineContentItemSchemaFromTuple`, `createInlineContentSchemaFromTuple`.
  - Block: `createBlockContentItemSchemaFromTuple`, `createBlockContentSchemaFromTuple`.
- Structured wrappers: ensure `src/structured/block-content-schema.ts` only calls tuple-based builders and returns `ZodType<BlockContent<E>>`.
- Remove unused imports (e.g., `createWidgetTypeEnumFromCollection`) where replaced by tuple-based wrappers.

Feedback authoring integration
- Parameterize authoring types in `feedback-nested-schema.ts` with `BlockContent<E>` at compile time.
- Update `createNestedFeedbackZodSchema` to return `ZodType<NestedFeedbackAuthoring<P, BlockContent<E>>>`.
- Thread collection through all call sites in structured pipeline (`prompts/feedback.ts`, `client.ts`).

Compiler integration
- Ensure `createDynamicAssessmentItemSchema` consumes the non-generic inline schemas (ok) and the generic block tuple-based wrappers where possible.
- Add tuple-aware overloads if needed to keep compatibility with existing entry points.

Registry/types alignment (optional but recommended)
- Strengthen `WidgetCollection.schemas` to map each widget type name to its Zod schema with a precise type (done: `{ [K in E[number]]: z.ZodType<unknown> }`).
- Consider a typed registry mapping from widget type name to a more specific widget schema type to enable deeper compile-time linking later.

Tests
- Add compile-time tests (via d.ts or tsd) asserting `widgetRef.widgetType` narrows to `E[number]` per collection.
- Runtime tests for tuple-based builders: invalid widget type should fail Zod validation.
- End-to-end tests for two distinct collections with different tuples ensure types/validation differ as expected.

Cleanup/migration
- Search and remove now-dead helpers (legacy non-generic wrappers) once all call sites are updated.
- Update docs in `docs/collection-typed-widget-content.md` with any API changes made during implementation.


