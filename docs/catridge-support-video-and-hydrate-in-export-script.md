Title, Overview, Goals, Non-Goals:

**Title:** Course Cartridge Video Support & YouTube Metadata Hydration

**Overview:** Introduce first-class `video` resources into the cartridge schema and export pipeline, automatically extracting YouTube embeds from the post-processed stimulus HTML emitted by `scripts/canvas-stimulus-generate.ts`, hydrating their metadata (title, description, duration) via RapidAPI, and emitting sanitized article HTML plus standalone video JSON. Update downstream helpers, validation, and tests so OneRoster conversion can achieve parity with hardcoded XP/video handling.

**Goals:**
- Detect embedded YouTube iframes during stimulus generation (operating solely on the sanitized HTML produced by `src/stimulus/`), remove them from article HTML, and persist ordered video manifests per lesson.
- Extend cartridge schemas, types, and builders to package videos in `lesson.json` and serialize structured metadata files under `videos/`.
- Hydrate required metadata (title, description, duration) from RapidAPI using a reusable TypeScript client that reads credentials from `.env.local`.
- Update the export script to stage video metadata files and maintain resource ordering.
- Enhance verification/tests to prevent regressions (e.g., orphaned iframes, missing metadata, incorrect ordering).

**Non-Goals:**
- Fetch or cache actual video media assets or transcripts not already available on disk.
- Modify OneRoster generation/converter beyond documenting the required downstream changes.
- Support non-YouTube providers; fail fast when the iframe is not a YouTube embed.
- Rework front-end lesson rendering or XP calculation logic in this repository.

Files Changed:

>>>> .env.example
Add documentation-only entry so developers know to populate `RAPIDAPI_YOUTUBE_KEY` for local runs (do not commit real values). Mention that the export script reads from `.env.local`.

>>>> src/stimulus/types.ts
- Extend `StimulusBuildResult` with a new `videos: ExtractedVideo[]` property.
- Introduce `ExtractedVideo` type capturing `order`, `youtubeId`, optional `titleHint`, and optional `contextHtml`. `titleHint` stores short inline text preceding the iframe when available (e.g., `<strong>Video:</strong>` labels), but is optional because many embeds appear without nearby captions; `contextHtml` captures a longer HTML snippet when present.

Relevant additions:
```ts
export type ExtractedVideo = {
  order: number
  youtubeId: string
  titleHint?: string
  contextHtml?: string
}

export interface StimulusBuildResult {
  html: string
  issues: StimulusIssue[]
  assets: StimulusAsset[]
  videos: ExtractedVideo[]
}
```

>>>> src/stimulus/video-extractor.ts (new)
Implement DOM traversal utilities that collect YouTube embeds:
- Parse `<iframe>` elements, extract `youtubeId` with a strict regex, gather surrounding heading/paragraph HTML as contextual hints, remove the iframe entirely so the sanitized article contains no embed markup, and note its document order.
- Return ordered `ExtractedVideo[]` and mutate the DOM in place so serialized HTML is iframe-free without injecting replacement nodes.

Key outline:
```ts
export function extractYouTubeVideos(root: Element): ExtractedVideo[] {
  const found: ExtractedVideo[] = []
  for (const iframe of Array.from(root.querySelectorAll("iframe"))) {
    const srcAttr = iframe.getAttribute("src")
    if (typeof srcAttr !== "string") {
      continue
    }
    if (srcAttr.length === 0) {
      continue
    }
    const match = parseYoutubeId(srcAttr)
    if (!match) {
      continue
    }
    const order = computeDocumentOrder(iframe)
    const context = collectContextHtml(iframe)
    iframe.remove()
    const entry: ExtractedVideo = { order, youtubeId: match }
    if (context !== undefined) entry.contextHtml = context
    found.push(entry)
  }
  return found.sort((a, b) => a.order - b.order)
}
```

>>>> src/stimulus/builder.ts
- Invoke the new extractor before serialization, capture `videos`, and pass along with the sanitized/normalized HTML.
- Ensure stimulus issues list includes extractor warnings (e.g., malformed URLs).

Relevant edit:
```ts
const videoManifests = extractYouTubeVideos(root)
const html = serializeArticle(root)
return {
  html,
  issues: [...issues, ...validationIssues],
  assets,
  videos: videoManifests
}
```

>>>> scripts/canvas-stimulus-generate.ts
- Serialize `videos.json` alongside `stimulus.html` for each page, containing the ordered extractor output.
- Add Zod schema `DetectedVideoSchema` mirroring `ExtractedVideo`.
- Ensure empty arrays are written when no videos are present, so downstream logic can rely on file existence.

Relevant write block:
```ts
await Bun.write(path.join(outDir, "videos.json"), JSON.stringify(videoData, null, 2))
```

>>>> scripts/lib/youtube-metadata.ts (new)
Create a focused RapidAPI client:
- Read `RAPIDAPI_YOUTUBE_KEY` from `process.env`, loading `.env.local` via `dotenv/config` if not already loaded by Bun.
- Expose `fetchYoutubeMetadata(videoId: string): Promise<YoutubeMetadata>` returning strongly typed fields (`title`, `description`, `durationSeconds`).
- Normalize duration by parsing `video_length` as integer seconds; throw descriptive errors for missing fields or non-200 responses.

