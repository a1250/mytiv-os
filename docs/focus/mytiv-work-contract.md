# Mytiv Work — UI ↔ backend contract

The meeting point between the Focus UI (`auto/focus-redesign`, this branch) and the backend work in `auto/work-pkg1`.
Today every Mytiv Work screen runs on typed fixtures through the demo store, in the fixture demo scope only
(`/_demo/focus/…`, development and Preview); a real business scope shows "not connected yet". **No backend is
connected and nothing in this document has been merged.** `auto/work-pkg1` was read as a contract source only (head `6b6f537`, local and not
pushed): nothing was merged or cherry-picked from it.

- **UI types:** `lib/focus/contracts/work.ts`.
- **Pure rules (unit-tested):** `lib/focus/state/work.ts`.
- **Fixtures:** `lib/focus/fixtures/work.ts`, including the per-source capability map.
- **Demo store** (the stand-in to replace): `components/focus/shell/demo-store.tsx`.
- **pkg1 sources:**
  - `lib/work-source/types.ts` (`WorkItem`, `WorkStatusCategory`, `TaskSourceCapabilities`, Query/Command split);
  - `lib/tasks-policy.ts` (legacy `/tasks` field allowlist);
  - `drizzle/migrations/0012_work_expand.sql`;
  - `docs/work/PLAN-v2-mytiv-work.md` §6–8.

## 1. Screens and routes

Routes are relative to the tenant segment `/{businessSlug}` (examples run on `/_demo`).

| Route | Screen | Handoff |
|---|---|---|
| `/focus/work` | My tasks: by time / list / Kanban over the same tasks, quick create, timer, drawer | W1, M9 |
| `/focus/work/list` | Project list: parent rows expand to children, "חסום על ידי" row, filters | W2 |
| `/focus/work/board` | Project Kanban: keyboard and mouse moves, refused moves explained | W3 |
| `/focus/work/task` | Demo scope only: redirect to `/focus/work/list?task=t-post45` (the drawer opens over the list) | W4, M10 |
| `/focus/work/time` | Timer + hours report + logged entries | W5 |
| `/focus/work/states` | Every system state, interactive | W6 |
| `/focus/work/all-tasks` | All my tasks across projects: filters, grouping, source of truth, one quick action per row | F5, M6 |
| `/focus/projects/umino/execution` | Project execution grouped by status + blocked-task panel with save & sync | D3 |
| any of the above `?task=<id>` | `TaskDrawerHost` opens the drawer for that task (deep link) | — |

## 2. Components and props

All components are pure views. Actions leave them only through callbacks.

