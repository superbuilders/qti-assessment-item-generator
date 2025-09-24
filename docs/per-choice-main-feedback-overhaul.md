## QTI Feedback Overhaul: Lower-Level Interface

### Executive Summary
Replace our current binary feedback system with a direct mapping to QTI's feedback-block mechanism. Authors define feedback blocks keyed by identifiers, and response processing routes outcomes to those identifiers.

---

## Philosophy

Instead of wrapping QTI's feedback system, expose it directly:
- Authors define `qti-feedback-block` elements via JSON
- Response processing sets outcome variables to specific identifiers
- Engine shows matching feedback blocks

This is simpler, more powerful, and matches exactly how QTI works.

---

## Current vs New Schema

### BEFORE (Current System)
```typescript
AssessmentItem {
  feedback: {
    correct: BlockContent     // Binary: right/wrong
    incorrect: BlockContent
  }
}

// Plus optional choice-level feedback
ChoiceInteraction {
  choices: Array<{
    identifier: string
    content: BlockContent
    feedback?: InlineContent | null  // Optional inline feedback
  }>
}
```

### AFTER (Direct QTI Mapping)
```typescript
AssessmentItem {
  feedbackBlocks: Array<{
    identifier: string        // Maps to qti-feedback-block identifier
    outcomeIdentifier: string // Maps to qti-feedback-block outcome-identifier  
    content: BlockContent     // Rich content (widgets, tables, etc.)
  }>
  
  // Response processing sets outcome variables to route feedback
  // No special wrapper logic needed
}

// Choice-level feedback REMOVED entirely
ChoiceInteraction {
  choices: Array<{
    identifier: string
    content: BlockContent
    // NO feedback field at all
  }>
}
```

---

## Example: Single Choice Question

### JSON Input
```json
{
  "interactions": {
    "choice_1": {
      "type": "choiceInteraction",
      "responseIdentifier": "RESPONSE",
      "choices": [
        {"identifier": "A", "content": [...]},
        {"identifier": "B", "content": [...]},
        {"identifier": "C", "content": [...]}
      ]
    }
  },
  
  "feedbackBlocks": [
    {
      "identifier": "A",
      "outcomeIdentifier": "FEEDBACK__RESPONSE", 
      "content": [
        {"type": "paragraph", "content": [{"type": "text", "content": "Correct! Here's why A is right..."}]}
      ]
    },
    {
      "identifier": "B", 
      "outcomeIdentifier": "FEEDBACK__RESPONSE",
      "content": [
        {"type": "paragraph", "content": [{"type": "text", "content": "Incorrect. B is wrong because..."}]}
      ]
    },
    {
      "identifier": "C",
      "outcomeIdentifier": "FEEDBACK__RESPONSE", 
      "content": [
        {"type": "paragraph", "content": [{"type": "text", "content": "Incorrect. C is wrong because..."}]}
      ]
    }
  ],
  
  "responseDeclarations": [
    {"identifier": "RESPONSE", "baseType": "identifier", "cardinality": "single", "correct": "A"}
  ]
}
```

