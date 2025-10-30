# PRD: Refactor Template Generation to a Stateless, Event-Driven Workflow

## Summary
- Replace the CLI-driven template generator with an Inngest-orchestrated, database-backed workflow.
- Use the existing `templates`, `template_candidates`, and `candidate_diagnostics` tables as the single source of truth.
- Introduce three stateless Inngest functions that operate exclusively on database records and communicate via lightweight events.
- Ensure downstream systems continue to receive the existing `template/template.generation.completed` and `template/template.generation.failed` events.

## Goals
- Persist all workflow state in Postgres using the current schema with no new tables.
- Make every Inngest function stateless and idempotent, requiring only identifiers in event payloads.
- Delete the `packages/lib/src/templates/cli.ts` entry point and any scripts that invoke it.
- Preserve existing AI prompt logic, validation rules, and public event contracts.

## Non-Goals
- Changing the structure or validation rules of template source code.
- Altering external event names or payloads beyond removing unused fields.
- Rewriting the AI prompt/validation helpers in `packages/lib/src/templates`.

## Stakeholders
- Product Engineering: responsible for implementation and maintenance.
- Platform Engineering: monitors Inngest deployments and observability.
- Content Operations: consumers of `template/template.generation.*` events.

## Current Architecture
### CLI Pipeline
- `packages/lib/src/templates/cli.ts` loads QTI JSON from disk, computes prompts, invokes OpenAI, retries up to 10 times, validates, and writes output to disk.
- State is transient; diagnostics exist only in logs or debug files.

### Inngest Function
- `packages/app/src/inngest/functions/template-generation.ts` responds to `template/template.generation.requested` by ensuring a `templates` row exists, then immediately emits completion or failure events.
- No AI generation or candidate tracking occurs in Inngest today.

## Target Architecture Overview
1. External systems emit `template/template.generation.requested` with `{ templateId }`.
2. `startGeneration` function creates a `template_candidates` record (placeholder source) and emits `template/candidate.generation.requested`.
3. `generateCandidate` reads required context, runs AI generation, updates the candidate source, and emits `template/candidate.validation.requested`.
4. `validateCandidate` runs validations, persists diagnostics, and either:
   - Emits `template/template.generation.completed` when diagnostics are empty.
   - Emits `template/candidate.generation.requested` for retries with incremented `iteration`.
   - Emits `template/template.generation.failed` after 10 unsuccessful attempts.
5. All state (source, diagnostics, retry history) resides in Postgres.

## Event Model
| Event Name | Producer | Payload | Consumer |
| --- | --- | --- | --- |
| `template/template.generation.requested` | External | `{ templateId: UUID }` | `startGeneration` (Inngest) |
| `template/candidate.generation.requested` | Inngest (Step) | `{ templateId: UUID, candidateId: UUID, iteration: int >= 1 }` | `generateCandidate` |
| `template/candidate.validation.requested` | Inngest (Step) | `{ templateId: UUID, candidateId: UUID, iteration: int >= 1 }` | `validateCandidate` |
| `template/template.generation.completed` | Inngest (Step) | `{ templateId: UUID }` | External subscribers |
| `template/template.generation.failed` | Inngest (Step) | `{ templateId: UUID, reason: string }` | External subscribers |

## Function Specifications
### 1. `startGeneration`
- **Trigger:** `template/template.generation.requested`.
- **Responsibilities:**
  1. Load the associated template record; fail fast if missing.
  2. Derive the next `version` by selecting the current max version for the template and adding 1 (default to 1).
  3. Insert a new `template_candidates` row with placeholder `source: ""` to satisfy the `NOT NULL` constraint.
  4. Emit `template/candidate.generation.requested` with `iteration: 1`.
- **Idempotency Strategy:** Reliant on event-level idempotency; version selection ensures duplicate inserts fail gracefully.
- **Logging:** Log template ID, candidate ID, and derived version.

### 2. `generateCandidate`
- **Trigger:** `template/candidate.generation.requested`.
- **Responsibilities:**
  1. Fetch template metadata (`templates`, `authored_assessment_items`) and the candidate row in a single step.
  2. Parse structured input into `sourceContext` and `allowedWidgets` using existing helpers.
  3. Determine retry context (`lastCode`, `lastDiagnostics`) by reading existing candidate source and most recent diagnostics.
  4. Compose prompts via `composeInitialPrompt` or `composeRetryPrompt`, then call `runGenerationAttempt`.
  5. Update `template_candidates.source` with the generated code.
  6. Emit `template/candidate.validation.requested` carrying the iteration count.
- **Concurrency:** Limit to 5 concurrent executions to control OpenAI usage.
- **Error Handling:** Wrap DB and AI calls with `errors.try`; propagate failures so Inngest retries the step.