| Component (file) | Props | Emits |
|---|---|---|
| `MyTasksView` (`patterns/work/my-tasks.tsx`) | `buckets: MyTasksBuckets`, `now`, `timer: { activeTaskId, onStart(id), onPause() }`, `limit?` | timer start/pause; navigation to `?task=` |
| `QuickCreate` (`patterns/work/quick-create.tsx`) | `now`, `people: {id,name}[]`, `clients: string[]`, `autoFocus?`, `compact?` | `onCreate({title, dueDate, priority, assigneeId, client}, keepOpen)` |
| `TaskCard` / `RichTaskCard` / `PlainTaskCard` / `BlockedTaskCard` / `WaitingTaskCard` (`patterns/work/task-card.tsx`) | `task`, `now`, `size: "sm"\|"md"`, `view?`, `timer?`, `compact?` | timer start/pause |
| `TaskListView` (`patterns/work/task-list.tsx`) | `tasks`, `all`, `now`, `groupBy: "status"\|"none"`, `groupOrder?`, `expandedIds`, `columns?`, `selectedId?`, `canEdit?` | `onToggleExpand(id)`, `onToggleDone(task)`, `onOpen?(task)` |
| `TaskBoard` (`patterns/work/task-board.tsx`) | `tasks`, `all`, `timerTaskId?`, `timerLabel?`, `canEdit?` | `onMove(taskId, to: BoardColumn, expectedVersion) → {ok, reason?}` |
| `TaskDrawerBody` + `TaskDrawerHead` (`patterns/work/task-drawer.tsx`) | `task`, `all`, `now`, `role: WorkRole`, `caps: CapabilityMap`, `allowPlanned` (demo scope), `baseVersion`, `viewerId`, `conflict`, `timer`, `entries: TimeEntry[]` | `onPatch(patch, expectedVersion)`, `onResolveConflict("mine"\|"theirs")`, `onLogTime(minutes)`, `onDuplicate()`, `onClose()`, `onDirtyChange(dirty)` |
| `TaskDrawerHost` (`shell/task-drawer-host.tsx`) | `defaultTaskId?` | Connects the drawer to the store: the token the drawer loaded, adoption of the viewer's own writes only (write lineage), conflicts naming the writer, close confirmation, and the shared unsaved-changes guard |
| `TimerBarView` / `TimerBar` (`shell/timer-bar.tsx`) | `activeTimer: ActiveTimer \| null`, `elapsedMs`, `variant: "fixed"\|"inline"`, `note?` | `onPause()`, `onResume()`, `onStop()` |
| `TimeReport` (`patterns/work/time-report.tsx`) | `data: TimeReportData`, `groupBy`, `rows: TimeReportRow[]` | `onGroupBy(group)` |
| `WorkStateView` (`patterns/work/work-states.tsx`) | `state: WorkViewState \| {kind:"ready"}` | `onRetry`, `onCreate`, `onRequestAccess`, `onKeepMine`, `onTakeTheirs` |
| `BlockedTaskPanel` (`patterns/work/blocked-panel.tsx`) | `task`, `all`, `now`, `viewerId`, `sync: SyncState`, `canEdit` | `onSave({assigneeId, nextAction, followUp, note})`, `onRetry()`, `onDirtyChange(dirty)` |

## 3. Commands (what the store does today → what pkg1 must do)

`WorkCommands` in `contracts/work.ts`; the demo store implements it (`satisfies WorkCommands`). Every write returns a
`WriteResult`: the new task with its new token, a conflict (nothing written), or a refusal with a reason.

| Command | Demo behaviour | Rules (`state/work.ts`) |
|---|---|---|
| `patchTask(id, patch, expectedVersion)` | Applies the patch through `applyPatch`, mints the next opaque token, records the actor (`updatedBy`) | Token must match, otherwise a conflict and nothing is written. Status must be canonical (no stored "blocked"). `block: {reason}` needs a non-blank reason and sets `waiting`; `unblock` lifts it. `done` needs `canComplete`; reopening under a done parent is refused (`canReopen`). Title required; start ≤ due; `addDependency` needs `canDepend` (same project, no cycle); `logMinutes` is an increment (1..1440) and unknown time stays unknown. The stored-task invariant (`taskInvariant`) is checked on the result. |
| `moveTask(id, column, expectedVersion)` | Sets the column's canonical status (`blockedOrWaiting` → `waiting`) | `checkMove` → refusal with a reason (pkg1 plan: `409 move_blocked`); a move that changes nothing is refused, never a fake success |
| `undoTask(previous, expectedVersion)` | Compensating write back to `previous` | Refused when the task is no longer at the token the undone action produced, or when the rules forbid it now (`revertTask`) |
| `createTask(draft)` | New task, `state: "live"`, `source: "mytiv"`; no due date unless the user gave one | `parseQuickTask` for "מחר / גבוה / @שם / #לקוח"; an unknown `@` or `#` stays null and is never guessed; a done parent is not kept |
| `removeTask(id, expectedVersion?)` | The undo of a create | Refused when the task changed since it was created or has children |
| `logTime(id, minutes)` | `patchTask(logMinutes)`; the `TimeEntry` exists only if that write went through | `parseDuration` accepts `1:30`, `90`, `1.5h`, `45m`, within 1..1440 minutes |
| `timerStart(id)` / `timerPause` / `timerResume` / `timerStop` (store, not yet in `WorkCommands`) | One timer per person: a running one is stopped and logged first. Stop logs whole minutes (<30s logs nothing) through `logMinutes` | `switchTimer`, `pauseTimer`, `resumeTimer`, `minutesToLog` |