### QTI Output (Uniform Outcome Naming)
```xml
<qti-outcome-declaration identifier="FEEDBACK__RESPONSE" cardinality="single" base-type="identifier"/>

<qti-item-body>
  <qti-choice-interaction response-identifier="RESPONSE">...</qti-choice-interaction>
  
  <qti-feedback-block identifier="A" outcome-identifier="FEEDBACK__RESPONSE" show-hide="show">
    <qti-content-body>
      <p>Correct! Here's why A is right...</p>
    </qti-content-body>
  </qti-feedback-block>
  
  <qti-feedback-block identifier="B" outcome-identifier="FEEDBACK__RESPONSE" show-hide="show">
    <qti-content-body>
      <p>Incorrect. B is wrong because...</p>
    </qti-content-body>
  </qti-feedback-block>
  
  <qti-feedback-block identifier="C" outcome-identifier="FEEDBACK__RESPONSE" show-hide="show">
    <qti-content-body>
      <p>Incorrect. C is wrong because...</p>
    </qti-content-body>
  </qti-feedback-block>
</qti-item-body>

<qti-response-processing>
  <qti-response-condition>
    <qti-response-if>
      <qti-match>
        <qti-variable identifier="RESPONSE"/>
        <qti-base-value base-type="identifier">A</qti-base-value>
      </qti-match>
      <qti-set-outcome-value identifier="FEEDBACK__RESPONSE">
        <qti-base-value base-type="identifier">A</qti-base-value>
      </qti-set-outcome-value>
    </qti-response-if>
    <qti-response-else-if>
      <qti-match>
        <qti-variable identifier="RESPONSE"/>
        <qti-base-value base-type="identifier">B</qti-base-value>
      </qti-match>
      <qti-set-outcome-value identifier="FEEDBACK__RESPONSE">
        <qti-base-value base-type="identifier">B</qti-base-value>
      </qti-set-outcome-value>
    </qti-response-else-if>
    <qti-response-else-if>
      <qti-match>
        <qti-variable identifier="RESPONSE"/>
        <qti-base-value base-type="identifier">C</qti-base-value>
      </qti-match>
      <qti-set-outcome-value identifier="FEEDBACK__RESPONSE">
        <qti-base-value base-type="identifier">C</qti-base-value>
      </qti-set-outcome-value>
    </qti-response-else-if>
  </qti-response-condition>
</qti-response-processing>
```

---

## Multi-Select Example

```json
{
  "feedbackBlocks": [
    {
      "identifier": "A",
      "outcomeIdentifier": "FEEDBACK_MULTI",
      "content": [{"type": "paragraph", "content": [{"type": "text", "content": "Good choice! A is correct because..."}]}]
    },
    {
      "identifier": "B", 
      "outcomeIdentifier": "FEEDBACK_MULTI",
      "content": [{"type": "paragraph", "content": [{"type": "text", "content": "Excellent! B is also correct because..."}]}]
    },
    {
      "identifier": "C",
      "outcomeIdentifier": "FEEDBACK_MULTI",
      "content": [{"type": "paragraph", "content": [{"type": "text", "content": "Incorrect. C is wrong because..."}]}]
    }
  ]
}
```

QTI declares `FEEDBACK_MULTI` with `cardinality="multiple"`. If user selects A+B, both feedback blocks show.

---

## Multiple Interactions Example

```json
{
  "interactions": {
    "choice_1": {"responseIdentifier": "RESP_1", ...},
    "dropdown_2": {"responseIdentifier": "RESP_2", ...}
  },
  
  "feedbackBlocks": [
    // Feedback for choice_1
    {"identifier": "A", "outcomeIdentifier": "FEEDBACK_1", "content": [...]},
    {"identifier": "B", "outcomeIdentifier": "FEEDBACK_1", "content": [...]},
    
    // Feedback for dropdown_2  
    {"identifier": "YES", "outcomeIdentifier": "FEEDBACK_2", "content": [...]},
    {"identifier": "NO", "outcomeIdentifier": "FEEDBACK_2", "content": [...]}
  ]
}
```

Compiler emits:
- `<qti-outcome-declaration identifier="FEEDBACK_1" ...>`
- `<qti-outcome-declaration identifier="FEEDBACK_2" ...>`
- Response processing sets both outcomes based on user selections
- User sees feedback from both interactions

---

## Complex/Non-Enumerated Interactions

For textEntry, orderInteraction, gapMatch - use traditional CORRECT/INCORRECT:

```json
{
  "feedbackBlocks": [
    {
      "identifier": "CORRECT",
      "outcomeIdentifier": "FEEDBACK", 
      "content": [{"type": "paragraph", "content": [{"type": "text", "content": "Great! Your sequence is correct..."}]}]
    },
    {
      "identifier": "INCORRECT",
      "outcomeIdentifier": "FEEDBACK",
      "content": [{"type": "paragraph", "content": [{"type": "text", "content": "Not quite. The correct order should be..."}]}]
    }
  ]
}
```

