## Canvas scrape analysis — English 09, Part 1

### Scope and goal
This report inventories the `canvas-scrape` dataset, characterizes quiz/test artifacts, verifies answer availability, and evaluates suitability for our existing structured generation + QTI compilation pipeline. It also outlines the inputs we’ll feed to the pipeline for an automated conversion script analogous to `scripts/staar-batch-generate.ts`.

### High-level inventory
- **Course root**: `canvas-scrape/English 09, Part 1`
- Contains course pages, resources, and assessments. Assessments live in per-lesson folders with an `_quiz` subdirectory containing artifacts.

#### Per-page scraped artifacts (non-quiz)
- `page.html`: raw HTML of the Canvas/Moodle page
- `page-data.json`: normalized extraction with:
  - `title` (string), `url` (string)
  - `mainContent.text` (string, text-only), `mainContent.html` (string, sanitized HTML)
  - `sections[]`: structured headings with `heading`, `level`, `content`
  - `links[]`: extracted links with `text`, `url`, `type` (internal|external)
  - `media[]`: e.g., iframes (YouTube embeds)
  - `metadata`: `timestamp`, `courseId`, optional IDs
- `metadata.json`: page-level scrape metadata, e.g.:
  - `title`, `url`, `id`, `type` (page|quiz|assign|url)
  - `unit` (string), `scrapedAt` (ISO), `actualUrl`
  - `networkRequestCount`, `resourcesDownloaded`, and quiz flags (`quizAttempted`, `quizQuestionsAnswered`)
- `network.json`: array of network requests captured during scrape with `url`, `method`, `status`, `resourceType`, `timestamp`
- `network.log`: raw text/console of network events

#### Assessment sets detected
- **Unit quizzes**: 28 total
  - Unit 1 quizzes: 6 (`Quiz 1.1` … `Quiz 1.6`)
  - Unit 2 quizzes: 6 (`Quiz 2.1` … `Quiz 2.6`)
  - Unit 3 quizzes: 6 (`Quiz 3.1` … `Quiz 3.6`)
  - Unit 4 quizzes: 4 (`Quiz 4.1` … `Quiz 4.4`)
  - Unit 5 quizzes: 5 (`Quiz 5.1` … `Quiz 5.5`)
  - How to Take This Course: 1 (`MANDATORY QUIZ`)
- **Unit tests**: 5 (`Unit 1 Test` … `Unit 5 Test`)
- **Total assessment datasets with `_quiz/` artifacts**: 33 (28 quizzes + 5 unit tests)

### Artifact coverage across `_quiz/`
Counts below are presence across the 33 `_quiz` directories:

- quiz-data.json: 33/33
- quiz-data.json.backup: 32/33
- quiz-page.html: 29/33
- results.html: 26/33
- score.json: 26/33
- results.png: 26/33
- before-submit.png: 28/33
- quiz-full-page.png: 29/33
- quiz-overview.png: 30/33
- capture-*.html: 7 files total (present in several unit tests)
- capture-*.png: 7 files total (paired with the above)
- question-*.png: 478 files total (≈14–15 per assessment on average; min ~9, max ~30 on unit tests)

Additional quiz-adjacent page artifacts (siblings of `_quiz/`):
- Sibling `page.html` exists for almost every quiz/test parent directory (e.g., `.../Quiz 2.2/page.html`). This is the page view before entering the attempt UI.
- Sibling `metadata.json`, `network.json`, and `network.log` present alongside those `page.html` files.

Notes:
- Unit tests often include `capture-*.html/.png` (page-level captures) and large sets of `question-*.png` (up to 30 questions). Some tests lack `quiz-page.html` and/or `results.html` but still have enough alternative artifacts.
- Most unit quizzes include `quiz-page.html`, `results.html`, `score.json`, `quiz-full-page.png`, and `quiz-overview.png` in addition to per-question images.

### quiz-data.json structure and fidelity
- Schema (empirical):
  - `questions`: array of question objects. Observed types: `multiple-choice`, `dropdown`, `matching`. Fields include `questionNumber`, `questionText`, `type`, `options` (for MC), `blanks` (for dropdown), and `pairs` (for matching). Some include `groupName` and `questionId`.
  - `answers`: object keyed by question number as a string (e.g., "1", "2"). For MC, an `answer` key contains either a label (e.g., `"c"`) or full text (e.g., `"True"`); for dropdown, `answers` is an array mapping blanks to selected text; for matching, `matches` is an array of `{ prompt, answer }` pairs.
  - Optional metadata: `reasoning`, `correct` (boolean), `state` (e.g., `"Correct"`), `grade` per question.
  - File-level metadata: `timestamp`, `cleanedDropdowns: true` when options normalized; some tests include `recovered: true`, `recoveryMethod: "HTML parsing"` indicating answers were reconstructed from `results.html`.

