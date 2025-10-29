# Event-Driven Template Generation Platform Proposal

## Why We Are Moving Beyond the Demo
- **Current state**: `packages/lib/src/templates` is a CLI-driven proof of concept that shells out to OpenAI, performs in-process type checking, and writes files locally. There is no persistent state, no API surface, and error handling is limited to log output.
- **Future requirements**: We want a hosted service capable of orchestrating deterministic template generation, replaying attempts, persisting artifacts, and exposing progress/program status to clients (internal UI, async job monitors, etc.).
- **Solution direction**: Migrate from an ad-hoc CLI to an event-driven architecture backed by Inngest and a Hono-powered API, with Postgres providing persistence. Target deployment is Vercel, keeping us close to edge-friendly runtime constraints while still supporting serverless workloads.

## Target Architecture Overview
- **Hono API (`packages/app/src`)**  
  - Serves as the primary HTTP interface, deployed to Vercel’s Edge (or Node) runtime.  
  - Mounts `Inngest` via the official `inngest/hono` adapter to expose `/api/inngest` for function execution and event ingestion.  
  - Exposes additional REST endpoints (e.g., `POST /api/templates` to request a generation, `GET /api/templates/:id` to poll status, `GET /api/templates/:id/artifacts` to fetch outputs).

- **Inngest Event Bus**  
  - Owns orchestration of long-running template generation via declarative functions.  
  - Encodes each generation attempt as a state machine: ingestion → prompt assembly → LLM call → validation → persistence → notifications.  
  - Provides built-in retries, step-level idempotency, and visibility (timeline, logs) for every run.