Response processing compares against correct answer and sets FEEDBACK to CORRECT or INCORRECT.

---

## Schema Definition

```typescript
interface FeedbackBlock {
  identifier: string           // REQUIRED: qti-feedback-block identifier
  outcomeIdentifier: string    // REQUIRED: outcome variable name
  content: BlockContent        // REQUIRED: rich content (no interactions via blockSlot)
}

interface AssessmentItem {
  // Remove old feedback field entirely
  feedbackBlocks: FeedbackBlock[]  // NEW: direct QTI mapping
  
  // Existing fields unchanged
  interactions: Record<string, AnyInteraction>
  responseDeclarations: ResponseDeclaration[]
  // ...
}
```

### Validation Rules

1. **Outcome Declaration**: For each unique `outcomeIdentifier` in feedbackBlocks, compiler MUST declare `<qti-outcome-declaration>`
   - Cardinality determined by interaction type: single for single-select, multiple for multi-select
   - FEEDBACK-INLINE is no longer declared (removed entirely)
2. **Reserved Names**: `outcomeIdentifier` cannot be SCORE or MAXSCORE (reserved by QTI)
3. **No Interactive Widgets**: `content` MUST NOT contain blockSlots that resolve to interactive widgets
   - If blockSlot resolves to dataTable with any "input" or "dropdown" cells, throw "interactive widgets banned in feedback"
   - Static dataTable (only "inline" and "number" cells) is allowed
4. **Identifier Uniqueness**: Within same `outcomeIdentifier`, all `identifier` values MUST be unique
5. **Response Processing**: Compiler generates response conditions to set outcome variables

---

## Identifier Type Safety (Namespaced, Branded)

We will enforce strong, namespaced identifier patterns using Zod regex + branding, and cross-field validation, inspired by the superRefine approach used in `transformation-diagram.ts`.

### Regex namespaces

```typescript
// Outcome identifiers control which feedback blocks are shown
export const OUTCOME_IDENTIFIER_REGEX = /^FEEDBACK(?:__[A-Za-z0-9_]+)?$/

// Feedback block identifiers (values assigned to the outcome)
// Allow classic tokens like CORRECT/INCORRECT and choice ids like A/B/C or uppercase tokens
export const FEEDBACK_BLOCK_ID_REGEX = /^(CORRECT|INCORRECT|[A-Z][A-Z0-9_]*)$/

// Response identifiers for interactions
export const RESPONSE_IDENTIFIER_REGEX = /^(RESP|RESPONSE)(?:__[A-Za-z0-9_]+)?$/

// Choice identifiers (enumerated options)
export const CHOICE_IDENTIFIER_REGEX = /^[A-Z][A-Z0-9_]*$/

// Gap identifiers and draggable word identifiers (already enforced but documented here)
export const GAP_IDENTIFIER_REGEX = /^GAP_[A-Za-z0-9_]+$/
export const GAP_TEXT_IDENTIFIER_REGEX = /^(WORD|TERM)_[A-Za-z0-9_]+$/
```

### Schema wiring with regex validation

```typescript
// Direct regex validation on string fields (no branding)
// interactions
responseIdentifier: z.string().regex(RESPONSE_IDENTIFIER_REGEX, "invalid response identifier")
choices: z.array(z.object({
  identifier: z.string().regex(CHOICE_IDENTIFIER_REGEX, "invalid choice identifier"),
  content: createBlockContentSchema()
}).strict())

// feedback blocks
feedbackBlocks: z.array(z.object({
  identifier: z.string().regex(FEEDBACK_BLOCK_ID_REGEX, "invalid feedback block identifier"),
  outcomeIdentifier: z.string().regex(OUTCOME_IDENTIFIER_REGEX, "invalid outcome identifier"),
  content: createBlockContentSchema()
}).strict())
```

### Cross-field validation using superRefine (pre-validator style)

Using the `transformation-diagram.ts` pattern of superRefine for cross-field validation:

