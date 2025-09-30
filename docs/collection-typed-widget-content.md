## Collection-Typed Widget Content: Compile-Time Propagation of Widget Types

Goal
- Propagate each `WidgetCollection`'s widget type set to compile-time types for all content schemas (InlineContent, BlockContent, Feedback leaves), while preserving strict runtime validation via Zod.
- Eliminate generic `z.ZodType` without generics and any `unknown` in public return types.

Key Idea
- Treat a collection’s `widgetTypeKeys` as a literal tuple and carry its literal union `E[number]` (widget type names) through all builders.
- Build Zod schemas parameterized by `z.ZodEnum<E>` and return `ZodType<...For<E>>` where the TS shape encodes widget type constraints.

Target API Changes (Types and Functions)
1) Literal-driven widget types
```ts
// Enforce literal tuple input (compile-time):
export type WidgetTypeTuple = readonly [string, ...string[]]

// Helper to derive union type from tuple E
export type WidgetTypeFrom<E extends WidgetTypeTuple> = E[number]
```

2) Enum builder preserving literals
```ts
// src/structured/schemas.ts (or dedicated helpers)
export function createWidgetTypeEnumFromCollection<const E extends WidgetTypeTuple>(
  collection: { name: string; widgetTypeKeys: E }
): z.ZodEnum<E>
```

3) Content types parameterized by E
```ts
// compiler-level structural types derived from E
export type BlockContentItemFor<E extends WidgetTypeTuple> =
  | { type: "paragraph"; content: InlineContent }
  | { type: "codeBlock"; code: string }
  | { type: "unorderedList"; items: InlineContent[] }
  | { type: "orderedList"; items: InlineContent[] }
  | { type: "tableRich"; header: (InlineContent | null)[][] | null; rows: (InlineContent | null)[][] }
  | { type: "widgetRef"; widgetId: string; widgetType: WidgetTypeFrom<E> }
  | { type: "interactionRef"; interactionId: string }

export type BlockContentFor<E extends WidgetTypeTuple> = Array<BlockContentItemFor<E>>
```

4) Zod builders return typed Zod schemas (no unknown)
```ts
// src/compiler/schemas.ts
export function createInlineContentSchema<E extends WidgetTypeTuple>(
  widgetTypeEnum: z.ZodEnum<E>
): z.ZodType<InlineContent>

export function createBlockContentItemSchema<E extends WidgetTypeTuple>(
  widgetTypeEnum: z.ZodEnum<E>
): z.ZodType<BlockContentItemFor<E>>

export function createBlockContentSchema<E extends WidgetTypeTuple>(
  widgetTypeEnum: z.ZodEnum<E>
): z.ZodType<BlockContentFor<E>>
```

5) Collection-scoped convenience wrappers (no cycles)
```ts
// src/structured/block-content-schema.ts
export function createBlockContentSchemaFromCollection<const E extends WidgetTypeTuple>(
  collection: { widgetTypeKeys: E }
): z.ZodType<BlockContentFor<E>> {
  const enumE = createWidgetTypeEnumFromCollection(collection)
  return createBlockContentSchema(enumE)
}
```

6) Feedback authoring types parameterized by E
```ts
// src/structured/feedback-nested-schema.ts
export type AuthoringNestedLeaf<ContentT> = { content: ContentT }
export type ResponseIdentifierLiteral<P extends FeedbackPlan> = P["dimensions"][number]["responseIdentifier"]
export type AuthoringNestedNode<P extends FeedbackPlan, ContentT> = {
  [R in ResponseIdentifierLiteral<P>]: { [key: string]: AuthoringNestedLeaf<ContentT> | AuthoringNestedNode<P, ContentT> }
}
export type AuthoringFeedbackOverall<P extends FeedbackPlan, ContentT> =
  | { CORRECT: AuthoringNestedLeaf<ContentT>; INCORRECT: AuthoringNestedLeaf<ContentT> }
  | AuthoringNestedNode<P, ContentT>
export type NestedFeedbackAuthoring<P extends FeedbackPlan, ContentT> = {
  feedback: { FEEDBACK__OVERALL: AuthoringFeedbackOverall<P, ContentT> }
}

// Zod builders parameterized by plan and collection tuple E
export function createNestedFeedbackZodSchema<P extends FeedbackPlan, const E extends WidgetTypeTuple>(
  plan: P,
  collection: { widgetTypeKeys: E }
): z.ZodType<NestedFeedbackAuthoring<P, BlockContentFor<E>>>

export function validateNestedFeedback<P extends FeedbackPlan, const E extends WidgetTypeTuple>(
  input: unknown,
  plan: P,
  collection: { widgetTypeKeys: E }
): NestedFeedbackAuthoring<P, BlockContentFor<E>>

export function buildEmptyNestedFeedback<P extends FeedbackPlan, const E extends WidgetTypeTuple>(
  plan: P
): NestedFeedbackAuthoring<P, BlockContentFor<E>>

export function convertNestedFeedbackToBlocks<P extends FeedbackPlan, const E extends WidgetTypeTuple>(
  nested: NestedFeedbackAuthoring<P, BlockContentFor<E>>,
  plan: P
): Record<string, BlockContentFor<E>>
```

