# Widget Schema Fixes: polyhedron-diagram & parallelogram-trapezoid-diagram

## Executive Summary

Two critical widget generators (`polyhedron-diagram.ts` and `parallelogram-trapezoid-diagram.ts`) were producing corrupted SVG output due to fundamental schema design issues. These issues stemmed from using factory functions to generate Zod schemas and incorrectly applying canvas dimension validators to shape dimensions. This report details the problems discovered, their impact, and the solutions implemented.

## The Problem

### 1. Visual Symptoms

The generated SVG diagrams exhibited several rendering issues:
- **Fractional coordinates with excessive decimal places** (e.g., `196.83870967741936`, `199.5483870967742`)
- **Misaligned shapes and labels**
- **Inconsistent rendering between test runs**
- **Poor visual quality** described by the user as "output looks like shit"

### 2. Root Causes

#### A. Factory Function Anti-Pattern

Both widgets were using factory functions to generate Zod schemas:

```typescript
// ❌ BAD: Factory function creating new schema instances
const createLabelValueSchema = () =>
    z.discriminatedUnion("type", [
        z.object({ type: z.literal("number"), value: z.number() }),
        z.object({ type: z.literal("string"), value: z.string().max(1) }),
        z.object({ type: z.literal("none") })
    ])

// Each call creates a NEW schema instance
const schema1 = createLabelValueSchema() // Instance #1
const schema2 = createLabelValueSchema() // Instance #2 (different from #1!)
```

**Why This Is Problematic:**
1. **OpenAI JSON Schema Generation**: Each schema instance gets its own `$ref` in the generated JSON schema, leading to bloated and confusing schema definitions
2. **Type Inference Issues**: TypeScript treats each instance as a distinct type, causing type mismatches
3. **Memory Inefficiency**: Creating multiple identical schemas wastes memory
4. **Validation Inconsistencies**: Different instances may behave differently in edge cases

#### B. Dimension Validator Misuse

Shape dimensions were incorrectly using canvas dimension validators:

```typescript
// ❌ BAD: Shape dimensions using canvas validators
const Parallelogram = z.object({
    height: createHeightSchema(), // Returns z.number().min(300).max(500)
    // ...
})
```

**Impact:**
- Shape dimensions (which should be 3-15 units) were forced to be 300-500 pixels
- AI tools generating examples had to use absurd values like `height: 396` for a shape that should be `height: 5`
- Examples contained shape dimensions like `500`, `470`, `386` instead of reasonable values

## The Solution

### 1. Single Schema Instances

Replaced all factory functions with single, reusable schema instances:

```typescript
// ✅ GOOD: Single schema instance
const LabelValueSchema = z
    .discriminatedUnion("type", [
        z.object({ type: z.literal("number"), value: z.number() }),
        z.object({ type: z.literal("string"), value: z.string().max(1) }),
        z.object({ type: z.literal("none") })
    ])
    .describe("Label value as number, single-letter string, or none")

// Reused everywhere
labels: z.object({
    base: LabelValueSchema.describe("..."),
    height: LabelValueSchema.describe("..."),
    // ...
})
```

### 2. Proper Dimension Validators

Separated canvas dimensions from shape dimensions:

```typescript
// ✅ GOOD: Canvas dimensions (300-500px)
width: createWidthSchema(),    // For the SVG canvas
height: createHeightSchema(),   // For the SVG canvas

// ✅ GOOD: Shape dimensions (reasonable units)
shape: z.object({
    height: z.number().positive().describe("Height in arbitrary units (e.g., 5, 7, 10)"),
    base: z.number().positive().describe("Base in arbitrary units (e.g., 8, 12, 6.5)"),
    // ...
})
```

### 3. Example Data Correction

Fixed all example data to use reasonable dimensions:
- **Before**: `height: 396`, `height: 500`, `height: 470`
- **After**: `height: 7`, `height: 12`, `height: 11`

## Impact Analysis

### polyhedron-diagram.ts

- **Examples Fixed**: 235 total
  - 130 rectangular prisms
  - 47 rectangular pyramids (were missing/corrupted)
  - 48 triangular prisms
  - 10 triangular pyramids (were missing/corrupted)
- **Schema Simplification**: Removed all dimension properties from shape schemas, using default dimensions in the generator

### parallelogram-trapezoid-diagram.ts

- **Examples Fixed**: 61 total
- **Height Values Corrected**: Mapped 300-500 range to reasonable 3-12 range
- **Schema Fixes**: Replaced 13 factory function calls with single instances

## Technical Details

### Schema Instance Comparison

```typescript
// Before (Multiple Instances)
createLabelValueSchema() === createLabelValueSchema() // false! Different instances

// After (Single Instance)
LabelValueSchema === LabelValueSchema // true! Same instance
```

### OpenAI JSON Schema Impact

**Before (with factory functions):**
```json
{
  "definitions": {
    "LabelValueSchema_1": { /* ... */ },
    "LabelValueSchema_2": { /* ... */ },
    "LabelValueSchema_3": { /* ... */ },
    // ... up to 13 duplicate definitions!
  },
  "$ref": "#/definitions/LabelValueSchema_1"
}
```

**After (single instance):**
```json
{
  "definitions": {
    "LabelValueSchema": { /* ... */ }
  },
  "$ref": "#/definitions/LabelValueSchema"
}
```

## Lessons Learned

### 1. Factory Functions Are An Anti-Pattern for Schemas

**Never do this:**
```typescript
const createSomeSchema = () => z.object({ /* ... */ })
```

**Always do this:**
```typescript
const SomeSchema = z.object({ /* ... */ })
```

### 2. Separate Concerns for Dimensions

- **Canvas dimensions**: Display size of the SVG (300-500px range)
- **Shape dimensions**: Mathematical/geometric properties (1-20 unit range)
- **Never mix these concerns in validators**

### 3. AI Tool Compatibility

When schemas have incorrect constraints, AI tools are forced to generate invalid data:
- The AI correctly followed the schema but produced nonsensical results
- After fixes, AI can now generate proper, sensible examples

## Prevention Guidelines

To prevent similar issues in future widgets:

1. **Always use single schema instances** - no factory functions
2. **Clearly separate canvas dimensions from content dimensions**
3. **Test with AI-generated examples** to ensure schemas allow reasonable values
4. **Review generated OpenAI JSON schemas** for duplicate `$ref` definitions
5. **Validate that shape properties use appropriate ranges** (not canvas pixel ranges)

## Conclusion

These fixes resolved critical schema design flaws that were causing:
- Corrupted SVG output with excessive decimal precision
- AI tools generating invalid examples
- Missing or corrupted test data (pyramids disappeared)
- Type inference and validation issues

The widgets now produce clean, consistent SVG output with proper coordinate values and allow AI tools to generate sensible examples. The total impact was 296 fixed examples across both widgets, with all tests now passing with clean snapshots.

## Related Fixes

This issue pattern was previously identified and fixed in:
- `3d-intersection-diagram.ts` (commit `1fc7b4f035d308cc7768486a36724744de567bec`)

The same pattern should be checked in all other widget generators to ensure consistency.