```typescript
const AssessmentItemSchema = z
  .object({
    // ... other fields
    feedbackBlocks: z.array(FeedbackBlockSchema),
    interactions: z.record(AnyInteractionSchema).nullable(),
    responseDeclarations: z.array(ResponseDeclarationSchema)
  })
  .strict()
  .superRefine((data, ctx) => {
    // Build responseId -> set(choiceIds) from enumerated interactions  
    const responseIdToChoices = new Map<string, Set<string>>()
    
    if (data.interactions) {
      for (const [interactionId, interaction] of Object.entries(data.interactions)) {
        if (interaction.type === "choiceInteraction" || interaction.type === "inlineChoiceInteraction") {
          const choiceIds = new Set(interaction.choices.map(c => c.identifier))
          responseIdToChoices.set(interaction.responseIdentifier, choiceIds)
        }
      }
    }
    
    // Validate feedback block identifiers match interaction structure
    for (let i = 0; i < data.feedbackBlocks.length; i++) {
      const fb = data.feedbackBlocks[i]
      
      if (fb.outcomeIdentifier === "FEEDBACK") {
        // Non-enumerated: must be CORRECT or INCORRECT
        if (!/^(CORRECT|INCORRECT)$/.test(fb.identifier)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "feedback block id must be CORRECT or INCORRECT for global FEEDBACK outcome",
            path: ["feedbackBlocks", i, "identifier"]
          })
        }
        continue
      }
      
      // Enumerated: FEEDBACK__<responseId> format
      const match = /^FEEDBACK__([A-Za-z0-9_]+)$/.exec(fb.outcomeIdentifier)
      if (match) {
        const respId = match[1]
        const allowedChoices = responseIdToChoices.get(respId)
        if (!allowedChoices || !allowedChoices.has(fb.identifier)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `feedback block identifier "${fb.identifier}" not found in choices for response "${respId}"`,
            path: ["feedbackBlocks", i, "identifier"]
          })
        }
      }
    }
  })
```

This provides compile-time identifier format validation plus runtime cross-field consistency, following the same pattern as `transformation-diagram.ts` vertex/label validation.

---

## Benefits of This Approach

### Simpler
- No wrapper abstractions
- Direct 1:1 mapping to QTI
- Authors see exactly what gets generated

### More Powerful  
- Support any feedback routing pattern
- Easy to add new outcome variables
- Natural support for multi-interaction items

### Type Safe
- Feedback blocks are required (non-empty array)
- Clear relationship between identifiers and outcomes
- BlockContent supports rich widgets/tables

### Flexible
- Per-choice feedback: one block per choice identifier
- Binary feedback: CORRECT/INCORRECT identifiers  
- Custom patterns: any identifier scheme you want

---

## Migration Strategy

1. **Remove**: Top-level feedback.correct/incorrect fields
2. **Remove**: All choice.feedback (inline feedback) from interaction schemas
3. **Remove**: qti-feedback-inline emission from interaction compiler
4. **Add**: feedbackBlocks array to AssessmentItem schema
5. **Update**: Compiler to emit qti-feedback-block elements from feedbackBlocks
6. **Update**: Response processor to set outcome variables (remove hardcoded FEEDBACK/FEEDBACK-INLINE)
7. **Update**: Templates to use new feedbackBlocks format
8. **Update**: AI prompts to generate feedbackBlocks instead of choice.feedback
9. **Add**: Namespaced identifier enforcement (regex + branding) and cross-field pre-validation

---

## Implementation Notes

### Compiler Changes
- Parse feedbackBlocks array
- Group by outcomeIdentifier to determine outcome declarations (compiler declares these, not templates)
- Remove hardcoded FEEDBACK and FEEDBACK-INLINE declarations
- Emit qti-feedback-block elements in item body from feedbackBlocks
- Generate response processing to set outcome variables