Exact JSON paths used:
- Questions array: `$.questions[*]`
  - For MC: `$.questions[*].type == "multiple-choice"`, options at `options[*].label|text`
  - For dropdown: `$.questions[*].type == "dropdown"`, blanks at `blanks[*].options[*]`
  - For matching: `$.questions[*].type == "matching"`, pairs at `pairs[*].prompt`, `pairs[*].options[*]`
- Answers object: `$.answers.{questionNumberAsString}`
  - MC: `$.answers["N"].answer` (label or full text)
  - Dropdown: `$.answers["N"].answers[*]` (array of selected texts by blank order)
  - Matching: `$.answers["N"].matches[*].prompt|answer`
  - Optional: `reasoning`, `correct` (boolean), `state`, `grade`

Observed fidelity by type:
- Many unit quizzes have fully populated `answers` with rich `reasoning`, correctness flags, and per-question grades. `score.json` aligns with these.
- `MANDATORY QUIZ` has `answers: {}` (no submissions captured), though questions are present. Expect to treat this as “no ground-truth answers.”
- Unit tests vary:
  - Several tests have comprehensive answers reconstructed (`recovered: true`) from the results page.
  - A minority present partial answer coverage (e.g., a single keyed answer despite multiple questions). These can still be processed using page captures and question images.

### Results and scoring artifacts
- `results.html` typically contains the Canvas "Quiz Results" view, usable for fallback extraction of selected/correct answers and explanations.
- `score.json` includes overall status and marks, e.g. `{ status: "Finished", marks: "12.00/12.00", grade: "10.00 out of 10.00 (100%)" }`.
- When `results.html` is missing, `quiz-full-page.png` and `quiz-overview.png` provide visual context; for tests, `capture-*.html/.png` pairs provide structured/visual snapshots.

Exact file locations (by pattern):
- `<quizDir>/_quiz/quiz-data.json`
- `<quizDir>/_quiz/quiz-page.html` (attempt UI for many quizzes)
- `<quizDir>/_quiz/results.html` (attempt review; answers)
- `<quizDir>/_quiz/score.json` (attempt score summary)
- `<quizDir>/_quiz/question-*.png` (per-question screenshots)
- `<quizDir>/_quiz/{quiz-full-page,quiz-overview,before-submit}.png`
- `<quizDir>/_quiz/capture-*.{html,png}` (primarily tests)
- Siblings: `<quizDir>/page.html`, `page-data.json`, `metadata.json`, `network.json`, `network.log`

### Visual content
- Per-question images are widespread (`question-*.png`); many prompts embed the essential question stem and options within the screenshot rather than text-only HTML.
- Also present and useful: nested `_quiz/_images/*.png` (e.g., figures embedded in HTML), `_quiz/results.png`, `_quiz/quiz-overview.png`, `_quiz/quiz-full-page.png`, `_quiz/before-submit.png`, and page screenshots like `_quiz/page-*-screenshot.png`.
- This favors a multimodal pipeline path: include images alongside text so the model can read the screenshots.

### Suitability for our pipeline
Our pipeline expects an `AiContextEnvelope` with:
- `primaryContent`: string
- `supplementaryContent`: string[]
- `multimodalImageUrls`: string[] (http/https/data)
- `multimodalImagePayloads`: raster payloads (ArrayBuffer + MIME)
- `pdfPayloads`: PDF payloads (ArrayBuffer + name) — attached to Shot 1 as `input_file`

Assessment of fitness:
- **Primary content**: `quiz-page.html` (29/33) is an appropriate primary text source for quizzes. For unit tests that lack this, we can substitute a synthesized primary using `capture-*.html` (if present) or a concatenation of question texts from `quiz-data.json` (stringified) plus a textual summary.
- **Supplementary content**: 
  - Add `results.html` when present (26/33) to reinforce answer keys/explanations.
  - Add `quiz-data.json` (stringified) as supplemental context (33/33) to provide structured options and normalized dropdowns/matching schemas.
  - Optionally include page-level `page.html`/`page-data.json` from the parent lesson for extra semantic context.
