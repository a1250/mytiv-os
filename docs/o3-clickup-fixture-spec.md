# O3 — real ClickUp write test: fixture specification (NOT yet approved, NOT yet run)

Purpose: prove, once, against the real ClickUp API, the three things a mocked transport cannot —
that a governed `update_task` lands and reads back, that `due_date: null` clears a date, and that
`date_updated` behaves as the rollback guard assumes (including on an assignee-only change).
One task, created by the owner for this purpose, never a client task.

## Fixture (owner creates by hand in ClickUp — the API cannot create custom fields, and we do not want the app creating folders)

| Item | Value |
|---|---|
| Space | any non-client space in workspace 90182347023 |
| Folder | `OPS-STAGING` — **must then be added to `OPS_CLIENT_FOLDERS.mytiv` in `lib/ops-config.ts`** with `key: "ops-staging"`, `internal: true`; this is a code change reviewed like any other, not a fixture patch |
| List | `Tasks` (name must match the alias so it classifies as `tasks`) with statuses: `to do` (open) · `working` (custom) · `review` (custom) · `done` (closed) |
| Task | `STAGING-ROLLBACK-1` |
| Initial status | `working` |
| Initial assignee | the owner's own ClickUp user (exactly one) |
| Initial due date | **none** (so the update sets one and the rollback must clear it) |
| Description | `**Done when:** this task has been updated and rolled back by Ops with matching audit receipts` |
| Attachment | one small `.mp4` (any recording) — needed only for the optional closing check |

Staging app: `.env.staging` with `CLICKUP_API_BASE` **unset** (real API), the real token, and a
project in Business A pointing at the `OPS-STAGING` folder id. `OPS_CLIENT_FOLDERS` is the only
thing that lets the app read it; the other client folders stay untouched by scope.

## Expected update (one governed write, owner session, Tasks tab)

status `working → review`, assignee: add a second workspace member, due date: set to a date 7 days out.
Expected audit: `confirmed` (eligible) → `succeeded` with `pre_state {working, [owner], due null, date_updated d0}` and
`post_state {review, [owner, second], due d7, date_updated d1 > d0}`; the ClickUp task shows exactly that.

## Expected rollback (audit log → שחזר → confirm)

Reverse patch `{ status: "working", assignees: { rem: [second] }, due_date: null }`. Expected: HTTP 200, task back to
`working / [owner] / no due date`, `rollback_task` action with its own pre/post, `rolled_back` on the original,
and a second שחזר → `already_rolled_back`. Then: edit the task title by hand in ClickUp and attempt a rollback of a
fresh write → `task_changed_since_action` (proves the real `date_updated` moves on a non-field edit).

## Also to observe (record, do not assert)

- whether `date_updated` changes on an assignee-only PUT (if it does not, the guard is weaker for that field — document)
- the exact 404 body when the task is deleted (the app maps `ClickUpError 404 → target_missing`)

## Cleanup

1. Delete `STAGING-ROLLBACK-1` **by hand in ClickUp** (the app cannot delete, by design).
2. Remove the `OPS-STAGING` folder or leave it for future O3 runs (owner's choice); if removed, revert the `ops-config.ts` line.
3. The staging database keeps the audit rows — that is the point; they are fixture data, not client data.

## Approval line

Nothing above runs until the owner writes the approval explicitly, names the folder id, and confirms the task exists.