Shared screen actions live in `shell/task-actions.ts`: `useTaskGate` (role + capability), `useTaskUndo` /
`useCreateUndo` (versioned undo; a refused undo is explained and the toast does not say "בוטל"), `useRevertSync`
(undo after a confirmed ClickUp sync starts a revert sync), `useToggleDone`, `useBoardMove`.

## 4. Data types — field mapping to `auto/work-pkg1`

**Key:**
- **WI** = `WorkItem` (provider-neutral read).
- **T** = `tasks` row after `0012_work_expand`.
- **—** = not in pkg1 yet.

### `Task`

| Focus field | pkg1 source | Adaptation needed |
|---|---|---|
| `id` | WI `ref` (`{provider,id}`) / T `id` | **Required:** use `refKey(ref)` (`"mytiv:<uuid>"` / `"clickup:<id>"`) as the UI id so the providers cannot collide |
| `title`, `notes` | WI `title` / T `title`, `notes` | — |
| `status: WorkStatus` | WI `statusCategory`; T `status_category` + `status_id` (per-business `work_statuses`) | Map by category, see §5 |
| `statusLabel` | WI `statusLabel` / `work_statuses.label_he` | Shown when present |
| `priority` | T `priority` (`low\|medium\|high\|urgent`); WI `priority` (`urgent\|high\|normal\|low\|null`) | `normal` → `medium`. A null priority must render as "—"; **gap:** Focus `Priority` has no null yet (§8) |
| `assigneeId` | WI `assignee.ref` / T `owner_user_id` | Write path: ClickUp has `assign` (ops route). Mytiv legacy PATCH has **no** assignee field |
| `participantIds` | — | Missing in pkg1 |
| `startDate`, `dueDate` | T `start_on`, `due_on` (typed); legacy `due_date` text | Read the typed columns after the contract step |
| `estimateMinutes` | T `estimate_minutes`; WI `estimateHours` | ×60 |
| `spentMinutes: number \| null` | WI `TimeByItem.perItem[].hours` (read) | **null when the source does not report time** — never 0 |
| `subtasks: Subtask[]` | — | Missing (lightweight sub-items) |
| `checklist: ChecklistItem[]` | — (plan §6: `POST tasks/[id]/checklist`, `PATCH checklist/[itemId]`) | Planned |
| `parentId` | T `parent_id` (same business, FK) | Same-project rule in plan |
| `dependsOn: TaskRef[]` | — (plan §6: `POST tasks/[id]/dependencies`, `kind:'blocks'`, same project) | Planned |
| `links` | T `project_id`, `lead_id`; marketing `taskRef` / `clickupTaskId` | `proposalId` / `campaignId` missing |
| `context` | WI `projectLabel`, `groupLabel` | Adapter resolves labels |
| `nextAction`, `followUp` | — | Missing. In D3 they are saved with the blocked-task panel |
| `blockedReason` | — | Missing. Only on a `waiting` task, never blank (invariant); written through `patch.block` |
| `waitingFor` | T `waiting_on` (`client\|contractor\|internal`) + `labels.waitingOnLabel` | Free text in Focus. pkg1 has an enum, so the adapter maps it to a label |
| `comments`, `evidence`, `activity` | — (audit log exists for ops actions) | Planned |
| `source: "mytiv"\|"clickup"` | WI `ref.provider` | — |
| `state: "live"\|"planned"` | — (UI-only flag) | — |
| `version: string` | T `version` (int, stringified); WI `concurrencyToken` (opaque string; ClickUp `date_updated`) | Done in Focus: an opaque string the UI only compares for equality and never computes |
| `updatedBy` | audit actor of the last write | Used to name the writer in a conflict and to adopt the viewer's own writes |
| `statusKey` | T `status_id` → `work_statuses.key` | A business key `blocked` under category `waiting` is a manual block (§5) |
| `updatedAt` | WI `updatedAt` / T `updated_at` | — |