### 3. `validateCandidate`
- **Trigger:** `template/candidate.validation.requested`.
- **Responsibilities:**
  1. Load candidate source and allowed widgets (join with `templates`).
  2. Execute validators: `typeCheckSource`, `validateTemplateWidgets`, `validateNoNonNullAssertions`, `validateNoTypeAssertions`.
  3. On success, emit `template/template.generation.completed`.
  4. On failure:
     - Replace rows in `candidate_diagnostics` for this candidate with fresh diagnostics.
     - If `iteration >= MAX_RETRIES (10)`, emit `template/template.generation.failed`.
     - Otherwise, emit `template/candidate.generation.requested` with `iteration + 1`.
- **Idempotency:** diagnostic deletion/insert encapsulated in a single step to avoid duplication.
- **Observability:** log diagnostic counts, retry counts, and final failure reasons.

## Database Interactions
- `templates`: read-only access to maintain existing relationships.
- `template_candidates`:
  - On insert, use `source: ""` placeholder.
  - Store generated TypeScript in `source`.
  - Index usage remains unchanged.
- `candidate_diagnostics`:
  - Delete and re-insert diagnostics per validation attempt to reflect latest state.
  - Ensure inserted records align with schema fields (`message`, `line`, `column`, `tsCode`).
- `authored_assessment_items`: read structured item body for prompts.

## Code Changes
1. Remove `packages/app/src/inngest/functions/template-generation.ts`.
2. Create `packages/app/src/inngest/functions/template-generation/01-start-generation.ts`.
3. Create `packages/app/src/inngest/functions/template-generation/02-generate-candidate.ts`.
4. Create `packages/app/src/inngest/functions/template-generation/03-validate-candidate.ts`.
5. Update `packages/app/src/inngest/functions/index.ts` to export the new functions.
6. Adjust `packages/app/src/inngest/client.ts` schemas to:
   - Narrow `template/template.generation.requested` payload to `{ templateId }`.
   - Add schemas for `template/candidate.generation.requested` and `template/candidate.validation.requested`.
7. Delete `packages/lib/src/templates/cli.ts` and remove any references (package scripts, docs).
8. Remove `packages/lib/src/templates/orchestrator.ts` usage paths replaced by Inngest flow; keep shared helpers intact.

## Migration & Rollout Plan
1. **Code Implementation:** Apply all changes behind feature branches; ensure TypeScript builds succeed.
2. **Configuration:** Redeploy Inngest functions so new handlers are registered and old ones are removed.
3. **Staging Verification:** Trigger a workflow in staging to confirm DB writes, events, and retries.
4. **CLI Decommissioning:** Remove CLI invocation from automation, ensuring no jobs still depend on it.
5. **Production Rollout:** Deploy application code, confirm Inngest dashboards show the three new functions healthy.
6. **Post-Deployment Audit:** Validate database entries for a handful of templates and monitor logs for failures.

## Testing Strategy
- **Unit Tests:** Cover prompt selection logic pathways (`initial` vs `retry`) and validation aggregator behavior.
- **Integration Tests:** Use a test database to execute the three functions end-to-end with mocked AI responses.
- **Manual QA:** Trigger workflow with controlled fixtures, inspect `template_candidates` and `candidate_diagnostics` rows, confirm events in Inngest UI.
- **Load Test (Optional):** Simulate concurrent generation requests to validate concurrency limits and DB contention handling.

## Observability
- Use `logger.info/warn/error` to trace templateId, candidateId, iteration, and retry counts.
- Configure structured logs to include timestamps and step names for debugging.
- Monitor Inngest metrics for function failure rates and retry counts; set alerts on repeated AI or DB step failures.

## Dependencies
- Existing AI helpers (`createAi`, `runGenerationAttempt`, prompt composers, validators).
- Environment variables (`OPENAI_API_KEY`, `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`).
- Postgres access via Drizzle (`db` client).

## Risks & Mitigations
- **AI Failures or Rate Limits:** Step-level retries with exponential backoff; concurrency limit of 5.
- **Schema Constraints (source NOT NULL):** Insert empty string placeholder prior to generation; expedite update on same step.
- **Duplicate Candidates on Retry:** Version calculation enforces uniqueness; event idempotency prevents double inserts.
- **Long-Running Validation:** Validation steps are deterministic; ensure each validator resides inside `step.run`.
- **Orphaned CLI References:** Comprehensive search to remove documentation and scripts invoking the deleted CLI.

## Open Questions
- Should `template_candidates.source` allow `NULL` to avoid placeholders? For now, we will use `""` to honor the existing constraint.
- Do we need to capture diagnostic metadata beyond the current schema? If yes, plan future migration separately.

## Implementation Checklist
- [ ] Update Inngest client schemas and regenerate types if applicable.
- [ ] Implement and export new Inngest functions.
- [ ] Delete legacy CLI and orchestrator entry points.
- [ ] Add new unit/integration tests; update CI configuration as required.
- [ ] Validate workflow in staging, including retry and failure paths.
- [ ] Coordinate production deployment and monitor post-launch.

