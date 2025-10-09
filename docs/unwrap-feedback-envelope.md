# Unwrap Feedback Envelope from Schema Builder

Status: Approved
Owner: Core Team

## Problem

The nested feedback schema builder returns a whole-object envelope schema:

```ts
// Current (problematic)
createNestedFeedbackZodSchema(plan, keys) returns:
  z.object({ feedback: z.object({ FEEDBACK__OVERALL: ... }).strict() }).strict()
```

This forces awkward composition in `AssessmentItem`:
- Can't do `feedback: NestedAuthoringSchema` (would create feedback.feedback.FEEDBACK__OVERALL)
- Must use `.and(...)` intersection to merge envelope + outer fields
- Any consumer that wants to embed needs to spelunk into schema.shape or use unsafe type assertions

The root cause: hardcoding the top-level `feedback` key in the builder when most callers just want the property-level schema.

## Solution

Return the property-level schema directly from the builder:

```ts
// New (clean)
createFeedbackObjectSchema(plan, keys) returns:
  z.object({ FEEDBACK__OVERALL: ... }).strict()
```

Callers can now compose naturally:
- Item schema: `feedback: FeedbackObjectSchema` (direct embedding, no .and)
- LLM prompts: Wrap locally when needed for JSON Schema

## API Changes

### New Functions (src/core/feedback/authoring/schema.ts)

```ts
// Property-level nested authoring object
export function createFeedbackObjectSchema<P extends FeedbackPlan, const E extends readonly string[]>(
    feedbackPlan: P,
    widgetTypeKeys: E
): z.ZodType<AuthoringFeedbackOverall<P, E>>

// Validate the property-level object
export function validateFeedbackObject<P extends FeedbackPlan, const E extends readonly string[]>(
    feedbackObject: unknown,
    feedbackPlan: P,
    widgetTypeKeys: E
): AuthoringFeedbackOverall<P, E>

// Convert property-level object to flat blocks
export function convertFeedbackObjectToBlocks<P extends FeedbackPlan, E extends readonly string[]>(
    feedbackObject: AuthoringFeedbackOverall<P, E>,
    feedbackPlan: P
): Record<string, BlockContent<E>>
```

### Removed Functions

- `createNestedFeedbackZodSchema` (replaced by createFeedbackObjectSchema)
- `validateNestedFeedback` (replaced by validateFeedbackObject)
- `convertNestedFeedbackToBlocks` (replaced by convertFeedbackObjectToBlocks)
- `createNestedFeedbackPromptArtifacts` (callers wrap locally as needed)

## File-by-File Changes

### src/core/feedback/authoring/schema.ts

Remove the envelope wrapper from the builder:

```diff
-export function createNestedFeedbackZodSchema<P extends FeedbackPlan, const E extends readonly string[]>(
+export function createFeedbackObjectSchema<P extends FeedbackPlan, const E extends readonly string[]>(
     feedbackPlan: P,
     widgetTypeKeys: E
-): z.ZodType<NestedFeedbackAuthoring<P, E>> {
+): z.ZodType<AuthoringFeedbackOverall<P, E>> {
     const ScopedBlockContentSchema: z.ZodType<BlockContent<E>> = createBlockContentSchema(widgetTypeKeys)
     const LeafNodeSchema: z.ZodType<AuthoringNestedLeaf<E>> = z.object({ content: ScopedBlockContentSchema }).strict()
     
     // ... build OverallSchema from plan (fallback or combo) ...
     
-    const FeedbackMapSchema = z.object({ FEEDBACK__OVERALL: OverallSchema }).strict()
-    const Schema = z.object({ feedback: FeedbackMapSchema }).strict()
-    return Schema
+    return z.object({ FEEDBACK__OVERALL: OverallSchema }).strict()
 }
```

Update validators to accept property-level objects:

```diff
-export function validateNestedFeedback<P extends FeedbackPlan, const E extends readonly string[]>(
-    nested: unknown,
+export function validateFeedbackObject<P extends FeedbackPlan, const E extends readonly string[]>(
+    feedbackObject: unknown,
     feedbackPlan: P,
     widgetTypeKeys: E
-): NestedFeedbackAuthoring<P, E> {
+): AuthoringFeedbackOverall<P, E> {
-    const schema = createNestedFeedbackZodSchema(feedbackPlan, widgetTypeKeys)
+    const schema = createFeedbackObjectSchema(feedbackPlan, widgetTypeKeys)
     const result = schema.safeParse(feedbackObject)
     
     if (!result.success) {
         logger.error("feedback object validation", { error: result.error })
         throw errors.wrap(result.error, "feedback object validation")
     }
-    
-    const data = result.data
-    if (!isNestedFeedbackAuthoring<E>(data)) {
-        logger.error("feedback schema validation type guard failed")
-        throw errors.new("feedback schema validation type guard failed")
-    }
-    return data
+    return result.data
 }
```

Update converter to accept property-level objects:

