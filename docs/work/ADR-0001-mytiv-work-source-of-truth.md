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
2. **Provider-neutral model, split into query and command (implemented, package 1).** `lib/work-source/types.ts`:
   - Every identity carries its provider — `WorkRef {provider, id}` for items, people (`PersonRef`), status scopes
     (`StatusScopeRef`) and logged-time rows (`ItemTime.item`). `refKey()` (`provider:id`) is the only string form
     (React keys, map keys, `<option>` values), so equal ids from ClickUp and Mytiv never collide in a merged list,
     filter, time report or write.
   - `TaskQuerySource` (items, status options, people, time) and `TaskCommandSource` (`prepare` → validated,
     provider-shaped payload for the audit record; `apply` → the write) are separate; both expose
     `TaskSourceCapabilities`. The UI offers an action only when the source declares it **and** the item belongs
     to that source; a command source refuses anything it does not declare (`CommandNotSupportedError`).
   - ClickUp (`lib/work-source/clickup-adapter.ts`) declares `changeStatus` and `assign` only — the existing
     audited write path, now routed through `clickupCommandSource` with an unchanged audit payload. Mytiv commands
     are added later by implementing the same interface; no UI refactor is needed.
   - Status categories: `open | active | waiting | review | done | cancelled | unknown`. ClickUp's status *type* is
     authoritative for open/done/closed; a *custom* status maps only through an explicit name table, otherwise
     `unknown`. `unknown` is never counted as finished or active, is shown as "unmapped", and nothing branches on
     it (closing rules stay the source's own server-side check, e.g. `assertClosure`). Archive and trash are flags
     (`archived`, `trashed`), never categories. Mytiv's own statuses never use `unknown`.
   - The core and UI know no list ids, ClickUp URLs, status types, numeric member ids or "Me". Marketing plan
     items resolve through `planItemTaskRef()`.
3. **Evolve `tasks`, never in place.** Schema changes go expand → backfill → validate → contract, each its own
   migration/PR. New columns (e.g. `due_on date`, `status_key`) sit beside the old ones; constraints on old data are
   added only after a report on the live data. `due_date`/`status` are removed only in a later contract step.
4. **Statuses: system templates, per-business rows, DB-enforced category.** (Replaces a global `key` PK.)
   ```sql
   work_status_templates (key text PRIMARY KEY, category text NOT NULL CHECK (category IN
       ('open','active','waiting','review','done','cancelled')), label_he text NOT NULL, position int NOT NULL)
   work_statuses (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     business_id uuid NOT NULL REFERENCES businesses(id),
     key text NOT NULL CHECK (key ~ '^[a-z][a-z0-9_]{0,39}$'),
     template_key text NULL REFERENCES work_status_templates(key),   -- set for the system statuses
     category text NOT NULL CHECK (category IN ('open','active','waiting','review','done','cancelled')),
     label_he text NOT NULL, position int NOT NULL,
     retired_at timestamptz NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
     UNIQUE (business_id, key),                 -- the same key may exist in two businesses
     UNIQUE (business_id, id, category))        -- target of the tasks FK
   work_status_revisions (append-only: status_id, business_id, label_he, position, retired_at, changed_by, changed_at)
   tasks.status_id uuid, tasks.status_category text,
     FOREIGN KEY (business_id, status_id, status_category) REFERENCES work_statuses (business_id, id, category)
   ```
   - System statuses are *copied per business* from the templates (expand-migration backfill for existing
     businesses; a trigger on `businesses` INSERT for new ones). Every FK is then same-business by construction —
     a task can never point at another business's status, which a nullable `business_id` "global row" could not
     guarantee.
   - The composite FK makes a contradictory `(status, category)` pair unstorable. `category` and `key` of a status
     are immutable (trigger); re-categorising = a new status plus a governed migration of the tasks.
   - Renames change `label_he` only; `id`/`key` stay. Every change is appended to `work_status_revisions`, and
     task events record `status_id` plus the label at the time, so history reads as it was.
   - Business-specific custom statuses (later) are ordinary rows with `template_key NULL`; retiring hides a status
     without breaking history (`retired_at`, never DELETE).
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
8. **Authorization and the database boundary — stated honestly.**
   - *Today* the runtime and migrations both connect as `neondb_owner` (verified from the role name in the
     `DATABASE_URL`/`DATABASE_URL_UNPOOLED` of production and staging, no values read). A table owner can bypass
     or remove any in-database restriction: triggers, `REVOKE`, `SECURITY DEFINER` wrappers and RLS policies
     (`ALTER TABLE … DISABLE …`). So **`work.via_function` (a transaction-local `set_config` checked by guard
     triggers) is a guardrail against our own code taking a shortcut — it is not a security boundary.**
   - *Target* (owner gate: it needs a new Neon role and a changed runtime `DATABASE_URL` in Vercel):
     - `neondb_owner` keeps running migrations only (`DATABASE_URL_UNPOOLED`, never in the runtime).
     - Work tables are owned by a `NOLOGIN` role `mytiv_work_owner` (granted to `neondb_owner` for migrations).
     - The runtime uses a new `LOGIN` role `mytiv_app` (created through the Neon API/console; Neon supports
       additional roles and the HTTP driver authenticates any role). It keeps today's privileges on the existing
       tables, gets `SELECT` only on Work tables (or on views), and **no `INSERT/UPDATE/DELETE/TRUNCATE`** on them.
     - Every Work write is a function owned by `mytiv_work_owner`, `SECURITY DEFINER`, with
       `SET search_path = pg_catalog, public, pg_temp` and schema-qualified references inside;
       `REVOKE ALL ON FUNCTION … FROM PUBLIC`, then `GRANT EXECUTE` to `mytiv_app` for exactly the functions it needs.
     - Each function's first step is `work_authorize(p_business, p_actor, p_operation, p_target)`: active membership
       (`accepted_at` set, `deactivated_at` null), role per the matrix, target in the business.
   - `p_actor` and `p_business` are derived server-side from the authenticated session (`guard()`), never taken
     from a request body. The database cannot authenticate end users itself: with the target model, a compromised
     app could still act as any *member* through the functions, but could no longer bypass the functions' rules,
     write Work tables directly, or touch history. That residual risk is documented, not hidden.
   - Until the role split is approved and done, Work's protection is: route checks + function checks + guardrail
     triggers + append-only history + tests. None of these is presented as a security boundary.
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
  identical to `e35a189` except the assignee `<option>` values, which are now provider-qualified (`101` →
  `clickup:101`) — proven by normalising those values against the base snapshot (`tests/ops-render-parity.vitest.ts`).
  An unmapped status adds an "Unmapped status" badge; none of today's fixture statuses is unmapped.
- **Leak audit:** task-link probes; refuses any non-local database.
- **Still ClickUp-specific (by design, until PR 12):** Copilot tools, rollback/reconcile, `/ops/snapshot`,
  `/ops/members`, `assertClosure`, and project-level ClickUp folder texts.

## Gates (each needs explicit owner approval)

Runtime role split (`mytiv_app`, Vercel `DATABASE_URL`) → legacy-data report on production → `0012_work_expand` (staging, then production) → backfill → `0013_work_validate`
→ functions/API → time (`btree_gist`) → collaboration → ClickUp inventory with the real token → import →
per-project cutover (pilot: internal folder `מיטיב`) → marketing `taskRef` contract → contract migration.
