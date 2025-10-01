# Better Feedback Generation: Flattened Combo-Key Schema and Prompt Architecture

## Goals

- Eliminate OpenAI response_format 400s due to enum explosion in nested feedback schemas
- Preserve strict, hardcoded keys so the AI must output exactly one entry per feedback combination
- Increase clarity for the model about what each key represents (esp. multi-dimensional feedback)
- Keep the runtime as simple as possible: validate and plug output directly into the compiler

## Current Pipeline (Context)

- Feedback plan construction creates dimensions and explicit combinations with stable IDs:

```1:82:src/core/feedback/plan/builder.ts
export function buildFeedbackPlanFromInteractions<E extends readonly string[]>(
	interactions: Record<string, AnyInteraction<E>>,
	responseDeclarations: ResponseDeclaration[]
): FeedbackPlan {
	// ... sort interactions, derive dimensions
	const combinations: FeedbackPlan["combinations"] = []
	if (mode === "fallback") {
		combinations.push({ id: "CORRECT", path: [] }, { id: "INCORRECT", path: [] })
	} else {
		// expand cartesian product of dimension keys and derive stable IDs
		for (const path of paths) {
			const derivedId = deriveComboIdentifier(
				path.map((seg) => `${normalizeIdPart(seg.responseIdentifier)}_${normalizeIdPart(seg.key)}`)
			)
			combinations.push({ id: derivedId, path })
		}
	}
	return { mode, dimensions, combinations }
}
```

- Combo IDs are deterministic and QTI-safe:

```1:18:src/core/feedback/utils.ts
export function normalizeIdPart(part: string): string {
	return part.toUpperCase().replace(/[^A-Z0-9_]/g, "_")
}

export function deriveComboIdentifier(pathParts: string[]): string {
	return `FB__${pathParts.join("__")}`
}
```

- The nested authoring schema ultimately flattens to a block map keyed by combination IDs for compiler consumption:

```132:199:src/core/feedback/authoring/schema.ts
// Nested mode: recursively walk the object graph
// At each leaf, find the matching combination and set
blocks[combination.id] = node.content
```

- Today’s prompt/schema uses a nested Zod schema (converted to JSON Schema) which repeats the same big discriminated unions for every leaf. This duplication causes OpenAI’s "at most 1000 enum values" error in complex items.

## Proposed Architecture: Flat-Key Feedback Schema

### Data shape returned by the model

Return a single, flat object keyed by explicit combination IDs:

```json
{
  "feedback": {
    "FEEDBACK__OVERALL": {
      "FB__RESPONSE_A": { "content": [ /* BlockContent */ ] },
      "FB__RESPONSE_B": { "content": [ /* BlockContent */ ] },
      "FB__RESPONSE_C": { "content": [ /* BlockContent */ ] },
      "FB__RESPONSE_D": { "content": [ /* BlockContent */ ] }
    }
  }
}
```

For multi-dimensional feedback (e.g., two dimensions), the keys embed the entire selection path:

```json
{
  "feedback": {
    "FEEDBACK__OVERALL": {
      "FB__RESPONSE_KM__CORRECT__RESPONSE_M__INCORRECT": { "content": [ /* ... */ ] },
      "FB__RESPONSE_KM__CORRECT__RESPONSE_M__CORRECT":   { "content": [ /* ... */ ] },
      "FB__RESPONSE_KM__INCORRECT__RESPONSE_M__CORRECT": { "content": [ /* ... */ ] },
      "FB__RESPONSE_KM__INCORRECT__RESPONSE_M__INCORRECT": { "content": [ /* ... */ ] }
    }
  }
}
```

### Zod schema builder

Introduce a flat feedback schema builder that enforces exact keys from the feedback plan and reuses a single leaf schema instance for all combinations (minimizes JSON Schema size):

```ts
// New: createFlatFeedbackZodSchema(feedbackPlan, widgetTypeKeys)
const ScopedBlockContentSchema = createBlockContentSchema(widgetTypeKeys)
const LeafNodeSchema = z.object({ content: ScopedBlockContentSchema }).strict()

const shape: Record<string, z.ZodType> = {}
for (const combo of feedbackPlan.combinations) {
	shape[combo.id] = LeafNodeSchema // REUSE SAME INSTANCE for all keys
}

const FlatFeedbackSchema = z
	.object({
		feedback: z
			.object({ FEEDBACK__OVERALL: z.object(shape).strict() })
			.strict()
	})
	.strict()
```

