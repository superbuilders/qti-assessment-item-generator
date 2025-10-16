# Course Cartridge System

A strictly validated, integrity-checked packaging system for course content and assessments.

## Philosophy

**Write-time validation, read-time trust.** All JSON is Zod-validated during packaging; cartridges are checksummed; reads validate integrity once at open, then trust the data structure without re-validating schemas.

## Data Model

```
Cartridge (tar.zst archive)
├── index.json              # Top-level manifest (version 1)
├── integrity.json          # SHA-256 checksums for all files
├── units/
│   └── unit-{id}.json      # Unit metadata + lesson refs
├── lessons/
│   └── unit-{id}/
│       └── lesson-{id}.json  # Lesson metadata + resource refs
├── content/
│   └── {group}/{slug}/
│       └── stimulus.html   # Article content
├── quizzes/
│   └── quiz-{unit}-{lesson}/
│       ├── question-{nn}.xml
│       └── question-{nn}-structured.json
└── tests/
    └── unit-{n}-test/
        ├── question-{nn}.xml
        └── question-{nn}-structured.json
```

### Hierarchy

- **Index**: Root manifest listing all units and required course metadata
- **Unit**: Contains lessons and optional unit test
- **Lesson**: Contains resources (articles and/or quizzes)
- **Resource**: Either an article (HTML stimulus) or a quiz (collection of questions)

## Building a Cartridge (In-Memory)

Use the builder to validate and produce a tar.zst without temp files.

```ts
import { buildCartridgeToFile, buildCartridgeToBytes, type CartridgeBuildInput } from "@/cartridge/build/builder"

const input: CartridgeBuildInput = {
  generator: { name: "qti-assessment-item-generator", version: "1.0.0" },
  course: { title: "English 09, Part 1", subject: "English" },
  units: [
    {
      id: "unit-1",
      unitNumber: 1,
      title: "Unit 1- Short Fiction - Literary Elements",
      lessons: [
        {
          id: "lesson-1-1",
          unitId: "unit-1",
          lessonNumber: 1,
          title: "1.1 Plot Structure",
          resources: [
            { id: "article-intro", type: "article", path: "content/unit-1--short-fiction---literary-elements/1-1-plot-structure/stimulus.html" },
            {
              id: "quiz-1-1",
              type: "quiz",
              path: "quizzes/quiz-1-1",
              questionCount: 2,
              questions: [
                { number: 1, xml: "quizzes/quiz-1-1/question-01.xml", json: "quizzes/quiz-1-1/question-01-structured.json" },
                { number: 2, xml: "quizzes/quiz-1-1/question-02.xml", json: "quizzes/quiz-1-1/question-02-structured.json" }
              ]
            }
          ]
        }
      ]
    }
  ],
  files: {
    "content/unit-1/intro/stimulus.html": new TextEncoder().encode("<html>...</html>"),
    "quizzes/quiz-1-1/question-01.xml": new TextEncoder().encode("<assessmentItem>...</assessmentItem>"),
    "quizzes/quiz-1-1/question-01-structured.json": new TextEncoder().encode("{\"a\":1}"),
    "quizzes/quiz-1-1/question-02.xml": new TextEncoder().encode("<assessmentItem>...</assessmentItem>"),
    "quizzes/quiz-1-1/question-02-structured.json": new TextEncoder().encode("{\"b\":2}")
  }
}

// Write to file atomically
await buildCartridgeToFile(input, "./course-cartridge-v1.tar.zst")

// OR get bytes directly
const bytes = await buildCartridgeToBytes(input)
```

### Guarantees
- Zod-validated writes for `lesson.json`, `unit.json`, and `index.json` (strict: unexpected fields are rejected)
- Integrity manifest generated in-memory and included as `integrity.json`
- No temp files or directory staging necessary
- Deterministic ordering enforced via required `unitNumber` and `lessonNumber`
- Required fields: `Lesson.title`, `Lesson.lessonNumber`, `Unit.title`, `Unit.unitNumber`, `Unit.counts`, `IndexV1.generator`, `IndexV1.course`

## Reading a Cartridge

### Opening

```ts
import { openCartridgeTarZst } from "@/cartridge/readers/tarzst"

const reader = await openCartridgeTarZst("./course-cartridge-v1.tar.zst")
```

Integrity is validated on open; subsequent reads trust shapes and only JSON.parse is used (no Zod at read-time).

### Iteration helpers