### Response Processing Logic
- For identifier-based single-select: set `FEEDBACK__<responseId>` to the selected choice identifier
- For identifier-based multi-select: set `FEEDBACK__<responseId>` (cardinality multiple) to all selected choice identifiers
- For non-enumerated (textEntry, orderInteraction, gapMatch): set `FEEDBACK__GLOBAL` to `CORRECT` or `INCORRECT` based on answer correctness
- Cardinality derivation:
  - If `responseDeclaration.baseType === "identifier"` and `cardinality === "single"`, declare `<qti-outcome-declaration identifier="FEEDBACK__<responseId>" cardinality="single" base-type="identifier"/>`.
  - If `responseDeclaration.baseType === "identifier"` and `cardinality === "multiple"`, declare `<qti-outcome-declaration identifier="FEEDBACK__<responseId>" cardinality="multiple" base-type="identifier"/>`.
  - For non-enumerated interactions (text/string/float/integer or directedPair), declare `<qti-outcome-declaration identifier="FEEDBACK__GLOBAL" cardinality="single" base-type="identifier"/>` and use `CORRECT`/`INCORRECT` values.

### Widget Restrictions in Feedback
- dataTable widgets in feedback content MUST be static display only
- If any dataTable cell has a missing/unknown `type` or any interactive type (e.g., `input`, `dropdown`), compilation fails
- Other widgets that do not emit interactions are allowed (charts, diagrams). Any widget that would emit an interaction is banned in feedback content

### Structured AI Pipeline Enablement Checklist
- Schema: add `feedbackBlocks` and remove legacy `feedback`/`choice.feedback`; add regexes and `superRefine`
- Prompts: update all guidance and examples to generate `feedbackBlocks`; document uniform outcome naming; ban inline feedback
- Validators: update structured validator and pre-validator to process `feedbackBlocks`, enforce no interactive widgets, and fail on legacy fields
- Compiler: declare outcomes per `outcomeIdentifier`, emit `qti-feedback-block` for each, validate content widgets
- Response Processor: generate per-outcome logic as above; support multiple interactions and multi-select
- Tests/Examples: update snapshots and examples to use `feedbackBlocks`; remove all `qti-feedback-inline` expectations

---

## Detailed Implementation Requirements

### File-by-File Changes Required

#### src/compiler/schemas.ts
- Remove top-level `feedback: FeedbackSchema` from AssessmentItemSchema
- Remove `feedback?: InlineContent | null` from choice objects in ChoiceInteractionSchema and OrderInteractionSchema  
- Add `feedbackBlocks: z.array(FeedbackBlockSchema).nonempty()` to AssessmentItemSchema
- Add new regex constants: OUTCOME_IDENTIFIER_REGEX, FEEDBACK_BLOCK_ID_REGEX, etc.
- Add superRefine cross-field validation to AssessmentItemSchema for feedback-choice consistency
- Keep SAFE_IDENTIFIER_REGEX for response identifiers (decide: stricter uppercase for choices?)

#### src/compiler/compiler.ts  
- Remove hardcoded FEEDBACK and FEEDBACK-INLINE outcome declarations (lines 945-946)
- Replace CORRECT/INCORRECT feedback block emission (lines 949-954) with loop over feedbackBlocks
- Add outcome declaration loop: for each unique outcomeIdentifier, declare with appropriate cardinality
- Add dataTable-in-feedback validation: scan blockSlots in feedback content, resolve to widgets, check for input/dropdown cells
- Add legacy field detection: hard fail if old feedback or choice.feedback fields are present

#### src/compiler/response-processor.ts
- Replace hardcoded FEEDBACK → CORRECT/INCORRECT logic with dynamic outcome setting
- For identifier-based interactions: generate else-if chain per choice to set outcome to selected identifier
- For multi-select: use cardinality="multiple" and set outcome to all selected identifiers  
- For non-enumerated: keep CORRECT/INCORRECT pattern but use configured outcomeIdentifier
- Remove references to FEEDBACK-INLINE

#### src/compiler/interaction-compiler.ts
- Remove qti-feedback-inline emission entirely (lines that append choice feedback)
- Remove renderInlineContent calls for choice.feedback

### Structured Pipeline Changes

