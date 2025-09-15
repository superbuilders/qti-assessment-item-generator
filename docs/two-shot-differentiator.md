### Two‑Shot Differentiator: Frozen Leaves for Non‑Widgets, Focused Widget Regeneration

This document proposes a two‑shot differentiation strategy that preserves our existing “frozen leaves” guarantees for non‑widget fields while allowing rich, unconstrained regeneration of widget internals under fixed widget types. The goal is to maximize stability, difficulty control, and structural safety for the assessment item as a whole, while enabling high‑fidelity variation of visual content inside widgets.

### Current State (Overview)

- **Differentiator entry point**: `src/structured/differentiator.ts`
  - Transforms the input item by converting arrays to objects so we can build a rigid runtime Zod schema.
  - Uses `generateZodSchemaFromObject` to create an OpenAI‑compatible schema with frozen literals for critical keys (e.g., `type`, some identifiers, response declarations fields) — the “frozen leaves” strategy.
  - Sends a single prompt that requires “identical JSON structure,” then converts objects back to arrays on output.

- **Frozen leaves generator**: `src/structured/zod-runtime-generator.ts`
  - Freezes `type`, `slotId` in slot contexts, `responseIdentifier` in interaction contexts, interaction `shuffle`, and response declaration fields `cardinality`/`baseType` when in the right structural paths.
  - Produces a strict Zod object for the full item shape to enforce “no extra keys.”

- **Multi‑shot generation pipeline (initial item generation)**: `src/structured/client.ts#generateFromEnvelope`
  - Shot 1: assessment shell
  - Shot 2: widget mapping (slot → widget type)
  - Shot 3: interactions
  - Shot 4: widgets
  - Final assembly into a complete `AssessmentItem` validated against dynamic schemas in `src/compiler/schemas.ts`.

### Problem

For differentiation, we currently freeze the entire structure, including widgets. This maximizes safety but can be too constraining for visual variation. We want a two‑shot approach where:
- Shot A: Differentiate everything except widgets using frozen leaves (structure‑locked) — body, interactions, response declarations, feedback, metadata — so these vary safely.
- Shot B: Regenerate widget objects with the same widget types as the original (hardcoded per slot), allowing any internal widget fields to change while preserving the widget type and the slot layout.

### Proposed Two‑Shot Differentiator

1) Shot A: Non‑Widget Differentiation (Frozen Leaves)
- Input: Original `AssessmentItemInput`, target count `n`.
- Transformation: Same array→object transform.
- Schema generation: Use `generateZodSchemaFromObject` but override the handling for `widgets` such that:
  - `widgets` field is present and must match the same set of slot keys as the original, but each slot’s schema is a permissive “opaque widget placeholder” with only `type` frozen to the original type; all other widget keys are not frozen and may be null or minimally constrained.
  - This maintains the global JSON structure and ensures widget slot presence and widget types are fixed, but prevents the model from altering widget internals during Shot A.
- Prompt: Keep the current differentiator core language (identical structure, maintain difficulty, preserve pedagogical intent, valid MathML, entity bans) and add:
  - “Do not modify any widget internals in this shot. Preserve widget objects and their types exactly as placeholders; you will not edit widget fields here.”
- Output: `n` differentiated items with varied non‑widget leaves and preserved widget placeholders (same slot keys, same `type` literals).

Implementation notes:
- Build a “widgets‑as‑stubs” runtime schema by cloning the transformed item and replacing each `widgets[slot]` with `{ type: z.literal(originalType) }` for Shot A’s schema generation path.
- Keep existing frozen rules for interactions, response declarations, and content models as today (see `zod-runtime-generator.ts`).

2) Shot B: Widget Regeneration (Same Type, Free Internals)
- Input: For each Shot‑A item, reuse the item as the context along with a “fixed widget mapping” derived from its widgets: `Record<slotId, widgetType>`.
- Prompting: Reuse the widget content prompt machinery:
  - System/user prompts from `src/structured/prompts/widgets.ts` already accept a widget mapping and interaction context.
  - Modify or add a variant prompt: “For each widget slot, you MUST use the exact same widget type as provided. You may change ANY widget properties as needed to produce a coherent alternative, but the type cannot change.”
- Schema: Use `createDynamicAssessmentItemSchema(widgetMapping)` from `src/compiler/schemas.ts` to validate widgets by type. This permits full, type‑specific widget structures for regeneration.
- Output: For each differentiated item from Shot A, fully regenerated `widgets` objects validated per type, then assemble the final item.

### Data Flow

