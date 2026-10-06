# Focus × Mytiv — real integration

Branch `auto/focus-integration` (Integration PR a1250/mytiv-os#10, **draft**), stacked on `auto/focus-redesign`
(#9 @ `25dfda8`, unchanged). Merges `auto/work-pkg1` (`6b6f537`) for the Work groundwork. **Not merged, not deployed;
no migration has been run on staging, shared or production.** Every result below comes from a disposable local
PostgreSQL.

## The boundary

| Scope | What renders | Writes go to |
|---|---|---|
| `/_demo/focus/…` (dev, Vercel Preview only) | fixtures + the client demo store, unchanged from #9 | the demo store (QA only) |
| `/{business}/focus/…`, area flag **off** | the area's "not connected yet" page — never a fixture | nothing |
| `/{business}/focus/…`, area flag **on** | the business's own data, read on the server | the governed backend routes below |

Business identity always comes from the verified session → membership (`guard` / `getFocusScope`), never from the URL,
a query or the client. Every write route is same-origin, takes a client-generated UUID `requestId`, and is replay-safe.

| Flag (server env, default off) | Connects | Needs |
|---|---|---|
| `WORK_API_ENABLED=true` | Work: my work, all tasks, drawer, board/list writes, comments, time | migrations 0012, 0013, 0015 |
| `MARKETING_MODULE_ENABLED=true` (existing) | Approvals (C2a/C2b), Marketing → campaigns & execution (C12, C7, receipts) | migrations 0010, 0011 (already in the base) |
| `EXTERNAL_ACTIONS_ENABLED=true` | Mail (Gmail via backend attempts), `/api/[slug]/external/*` | migration 0014 + the business's Google connection |

With a flag off its API answers 404 and its Focus area shows "not connected yet" (verified on a production build:
`next start`, all flags off).

## What is connected

### Work (real Mytiv DB)
- **Read**: `lib/work/read.ts` — the business's tasks with status key/label, owner, participants, dates, dependencies,
  sub-tasks (child tasks), comments, total logged minutes, last writer, recent `work_events`; its members and projects.
  Mapped to the Focus `Task` contract by `lib/focus/adapters/work.ts` (`taskFromRow`).
- **Write**: every edit is one DB function (migrations 0013/0015). The DB re-checks membership and role, records the
  request in `work_requests` (an exact retry returns the recorded result, another payload under the id → `request_conflict`),
  checks the optimistic version under a row lock (a stale write changes nothing → `409 version_conflict` with the
  current task), enforces the rules (block needs a reason, open dependency / open children / done parent, cycles,
  cross-project, start ≤ due, assignee must be an active member), and appends `work_events`.
- **Focus client**: the same store as the demo in *remote mode* (`DemoStoreProvider remote`, `WorkRemote`). Local
  rules give instant feedback; each write carries the version the server last confirmed; writes to one task are
  serialized; a lost answer is retried with the **same** request id; a conflict or refusal puts the server's copy back
  and says why (toast); the list re-reads on focus and every 30 s.
- **Comments and time** (0015): append-only, ledgered, and they do **not** bump the task version — a comment never
  turns a colleague's edit into a conflict. A member logs only their own time (1–1440 min, not in the future; timer or
  manual). Undo of server-recorded time or comments is not offered (append-only).

### Approvals and marketing (canonical Marketing OS contracts, no engine code copied)
- **Approvals** (`/focus/approvals`): per project bound to a marketing tenant, the latest C2a queue (re-validated against
  the vendored contract on read) joined with the C2b decisions recorded here. Owner/admin decide with a mandatory
  reason through the existing governed route `POST …/ops/projects/[projectId]/marketing/decisions` (same origin,
  confirmation, content hash the user saw, audited); a retry reuses the request id. The item then shows "ההחלטה נרשמה ·
  ממתינה להחלה במנוע" until the engine's next export. Members read only. Linked execution receipts and the engine's
  reconciliation are shown on the card.
- **Campaigns & execution** (`/focus/marketing/board`, read-only): C12 campaigns (build state, budget, KPIs, content
  calendar), the C7 workboard (engine status, four-state completion, evidence state) and the evidence / receipts recorded
  here with their reconciliation. "Done" is the engine's completion, never a board column.

### External execution (backend-owned attempts, 0014)
- `external_attempts` rows are written **before** the provider call and settled with its answer
  (`confirmed | failed | unknown`); rows only move forward and never change identity.
- One DB gate per target (`gmail:thread:<id>`, `meta:approval:<id>`) under an advisory lock: an attempt in flight, or a
  confirmed draft, refuses a new one; after an UNKNOWN outcome every new attempt on the target is refused
  (`needs_target_check`) unless the request names **that** UNKNOWN attempt as checked at the target — the check unlocks
  exactly one attempt. An attempt never settled (the server died mid-call) expires to UNKNOWN after 2 minutes.
- **Mail** (`/focus/comms`): the business's own Gmail inbox (server read), a thread, the thread's attempt history, and a
  reply saved as a Gmail draft (`…/external/gmail/draft`) then sent **only** through `…/external/gmail/send` after the
  review dialog's confirmation (and the Gmail target check after UNKNOWN). "נשלח" appears only when Gmail confirmed.
- **Meta**: `…/external/meta/schedule` refuses with `503 meta_not_configured` before recording anything — Mytiv has no
  Meta integration (owner item).

## Migrations (new on this branch)

| Migration | From | Contents |
|---|---|---|
| `0012_work_expand` | pkg1 (merged) | `work_statuses` per business, typed task columns, `version`, `owner_user_id`, `parent_id`; backfill script |
| `0013_work_functions` | here | `task_dependencies`, `task_members`, `work_requests` (immutable), `work_events` (append-only); `tasks.blocked_reason / next_action / follow_up_on`; `work_create_task`, `work_update_task` + helpers |
| `0014_external_attempts` | here | `external_attempts` (forward-only trigger); `external_attempt_admit / settle / expire` |
| `0015_work_comments_time` | here | `task_comments`, `task_time_entries` (immutable); `work_add_comment`, `work_log_time`, `work_live_task` |

All are additive. Numbering differs from the pkg1 plan (which reserved 0013 for "validate" / 0014 for functions) — an
owner item before anything is applied anywhere shared.

## API changes

| Route | Method | Notes |
|---|---|---|
| `/api/[slug]/work/tasks` | GET, POST | read model `{tasks, complete, people, projects, viewerId, role, capabilities}`; create |
| `/api/[slug]/work/tasks/[id]` | PATCH | `{requestId, expectedVersion, patch}` → `200 {task}` · `409 {error:"version_conflict", current}` · 4xx refusal |
| `/api/[slug]/work/tasks/[id]/comments` | POST | `{requestId, body}` → `200 {task}` |
| `/api/[slug]/work/tasks/[id]/time` | POST | `{requestId, minutes, startedAt, source}` → `200 {task}` |
| `/api/[slug]/external/gmail/draft` | POST | `{requestId, threadId, to, subject, body}` → `{draftId}` (nothing sent) |
| `/api/[slug]/external/gmail/send` | POST | `{requestId, threadId, draftId, attestedUnknownAttemptId?}` → `200 {attempt}` · `409 in_flight / already_done / needs_target_check{unknownAttemptId}` |
| `/api/[slug]/external/attempts` | GET | `?target=gmail:thread:<id>` → attempts, newest first |
| `/api/[slug]/external/meta/schedule` | POST | `503 meta_not_configured` |
| `/api/[slug]/tasks*`, `/api/[slug]/ops/tasks/[taskId]` | — | pkg1 hardening (allowlist, tenant-checked links, same-origin, owner/admin delete) |

Existing marketing routes (binding, artifacts, decisions, receipts) are used as they are.

## Local verification stack

`scripts/focus/int/stack.sh db` drops/recreates a **local** database (refuses non-localhost hosts and requires
`INT_CONFIRM_DROP=<db>`), applies every migration in journal order and seeds the fictional staging fixtures plus a
fake Google connection for business A. `stack.sh serve` starts a localhost SQL endpoint in the Neon HTTP wire format
(used by the app only when both the DB URL and the endpoint are localhost — `lib/db/local-endpoint.ts`), a Gmail
stand-in (`gmail-mock.mjs`: ok / fail400 / err500 / hang), and `next dev`.

```bash
PGHOST=127.0.0.1 PGPORT=55432 PGUSER=postgres INT_DB=focus_int INT_CONFIRM_DROP=focus_int \
  ITEST_PG_MODULE=/path/to/node_modules/pg scripts/focus/int/stack.sh db
WORK_API_ENABLED=true MARKETING_MODULE_ENABLED=true EXTERNAL_ACTIONS_ENABLED=true PGHOST=127.0.0.1 PGPORT=55432 \
  PGUSER=postgres INT_DB=focus_int ITEST_PG_MODULE=/path/to/node_modules/pg scripts/focus/int/stack.sh serve 3200
INT_PW=$(cat "$INT_SECRETS_DIR/int-password") PLAYWRIGHT_MODULE=/path/to/playwright node scripts/focus/int/e2e-work.mjs
```

E2E scripts: `e2e-work`, `e2e-external`, `e2e-approvals`, `e2e-mail`, `e2e-marketing`, `axe-business`.

## Not connected yet

See the PR description for the current implemented-vs-remaining matrix and the owner decisions.
