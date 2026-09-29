# Marketing tenant binding (owner decision D2)

**Decision (2026-09-29, owner):** the business↔marketing-tenant binding is database-backed, owner-controlled,
auditable, and the canonical source of truth. There is no implicit fallback to the environment.

## Model (migration `0008_marketing_bindings`)
- `marketing_binding_events` — append-only log (`bind` / `revoke`), each with `binding_version`, tenant,
  actor and request id. UPDATE/DELETE are rejected by trigger; inserts must advance the version by exactly
  one (bind) or close the current bind (revoke); the actor must be an **owner** of the business.
- `marketing_bindings` — one current row per (business, project). A trigger lets it change only in
  lock-step with the latest event; it is never deleted (revoke instead).
- `marketing_bind(business, project, tenant, actor, request)` / `marketing_revoke(...)` — the only write
  path: one statement each, serialized per (business, project) with an advisory transaction lock (the app's
  `neon-http` driver has no interactive transactions). Rebind → version + 1; revoke keeps the version;
  binding the same tenant again is refused (`binding_unchanged`).
- Composite FKs keep every row inside its business (project and actor membership).

## Runtime
`getMarketingBinding(businessId, projectId)` (`lib/marketing/binding-store.ts`) reads only the current row:
no row, revoked, malformed or a database error → **not connected**. `OPS_MARKETING_BINDINGS` is ignored by
requests.

## Bootstrap (owner-run, once, after the migration is applied by the owner)
`scripts/marketing-bind-bootstrap.ts --owner <email>` prints what it would bind from the legacy
`OPS_MARKETING_BINDINGS`; `--apply` records an audited version-1 bind for each entry that has no binding row
yet (existing rows are never overwritten). Then remove the variable.

## Verification
- `tests/marketing-binding.sql` — run on an isolated database after migrations (rolls back).
- `tests/marketing-binding-concurrency.sh "<psql args>"` — N parallel rebinds serialize to versions 1..N.
- Neither is run in CI (no database); both were run on a local throwaway PostgreSQL 17.
