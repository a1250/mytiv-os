# Mytiv Work package 1 — verification (2026-10-01T13:05:14Z)

Branch `auto/work-pkg1` on `e35a189` (PR #8 → #7). Local only: no staging, production or ClickUp contact. HEADs re-checked before work: main 3ca991c, #7 48acb1e, #8 e35a189.

| Check | Base e35a189 | auto/work-pkg1 |
|---|---|---|
| `npm test` node:test | 28/28 | 28/28 |
| `npm test` vitest | 20 files, 174 | 23 files, 193 (+parity 5, tasks-route 9, work-source 5) |
| `tsc --noEmit` | clean | clean |
| eslint (repo) | 51 errors, 45 warnings (pre-existing) | 51 errors, 44 warnings; new files clean |
| DB integration (local PG, run.sh) | 7 files, 26 + SQL + concurrency | 8 files, 32 (+tasks-isolation 6) + SQL + concurrency |
| Ops markup parity (snapshot written at base) | — | byte-identical (5 tests, 8 snapshots) |
| Leak audit (local PG via shim) | — | 57 checks, 16 modules, NO LEAKS; remote host refused (exit 2) |
| Mutation (11 mutants on the new protections) | — | 11/11 killed |
| Isolated `next build` | pass | pass (1378cca) |
| Ops HTTP matrix (local stack, ClickUp mock) | 67/67 | 67/67 |
| Marketing HTTP matrix (local stack) | 67/67 | 67/67 |
| /tasks HTTP check, real sessions (owner-a, member-a, owner-b) | — | 12/12 |

Local stack: fresh Postgres DB built from the 12 migrations + `scripts/staging/seed-staging.mjs` fixtures (fictional @staging.invalid users), `next dev` via the neon shim, `clickup-mock.mjs` on 127.0.0.1. Test rows titled `PKG1-QA …` exist only in that local DB.

## /tasks HTTP check

| | session | request | got |
|---|---|---|---|
| ✅ | owner-a | POST /api/mytiv/tasks (own project → stored) | 200 |
| ✅ | owner-a | POST /api/mytiv/tasks (B's project) | 404 project_not_found |
| ✅ | owner-a | POST /api/mytiv/tasks  | 400 field_not_allowed |
| ✅ | owner-a | POST /api/mytiv/tasks (cross-origin) | 403 same_origin_required |
| ✅ | owner-a | PATCH /api/mytiv/tasks/694d70a5  | 404 project_not_found |
| ✅ | member-a | PATCH /api/mytiv/tasks/694d70a5 (member may update) | 200 |
| ✅ | member-a | DELETE /api/mytiv/tasks/694d70a5 (member delete) | 403 approval_role_required |
| ✅ | owner-b | PATCH /api/second-business/tasks/694d70a5 (B on A's task) | 404 not_found |
| ✅ | owner-b | DELETE /api/second-business/tasks/694d70a5 (B on A's task) | 404 not_found |
| ✅ | owner-b | GET /api/mytiv/tasks (B reads A's business) | 404 not found |
| ✅ | owner-a | DELETE /api/mytiv/tasks/694d70a5  | 204 |
| ✅ | owner-a | DELETE /api/mytiv/tasks/694d70a5 (already gone) | 404 not_found |

12/12 checks passed

## Not verified
- Tasks page error message in a browser (UI change is a single alert line; API behaviour verified above).
- Nothing ran on staging, Preview or production.

---

# Package 1 review fixes (v2.1, commit d766992 + this one)

| Check | Result |
|---|---|
| `npm test` | node:test 28/28 · vitest 23 files, **199** |
| `tsc --noEmit` | clean |
| eslint (repo) | 51 errors, 44 warnings — unchanged pre-existing total; new/changed code adds none |
| DB integration (local PG) | 8 files, **32** + 4 SQL fixtures + 3 concurrency scripts |
| Isolated `next build` | pass (d766992) |
| Ops HTTP matrix (local, ClickUp mock) | **67/67** |
| Marketing HTTP matrix (local) | **67/67** |
| `scripts/staging/work-http-check.mjs` (new, local only) | **14/14** — 12 legacy `/tasks` checks + 2 neutral-assignee checks on the ClickUp write route |
| Mutation (review fixes) | **10/10 killed**: custom→active default, closed→unknown, Mytiv ref accepted by ClickUp, refKey without provider, sameWorkRef without provider, unknown counted finished, UI ignoring the changeStatus capability, unmapped badge removed, command source accepting a foreign target, marker validated only after the claim |
| Ops markup parity | identical to e35a189 after normalising assignee `<option>` values (`101` → `clickup:101`) — the only change |

## Self-review — every remaining ClickUp reference in the migrated consumers

| Where | What | Classification |
|---|---|---|
| `lib/work-source/clickup-adapter.ts` | `OpsTask`, `listId`, `statusType`, `blockedOn`, numeric member ids, ClickUp URLs | **Correct** — the adapter is the one place allowed to know them |
| `lib/work-source/index.ts` | always selects the ClickUp source | **Correct for now** — `projects.work_source` arrives with the expand migration |
| `lib/marketing/task-ref.ts` | reads `clickupTaskId` | **Correct** — the single translation point until the C1 `taskRef` contract (PR 14) |
| `app/api/[slug]/ops/tasks/[taskId]/route.ts` | ClickUp-specific route (scope, closing evidence, audit snapshots) | **Documented debt** — provider-specific by design; writes now go through `clickupCommandSource` |
| `components/ops/task-table.tsx` | write URL uses `task.ref.id` | **Correct** — only offered when `capabilities.provider === task.ref.provider` (tested) |
| Ops Home / Projects / workspace / Money copy: "Live from ClickUp", "ClickUp folder …", "hours logged in ClickUp", `ClickUpFailed`/`ClickUpNotConfigured` notices, `project.clickupFolderId` texts | project-level link to ClickUp, not task model | **Documented debt** — becomes source-aware with `projects.work_source` (PR 12) |
| `components/ops/marketing-panel.tsx` header "מצב הביצוע מ־ClickUp" | copy | **Documented debt** (PR 12/14) |
| Copilot, rollback/reconcile, `/ops/snapshot`, `/ops/members`, `assertClosure` | ClickUp-only features | **Documented debt** (PR 12) |
| Any `OpsTask`/`listId`/`statusType`/`blockedOn`/numeric person id in a neutral component | — | **None found** (no bugs) |

Regressions checked: permissions (writer-only route, member read-only UI, capability gating), Money (estimates and logged time keyed by provider+id; "(no task)" time has no item), marketing panel (matches by `WorkRef`), Ops Home counts (never read the category).

---

# PR 2–4 (local only) — legacy report, expand migration, backfill — head 68fdb02

| Check | Result |
|---|---|
| `npm test` | node:test 28/28 · vitest 23 files, 199 |
| `tsc --noEmit` / eslint on new code | clean / clean |
| DB integration (`run.sh`, 13 migrations) | 10 files, **40** tests · 4 SQL fixtures · 3 concurrency scripts · **21** checks in `tests/work-expand-on-legacy.sh` |
| `drizzle-kit migrate` (real runner, breakpoints) on a fresh local DB | 13 migrations applied; 7 templates; 4 Work triggers |
| 0012 on legacy junk | every legacy task/business/membership/project value byte-identical (md5 fingerprint) |
| Legacy report script (neon client via shim) | runs in one READ ONLY transaction; remote host refused (exit 2) |
| Backfill script (neon client via shim), 1200 generated legacy rows | status 900/300 unknown, due_on 960/240 invalid, completed_at 300, last_activity 1200; second run changes 0; remote host refused (exit 2) |
| Isolated `next build` | pass (68fdb02) |
| Ops / marketing HTTP matrices (local DB with 0012) | 67/67 · 67/67 |
| `work-http-check.mjs` (dual-write path) | 14/14 |
| Mutation | 0012: 8/8 killed (one test tightened); dual-write 3/3; backfill 2 real killed + 3 equivalent (documented) |

**Deploy order** (when the gates open): apply `0012_work_expand` → then deploy code containing the dual-write
(the `/tasks` writes reference the new columns). The legacy report may run before or after 0012; the backfill only
after 0012. Nothing here has run on staging, Preview or production.