### Other types

- **`ActiveTimer`:** no pkg1 counterpart. Planned server timers, see §7.
- **`TimeEntry`:** no pkg1 counterpart. pkg1 reads ClickUp time only in aggregate (`TimeByItem`).
- **`TimeReportData`:** derivable from `timeByItem` for ClickUp. Mytiv-side time does not exist yet.
- **`WorkCapabilities`:** the keys of pkg1 `TaskSourceCapabilities` (minus `archive/trash`). Focus reads a
  **`CapabilityMap`** — each key `live` or `planned` — per source; the fixture `CAPABILITIES` is the truth table in §6.
- **`WorkRole`:** pkg1 membership role (text column; `owner`/`admin` checked by `assertWriter`).

## 5. Status mapping

| pkg1 category | Typical keys (`work_status_templates`) | Focus `WorkStatus` | Notes |
|---|---|---|---|
| `open` | `backlog` (לתכנון), `todo` (לביצוע) | `todo` | `statusLabel` keeps "לתכנון" |
| `active` | `in_progress` (בעבודה) | `in_progress` | — |
| `review` | `review` (בבדיקה) | `in_progress` + `statusLabel: "בבדיקה"` | The handoff W3 note expects per-business stages ("ממתין", "בבדיקה") |
| `waiting` | `waiting` (ממתין) | `waiting` | `waiting_on` supplies `waitingFor` |
| — | — | *(derived)* | **Not a status.** Canonical `WorkStatus` has no "blocked"; `displayStatus` derives it: an open `blocks` dependency, or a manual block = `waiting` + business key `blocked` and/or a written `blockedReason` (`isManuallyBlocked`). The text is `blockedWhy` / `manualBlockText` ("סומנה כחסומה במקור, בלי סיבה כתובה." when the source gave none). In the drawer "חסום…" is an action that requires a reason. Other domains (content cards, campaign rows) read it live with `blockedByTask`. |
| `done` | `done` | `done` | Closing uses the source's authoritative check (pkg1 rule) |
| `cancelled` | `cancelled` | `cancelled` | — |
| `unknown` | Unmapped source status | `unknown` | Never counted as done or active, shown as "? לא ממופה", no action branches on it (implemented: `canComplete`/`canStart` refuse; buckets put it in `unmapped`) |

## 6. Capabilities today (per pkg1) — what the UI labels "מתוכנן"

| Capability | Mytiv source (legacy `/tasks`) | ClickUp source (`TaskCommandSource`) |
|---|---|---|
| changeStatus | live: `PATCH /api/[slug]/tasks/[id]` `{status}`. Legacy enum; dual-write fills `status_category` | live: `PATCH /api/[slug]/ops/tasks/[taskId]` `{projectId, status, requestId, expectedUpdatedAt}` |
| assign | **planned**: no field in the allowlist | live: ops route `assignees: {add, remove}` (neutral refs) |
| create | live: `POST /api/[slug]/tasks` | planned |
| setDueDate | live: `{dueDate}` | planned |
| comment, trackTime, depend, checklist, nest | planned | planned |
| delete | live: owner/admin only (`assertWriter`) | — |

## 7. Optimistic updates, concurrency, errors

- **Write flow:** the UI validates with the pure rules first and sends the write with the token it last saw (the demo store applies it through the same rules).
  - **On success:** store the returned token. pkg1 plan: every write returns `requestId` and `version`.
  - **On `409 version`:** show `WorkStateView` `versionConflict` (mine vs theirs) and overwrite nothing. "שמור את שלי" re-sends with the new token; "קבל את של …" adopts the server copy. This is implemented in the drawer (`TaskDrawerHost`).
  - **On any other failure:** revert locally and keep the draft. In D3 a ClickUp sync failure keeps the change here, marked "טרם סונכרן", with retry.