- **Images**: 
  - Attach all `_quiz/question-*.png` as `multimodalImagePayloads` for every assessment. No local byte/image caps — we rely on provider-side limits. If the provider rejects due to size, we fail fast with clear diagnostics for an explicit operator decision.
  - Include `quiz-full-page.png`, `quiz-overview.png`, and `before-submit.png` as additional multimodal context where helpful.

How envelopes are consumed (from pipeline code):
- `generateFromEnvelope()`
  - Validates `primaryContent` non-empty.
  - Resolves images via `resolveRasterImages`: accepts `multimodalImageUrls` (http/https/data) and inlines `multimodalImagePayloads` into data URLs. Local size caps were removed; provider limits apply.
  - Shot 1: `createAssessmentShellPrompt(...)` formats unified sections; PDFs in `pdfPayloads` are attached as `input_file` parts; images are provided via `input_image` (URLs) and `input_file` (payloads). The prompt text states: "Raster images are attached as multimodal inputs for vision" (no explicit count).
  - Shot 2: `createInteractionContentPrompt(...)` includes the unified sections and multimodal images (no PDFs attached here by design).
  - Shot 4: Widget generation prompt includes the unified sections plus interaction context and widget mapping (images only).

Implications for Canvas:
- We can set `primaryContent` to the raw HTML of `quiz-page.html` when present; otherwise to combined relevant HTML or a JSON/text summary of `quiz-data.json` for tests without UI HTML.
- We should push rich signals into `supplementaryContent`: the full `results.html` text (if present), stringified `quiz-data.json`, and optionally sibling `page.html` or `page-data.json.html` strings. These will be shown under "Supplementary Content" blocks verbatim to the model.

Widget collection selection:
- The content types are general ELA quiz interactions (MC, dropdown, matching). Use `widgetCollections.all` for maximal type coverage during generation. We do not need a math-specific collection here.

### Data sufficiency conclusions
- For virtually all quizzes and most unit tests, we have sufficient structured and/or visual artifacts to run through the pipeline:
  - Questions and options: present in `quiz-data.json` and/or page HTML.
  - Answer keys: present in `answers` for most quizzes; reconstructable from `results.html` for many tests; absent in edge cases (e.g., `MANDATORY QUIZ`).
  - Visual context: comprehensive `question-*.png` ensures multimodal grounding when HTML is sparse.
- Edge cases to handle:
  - Assessments without `results.html` and with sparse `answers` → rely on images + quiz-page/capture HTML + any embedded hints in JSON.
  - Payload size guardrails for large tests → check aggregate image bytes; compress or limit if above cap.

### Proposed conversion approach (analogous to staar-batch-generate)
For each `_quiz` directory:
1. Identify available artifacts:
   - Preferred primary: `quiz-page.html` content.
   - Fallback primaries: first available of `capture-*.html` (tests) OR a synthesized primary created from:
     - `page-data.json.mainContent.html` (if present) OR `page.html` sibling
     - and/or a textual dump of `quiz-data.json.questions[*]` and choice lists
   - Supplementary: include any of the following that exist:
     - `results.html`
     - `quiz-data.json` (stringified)
     - sibling `page.html` or `page-data.json.mainContent.html`
   - Images: all `question-*.png` plus `quiz-full-page.png`, `quiz-overview.png`, `before-submit.png` (when present).
2. Build `AiContextEnvelope` from these sources.
3. Call `generateFromEnvelope(openai, logger, envelope, widgetCollections.all)`.
4. Persist the structured JSON and compiled QTI XML per assessment, mirroring `scripts/staar-batch-generate.ts` output conventions.

### Exact envelope-building plan (Canvas)
- primaryContent (string, in priority order):
  1) `<quizDir>/_quiz/quiz-page.html` text
  2) If missing: first available `<quizDir>/_quiz/page-*.html` or `<quizDir>/_quiz/capture-*.html` (concatenate if multiple but keep order)
  3) Sibling `<quizDir>/page-data.json.mainContent.html` or `<quizDir>/page.html`
  4) As last resort: a compact textual synthesis of `quiz-data.json` (questions, options)