- Input item → Shot A schema build (arrays→objects, widgets→stubs) → AI call (frozen leaves for non‑widgets) → `n` items with unchanged widget placeholders
- For each item i in n:
  - Extract `widgetMapping_i` from placeholders (slotId → type)
  - Use `createWidgetContentPrompt` with the new item’s body/interactions/feedback and the fixed `widgetMapping_i`
  - AI generates full widgets of the given types
  - Validate with `createDynamicAssessmentItemSchema(widgetMapping_i)` and assemble final differentiated item i

### Why This Works

- Preserves our strongest guarantees for non‑widget structure and critical identifiers via the existing frozen‑leaves approach.
- Prevents cross‑shot inconsistencies by locking widget slot keys and types in Shot A.
- Leverages the mature widget‑generation pipeline (prompts, schema, and assembly) for Shot B, minimizing new surface area.
- Keeps difficulty and pedagogy constraints in Shot A where interaction content and response declarations live; widget visuals can vary while staying coherent with the regenerated interaction prompts.

### Why We Do Not Freeze Widget Leaves

Widgets are already strongly constrained by their type‑specific Zod schemas (`typedSchemas` in `src/widgets/registry.ts`) and the dynamic schema builder (`createDynamicAssessmentItemSchema` in `src/compiler/schemas.ts`). Freezing every widget leaf would unnecessarily restrict expressivity without improving safety. Instead, we:

- **Freeze only the widget `type` and slot keys**: This preserves the widget kind and layout, which are the stability anchors needed across shots.
- **Rely on rich, domain‑specific Zod schemas for internals**: Each widget type’s schema defines the exact allowable structure, enumerations, numeric ranges, and nested objects. This is a stronger and more semantically meaningful constraint than generic literal‑freezing of leaves.
- **Validate per‑type on Shot B**: Regenerated widget content is validated by `createDynamicAssessmentItemSchema(widgetMapping)`, which enforces the correct schema for each slot’s type. Invalid or out‑of‑domain fields fail fast.
- **Gain flexibility for faithful visual variation**: Allowing internals to change (within schema) lets the AI adjust labels, coordinates, scales, and visual parameters to better represent the differentiated prompt, while still preventing type changes or structural drift.

Net effect: We maintain safety via type‑aware validation and explicit slot/type locking, while removing leaf‑freezing that would otherwise block legitimate and necessary widget variation.

### Required Changes (Targeted)

- `src/structured/differentiator.ts`
  - Split into two exported functions:
    - `differentiateAssessmentItemNonWidgets(...)` → returns `n` items with widget stubs (type‑only)
    - `regenerateWidgetsForDifferentiatedItems(...)` → takes each item and regenerates widgets using fixed mapping
  - Or retain a single `differentiateAssessmentItem(...)` that internally orchestrates two shots.
  - Add a helper to build a Shot‑A runtime schema: replace each widget object with `{ type: z.literal(originalType) }` before `generateZodSchemaFromObject` is called.

- `src/structured/prompts/differentiation` (new or extend current prompt builder inside `differentiator.ts`)
  - Add explicit language to prohibit widget internals changes in Shot A.
  - Optionally add a short section enumerating the widget slot names that are present and declaring they are frozen for Shot A.

- `src/structured/client.ts` (optional integration)
  - Option to expose a high‑level API: `differentiateWithFixedWidgets(openai, logger, item, n)` that returns `n` fully assembled items by running Shot A then Shot B in sequence, reusing existing widget generation logic.

- Tests
  - Unit: Shot‑A schema: asserts widget stubs freeze only `type` and keep slot keys identical.
  - E2E: Differentiation produces `n` items where body/interactions/feedback vary; widget types remain identical per slot; Shot‑B widget regeneration produces valid widgets per `createDynamicAssessmentItemSchema`.

### Safety and Rules Compliance

- Error handling and logging: Follow `@superbuilders/errors` and `@superbuilders/slog` across new code paths. No try/catch, use `errors.try`/`errors.trySync`; log before throw; no fallbacks.
- Zod usage: Always prefer `safeParse` when validating; Shot B relies on `createDynamicAssessmentItemSchema(widgetMapping)` which is already zod‑based.
- No fallbacks: Widget mapping for Shot B is derived strictly from Shot‑A placeholders; if a slot/type is missing or mismatched, fail fast and log.

### Open Questions

- Should we allow Shot A to lightly vary widget‑visible labels embedded in body/choices? The proposal keeps those in non‑widget content, so they already vary in Shot A; widget internals then align in Shot B.
- For items with no widgets, Shot B is a no‑op — the flow should short‑circuit.

### Summary

Adopting a two‑shot differentiator isolates structural and pedagogical stability (Shot A, frozen leaves) from visual richness (Shot B, same widget type with free internals). It reuses existing components, minimizes risk, and gives us more realistic, varied differentiated items without compromising the integrity of the assessment structure.