7) Structured pipeline threading
```ts
// src/structured/prompts/feedback.ts
export function createFeedbackPrompt<const E extends WidgetTypeTuple>(
  envelope: AiContextEnvelope,
  shell: AssessmentItemShell,
  plan: FeedbackPlan,
  imageContext: ImageContext,
  collection: { widgetTypeKeys: E }
) {
  const FeedbackSchema = createNestedFeedbackZodSchema(plan, collection)
  // return systemInstruction, userContent, FeedbackSchema
}

// src/structured/client.ts (Shot 3)
const { systemInstruction, userContent, FeedbackSchema } = createFeedbackPrompt(
  envelope,
  shell,
  plan,
  imageContext,
  widgetCollection // must expose literal tuple for widgetTypeKeys
)
const feedbackJsonSchema = toJSONSchemaPromptSafe(FeedbackSchema)

const validated = validateNestedFeedback(responseJson, plan, widgetCollection)
const feedbackBlocks = convertNestedFeedbackToBlocks(validated, plan)
```

Implementation Steps
1) Strengthen compiler schemas
   - Update `createInlineContentSchema`, `createBlockContentItemSchema`, `createBlockContentSchema` return types to their parameterized forms (InlineContent, BlockContentFor<E>).
   - Ensure `widgetRef.widgetType` uses `E[number]` in both TS type and Zod enum.

2) Strengthen enum builder
   - Change `createWidgetTypeEnumFromCollection` signature to use `const E extends WidgetTypeTuple` and return `z.ZodEnum<E>`.
   - Require `widgetTypeKeys` sources to be declared as `as const` in collections.

3) Add collection-scoped helpers (no cycles)
   - Implement `createBlockContentSchemaFromCollection` in `src/structured/block-content-schema.ts`.

4) Parameterize feedback authoring
   - Update all authoring types to accept `ContentT` and thread `BlockContentFor<E>` through exported functions.
   - The Zod builders should return `ZodType<NestedFeedbackAuthoring<P, BlockContentFor<E>>>`.
   - Replace any remaining bare `z.ZodType` with generic `z.ZodType<...>`.

5) Update call sites
   - `prompts/feedback.ts`, `client.ts`, any template helpers to pass the collection value; rely on its literal tuple to carry `E`.

6) Tests
   - Unit tests verifying compile-time types via dummy generics (e.g., ensure `widgetRef.widgetType` narrows to the tuple union for a test collection).
   - Zod runtime tests for mismatch widget types fail validation.
   - End-to-end test that `createNestedFeedbackZodSchema` + `validateNestedFeedback` + `convertNestedFeedbackToBlocks` work with two different collections exposing different widgetType sets.

Error Handling & Logging (unchanged)
- Preserve `@error-handling.mdc` patterns: safeParse, log + throw, named error constants.
- Keep structured logging with concise attributes; avoid logging full content bodies.

Migration Notes
- Collections must define `widgetTypeKeys` as literal tuples (`as const`).
- Replace imports of old collection-scoped builder with new generic ones; return types will be more precise.
- Remove any residual `as` assertions; rely on generic parameterization + Zod schemas for runtime and compile-time alignment.

Future Extension (Optional)
- Tie widget type names to widget schemas via a typed registry interface so that `widgetRef.widgetType` can imply its schema at compile time (requires additional mapping types, can be done later).