This keeps hardcoded keys via `z.object(shape).strict()` and dramatically reduces duplicated discriminant enums compared to nested trees.

### JSON Schema conversion

Continue using the existing conversion and safety passes:

```153:177:src/core/json-schema/to-json-schema.ts
export function toJSONSchemaPromptSafe(schema: z.ZodType): BaseSchema {
	const json = z.toJSONSchema(schema, { target: "draft-2020-12", io: "input", unrepresentable: "any" })
	stripPropertyNames(json)
	ensureEmptyProperties(json)
	return json
}
```

Because all combination keys point to the same `LeafNodeSchema` instance, the resulting JSON Schema avoids massive duplication of discriminated unions. Even when the converter inlines, the flat layout yields far fewer enums than the nested design.

### Runtime handling (unchanged, but simpler)

- Validate the LLM output against `FlatFeedbackSchema`
- Use the validated object as `feedbackBlocks` by simply taking the `FEEDBACK__OVERALL` map (already keyed by `combination.id`), avoiding any tree-walking conversion
- This matches what the compiler expects today

## Prompt Design for Clarity and Richness

We will maximize clarity and guidance, especially for multi-dimensional feedback, and include all content quality rules in one place.

### Prompt additions (high signal for the model)

1) **Explicit key mapping table**

Generate, from `feedbackPlan.combinations`, a table that explains each key in plain language:

```text
FEEDBACK KEYS MAPPING
- FB__RESPONSE_A: RESPONSE → A
- FB__RESPONSE_B: RESPONSE → B
- FB__RESPONSE_C: RESPONSE → C
- FB__RESPONSE_D: RESPONSE → D
```

For multi-dimensional:

```text
- FB__RESPONSE_KM__CORRECT__RESPONSE_M__INCORRECT: RESPONSE_KM → CORRECT, RESPONSE_M → INCORRECT
- FB__RESPONSE_KM__CORRECT__RESPONSE_M__CORRECT:   RESPONSE_KM → CORRECT, RESPONSE_M → CORRECT
- ...
```

2) **Dimension inventory**

List each dimension with its `responseIdentifier`, type, and possible keys:

```text
DIMENSIONS
- RESPONSE_KM: binary → keys = [CORRECT, INCORRECT]
- RESPONSE_M: enumerated → keys = [M_0, M_1, M_2]
```

3) **Content quality rubric** (concise but explicit)

- Immediate response: acknowledge correct/incorrect
- Conceptual explanation: why and the underlying math idea
- Remedial guidance: what misconception to fix and how
- Learning path: next step suggestions

4) **Strict content model reminders**

- BlockContent only in feedback (paragraph, math, lists, tableRich, refs)
- No interactions inside feedback
- Currency and percent in MathML only
- Ban characters `^` and `|` in text
- No LaTeX sequences, no `<mfenced>`, no CDATA

5) **Context richness**

Provide the item shell, interactions, and any relevant widgets (as read-only context) so the model can write highly targeted feedback.

### Prompt skeleton (high level)

```text
SYSTEM:
You are an expert in educational content. Generate comprehensive feedback for ALL combinations.

STRUCTURE:
- Return JSON with keys under feedback.FEEDBACK__OVERALL matching EXACTLY the specified list.
- Each key maps to { content: BlockContent }.

DIMENSIONS:
<generated dimension inventory>

KEYS MAPPING:
<generated combination mapping table>

QUALITY RUBRIC:
1) Immediate, 2) Conceptual explanation, 3) Remedial guidance, 4) Learning path

STRICT RULES:
- Use BlockContent shape for all content
- No interactions, no LaTeX, no `<mfenced>`, no CDATA
- Currency/percent in MathML tokens only
- No `^` or `|` in text

CONTEXT:
- Assessment shell (sanitized)
- Interaction content
- Widget descriptions (read-only)
```

## OpenAI Constraints Mitigation

