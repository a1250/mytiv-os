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