```ts
import {
  iterUnits,
  iterUnitLessons,
  iterLessonResources,
  readArticleContent,
  readQuestionXml,
  readQuestionJson
} from "@/cartridge/client"

for await (const unit of iterUnits(reader)) {
  for await (const lesson of iterUnitLessons(reader, unit)) {
    for await (const resource of iterLessonResources(reader, lesson)) {
      // ...
    }
  }
}

// On-demand helpers
const html = await readArticleContent(reader, "content/unit-1/intro/stimulus.html")
const xml = await readQuestionXml(reader, "quizzes/quiz-1-1/question-01.xml")
const json = await readQuestionJson(reader, "quizzes/quiz-1-1/question-01-structured.json")
```

## Building a Cartridge (From Disk File Map)

If your content already exists on disk, use the file map builder to stream files into a cartridge without loading them all into memory:

```ts
import { buildCartridgeFromFileMap, type GeneratorInfo, type BuildUnit } from "@/cartridge/build/builder"

const generator: GeneratorInfo = { name: "qti-assessment-item-generator", version: "1.0.0" }

const units: BuildUnit[] = [
  {
    id: "unit-1",
    unitNumber: 1,
    title: "Unit 1",
    lessons: [
      {
        id: "lesson-1-1",
        unitId: "unit-1",
        lessonNumber: 1,
        title: "Introduction to Fractions",
        resources: [
          { id: "article-intro", type: "article", path: "content/unit-1/intro/stimulus.html" },
          {
            id: "quiz-1-1",
            type: "quiz",
            path: "quizzes/quiz-1-1",
            questionCount: 2,
            questions: [
              { number: 1, xml: "quizzes/quiz-1-1/question-01.xml", json: "quizzes/quiz-1-1/question-01-structured.json" },
              { number: 2, xml: "quizzes/quiz-1-1/question-02.xml", json: "quizzes/quiz-1-1/question-02-structured.json" }
            ]
          }
        ]
      }
    ]
  }
]

// Absolute source file paths → cartridge-relative destination paths (POSIX)
const files = {
  "content/unit-1/intro/stimulus.html": "/abs/content/unit-1/intro/stimulus.html",
  "quizzes/quiz-1-1/question-01.xml": "/abs/quizzes/quiz-1-1/question-01.xml",
  "quizzes/quiz-1-1/question-01-structured.json": "/abs/quizzes/quiz-1-1/question-01-structured.json",
  "quizzes/quiz-1-1/question-02.xml": "/abs/quizzes/quiz-1-1/question-02.xml",
  "quizzes/quiz-1-1/question-02-structured.json": "/abs/quizzes/quiz-1-1/question-02-structured.json"
}

await buildCartridgeFromFileMap({ generator, course: { title: "English 09, Part 1", subject: "English" }, units, files }, "./course-cartridge-v1.tar.zst")
```

### Validation and Path Rules

- All JSON entries (`index.json`, `units/*.json`, `lessons/*/*.json`) are strictly validated with Zod at write time.
- `files` must be a complete set: every referenced path in lessons/resources must exist in `files`, and there must be no extras.
- Cartridge paths are POSIX relative (no leading `/`, no `\\`); use forward slashes.
- Integrity is computed for every file and saved to `integrity.json` (sha256 + size). Integrity is verified on open.

## API Reference

### Creation (write-time)

- `buildCartridgeToBytes(input: CartridgeBuildInput): Promise<Uint8Array>`
- `buildCartridgeToFile(input: CartridgeBuildInput, outFile: string): Promise<void>`
- `buildCartridgeFromFileMap(plan: { generator: GeneratorInfo; units: BuildUnit[]; files: CartridgeFileMap }, outFile: string): Promise<void>`
- Types: `GeneratorInfo`, `CartridgeBuildInput`, `BuildUnit`, `CartridgeFileMap`

### Reading (read-time)

- `openCartridgeTarZst(path: string): Promise<CartridgeReader>`
- `createTarZstReader(path: string): Promise<CartridgeReader>` (no integrity check)
- `validateIntegrity(reader: CartridgeReader): Promise<{ ok: boolean; issues: { path: string; reason: string }[] }>`
- Iteration helpers: `iterUnits(reader)`, `iterUnitLessons(reader, unit)`, `iterLessonResources(reader, lesson)`
- Direct content: `readIndex`, `readUnit`, `readLesson`, `readArticleContent`, `readQuestionXml`, `readQuestionJson`
- Types: `CartridgeReader`, plus `IndexV1`, `Unit`, `Lesson`, `Resource` in `@/cartridge/types`

## Types and Schemas

- Types: `@/cartridge/types`
- Schemas: `@/cartridge/schema`

## Design Principles

1. Single format: tar.zst only
2. No fallbacks: missing or invalid data fails immediately
3. Strict validation on write; checksum validation on open
4. Fast, simple reads post-open

## Migration Notes

- Removed directory reader and file-based helper APIs
- Replaced packaging script to build directly from in-memory inputs