```diff
-export function convertNestedFeedbackToBlocks<P extends FeedbackPlan, E extends readonly string[]>(
-    nested: NestedFeedbackAuthoring<FeedbackPlan, E>,
+export function convertFeedbackObjectToBlocks<P extends FeedbackPlan, E extends readonly string[]>(
+    feedbackObject: AuthoringFeedbackOverall<FeedbackPlan, E>,
     feedbackPlan: P
 ): Record<string, BlockContent<E>> {
     const blocks: Record<string, BlockContent<E>> = {}
-    const overallFeedback = nested.feedback.FEEDBACK__OVERALL
+    const overallFeedback = feedbackObject
     
     // ... rest of conversion logic unchanged ...
 }
```

Update empty builder:

```diff
 export function buildEmptyNestedFeedback<P extends FeedbackPlan, E extends readonly string[] = readonly string[]>(
     feedbackPlan: P
-): NestedFeedbackAuthoring<FeedbackPlan, E> {
+): AuthoringFeedbackOverall<FeedbackPlan, E> {
     // ... build node logic unchanged ...
     
     const overallFeedback: AuthoringFeedbackOverall<FeedbackPlan, E> = ...
-    
-    return {
-        feedback: {
-            FEEDBACK__OVERALL: overallFeedback
-        }
-    }
+    return overallFeedback
 }
```

### src/core/item/schema.ts

Replace intersection with direct object composition:

```diff
-    const NestedAuthoringSchema = createNestedFeedbackZodSchema(feedbackPlan, widgetTypeKeys)
+    const FeedbackObjectSchema = createFeedbackObjectSchema(feedbackPlan, widgetTypeKeys)
     
-    const AssessmentItemSchema = NestedAuthoringSchema.and(
-        z.object({
-            identifier: z.string().describe("..."),
-            // ... other fields
-            feedbackPlan: FeedbackPlanSchema
-        }).strict()
-    ).describe("...")
+    const AssessmentItemSchema = z.object({
+        identifier: z.string().describe("..."),
+        // ... other fields
+        feedbackPlan: FeedbackPlanSchema,
+        feedback: FeedbackObjectSchema.describe("Nested feedback structure with dimensional paths for all response combinations.")
+    }).strict().describe("A complete QTI 3.0 assessment item with content, interactions, and scoring rules.")
```

### src/compiler/compiler.ts

Validate and convert the property-level feedback object directly:

```diff
-    const feedbackEnvelope = { feedback: itemData.feedback }
-    const validatedNested = validateNestedFeedback(
-        feedbackEnvelope,
+    const validatedFeedbackObject = validateFeedbackObject(
+        itemData.feedback.FEEDBACK__OVERALL,
         itemData.feedbackPlan,
         widgetCollection.widgetTypeKeys
     )
-    const feedbackBlocks = convertNestedFeedbackToBlocks(validatedNested, itemData.feedbackPlan)
+    const feedbackBlocks = convertFeedbackObjectToBlocks(validatedFeedbackObject, itemData.feedbackPlan)
```

### src/structured/prompts/feedback.ts

Wrap the property-level schema locally for LLM JSON Schema:

```diff
-    const FeedbackSchema = createNestedFeedbackZodSchema(feedbackPlan, widgetCollection.widgetTypeKeys)
+    const FeedbackObjectSchema = createFeedbackObjectSchema(feedbackPlan, widgetCollection.widgetTypeKeys)
+    const FeedbackSchema = z.object({ feedback: FeedbackObjectSchema }).strict()
     
     return { systemInstruction, userContent, FeedbackSchema }
```

Prompt text and examples remain unchanged (still show top-level "feedback" in JSON).

### src/core/item/types.ts

No changes needed (types already use AuthoringFeedbackOverall directly).

## Type Changes

### Before

```ts
export type NestedFeedbackAuthoring<P extends FeedbackPlan, E extends readonly string[]> = {
    feedback: { FEEDBACK__OVERALL: AuthoringFeedbackOverall<P, E> }
}
```

### After

Property-level only; envelope types removed. Callers that need an envelope construct it locally.

## Callers Summary

1. **src/core/feedback/authoring/schema.ts** — implements new property-level functions
2. **src/core/item/schema.ts** — switches to direct object composition (no .and)
3. **src/compiler/compiler.ts** — validates property-level object, no envelope wrapping
4. **src/structured/prompts/feedback.ts** — wraps object schema locally for LLM JSON Schema
5. **docs/post-mortem.md** — update references

## Migration Steps

1. Refactor builder and validators in `src/core/feedback/authoring/schema.ts`
2. Update item schema composition in `src/core/item/schema.ts`
3. Update compiler validation/conversion in `src/compiler/compiler.ts`
4. Update prompt wrapping in `src/structured/prompts/feedback.ts`
5. Update docs
6. Run tests, typecheck, biome

## Benefits

- Direct, idiomatic object composition in AssessmentItem
- No intersections, no shape access, no assertions
- Envelope usage is explicit and local (only where actually needed for LLM I/O)
- Simpler mental model: property-level schemas compose naturally
- Fewer coupling points; each consumer wraps only if needed

## Acceptance Criteria

- All tests pass
- Typecheck passes
- bun biome passes
- AssessmentItem schema uses object fields, not intersections
- Compiler validates property-level object directly
- Prompts still generate valid LLM JSON Schema with top-level "feedback"