- **Postgres (cloud-hosted)**  
  - Stores structured items, generation runs, iteration diagnostics, final templates, and audit logs.  
  - Enables querying history, re-running with different seeds, or correlating failures.  
  - Suggested hosted options compatible with Vercel: [Neon](https://neon.tech/), [Supabase](https://supabase.com/), or Vercel Postgres.

- **OpenAI + Validation Services**  
  - OpenAI access remains via server-side API calls triggered from Inngest functions.  
  - TypeScript validation uses the existing `typeCheckSource` helper; we’ll adapt it for an isolated runtime (likely Bun or `tsx` in a serverless context).  
  - Additional compliance checks (widget validation, no `!`/`as`, etc.) run as Inngest steps.

### High-Level Flow
1. Client submits a structured QTI item via Hono endpoint.  
2. API validates the structured item, inserts a `generation_requests` row, emits `template/requested` event to Inngest.  
3. Inngest function `template.generate` pulls request data, builds prompts, calls OpenAI, persists attempt metadata, and loops until success or exhaustion.  
4. Each iteration emits sub-events (e.g., `template/iteration.completed`) for observability and optional downstream consumers (notifications, dashboards).  
5. Successful completion writes the final template (and artifacts) to Postgres/object storage and emits `template/completed`. Failures emit `template/failed`.


## Proposed Project Layout
```
packages/
  app/
    src/
      index.ts          # Hono entrypoint (exported from Vercel)
      routes/
        templates.ts    # REST endpoints (create request, fetch status, stream artifacts)
      middleware/
        bindings.ts     # Hono bindings middleware for env vars (optional)
      inngest/
        client.ts       # Shared Inngest client (id, schemas, middleware)
        functions/
          template-generate.ts
          template-iteration.ts
          record-artifact.ts
          post-success.ts
      db/
        schema.sql      # Postgres schema (see below)
        migrations/     # (Using drizzle-kit, kysely, prisma, or plain SQL)
  lib/
    src/
      cartridge/
      compiler/
      core/
      examples/
      qti-validation/
      stimulus/
      structured/
      templates/
      testing/
      utils/
      widgets/
```

All existing modules under `src/` shift into `packages/lib/src/…` to keep the application surface (`packages/app/src`) distinct from reusable libraries.

### Hono + Inngest bootstrap (`packages/app/src/index.ts`)
```ts
import { Hono } from "hono";
import { serve } from "inngest/hono";
import { functions, inngest } from "./inngest";

const app = new Hono();

app.on(["GET", "PUT", "POST"], "/api/inngest", serve({ client: inngest, functions }));

export default app;
```

- Additional routes attach via `app.route("/api/templates", templatesRouter)` or similar.  
- Include bindings middleware to bridge Wrangler/Vercel runtime env variables into handlers so Inngest functions receive `ctx.env` (e.g., `DATABASE_URL`, `OPENAI_API_KEY`, `INNGEST_EVENT_KEY`).

### Inngest Client (`packages/app/src/inngest/client.ts`)
```ts
import { EventSchemas, Inngest } from "inngest";
import { z } from "zod";

export const inngest = new Inngest({
  id: "template-orchestrator",
  schemas: new EventSchemas().fromSchema({
    "template/requested": z.object({
      requestId: z.string().uuid(),
      seed: z.string().regex(/^\d+$/, "seed must be a decimal string"), // bigint serialized for transport
      structuredItem: z
        .object({
          widgets: z
            .record(z.object({ type: z.string() }).nullable())
            .nullable()
            .optional(),
        })
        .passthrough(),
      allowedWidgets: z
        .array(z.string())
        .max(1, "at most one widget type may be specified"),
      sourceContext: z.string().min(2), // prettified JSON string
      debugArtifacts: z.boolean().optional(),
    }),
    "template/iteration.completed": z.object({
      requestId: z.string().uuid(),
      iteration: z.number().int().positive(),
      status: z.enum(["success", "typecheck_failed", "validation_failed"]),
      diagnostics: z.array(
        z.object({
          message: z.string(),
          tsCode: z.number(),
          line: z.number(),
          column: z.number(),
        })
      ),
    }),
    "template/completed": z.object({
      requestId: z.string().uuid(),
      iterations: z.number().int().positive(),
      templatePath: z.string(),
    }),
    "template/failed": z.object({
      requestId: z.string().uuid(),
      iterations: z.number().int(),
      reason: z.string(),
    }),
  }),
});
```

`functions` will export an array of `inngest.createFunction` outputs composed under `packages/app/src/inngest/functions/index.ts`.


## Postgres Schema Sketch
- `generation_requests`  
  - `id UUID PK`, `source_context JSONB`, `allowed_widgets TEXT[]`, `seed NUMERIC(20, 0)`, `status ENUM("queued","running","succeeded","failed")`, `created_at`, `updated_at`.
- `generation_iterations`  
  - `id UUID PK`, `request_id UUID FK`, `iteration INT`, `prompt TEXT`, `response TEXT`, `status ENUM`, `diagnostics JSONB`, `created_at`.
- `generation_outputs`  
  - `request_id UUID PK`, `typescript TEXT`, `widget_tuple TEXT[]`, `metadata JSONB`, `stored_at`.  
  - Optional S3/object storage references for large artifacts (prompts, raw completions) (`artifact_url`).
- `events` (optional)  
  - Append-only ledger mirroring emitted Inngest events for internal analytics.

ORM options: Drizzle ORM (fits serverless Postgres and TypeScript), Prisma Accelerate, or Kysely. Start with Drizzle for lightweight SQL-first development.


## Orchestration Plan
1. **Ingress (Hono Route)**  
   - Validate the structured item with Zod, ensure widget count <= 1 (reusing logic from `parseStructuredInput`).  
   - Persist request row (status `queued`, attach optional `debug` flag).  
   - Emit `template/requested` event via `inngest.send`.

2. **Function: `template.generate`**  
   - Trigger: `template/requested`.  
   - Steps:  
     1. Load request, set status `running`.  
     2. Compose prompts using existing helpers (refactor `composeInitialPrompt` et al. into reusable modules).  
     3. Loop:  
        - Call subordinate Inngest function (`template.iteration`) with attempt count.  
        - Wait for response (`inngest.step.waitForEvent`) or orchestrate inline with step concurrency.  
        - Break on success; otherwise continue until `MAX_RETRIES`.  
     4. On success: call `recordArtifact`, set status, emit `template/completed`.  
     5. On exhaustion: mark failure, emit `template/failed`.

3. **Function: `template.iteration`**  
   - Accepts iteration inputs (prompts, last diagnostics).  
   - Invokes OpenAI (`inngest.step.run` with `fetch`).  
   - Runs TypeScript validation (spawn Bun/Node subprocess or integrate `tsx` runner).  
   - Emits `template/iteration.completed` carrying diagnostics and persisted artifacts.  
   - Returns success/failure for orchestrator step logic.

4. **Finalization & Notifications**  
   - `template.completion.notify` (optional) sends Slack/email via downstream event.  
   - `template.completion.audit` writes summary logs, increments metrics.


## Deployment Strategy (Vercel)
- **Hono**: Export default handler from `packages/app/src/index.ts`. Configure `vercel.json` with `"framework": "hono"` or rely on auto-detection.  
- **Inngest**: Install the Vercel integration; configure `/api/inngest` route. Deploy functions with `inngest deploy`.  
- **Database**: Use Vercel-managed Postgres or an external provider. Store `DATABASE_URL` in Vercel/Edge config.  
- **Secrets**: Manage `OPENAI_API_KEY`, `INNGEST_EVENT_KEY`, `INNGEST_DEV`, etc. through Vercel + Inngest dashboard.  
- **Runtime**: Ensure Node 18+ (Edge for Hono routes that don’t require Node APIs; Node runtime for steps needing `typescript` or file access). Consider splitting endpoints if `tsc` execution requires Node.


## Local Development
- `bun run dev` (or `npm run dev`) to start Hono locally via `hono dev`.  
- Run `inngest dev` for local eventing; this proxies `/api/inngest` requests.  
- Use Docker Compose or a local Postgres container (e.g., `docker-compose up postgres`).  
- Provide seed data + sample `curl`/`httpie` commands to simulate template submissions.  
- Mirror environment variables using `.env.local` consumed by both Hono and Inngest CLI.


## Migration & Refactor Considerations
- Extract template generation logic into reusable modules under `packages/lib/src/templates` so both CLI and Inngest pipelines can share code (e.g., rename CLI-specific functions, avoid direct `fs` writes).  
- Wrap TypeScript checker to accept injectable file-system adapters (memory/durable) for serverless compatibility.  
- Replace direct disk artifacts with Postgres or object storage writers (S3-compatible).  
- Validation rules (non-null, widget tuple) stay as pure functions, allowing reuse without changes.


## Implementation Roadmap
1. **Repository Reorg**  
   - Move existing modules into `packages/lib/src/*`, update import aliases/tsconfig paths accordingly.  
   - Introduce barrel exports where helpful to avoid long relative paths from the new app surface.  
2. **Foundation**  
   - Scaffold `packages/app/src`, install `hono`, `inngest`, `drizzle-kit` (or preferred ORM).  
   - Add minimal `GET /health` route and `/api/inngest` adapter.  
   - Configure local dev scripts (`"dev:api"`, `"dev:inngest"`).

3. **Persistence Layer**  
   - Finalize Postgres schema + migrations; wire up DB pool (e.g., `@neondatabase/serverless`).  
   - Implement repository modules to read/write requests, iterations, outputs.

4. **Ingestion API**  
   - Port `parseStructuredInput` into shared module.  
   - Create `POST /api/templates` endpoint with immediate status response.

5. **Inngest Orchestration**  
   - Create `template.generate` function with step scaffolding and logging.  
   - Integrate OpenAI call + prompt composer from existing modules.  
   - Persist iteration results, store diagnostics, emit events.

6. **Validation & Storage**  
   - Adapt TypeScript checker to run safely in serverless (spawn Worker or call dedicated microservice).  
   - Persist successful TypeScript output + metadata; expose download endpoint.

7. **Observability & DX**  
   - Add structured logging via `@superbuilders/slog`.  
   - Document event naming, add dashboards (Inngest UI, Vercel Analytics).  
   - Write developer documentation (`docs/architecture.md`, runbooks, sample requests).

8. **Launch**  
   - Set up Vercel project, Inngest integration, and database provisioning.  
   - Run canary deployments, load test with test seeds, monitor cost/latency.  
   - Deprecate old CLI path or keep as fallback referencing the new pipeline.


## Open Questions / Follow-Ups
- **Type-check execution environment**: Running `typescript` in a Vercel Edge function is not feasible. We may need a Node runtime function or a dedicated worker (e.g., Vercel Serverless Function or background queue) to execute `tsc`.  
- **Artifact storage**: Decide whether to store large artifacts directly in Postgres, in object storage (e.g., R2/S3), or as Git commits (less desirable).  
- **Multi-widget support**: Current rules enforce ≤1 widget. The new architecture should anticipate future relaxation (schema changes, validation updates).  
- **Cost controls**: Evaluate caching and deduplication strategies to avoid repeated OpenAI calls for identical inputs.


## Summary
This proposal moves the template generator from a local CLI into a production-ready, event-driven service. By combining Hono (for API), Inngest (for orchestration), Postgres (for persistence), and the existing template-generation modules, we can deliver deterministic, observable, and scalable template generation suitable for Vercel deployment. The outlined roadmap balances foundational scaffolding with incremental refactors, letting us ship usable endpoints early while continuing to harden validation, storage, and developer experience.