- **Undo:** a versioned compensating write sent within the UI window (`UNDO_WINDOW_MS` = 10s, `lib/focus/state/undo.ts`), refused with the reason when the task moved on. For a domain window (e.g. a scheduled post) the undo stays available until that time.
- **Expected errors → UI:**

  | pkg1 code | Status | UI |
  |---|---|---|
  | `not_found` | 404 | `error` state "המשימה לא נמצאה" (list refresh) |
  | `field_not_allowed`, `nothing_to_update`, invalid input | 400 | Inline field error (never a toast-only error) |
  | `approval_role_required`, `owner_role_required`, same-origin | 403 | `permissionDenied`, controls hidden |
  | `command_not_supported` | 409 | The capability is shown as planned; the UI should never send it |
  | `move_blocked` (plan) | 409 | Refused move with the reason (board / drawer) |
  | version conflict (plan `expectedVersion`) | 409 | `versionConflict` |
  | `cross_project_dependency_not_supported` (plan) | 422 | Inline "תלות אפשרית רק בתוך אותו פרויקט" (already enforced client-side) |
  | `write_unverified_check_audit_before_retry` | 502 | `error` "לא ידוע אם השינוי נשמר — בדוק ביומן לפני ניסיון חוזר"; **no blind retry** |
  | `operation_unavailable_check_audit_before_retry` | 503 | Same as 502 |
  | ClickUp read `rate_limited` / `failed` (`WorkSourceError`) | — | `unavailable` (never an empty list; counts hidden when `complete:false`) |

## 8. Permissions and source capabilities

UI matrix: `canDo(role, action, caps?, allowPlanned)` in `state/work.ts` (unit-tested).
- **owner / admin:** everything.
- **member:** everything except delete.
- **viewer:** read and comment only.