Snippet:
```ts
export async function fetchYoutubeMetadata(videoId: string): Promise<YoutubeMetadata> {
  const apiKey = getEnvOrThrow("RAPIDAPI_YOUTUBE_KEY")
  const url = new URL("https://youtube-v2.p.rapidapi.com/video/details")
  url.searchParams.set("video_id", videoId)
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": "youtube-v2.p.rapidapi.com"
    }
  })
  if (!res.ok) throw errors.new(`YouTube metadata fetch failed (${res.status})`)
  const payload = (await res.json()) as YoutubeRapidApiResponse
  if (typeof payload.title !== "string") {
    throw errors.new("YouTube metadata missing title")
  }
  if (payload.title.trim().length === 0) {
    throw errors.new("YouTube metadata missing title")
  }
  if (typeof payload.description !== "string") {
    throw errors.new("YouTube metadata missing description")
  }
  if (payload.description.trim().length === 0) {
    throw errors.new("YouTube metadata missing description")
  }
  const duration = parseDuration(payload.video_length)
  return {
    title: payload.title,
    description: payload.description,
    durationSeconds: duration
  }
}
```

>>>> scripts/canvas-package-export.ts
- Load `.env.local` on startup if present (`import "dotenv/config"` near top).
- Extend `collectStimulus()` to read `videos.json` for each page, validate with Zod, and attach to page records.
- After building the hierarchy, iterate videos per lesson:
  - Call `fetchYoutubeMetadata` for each YouTube ID (with deduplicated caching).
  - Compute cartridge video IDs (`${lessonId}-video-${index}`) and derive slugs via slugifier on the ID.
  - Write metadata JSON under `videos/{unitSlug}/${lessonSlug}/${videoId}.json`, including fields: `id`, `type`, `title` (from API), `slug` (derived), `path`, `youtubeId`, `durationSeconds`, `description`.
  - Insert `video` resources into lesson resource arrays with consistent ordering relative to articles/quizzes.
- Update file map/integrity handling so video metadata files are included.
- Guard with clear logging/failures when metadata fetch fails or required fields missing.

Relevant addition:
```ts
const videoMeta = await youtubeMetadataCache.get(video.youtubeId)
lesson.resources.push({
  id: videoId,
  title: videoMeta.title,
  type: "video",
  slug,
  path: metaPath,
  youtubeId: video.youtubeId,
  durationSeconds: videoMeta.durationSeconds,
  description: videoMeta.description
})
fileMap[metaPath] = writeTempJson(metaPath, { ...videoMetaPayload })
```

>>>> src/cartridge/schema.ts
- Introduce `ResourceVideoSchema` with required fields (`id`, `title`, `slug`, `type`, `path`, `youtubeId`, `durationSeconds`, `description`).
- Extend the `ResourceSchema` discriminated union to include `video`.
- Update any accompanying derived schemas if needed.

Snippet:
```ts
export const ResourceVideoSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  type: z.literal("video"),
  path: z.string(),
  youtubeId: z.string(),
  durationSeconds: z.number().int().positive(),
  description: z.string()
}).strict()

export const ResourceSchema = z.discriminatedUnion("type", [
  ResourceArticleSchema,
  ResourceQuizSchema,
  ResourceVideoSchema
])
```

>>>> src/cartridge/types.ts
- Mirror schema changes with `ResourceVideo` and `VideoMetadata` types.
- Update `Resource` and `Lesson.resources` unions accordingly.

Snippet:
```ts
export type ResourceVideo = {
  id: string
  title: string
  slug: string
  type: "video"
  path: string
  youtubeId: string
  durationSeconds: number
  description: string
}

export type Resource = ResourceArticle | ResourceQuiz | ResourceVideo
```

>>>> src/cartridge/build/builder.ts
- Update `requiredPaths` calculation to include `video.path`.
- Ensure lesson serialization writes the new discriminant without stripping fields.
- Include video metadata files when computing integrity hashes.
- Maintain ordering logic via resource `order` values computed in the export script (strip `order` before validation).

Relevant diff:
```ts
if (r.type === "video") requiredPaths.add(r.path)
```

>>>> src/cartridge/client.ts
- Add TypeScript guards for `ResourceVideo` and new helper `readVideoMetadata`.
- Update async iterators to return `Resource` union containing videos seamlessly.

Example:
```ts
export function isVideoResource(res: Resource): res is ResourceVideo {
  return res.type === "video"
}

export async function readVideoMetadata(reader: CartridgeReader, res: ResourceVideo) {
  const text = await reader.readText(res.path)
  return JSON.parse(text) as ResourceVideo
}
```
>>>> src/cartridge/README.md
- Document the new `videos/` directory structure, schema fields, and expectations for metadata JSON.
- Add guidance on RapidAPI hydration and integrity checks.

>>>> scripts/cartridge-verify.ts
- Extend validation to assert lessons with `video` resources have real files, schema-valid JSON, and that corresponding article HTML has no iframe tags.
- Emit actionable error messages if metadata is missing/invalid.

Snippet:
```ts
if (resource.type === "video") {
  const meta = await readJson(resource.path)
  const parsed = ResourceVideoSchema.safeParse(meta)
  if (!parsed.success) issues.push(/* ... */)
}
```

>>>> tests/stimulus/video-extractor.test.ts (new)
Unit tests covering:
- Extraction of multiple videos with correct ordering after removing embed nodes.
- Handling of malformed/non-YouTube iframes (ensure they remain in HTML and raise issues).

>>>> tests/scripts/canvas-package-export.video.test.ts (new)
- Fixture-based test ensuring the export script writes expected `video` resource entries, fetches metadata (mock RapidAPI), and preserves ordering/XP inputs.
- Use dependency injection or module mocking to stub `fetchYoutubeMetadata`.

>>>> docs/stimulus-woes.md
Update troubleshooting guidance:
- Add section on video hydration flow, RapidAPI prerequisites, and common failure modes (missing key, non-YouTube embeds).
- Note new verification checks for stray iframes.

>>>> package.json
- Add lightweight script `bun run validate:videos` (invokes stimulus + export + verify in sequence).
- Ensure no new runtime dependencies are required; rely on global `fetch`.

Commit message: `feat: surface cartridge videos with hydrated metadata`