- supplementaryContent (string[]):
  - If exists: full text of `<quizDir>/_quiz/results.html`
  - Always: JSON.stringify of `<quizDir>/_quiz/quiz-data.json`
  - Optionally: sibling `page.html` (raw) or `page-data.json.mainContent.html` (cleaned)
  - Optionally: include additional attempt context HTML from `<quizDir>/_quiz/page-*.html` or `<quizDir>/_quiz/capture-*.html` when not used as primary
  - Optionally: snippet of `score.json` and any `network.json` summary for provenance
- multimodalImagePayloads (raster):
  - Load and attach all `<quizDir>/_quiz/question-*.png`
  - Also attach: `<quizDir>/_quiz/_images/*.png`, `<quizDir>/_quiz/results.png`, `<quizDir>/_quiz/quiz-overview.png`, `<quizDir>/_quiz/quiz-full-page.png`, `<quizDir>/_quiz/before-submit.png`, and `<quizDir>/_quiz/page-*-screenshot.png` when present
- pdfPayloads (PDFs):
  - Discover relevant `_resources/*.pdf` for the lesson/quiz (title/author/topic keyword matching across `quiz-page.html`, `quiz-data.json`, and `page-data.json.mainContent.*`).
  - Load each matched PDF as `ArrayBuffer` and include it in `pdfPayloads` (Shot 1 only).
  - No local caps; rely on provider limits. On rejection (e.g., payload too large), fail fast with structured logs for explicit operator action.

### Answer availability by source
- Primary: `quiz-data.json.answers` when populated (most quizzes) → direct authoritative key
- Fallback: parse `results.html` (present for 26/33) → the scraper has already done this for some tests (`recovered: true` in `quiz-data.json`)
- If both missing (rare, e.g., `MANDATORY QUIZ`): proceed without ground-truth key; pipeline can still generate interactions from question stems/options

### Ready-to-build summary
- Total assessments to process: 33.
- Strong coverage of both text (HTML/JSON) and images per assessment.
- Answer availability is excellent for quizzes; good and reconstructable for most tests.
- All required inputs for our existing pipeline are present; a new script can be implemented to batch these using the multimodal pathway.


### Answer provenance and resolution strategy

What the dataset contains with respect to "correct answers":
- Many quizzes have authoritative per-question answers in `quiz-data.json.answers` with `correct: true` and detailed `reasoning` (these were derived from an actual attempt where the UI revealed correctness, not always from the site’s canonical key).
- Some entries have `correct: false` (the recorded selection did not match the canonical answer). In other words, the chosen answer is a user/model selection, not the LMS key.
- For many quizzes/tests we also have `_quiz/results.html`, which (when the course/attempt allowed it) displays the correct answer(s). Several `quiz-data.json` files include `"recovered": true` indicating answers were reconstructed from `results.html` automatically.
- For a minority of assessments (e.g., `MANDATORY QUIZ`), we have questions but no authoritative key (no results page with correct answers, and the stored selections may be guessed or incomplete).

Implications:
- We SHOULD NOT blindly trust `quiz-data.json.answers` as ground truth when `correct: false` or answers are missing.
- We CAN recover/confirm most correct answers by parsing `_quiz/results.html` (present in 26/33) and aligning to the `quiz-data.json.questions[*]` options.
- Where no results are available, items should be flagged for human review; do not invent keys.

Recommended pre-analysis and resolution:
1) For each `_quiz`:
   - Prefer authoritative answers from `_quiz/results.html` (parse per-question correct indicator, map to option text).
   - Else, if `quiz-data.json.answers["N"].correct === true`, accept that key.
   - Else, mark the question as `UNKNOWN` and require review.
2) Normalize mapping to QTI choice identifiers:
   - Multiple-choice: match by option text from `quiz-data.json.questions[N].options[*].text` to the generated QTI `choices[*].content` (use normalized text compare).
   - True/False: same as above.
   - Dropdown: map selected `answers[*]` (strings) to `inlineChoiceInteraction` choices by text.
   - Matching: map `matches[*].prompt → answer` to generated `gapMatch`/matching structures by prompt/choice text.
3) If mismatch between recovered key and generated `responseDeclarations.correct`, override the declaration.

Where to extract answers:
- From `quiz-data.json`: `$.answers["N"].answer` (MC), `$.answers["N"].answers[*]` (dropdown), `$.answers["N"].matches[*].answer` (matching) with `$.answers["N"].correct` boolean when present.
- From `results.html`: parse per-question blocks for “Correct answer” indicators and selected option markers; align by visible option text to the JSON options.

