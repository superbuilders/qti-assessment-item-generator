# Course Cartridge System

A strictly validated, integrity-checked packaging system for course content and assessments.

## Philosophy

**Write-time validation, read-time trust.** All JSON is Zod-validated during packaging; cartridges are checksummed; reads validate integrity once at open, then trust the data structure without re-validating schemas.

## Data Model

```
Cartridge (tar.bz2 archive)
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

- **Index**: Root manifest listing all units
- **Unit**: Contains lessons and optional unit test
- **Lesson**: Contains resources (articles and/or quizzes)
- **Resource**: Either an article (HTML stimulus) or a quiz (collection of questions)

## Building a Cartridge (In-Memory)

Use the builder to validate and produce a tar.bz2 without temp files.

```ts
import { buildCartridgeToFile, buildCartridgeToBytes, type CartridgeBuildInput } from "@/cartridge/build/builder"

const input: CartridgeBuildInput = {
  generator: { name: "qti-assessment-item-generator", version: "1.0.0" },
  units: [
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
await buildCartridgeToFile(input, "./course-cartridge-v1.tar.bz2")

// OR get bytes directly
const bytes = await buildCartridgeToBytes(input)
```

### Guarantees
- Zod-validated writes for `lesson.json`, `unit.json`, and `index.json` (strict: unexpected fields are rejected)
- Integrity manifest generated in-memory and included as `integrity.json`
- No temp files or directory staging necessary

## Reading a Cartridge

### Opening

```ts
import { openCartridgeTarBz2 } from "@/cartridge/readers/tarbz2"

const reader = await openCartridgeTarBz2("./course-cartridge-v1.tar.bz2")
```

Integrity is validated on open; subsequent reads trust shapes and only JSON.parse is used (no Zod at read-time).

### Iteration helpers

```ts
import { iterUnits, iterUnitLessons, iterLessonResources } from "@/cartridge/client"
```

## Types and Schemas

- Types: `@/cartridge/types`
- Schemas: `@/cartridge/schema`

## Design Principles

1. Single format: tar.bz2 only
2. No fallbacks: missing or invalid data fails immediately
3. Strict validation on write; checksum validation on open
4. Fast, simple reads post-open

## Migration Notes

- Removed directory reader and file-based helper APIs
- Replaced packaging script to build directly from in-memory inputs