With `caps` (the task source's `CapabilityMap`), an action whose capability is not `live` is refused — unless it is
`planned` and `allowPlanned` is set, which is true only in the fixture demo scope. Every write site checks both:
the drawer (`caps` + `allowPlanned`), and every quick action through `useTaskGate` (toggle done, Kanban move, assign
to me, follow-up, D3 save, timer start/stop). A planned write's toast says it ran in the demo only.
- **pkg1 today:**
  - ops commands (status/assign on ClickUp) and delete need owner/admin (`assertWriter`);
  - the legacy `/tasks` PATCH is open to any member of the business.
- **Plan §8:** the matrix moves into `work_authorize` in the DB (decision 12).
- **Gap:** pkg1 has no "viewer" role semantics and no per-project permission. Today the UI derives "צפייה בלבד" from a
  demo role switcher; a business scope's verified role is narrowed to `member` when unknown.

## 9. Timer lifecycle

`idle → running (startedAt, elapsedMs=0) ⇄ paused (elapsedMs accumulated) → stopped (TimeEntry minutes = ceil(elapsed/60s), <30s ignored)`

- **One timer per person.** Starting another task stops and logs the running one (`switchTimer`, toast with the logged minutes).
- **Demo persistence:** `localStorage` (`mytiv-focus-timer-v1`). It is re-anchored to the real clock on load, so it survives navigation and reload.
- **Integration (planned, not in pkg1):**
  - `POST /api/[slug]/work/timers` `{taskRef}` → `{timerId, startedAt}` (server clock is authoritative);
  - `PATCH …/timers/[id]` `{action: pause|resume}`;
  - `POST …/timers/[id]/stop` → `TimeEntry`;
  - `GET …/timers/active` on load and on focus;
  - a second device starting a timer returns `409 timer_running` with the active one, which the UI offers to switch.
- **Manual time:** `POST …/work/tasks/[id]/time` `{minutes, date}`.

## 10. Endpoint map (UI action → existing → planned)

| UI action | Exists in pkg1 | Planned (`/api/[slug]/work/…`, plan §6) |
|---|---|---|
| List my tasks / project tasks | `GET /api/[slug]/tasks` (legacy, Mytiv); ClickUp via `TaskQuerySource.items()` server-side | `GET work/tasks?scope=mine\|project&projectId=` → `{items, complete}` |
| Status change | `PATCH tasks/[id]` (Mytiv) · `PATCH ops/tasks/[taskId]` (ClickUp) | `PATCH work/tasks/[id]` `{status, expectedVersion, requestId}` |
| Assign | ClickUp ops route only | `PATCH work/tasks/[id]` `{ownerUserId}` |
| Create (quick) | `POST tasks` | `POST work/tasks` |
| Move on board | — | `POST work/tasks/[id]/move` (409 `move_blocked`) |
| Sub-tasks / parent | — (`parent_id` column exists) | `POST work/tasks` `{parentId}` |
| Checklist | — | `POST tasks/[id]/checklist`, `PATCH checklist/[itemId]`, `DELETE checklist/[itemId]` |
| Dependencies | — | `POST tasks/[id]/dependencies` `{kind:'blocks', on}` |
| Comments / activity | — (ops audit log exists) | `GET/POST work/tasks/[id]/comments`, `GET …/activity` |
| Timer / manual time / report | ClickUp `timeByItem` read | See §9; `GET work/time?range=&groupBy=` |
| Duplicate | — | `POST work/tasks/[id]/duplicate` |
| Delete | `DELETE tasks/[id]` (owner/admin) | Trash / restore (plan §3.1) |

## 11. What exists in `auto/work-pkg1` (local, not pushed)

- **Package 1:**
  - ADR-0001;
  - `/tasks` hardening (allowlist, tenant checks, same-origin, correct 404s);
  - provider-neutral `lib/work-source`;
  - leak-audit expansion.
- **PR 2:** read-only legacy tasks report.
- **PR 3:** `0012_work_expand` (additive). It includes:
  - `work_statuses`, `work_status_templates`, `work_status_revisions`;
  - typed task columns (`status_id`, `status_category`, `due_on`, `start_on`, `parent_id`, `owner_user_id`, `estimate_minutes`, `version`, `waiting_on`, …);
  - same-statement dual-write.
- **PR 4:** idempotent backfill.
- **Not applied anywhere yet.** Migrations, the role split and the prod report are owner gates.

## 12. What the backend still lacks for this UI

1. A work read API returning the neutral `WorkItem` with its concurrency token and `complete` flag, for mine and per project.
2. Write API under `/work` with `expectedVersion` + `requestId` and the conflict response.
3. Assignee, start date and estimate writes for Mytiv tasks.
4. Checklist, dependencies (`blocks`, same project), sub-task creation with `parent_id`, move with `move_blocked`.
5. Comments + activity feed per task.
6. Timers + manual time entries + time report for Mytiv tasks.
7. Fields with no column yet: participants, next action, follow-up date, blocked reason.
8. Viewer role / per-project permission enforced in `work_authorize`.
9. Per-business status vocabulary in the read model (`work_statuses` with labels) for the status select.

## 13. Integration order (proposed)

1. **Read path:**
   - an adapter maps `WorkItem` → `Task` (ids via `refKey`, token, category → status, null time → `spentMinutes: null`);
   - replace the fixture source behind `bucketsFor` / lists / board;
   - keep the demo store for writes.
2. **Status and assignee writes** through the existing routes, with the conflict and error mapping from §7. Capabilities come from the source.
3. **Create + due date** (Mytiv). The token is already opaque (`version: string`); map pkg1 `version` / `concurrencyToken` onto it.
4. **Hierarchy** (`parent_id`) and **checklist** once their endpoints exist. Remove those "מתוכנן" tags.
5. **Dependencies + move.**
6. **Comments / activity.**
7. **Timers + time entries + report.** Remove the `localStorage` timer.
8. **Remove the demo store** for work. Per-source capabilities come from the server.