- **Flattened schema**: Greatly reduces duplicated enums compared to nested schemas
- **Strict keys**: `z.object({ ...exact keys... }).strict()` ensures the AI must emit every required key
- **Batching if needed**: For very large combination counts, split the combination IDs into deterministic batches (e.g., halves or groups of N), call the model per batch, then merge outputs; still strict per batch with explicit keys
- **Schema minimization**: Reuse the same `LeafNodeSchema` instance for all keys to help converters avoid duplication; avoid `$ref` reliance in case OpenAI strips them

## Implementation Plan (Step-by-Step)

1) **Schema builder (core)**
   - Add `createFlatFeedbackZodSchema(feedbackPlan, widgetTypeKeys)` alongside current nested builder
   - Return Zod object with exact keys (combination IDs) and `LeafNodeSchema` reused per key

2) **Prompt (structured/prompts/feedback.ts)**
   - Add a flat-mode builder that:
     - Constructs the flat Zod schema
     - Builds the dimension inventory and key mapping table from `feedbackPlan`
     - Emits a clear SYSTEM + USER prompt including the mapping and all content rules

3) **Client (structured/client.ts)**
   - In shot 3 (feedback generation), switch to the flat feedback prompt & schema
   - Validate the model output against the flat schema
   - Use the validated `feedback.FEEDBACK__OVERALL` map directly as `feedbackBlocks`

4) **Compiler (no change expected)**
   - Compiler already expects a flat `feedbackBlocks: Record<string, BlockContent>` keyed by `combination.id`

5) **Tests**
   - Add tests for:
     - Flat schema generation (keys exactly match `feedbackPlan.combinations`)
     - Model output validation for a synthetic multi-dimensional plan
     - Snapshot for prompt text to ensure mapping table is present
     - Regression for enum limits: generate JSON Schema for a medium-size plan and confirm it doesn’t exceed limits

6) **Rollout & Safety**
   - Feature-flag the flat schema path initially
   - Emit logs: dimensionCount, combinationCount, and counts per batch (if batching)
   - On failure, log which required keys are missing from the model output

## Example: Flat Schema Outline

```ts
function createFlatFeedbackZodSchema<P extends FeedbackPlan, const E extends readonly string[]>(
	feedbackPlan: P,
	widgetTypeKeys: E
) {
	const ScopedBlockContentSchema = createBlockContentSchema(widgetTypeKeys)
	const LeafNodeSchema = z.object({ content: ScopedBlockContentSchema }).strict()

	const shape: Record<string, z.ZodType> = {}
	for (const combo of feedbackPlan.combinations) {
		shape[combo.id] = LeafNodeSchema
	}

	return z
		.object({ feedback: z.object({ FEEDBACK__OVERALL: z.object(shape).strict() }).strict() })
		.strict()
}
```

## Example: Prompt Mapping Table Section (Generated)

```text
DIMENSIONS
- RESPONSE_KM: binary → [CORRECT, INCORRECT]
- RESPONSE_M: enumerated → [M_0, M_1, M_2]

KEYS MAPPING
- FB__RESPONSE_KM__CORRECT__RESPONSE_M__INCORRECT: RESPONSE_KM → CORRECT, RESPONSE_M → INCORRECT
- FB__RESPONSE_KM__CORRECT__RESPONSE_M__CORRECT:   RESPONSE_KM → CORRECT, RESPONSE_M → CORRECT
- FB__RESPONSE_KM__INCORRECT__RESPONSE_M__CORRECT: RESPONSE_KM → INCORRECT, RESPONSE_M → CORRECT
- FB__RESPONSE_KM__INCORRECT__RESPONSE_M__INCORRECT: RESPONSE_KM → INCORRECT, RESPONSE_M → INCORRECT
```

## Tradeoffs & Why This is Better

- **Strictness preserved**: Exact keys are enforced in schema; the model must comply
- **Clarity improved**: Mapping table explains every key in plain language
- **Enums reduced**: Flat shape avoids repeated nested unions that cause OpenAI to reject schemas
- **Runtime simpler**: No nested-to-flat conversion; validated output is already the final shape
- **Scales with batching**: If combination counts are very large, keys can be partitioned into batches with strict schemas per batch

---

This proposal retains strict key control, reduces schema complexity for OpenAI, provides clearer guidance to the model, and plugs directly into our existing compiler workflow with minimal code churn.