Post-generation QA and correction
- The generator returns an object with `responseDeclarations: [{ identifier, cardinality, baseType, correct: [...] }]` and fully realized `interactions`.
- Build a QA step that cross-checks the produced `responseDeclarations[*].correct` against the resolved ground truth above. If differences are detected, update `responseDeclarations[*].correct` accordingly.
- If an answer is `UNKNOWN`, tag the item for manual review instead of fabricating a key. The compiler requires a key; for unknowns, hold the item out of compilation or mark for manual fix before compile.

Manual override ease
- It is straightforward to tweak the final structured JSON after generation:
  - Locate the interaction’s `responseIdentifier` (e.g., `"choice_interaction"`).
  - Update the matching `responseDeclarations` entry’s `correct` array to the intended identifiers (e.g., `["A"]` or `["B","C"]`).
  - Ensure the identifiers exist in the corresponding interaction’s `choices`/`inline choices`.
- This can be automated with a small script that takes a mapping `{ questionNumber → correctChoiceText(s) }`, resolves to identifiers by text match, and updates `responseDeclarations`.

Risk and recommendation
- We are not blocked. Most assessments have enough artifacts to recover the correct keys deterministically.
- Add a pre-analysis “answer resolution” step and a post-generation QA override step. Flag the small remainder (no results + uncertain keys) for human review.
- Including `_quiz/results.html` and stringified `quiz-data.json` in `supplementaryContent` materially improves the model’s accuracy during generation, reducing overrides.

### LLM context-feeding strategy (no pipeline rejiggering)

Goal: Maximize the chance the LLM selects/derives the correct answers using the existing envelope flow (primaryContent/supplementaryContent + multimodal images), while respecting token limits and image caps.

Observed non-quiz resources available:
- PDFs under `_resources/` across lessons/assignments/study guides (28 PDFs found), including:
  - Unit Study Guides (Units 1–5)
  - Canonical readings (e.g., “The Necklace”, “The Cask of Amontillado”, “Mother Tongue by Tan”, “Understanding Comics” excerpts)
- Lesson `page.html` and `page-data.json` per activity
- Sibling screenshots (`screenshot.png`) and per-quiz `_quiz/` screenshots

Strategy per assessment (ordered by benefit vs budget):
1) Primary content:
   - Use `_quiz/quiz-page.html` if present. If absent, use `_quiz/capture-*.html` (tests) or sibling `page-data.json.mainContent.html`.
   - Rationale: Directly contains the question stems/options context in the LMS rendering.
2) Supplementary content (high yield, low cost):
   - Always include stringified `_quiz/quiz-data.json` (questions/options normalized; helps robust mapping).
   - Include `_quiz/results.html` when present (authoritative answer context; improves reasoning and reduces hallucination).
   - Include sibling `page-data.json.mainContent.html` when it contains definitions/background relevant to the quiz topic (short, structured HTML rather than entire site HTML).
3) Images (vision context):
   - Attach ALL `_quiz/question-*.png` for every assessment. No pre-trimming.
   - Also attach `_quiz/quiz-overview.png`, `_quiz/quiz-full-page.png`, and `_quiz/before-submit.png` when present.
4) Extended context (aggressive mode):
  - For quizzes referencing specific readings, attach the reading PDFs from `_resources/*.pdf` via `pdfPayloads` so the model can read the document in Shot 1.
  - We do not extract PDF text by default; optionally include short excerpts in `supplementaryContent` only if separately available.
  - Linkage: detect references by title/author keywords in `quiz-page.html`, `quiz-data.json.questions[*].questionText`, and sibling `page-data.json.mainContent.text` to select the correct `_resources/*.pdf`.

Token approach:
- Favor maximal relevant context. Include all per-question images and attach directly referenced readings as PDFs (Shot 1).
- Prefer `page-data.json.mainContent.html` over raw `page.html` when both exist (cleaner text) but include both if helpful.

Exclusions for model input (kept for provenance only):
- `_videos/*.webm`, `quiz-data.json.backup`, `network.json`, `network.log`, `metadata.json`.

Why not “entire course content”?
- We include everything directly relevant: the quiz UI, normalized JSON, results, the lesson page, and the full text of the referenced readings. Including unrelated units/pages adds noise without improving accuracy.

Outcome:
- Pipeline unchanged. We enrich the envelope aggressively: quiz UI, normalized JSON, results, lesson page, ALL question images, and FULL referenced readings. `formatUnifiedContextSections` already surfaces these to the model.

