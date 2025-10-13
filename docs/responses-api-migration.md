## Migrate to Responses API — 80/20 Porting Guide

### Scope
Replace all Chat Completions usage with the Responses API across shots 1/2/4, adopt multi-part inputs (input_text, image_url, input_file), and standardize envelope-driven multimodal inputs (images + PDFs). Keep pipeline structure intact.

### TL;DR (do just this)
- Replace `openai.chat.completions.create(...)` with `client.responses.create(...)` in shots 1/2/4.
- Build `input` as an array of role messages with multi-part `content` (input_text, image_url, input_file).
- Use `instructions` for system behavior (what used to be the system message).
- Continue using Structured Outputs with `response_format: { type: "json_schema", json_schema: { name, schema, strict } }`.
- Envelope inputs:
  - Images: include all `multimodalImageUrls` as `image_url` parts; include all `multimodalImagePayloads` as `input_file` parts (base64-encoded internally).
  - PDFs: include `pdfPayloads` as `input_file` parts in Shot 1 only (shell). Do NOT attach PDFs in shots 2 and 4 by default.
- Parse model JSON from `response.output` (or use SDK `response.output_text` then JSON.parse when applicable).

---

### Key diffs vs Chat Completions
- `instructions` replaces the system message.
- `input` supports mixed content parts in one message (input_text, image_url, input_file).
- Structured Outputs unchanged; Responses is the forward path.

---

### Envelope policy (simple)

- Images
  - URLs → pass as `{ type: "image_url", image_url: { url, detail: "high" } }` content parts
  - Payloads (raw bytes) → base64 → `data:${mime};base64,${...}` → pass as `{ type: "input_file", filename, file_data }`
- PDFs
  - Payloads (raw bytes) only (implicit application/pdf) → base64 → `data:application/pdf;base64,...` → pass as `{ type: "input_file", filename, file_data }`
  - Attach PDFs in Shot 1 (shell) only by default

Rationale: keep Shot 1 as the authoritative context assembly (question UI + readings). Shots 2/4 operate with deterministic shell + images and do not need the full readings again.

---

### Shot templates

Below are generalized templates for Responses API calls per shot. Replace the schema builders and prompt functions with your existing ones.

#### Shot 1 — Assessment Shell
```ts
const { systemInstruction, userContent } = createAssessmentShellPrompt(envelope, imageContext, collection)
const ShellSchema = createAssessmentItemShellSchema(collection.widgetTypeKeys)
const jsonSchema = toJSONSchemaPromptSafe(ShellSchema)

const contentParts: any[] = []
contentParts.push({ type: "input_text", text: userContent })

// image URLs
for (const url of imageContext.imageUrls) {
  contentParts.push({ type: "image_url", image_url: { url, detail: "high" } })
}

// image payloads → base64 input_file
for (const img of envelope.multimodalImagePayloads) {
  const base64 = Buffer.from(img.data).toString("base64")
  contentParts.push({
    type: "input_file",
    filename: `image.${img.mimeType.split('/')[1]}`,
    file_data: `data:${img.mimeType};base64,${base64}`
  })
}

// PDF payloads (Shot 1 only)
for (const pdf of envelope.pdfPayloads) {
  const base64 = Buffer.from(pdf.data).toString("base64")
  const fname = pdf.name.endsWith(".pdf") ? pdf.name : `${pdf.name}.pdf`
  contentParts.push({ type: "input_file", filename: fname, file_data: `data:application/pdf;base64,${base64}` })
}

const response = await client.responses.create({
  model: OPENAI_MODEL,
  instructions: systemInstruction,
  input: [ { role: "user", content: contentParts } ],
  response_format: { type: "json_schema", json_schema: { name: "assessment_shell_generator", schema: jsonSchema, strict: true } }
})

// Extract JSON
const text = response.output_text // or aggregate from response.output
const parsed = JSON.parse(text)
const validated = ShellSchema.safeParse(parsed)
if (!validated.success) throw errors.wrap(validated.error, "shell validation")
```

#### Shot 2 — Interaction Content
```ts
const { systemInstruction, userContent } = createInteractionContentPrompt(envelope, assessmentShell, imageContext, collection)
const AnyInteraction = createAnyInteractionSchema(collection.widgetTypeKeys)
const InteractionSchema = z.record(z.string(), AnyInteraction)
const jsonSchema = toJSONSchemaPromptSafe(InteractionSchema)

const parts: any[] = []
parts.push({ type: "input_text", text: userContent })
for (const url of imageContext.imageUrls) parts.push({ type: "image_url", image_url: { url, detail: "high" } })
for (const img of envelope.multimodalImagePayloads) {
  const base64 = Buffer.from(img.data).toString("base64")
  parts.push({ type: "input_file", filename: `image.${img.mimeType.split('/')[1]}`, file_data: `data:${img.mimeType};base64,${base64}` })
}
// NOTE: PDFs NOT attached in Shot 2 by default

const resp = await client.responses.create({
  model: OPENAI_MODEL,
  instructions: systemInstruction,
  input: [ { role: "user", content: parts } ],
  response_format: { type: "json_schema", json_schema: { name: "interaction_content_generator", schema: jsonSchema, strict: true } }
})

const text = resp.output_text
const parsed = JSON.parse(text)
const validated = InteractionSchema.safeParse(parsed)
if (!validated.success) throw errors.wrap(validated.error, "interaction validation")
```

#### Shot 4 — Widget Content
```ts
const { systemInstruction, userContent } = createWidgetContentPrompt(envelope, assessmentShell, widgetMapping, generatedInteractions, collection, imageContext)
const WidgetCollectionSchema = z.record(z.string(), WidgetSchema)
const jsonSchema = toJSONSchemaPromptSafe(WidgetCollectionSchema)

const parts: any[] = []
parts.push({ type: "input_text", text: userContent })
for (const url of imageContext.imageUrls) parts.push({ type: "image_url", image_url: { url, detail: "high" } })
for (const img of envelope.multimodalImagePayloads) {
  const base64 = Buffer.from(img.data).toString("base64")
  parts.push({ type: "input_file", filename: `image.${img.mimeType.split('/')[1]}`, file_data: `data:${img.mimeType};base64,${base64}` })
}
// NOTE: PDFs NOT attached in Shot 4 by default

const resp = await client.responses.create({
  model: OPENAI_MODEL,
  instructions: systemInstruction,
  input: [ { role: "user", content: parts } ],
  response_format: { type: "json_schema", json_schema: { name: "widget_content_generator", schema: jsonSchema, strict: true } }
})

const text = resp.output_text
const parsed = JSON.parse(text)
const validated = WidgetCollectionSchema.safeParse(parsed)
if (!validated.success) throw errors.wrap(validated.error, "widget validation")
```

---

### Structured Outputs (unchanged)
Keep `response_format: { type: "json_schema", json_schema: { name, schema, strict } }` and parse `response.output_text`, then Zod-validate.

---

### Roles & instructions
Use `instructions` for system-level guidance. Put unified context in the `user` message’s `input_text` part.

---

### PDFs in shots — simple rule

- Shot 1 (shell): attach all referenced readings via `pdfPayloads` (raw bytes) as `input_file` parts.
- Shots 2/4: do not attach PDFs by default; rely on shell structure + images for deterministic content generation.

---

### Testing
1) Port Shot 1; validate schema on a sample.
2) Port Shot 2; validate interactions.
3) Port Shot 4; validate widgets.

---

### Limits & models
- Use a vision-capable model. Provider extracts text + page images from PDFs.
- If a request is too large, split PDFs or reduce non-essential images.


