## TEKS Grade 4 – Widget Mapping Triage (STAAR scrape)

### Scope
- Source: `teks-staar-scrape/staar_test_scrape/*/item-XX.html` and `svgs/` per question.
- Run context: `scripts/staar-batch-generate.ts` using widget collection `teks-math-4`.
- Goal: Enumerate every widget-mapping failure, identify the intended widget (if any), and prescribe precise fixes (aliasing, filtering, prompt rules, or collection expansion).

### Summary of mapping failures
- `question_06`: slot `polygons_image` → should be `nPolygon` (visuals of polygons)
- `question_08`: slots `reponse__a__v1` ... `reponse__e__v1` → placeholder refs, not widgets
- `question_12`: slots `response__a__v1` ... `response__d__v1` → placeholder refs, not widgets
- `question_15`: slots `response_placeholder_ignore` ... `response_placeholder_ignore_150` → placeholder refs, not widgets
- `question_23`: slots `reponse__c__v1` ... `reponse__e__v1` → placeholder refs, not widgets
- `question_27`: slots `reponse__a__v1` ... `reponse__d__v1` → placeholder refs, not widgets
- `question_29`: slots `reponse__a__v1` ... `reponse__d__v1` → placeholder refs, not widgets

### Per‑question details

- question_12
  - Evidence:
    - MC with simple equation SVGs (`eq_*`).
    - Failure slots: `response__a__v1`...`response__d__v1`.
  - Intended widget: none; MC with math images.
  - Root cause: Same placeholder contamination.
  - Fix: Same as question_08.

- question_15
  - Evidence:
    - MC “Which number line shows a point that represents 0.4...”; choices are number line images with image maps.
    - Failure slots: `response_placeholder_ignore`, `response_placeholder_ignore_10` ... `_150`.
  - Intended widget: none; options are images.
  - Root cause: Extreme placeholder emission; collector included these as required slots.
  - Fix: Same filter + prompt forbiddance as above.

- question_23
  - Evidence:
    - MS “Which representations can be used to find the number of parents, p ...” with a small bar/strip visual + algebra expressions as SVG.
    - Failure slots: `reponse__c__v1`, `reponse__d__v1`, `reponse__e__v1`.
  - Intended widget: none required; choices are images/text. If we later want, we can model the bar/strip as `tapeDiagram` but not necessary for rendering.
  - Root cause: Placeholder contamination.
  - Fix: Same filter + prompt forbiddance.

- question_27
  - Evidence:
    - Fraction model image `VR008506.g03.svg` plus math choices as SVG.
    - Failure slots: `reponse__a__v1`...`reponse__d__v1`.
  - Intended widget: Could optionally map the model to `fractionModelDiagram`, but static image is acceptable; no required widget slots.
  - Root cause: Placeholder contamination.
  - Fix: Same filter + prompt forbiddance.

- question_29
  - Evidence:
    - “Which equation cannot be used ...” with four equation SVGs `VR032191_mml_*.svg`.
    - Failure slots: `reponse__a__v1`...`reponse__d__v1`.
  - Intended widget: none; choices are images.
  - Root cause: Placeholder contamination.
  - Fix: Same filter + prompt forbiddance.

### Cross‑cutting root causes
- Placeholder slot pollution from LLM feedback generation step.
- Narrow aliasing: `polygons_image` not recognized though `nPolygon` exists.

### Prescriptive fixes
- Slot collection hardening (`src/structured/collector.ts`):
  - After collecting ids, filter out any id matching: `^(reponse__|response__|response_placeholder_ignore)`.
  - Note: This is not a fallback; it prevents non‑renderable placeholders from entering the mapping stage.
- Mapping normalization (client step before widget mapping prompt):
  - Rewrite `polygons_image` → `nPolygon` for `teks-math-4`.
  - Consider a general alias hook for other obvious synonyms we may encounter.
- Prompt constraints (feedback and widget mapping):
  - For feedback generation, explicitly forbid emitting widget references/placeholder ids in any text.
  - In widget mapping prompt, add a hint that “two polygons image” should map to `nPolygon` when present.
- Optional collection expansion (only if needed later):
  - If we see systematic geometry visuals (e.g., symmetry visuals) that need semantic rendering, evaluate enabling a safe subset (e.g., `geometricPrimitiveDiagram`, `polygonGraph`) from `fourth-grade-math`/`math-core`. Prefer aliasing to existing `teks-math-4` first.

### Concrete action list
- Implement ID filter in `collectAllWidgetSlotIds` to drop placeholder prefixes.
- Add alias map in `generateFromEnvelope` pre‑mapping step for `polygons_image` → `nPolygon` under `teks-math-4`.
- Update `createFeedbackPrompt` to forbid widget placeholders in content.
- Update `createWidgetMappingPrompt` with TEKS‑4 specific hint for polygon images.
- Add tests:
  - Collector ignores placeholder ids.
  - Alias rewrites `polygons_image` to `nPolygon`.
  - Mapping succeeds for question_06; placeholder contamination no longer produces required slots for the others.
