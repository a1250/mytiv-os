# ADR-0001 — Mytiv Work: one source of truth for tasks, moved per project

Status: **accepted in direction** (owner, 2026-10-01). Package 1 implemented on `auto/work-pkg1`; every later
step has its own owner gate (see "Gates").
Base: `a1250/mytiv-os` `auto/preview-mvp-app` @ `e35a189` (PR #8, stacked on PR #7 @ `48acb1e`; `main` @ `3ca991c`).

## Context

Mytiv OS has three task concepts today:

| Concept | Where | Source of truth |
|---|---|---|
| Internal tasks | `tasks` table (`lib/db/schema.ts:93`), "Tasks & Ops" page, dashboard, weekly review | the app — but unvalidated, unaudited, any member could delete |
| Ops tasks | `lib/clickup.ts` (live reads, no mirror), Ops Home / Projects / client workspace / Money / Copilot | ClickUp (`lib/clickup.ts:4`, `schema.ts:999`) |
| Marketing workboard (C7) | imported engine artifacts | Marketing OS engine |

The dashboard's "open tasks" and Ops' "open tasks" count different things. Goal: Mytiv becomes the single
source of truth for tasks and time, **gradually, one project at a time**, without ever running two active
sources for the same project and without two-way sync.

## Decisions

1. **Source of truth per project.** A later migration adds `projects.work_source ∈ {clickup, mytiv}`. A project
   is read and written through exactly one source. There is no two-way sync and no permanent mirror; ClickUp
   changes after a project's cutover are reported (drift), never applied.
2. **Provider-neutral read model (implemented, package 1).** `lib/work-source/types.ts` defines `WorkItem`,
   `WorkRef {provider, id}`, `WorkPerson {ref, name}`, `StatusOptions`, `ProjectTaskSource`. The core and the UI know
   no list ids, ClickUp URLs, status types, numeric member ids or "Me". ClickUp is an adapter
   (`lib/work-source/clickup-adapter.ts`, the only `OpsTask → WorkItem` mapper and the only place a person ref
   becomes a ClickUp id). Mytiv's own tasks will be the second adapter. Marketing plan items resolve through
   `planItemTaskRef()` (`lib/marketing/task-ref.ts`).
3. **Evolve `tasks`, never in place.** Schema changes go expand → backfill → validate → contract, each its own
   migration/PR. New columns (e.g. `due_on date`, `status_key`) sit beside the old ones; constraints on old data are
   added only after a report on the live data. `due_date`/`status` are removed only in a later contract step.
4. **Status consistency is a database rule.** A reference table `work_statuses(key, category, …)`; tasks carry
   `(status_key, status_category)` with a composite FK to it, so a contradictory pair cannot be stored.
5. **Hierarchy and dependencies (MVP).** `parent_id` (≤ 3 levels) and `blocks` dependencies only within one
   project; cross-project `relates` is deferred. Moves check subtasks and dependencies first. Cycles are prevented
   under a per-business advisory lock inside the database function that performs the change.
6. **Deletion.** Soft delete, trash and archive only. **No purge in the MVP**; physical deletion is designed
   separately with retention and privacy. Trash/restore/archive/move semantics for subtasks, dependencies, time,
   comments, links and checklist are specified in the plan (§3.1).
7. **Atomic writes and idempotency.** Each change is one plpgsql function that writes the change, a
   `work_requests` ledger row and an append-only `work_events` row in one transaction (neon-http has no
   interactive transactions; `db.batch` cannot branch and is not supported by the local test harness).
   `work_requests` records actor, operation, target, permission context, payload hash, status and retention; a
   replay is answered only for the same business, actor, operation and payload hash.
8. **Authorization inside the database.** Sensitive functions take `p_actor`/`p_business` and check active
   membership (`accepted_at`, `deactivated_at`), role and business scope themselves; guard triggers refuse direct
   DML not issued by those functions. Route handlers check the same things first.
9. **Time.** `time_entries` separate from tasks; at most one running timer per user (partial unique index), no
   overlap (exclusion constraint, `btree_gist` — owner approval), server clock only; actual time = sum of entries.
10. **ClickUp cutover protocol.** Read-only inventory and dry-run first; rehearsal on staging. At cutover: owner
    sets the folder to "View only" (best effort — ClickUp's docs do not establish that it restricts the workspace
    owner, admins or the API token), then an **immutable snapshot** from full read A, a second full read B that
    must hash-identical to A, import **from the snapshot**, verification, and a final hash read C before the flip.
    Any difference aborts. A `partial` import never flips.
11. **Marketing contracts.** C1 keeps `clickupTaskId` valid forever (append-only artifacts). A later contract
    version adds a neutral `taskRef {provider, id}`; readers accept both and refuse a mismatch.
12. **Existing audit layer.** Imports, cutover flips and any remaining ClickUp writes keep using `auditedAction`;
    Work's own edits use `work_events`, merged into the unified audit view for significant events.

## Package 1 (this branch) — no migrations, no behavior change for Ops

- **Legacy `/api/[slug]/tasks` hardened:** field allowlist + validation (`lib/tasks-policy.ts`); project/lead ids
  accepted only from the caller's business (`lib/tasks-links.ts`); `createTask` persists `projectId`;
  same-origin on writes; delete owner/admin only; real 404s; `done_at` follows the status transition.
- **Ops screens on the neutral model:** Ops Home, Projects, client workspace, Money, marketing panel. Markup is
  byte-identical to `e35a189` (`tests/ops-render-parity.vitest.ts`).
- **Leak audit:** task-link probes; refuses any non-local database.
- **Still ClickUp-specific (by design, until PR 12):** Copilot tools, rollback/reconcile, `/ops/snapshot`,
  `/ops/members`, `assertClosure`, and project-level ClickUp folder texts.

## Gates (each needs explicit owner approval)

Legacy-data report on production → `0012_work_expand` (staging, then production) → backfill → `0013_work_validate`
→ functions/API → time (`btree_gist`) → collaboration → ClickUp inventory with the real token → import →
per-project cutover (pilot: internal folder `מיטיב`) → marketing `taskRef` contract → contract migration.