#### src/structured/prompts/interactions.ts
- Remove all inline feedback guidance and examples (lines 516-521, 781-783)
- Add feedbackBlocks generation requirements
- Update examples to show outcomeIdentifier and identifier patterns
- Specify per-choice for enumerated interactions, CORRECT/INCORRECT for others

#### src/structured/prompts/shell.ts  
- Remove binary feedback examples
- Add feedbackBlocks examples for different interaction patterns
- Document outcome naming conventions (FEEDBACK vs FEEDBACK__<responseId>)

### Templates and Examples

#### src/templates/math/fraction-addition.ts
- Remove choice.feedback assignments (lines 194-214) 
- Add feedbackBlocks array with identifier per choice and outcomeIdentifier="FEEDBACK"
- Remove top-level feedback.correct/incorrect (lines 227-258)

#### src/examples.ts
- Update all examples to use feedbackBlocks instead of top-level feedback
- Remove any choice.feedback usage
- Ensure examples cover both per-choice and CORRECT/INCORRECT patterns

### Testing Changes

#### tests/compiler/*.test.ts
- Update snapshots: remove qti-feedback-inline elements
- Remove FEEDBACK-INLINE outcome declarations from expected XML
- Add per-choice qti-feedback-block assertions
- Test dataTable-in-feedback validation (should throw)
- Test cross-field validation (mismatched identifiers should fail)

#### tests/structured/*.test.ts  
- Update prompt/shell generation tests for new feedback format
- Test that inline feedback guidance is removed

---

## Critical Decisions to Finalize

### 1. Outcome Naming Convention
**Final**: Use `FEEDBACK__<responseId>` uniformly for all interactions.
- Enumerated interactions (choice/inlineChoice): `outcomeIdentifier = FEEDBACK__<responseIdentifier>` and each block `identifier` must match a defined choice id.
- Non-enumerated interactions (textEntry/order/gapMatch): `outcomeIdentifier = FEEDBACK__GLOBAL` and block identifiers must be `CORRECT` or `INCORRECT`.

### 2. Choice Identifier Strictness  
**Final**: Keep existing `SAFE_IDENTIFIER_REGEX` for now to minimize churn in examples and prompts. We may introduce a future stricter rule as an opt-in.

### 3. Multi-Select Response Processing
**Final**: Generate explicit else-if chains per choice that set the multiple-cardinality outcome to the selected identifiers. Optimize later if needed.

### 4. Feedback Block Rendering Order
**Final**: Append all `feedbackBlocks` at the end of the item body, grouped by `outcomeIdentifier`, preserving input order within groups.

### 5. Legacy Field Handling
**Final**: Fail-fast. If legacy `feedback` or `choice.feedback` is detected anywhere, log and throw with a precise error message.

### 6. DataTable Cell Type Detection
**Final**: Strict validation. In `feedbackBlocks` content, if a `blockSlot` resolves to a data table, all cells must have an explicit `type` in an allowlist of static types (e.g., `inline`, `number`, `text`). Any missing type or any interactive type (e.g., `input`, `dropdown`, or unknown) causes a compilation error.

---

## Risk Assessment

### Low Risk
- Schema changes: Well-defined with strong validation
- Basic compiler emission: Straightforward mapping from JSON to XML
- Template migration: Clear before/after examples

### Medium Risk  
- Cross-field validation complexity: Multiple interaction types with different identifier patterns
- Response processing generation: Must handle single/multiple cardinality correctly
- Prompt updates: AI must learn new feedback pattern

### High Risk
- DataTable validation: Complex widget structure inspection; edge cases in cell type detection
- Multi-interaction items: Outcome collision detection and rendering order
- Test migration: Large number of snapshots to update across multiple test suites

### Mitigation
- Implement dataTable validation incrementally with comprehensive tests
- Create migration script for updating existing examples/templates
- Update tests in phases: schemas first, then compiler, then snapshots

---

This approach gives us the full power of QTI's feedback system without unnecessary abstractions. Authors can implement any feedback pattern they need, from simple per-choice to complex multi-interaction scenarios.
