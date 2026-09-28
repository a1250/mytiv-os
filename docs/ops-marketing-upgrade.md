# Ops / Marketing OS audit and upgrade

Baseline: Ops `217e0e4bffe01471b0f78ca29c73901fe3a7c87a`; Marketing OS `8e9d2a839b058e543f604f194988d59f8d1f0896`. Audit date: 2026-09-10. Original repositories remain separate. Work is in an isolated checkout.

## Ownership decided before implementation

| Domain | Canonical owner | Ops responsibility |
|---|---|---|
| Business facts, verified gaps, priorities, strategy, monthly/weekly plans | Marketing OS / Business Brain | Versioned, provenance-labelled projection; no second strategy editor |
| Work status, assignees, execution deadlines, comments, operational decisions | ClickUp | Scoped reads and explicitly confirmed writes |
| App users, business memberships, client projects/specs | mytiv-web | Authenticate and map its business+project to a Marketing OS business |
| Marketing governance decisions (claims, budgets, publishing, skill promotion) | Existing Marketing OS approval queue | References only; task approval never grants publication or spend approval |
| ClickUp execution authorization and receipts | Ops | Durable actor/payload-bound audit and duplicate suppression |
| Media | Drive | References, no copied media |
| Events leads/quotes and revenue | mytiv-events CRM | References/aggregates, no duplicate CRM |
| Consent/customer records | Existing verified system of record (still to be confirmed) | No contact import or outbound messaging |
| Review runs, KPI provenance, process learning and skill lifecycle | Marketing OS | Due review dates and links; no automatic promotion |

Important tenancy difference: a mytiv-web business is the agency's access boundary; UMINO is a project within it. A Marketing OS tenant is the restaurant. Never equate the two slugs. An explicit server-controlled `(ops business, project) -> marketing business` mapping is required.

## Baseline findings and order

1. **P0 authorization:** task PATCH guards business membership but not task ownership. Copilot evidence/update/comment accept arbitrary task IDs. Project folder IDs are editable without workspace ownership enforcement. The shared ClickUp token makes these cross-business access paths.
2. **P0 execution governance:** proof is a prompt instruction; no server closure gate. Confirmation requests have no durable audit/idempotency record. Task creation can omit owner/date/definition of done despite the prompt. Fix these before adding execution integrations.
3. **P1 truthfulness:** ClickUp context failures become empty arrays and “none”; money summary can combine unknown costs and unrelated revenue. Preserve unavailable vs empty and unknown vs zero.
4. **P1 complementary planning:** introduce a read-only Marketing projection with priorities, schedule/dependencies, campaign/content/CRM/events references and review cadence. Imports validate scope/version/references and never write ClickUp. Preserve the existing Marketing approval authority.
5. **P2 integration automation:** signed delivery, outbox/reconciliation and verified publication/outcome receipts after manual contract acceptance. No automatic external writes in the first increment.

## Baseline validation

- TypeScript passed before changes.
- Full lint failed: 51 errors, 43 warnings, including existing non-Ops hooks and `any` usage. Earlier “lint clean” claim is not reproducible at this baseline.
- Existing `scripts/leak-audit.ts` mutates the first two real businesses and does not cover Ops/ClickUp. It must not be treated as proof of Ops isolation or run against production during this audit.
- Build, regression tests, live deployment status and remaining limitations are recorded below after verification.

## Integration acceptance contract

Manual authenticated import first. Payloads carry schema version, source revision, source timestamp and explicit marketing business. A server-side mapping chooses the allowed project; payloads cannot assign tenants or ClickUp folders. Reject stale/conflicting versions, duplicate item IDs, missing references, dependency cycles, invalid dates and unsafe URLs. Imported schedule status is marketing artifact state, never execution completion. Execution rows are read from ClickUp. Missing metrics stay unknown. Review dates do not create autonomous scheduled jobs. A public/financial marketing approval cannot be inferred from an Ops task confirmation.

## Production and live source evidence

The recorded public URL responded: `/login` 200, `/mytiv/ops` 307 to `/login`, and unauthenticated snapshot/projects/members APIs 401. This establishes availability and anonymous-access rejection only. The connected Vercel tool returned 404 for the locally recorded project/team; deployed commit and production environment settings remain unverified.

Read-only checks using the existing local configuration found five projects; 22 open ClickUp rows (including operational decision records), three or four lists per project, and no populated project briefs. No stored Claude API key and no local hourly-cost setting were present. The initial zero-hour result was from the original endpoint's default authenticated-user scope; it was not proof of missing contractor time. Corrected all-member time results are recorded in final verification.

The ClickUp [time-entry API documentation](https://developer.clickup.com/reference/gettimeentrieswithinadaterange) confirms that other users require explicit `assignee` IDs and workspace owner/admin permissions. The adapter now requests all returned workspace members and fails rather than assuming coverage when no members are available.

Runtime audit initially reported 4 findings (3 high, 1 critical). Next.js 16.2.12 is affected by the [AVIF optimizer advisory](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4). Next.js and its ESLint configuration are upgraded to 16.3.4; final dependency audit is recorded below. This is vulnerability remediation, not proof that the production site was exploited.

## Delivery and rollout

1. Review this branch and run `npm ci`, `npm test`, the changed-file lint check and production build. Existing repository-wide lint failures remain a separate backlog; do not suppress them globally.
2. Apply migrations 0005–0007 to an isolated staging database first. All baseline plus new SQL migrations and fixture database constraint tests were exercised locally. New history tables are append-only, with composite tenant/project/actor foreign keys. Existing data is retained.
3. Apply the migrations before deploying this code. Missing audit storage blocks writes. Do not roll back history tables or remove their triggers to retry an uncertain action.
4. The existing ClickUp token remains restricted by the checked-in per-business folder allowlist. Adding a client folder requires explicit operator configuration, not an arbitrary editable ID. Additional businesses must receive an explicit allowlist; there is no default shared workspace access.
5. Set `OPS_MARKETING_BINDINGS` as a server-only JSON object mapping `"<ops-business-slug>:<project-uuid>"` to `"<marketing-business>"`. Obtain the actual UUID from the tenant-scoped project record; do not guess or equate restaurant and agency slugs. No binding is enabled by this branch.
6. Validate an actual authored planning export using `node --import tsx scripts/validate-marketing-plan.ts <marketing-business> <plan.json>`. `docs/marketing-plan.fixture.json` is synthetic test material only, never UMINO business evidence. The canonical shape is `lib/marketing/contract.ts`.
7. An owner/admin previews the JSON and confirms import in the Marketing tab. Each new source revision must increase `revision`. Preserve `sourceRevision`, `asOf`, evidence references and review source links. This is a manual import boundary; no authenticated marketing-os HTTP service or automated delivery is claimed.
8. Marketing approval references stay references. Approve budgets, claims, publishing and skill promotion in the existing Marketing OS queue. Ops never interprets a task confirmation as authorization for these actions.
9. Reconcile an uncertain write in ClickUp and inspect `ops_actions` / `ops_audit_events` before a new request. Duplicate request IDs fail closed; the system does not promise exactly-once external delivery or retry an uncertain write.

## Deferred capabilities and remaining verification

- Authenticated browser acceptance against staging, verified deployed revision, production environment configuration and real external write/readback acceptance are still required before rollout. No production writes or migrations were performed.
- Marketing OS Control Center has a preference-based actor cookie and a navigation-only proxy, not the Ops membership boundary. Keep it local/private; importing its business logic does not make it safe to expose publicly.
- A bidirectional automated connector, signed webhooks, reconciliation workers, task creation from a marketing item and outcome-to-learning feedback are subsequent increments. First establish real plans/data and operational acceptance.
- CRM/event metrics and customer consent remain with their existing source systems. This release references campaign/content/CRM/events artifacts; it does not invent revenue, consent or attribution data.
- Review cadence displays explicit due dates. It does not schedule hidden jobs or auto-approve reviews.
- Existing ClickUp board pagination caps at 20 pages; large boards require explicit completeness handling. Comment evidence reads the current API page, not a full historic attachment review. Human review remains required; a recording URL is not machine proof that a repair worked.

## Final verification — 2026-09-11

- **30 regression tests pass**: 18 deterministic/adapter checks and 12 HTTP/proposal/audit tests, including foreign-project access, custom terminal status without evidence, concurrent duplicate claims, audit failure before mutation and unknown external outcomes. Route tests mock the database and ClickUp transport; they are not live write acceptance tests.
- **Marketing OS baseline: 80/80 tests pass** in an isolated clone. No skill promoted, brain edited or live plan approved.
- **PostgreSQL**: all baseline and new migrations applied successfully to an isolated local database. Fixture checks cover cross-business project/receipt foreign keys, duplicate claims/revisions and append-only history. An advisory transaction lock serializes snapshot imports, so an older revision cannot supersede a newer one through concurrent submissions.
- **TypeScript and changed/new code lint pass.** Repository-wide lint still reports 51 errors and 44 warnings, all outside the Ops/Marketing module paths. These are not hidden by an eslint override. The full baseline had 51 errors and 43 warnings; the dependency upgrade changed the full diagnostic set.
- **Runtime dependency audit: zero known findings** after upgrading Next.js/eslint-config-next to 16.3.4 and refreshing the vulnerable nanoid patch. This refers to `npm audit --omit=dev`; existing tooling/development advisories remain separate, and is not a claim of universal security.
- **Browser**: synthetic Marketing panel rendered, source/freshness/priority/schedule/review content inspected, invalid JSON plan rejected and valid plan showed an explicit import approval button. Browser reported no errors. No import was submitted. Temporary fixture route removed from delivered code.
- **Live read-only recheck**: all-member time request completed for all five projects with zero returned hours over the last 30 days. This is the API result for the accessible workspace, not proof of zero work. Claude key still absent, local hourly rate absent and five project briefs empty.
- **Deployment**: no production database migration, external write, deployment or merge was performed. The final build result is noted in the delivery receipt. Authenticated staging acceptance and real marketing business/project mapping remain rollout gates.

## Prioritized operational follow-up

| Priority | Next action | Acceptance evidence |
|---|---|---|
| P0 | Stage the migrations and patched release, verify using owner/member and two-business sessions | Actual HTTP rejection/allowance, one confirmed fixture task update with evidence and receipt, deployed commit recorded |
| P1 | Configure the business Claude key and contractor rate; fill each project's spec | Successful scoped chat, actual recorded costs, owner-reviewed specs |
| P1 | Establish time-reporting practice | Entries for the relevant contractors and period, coverage verified against ClickUp |
| P1 | Bind UMINO's Ops project to the Marketing OS business and import the first real plan | Explicit UUID mapping, versioned source plan, owner-reviewed priorities and valid dependencies |
| P2 | Connect measured outcomes and review results back to Marketing OS | Read-only CRM/reservation/media data with as-of/provenance and real review evidence |
| P2 | Consider automated transport only after manual acceptance | Authenticated contract, replay/expiry controls, reconciliation and no duplicate approval authority |

### Delivery receipt

Final clean Next.js **16.3.4 production build passed**, including TypeScript, page-data collection and static generation. Used fixture-only database/QStash settings; external access was only needed for the configured Google Fonts downloads. No temporary preview route remains. A client-bundle marker scan found no ClickUp token, secrets master key, QStash signing key or fixture database URL markers. This limited scan supplements the server-only imports and does not certify the absence of every possible secret.

Code delivered on `codex/ops-marketing-integration` in an isolated `mytiv-web-audit` checkout. Original repositories remain separate. Screenshot evidence is a synthetic UI preview, not production data. Production rollout and authenticated acceptance remain outstanding as listed above.

## Review of 654eb7a and fixes — 2026-09-11

Reviewed in `~/Projects/mytiv-web` on `codex/ops-marketing-integration` (branch fetched from the isolated checkout; `main` untouched at 217e0e4). Verification before any change: `npm ci`, `tsc --noEmit`, `npm test` (18 + 12), changed-file lint, `npm audit --omit=dev` (0), production build with fixture-only env (client bundle scanned, no secret markers), migrations 0000–0007 applied to an isolated local PostgreSQL 17 and `tests/ops-database.sql` run there, ClickUp reads only (`ops:check`: 5 folders, 20 open rows), and one read-only SELECT on production confirming all 5 project folder IDs are on the allowlist and that `ops_actions` / `ops_audit_events` / `marketing_snapshots` do not exist there yet (5 of 8 migrations applied). No production migration, deployment, or ClickUp write was performed.

### Fixed in this commit

1. **Migration 0007 — glued statement breakpoint.** Line 4 read `--> statement-breakpointALTER TABLE …`. `drizzle-orm`'s migrator splits on the marker string and applied the statement; `psql` (and any SQL console) treats the whole line as a comment and **silently skips the composite `(business_id, project_id) → projects` foreign key on `marketing_snapshots`** — observed on the isolated database, where `tests/ops-database.sql` still reported PASS because the cross-business insert was rejected by the membership FK instead. Fixed with a newline. `tests/ops-database.sql` now asserts both composite project FKs exist in `pg_constraint` and, with a user who is a member of both businesses, checks via `GET STACKED DIAGNOSTICS` that a cross-business snapshot and a cross-business claim are rejected **by those constraints specifically**. Proven: with the FK dropped the test fails (`composite (business_id, project_id) FK missing on marketing_snapshots`); on a fresh database with the fixed file it passes.
2. **A project whose folder is outside the allowlist no longer takes the screen down.** `listProjects`/`getProject` threw `folder_not_authorized` on read, and the Projects, Money and workspace pages did not catch it — one bad row would 500 every project page for the business. Reads now return the row annotated with `folderState: "linked" | "unlinked" | "unauthorized"` (one joined query instead of one extra query per row); `folderFromProject` yields no folder for an unauthorized row, so no page, route or copilot can read or write it (route test: 404, zero writes). Writes (`createProject`/`updateProject`) still refuse an unauthorized folder with 403. The hub shows "ClickUp folder not authorized for this business — tasks not read" and `—` instead of counts for any project that was not actually read; the workspace header and empty task/bug tables name the state instead of "No open tasks"; the copilot context reports it as UNKNOWN. Money excludes unauthorized projects from its rows.
3. **A pasted recording URL is no longer treated as a human review.** The Tasks tab set `evidence_reviewed` to `Boolean(evidenceUrl)`. It now asks a second, explicit confirmation ("I watched this recording and verified the definition of done."); declining aborts client-side with a visible message, and `evidence_reviewed` can only be true through that answer (`lib/ops-closure.ts`, shared with the copilot confirm card). The server was and remains the enforcement point: `assertClosure` refuses a closing status without `evidence_reviewed === true` **and** an exact attached URL. Tests: URL without confirmation → not reviewed and refused; confirmation without URL → refused; URL + confirmation but not attached → refused; route with `evidence_reviewed: false` → 409, zero writes.

### Documented limitation — Money screen

Zero logged hours is treated as unknown cost (`null`), not ₪0, because untracked time is not evidence of no work. Consequently the Money screen **cannot distinguish a month with no work from a month with no time reporting**; both show "—". This stays until a time-reporting practice exists (see the P1 follow-up above). Comment added at `lib/money.ts` where the rule lives.

### Not changed

No rollback / pre_state / post_state, no new feature, no schema change, no production migration, no ClickUp write. Activation still requires: migrations 0005–0007 on production (after staging), `OPS_MARKETING_BINDINGS` with the real UMINO project UUID, and a separately planned, explicitly approved ClickUp write test on a dedicated fixture task.

### Results after the fixes

`tsc` clean · `npm test` **20 + 14 pass** (was 18 + 12) · changed-file lint clean · production build passes (fixture env, client bundle clean) · `tests/ops-database.sql` PASS on a fresh isolated database built from the fixed migrations.

## Audit record and controlled rollback — 2026-09-14

No schema change. Everything below lives in the existing `ops_actions` / `ops_audit_events` tables (jsonb `detail`), still append-only by trigger. No production migration, deploy or ClickUp write was performed; ClickUp was an in-memory fixture behind a mocked transport.

### Data model (per governed write)

`ops_actions` row = the claim: actor (`user_id`), business, project, `request_id` (unique per business), `action`, payload hash, timestamp.
`ops_audit_events` rows, in order:

| event | detail |
|---|---|
| `confirmed` | `actor`, `approval { requestId, evidence_url, evidence_reviewed }`, `action`, `target { kind: task \| list \| project \| action, id }`, `payloadHash`, `rollback_eligibility` (`"eligible"` only for `update_task`; creations carry `{ not: "no_delete_capability" }`) |
| `succeeded` | `result` (ClickUp response summary/url), `external_ref { taskId, url, date_updated }`, `pre_state`, `post_state` |
| `rejected_or_unknown` | the operation itself declined (`ok: false`); nothing verified as written |
| `refused_before_write` | deterministic policy refusal before any external call (the rollback guards) |
| `failed_or_unknown` | `phase` ∈ `before_write` / `write_outcome_unknown` / `after_write_unverified`, plus `pre_state` when it was read before the failure |
| `rolled_back` | appended to the **original** action by a later `rollback_task`: `by_request_id`, `restored_to`, `restored_state` |

`pre_state` / `post_state` are `TaskSnapshot`s: task id, list id, status, assignee ids, due date (ms), `date_updated`. Identifiers only — no names, emails, titles or comments ever enter the log (`lib/ops-snapshot.ts`, tested).

### Write flow (`update_task`, both the Tasks tab and the copilot confirm)

guard → writer role → same-origin + `confirmed` + UUID request → project in this business → fresh scoped task read (list membership) → closure evidence if closing → **claim** → `confirmed` event → `updateTask`: fresh read (**pre**) → if the caller said which `date_updated` it saw (`expectedUpdatedAt` from the board row; the copilot uses the task in its own context) and the task moved on → `409 task_changed_since_read`, nothing sent → PUT → read-back (**post**) verified against the patch; a read-back that fails or disagrees throws `ClickUpWriteUnverifiedError` → HTTP 502 `write_unverified_check_audit_before_retry` and `failed_or_unknown { phase: after_write_unverified, pre_state }` → otherwise `succeeded { pre_state, post_state, external_ref }`.

### Rollback flow (`POST /api/[business]/ops/actions/[actionId]/rollback`)

Human-only; not in `CONFIRM_REQUIRED`, so the copilot cannot propose it (`tool: rollback_task` via `/chat/confirm` → `invalid_action`). Same gate as every write. The rollback is itself a claimed `rollback_task` action, so a refusal leaves a receipt and the same request id can never be replayed. Order, fail-closed:

1. action exists for **this business and project** — otherwise 404, and no ClickUp call is made
2. `action === update_task`, else 400 `rollback_unsupported_for_action`
3. not already `rolled_back`, else 409
4. has a `succeeded` event with verified `pre_state` and `post_state`, else 409 `outcome_unknown` (a partial/unverified write is never auto-reversed)
5. task still exists and is in this project's folder, else 409 `target_missing`
6. task `date_updated` equals the original `post_state`'s, else 409 `task_changed_since_action` — covers a ClickUp edit, a later Ops write, and any double rollback
7. reverse patch computed from the stored states (only fields that changed); nothing to undo → 409; a reverse that would set a `done`/`closed` status → 409 `rollback_would_close_task_use_normal_flow`
8. the reverse write goes through the same `updateTask` with `expectedDateUpdated = post_state.dateUpdated` (re-checked at the instant of writing), captures its own pre/post, and appends `rolled_back` to the original.

There is no delete anywhere in this path or in the codebase.

### Tests (all green: `npm test` = 24 node + 26 vitest; `tests/ops-database.sql` PASS on isolated PostgreSQL 17)

`tests/rollback.vitest.ts` drives the real routes against an in-memory ClickUp task and audit store with the SQL's tenant scoping:
(0) a governed write records actor, approval, target, eligibility, pre/post and external ref, with no personal data · a stale row is refused before any PUT · creations are recorded non-reversible and rollback of one is 400 ·
(1) normal update + rollback — exactly one reverse PUT `{status, assignees.rem}`, task restored, rollback action has its own pre/post, original carries `rolled_back` · a reverse that would close is refused ·
(2) partial external failure — PUT landed, read-back 404 → 502, `after_write_unverified` with `pre_state`; rollback refused `outcome_unknown` ·
(3) target deleted externally → 409 `target_missing`, zero writes, `refused_before_write` receipt ·
(4) state changed after the original write (external edit, and a later governed write) → 409 `task_changed_since_action`, zero writes ·
(5) duplicate rollback — same request id → 409 claimed; new request id after success → 409 `already_rolled_back`; exactly one `rolled_back` event ·
(6) unauthorized — member 403, unconfirmed 400, cross-origin 403, copilot `invalid_action` ·
(7) cross-tenant — another business's owner → 404 with **zero** ClickUp calls; wrong project in the same business → 404.
`tests/ops-security.test.ts` adds pure checks for snapshot shape/leak-freedom, reverse-patch minimality, the change-marker comparison and eligibility.

### Not verified here (remains for O2/O3)

Real ClickUp acceptance of `due_date: null` to clear a date, real `date_updated` semantics on assignee-only changes, and the Tasks-tab / audit-log UI under a real session. These are exactly the things a mocked transport cannot prove.

## O2 — staging verification — 2026-09-14

### Staging topology

| Layer | What | Isolation |
|---|---|---|
| Database | Neon project `green-feather-79805522`, **branch `ops-staging`** (`br-jolly-forest-awdg2zbo`), endpoint `ep-aged-glitter-…` — created as a **schema-only** branch (no production rows), then `public`/`drizzle` schemas dropped and **migrations 0000–0007 applied with `drizzle-kit migrate`** (8 recorded). `tests/ops-database.sql` PASS there; 2 composite project FKs and all 7 append-only/order triggers present. | Production endpoint `ep-orange-fog-…` untouched: still 5 migrations, no ops tables (SELECT-only check). A dedicated Neon *project* was refused by the API ("organization is managed by Vercel"). |
| Fixtures | `scripts/staging/seed-staging.mjs`: Business A `mytiv` (Mytiv — staging; owner-a, member-a; projects UMINO-staging→folder 901816026303 *linked*, Unauthorized-folder→999000111, Unlinked), Business B `second-business` (owner-b; B project→999000111 *unauthorized*). Fixed, distinct UUIDs (`aaaaaaaa-…` / `bbbbbbbb-…`). 3 users, 2 businesses, 3 memberships, 4 projects, nothing else. | No production data. Fixture password lives only in `.env.staging` (gitignored). |
| App | `scripts/staging/dev.sh` → `next dev -p 3100` with `.env.staging` over the process env (beats `.env.local`); **refuses to start** if `DATABASE_URL` equals production or `CLICKUP_API_BASE` is not the local mock. | Startup line observed: `db host ep-aged-glitter-…-pooler · clickup http://127.0.0.1:4545/api/v2`. |
| ClickUp | `scripts/staging/clickup-mock.mjs` on 127.0.0.1:4545 — stateful stand-in (PUT bumps `date_updated`, comments too, 404 on missing task, `/__state`, `/__reset`). `CLICKUP_API_BASE` is the only app change needed. | **No real ClickUp task was read or modified.** Mock request log: 95 requests, 8 writes, **0 touching the unauthorized folder/list/task**; `X-1` unchanged. |
| Binding | `OPS_MARKETING_BINDINGS='{"mytiv:aaaaaaaa-1111-4000-8000-0000000000a1":"umino"}'` (single-quoted — see bug #1). | |

### Auth matrix (real HTTP, `docs/staging/o2-http-matrix-2026-09-14.md`, 67/67)

| Session | Pages `/mytiv/ops*` | Reads `/api/mytiv/ops/*` | Writes | Rollback |
|---|---|---|---|---|
| D · unauthenticated | 307 → `/login` | 401 | 401 | 401 |
| A · UMINO owner (owner-a) | 200 | 200 | allowed, governed | allowed, governed |
| B · UMINO member (member-a) | 200 | 200 | **403 `approval_role_required`** on task PATCH, copilot confirm, project POST/PATCH, marketing import | **403** |
| C · owner of second business (owner-b) | **404** (`/mytiv/ops`, hub, workspace) | **404 not found** (projects, project, members) | 404 on A's task | **404** via A's slug; **404** via own slug with A's action id |

Also: owner-a → `/second-business/ops` 404; owner-a → B's project id through A's API 404; owner-b → own project 200; owner-b → `/api/second-business/ops/members` **503 `clickup_not_configured`** (no allowlist → not configured, not an empty list).

### Route matrix — governance (owner-a)

| Check | Result |
|---|---|
| missing `confirmed` | 400 `explicit_confirmation_required` |
| task under a project whose folder is outside the allowlist | 404, task never looked up (mock log) |
| closing status without reviewed evidence | 409 (server message) |
| repoint a project to a non-allowlisted folder | 403 `folder_not_authorized` |
| marketing import on an unbound project | 409 `marketing_not_connected` |
| stale row (`expectedUpdatedAt` older than the task) | **409 `task_changed_since_read`, 0 writes**, `failed_or_unknown{before_write, pre_state}` recorded |
| governed write | 200; mock task `review / [1001,1002]`; audit `confirmed{eligible, target task:STG-1} → succeeded{pre_state, post_state, external_ref}` |
| same `requestId` replayed | 409 `request_already_claimed_check_audit_before_retry` |
| copilot `add_comment` confirmed | 200; audit eligibility `{not: no_delete_capability}` |
| copilot `rollback_task` / `delete_task` | 400 `invalid_action` |
| rollback (owner) | **200**, mock task back to `working / [1001]`, `rollback_task` action with own pre/post, `rolled_back` on the original |
| same rollback request replayed / second rollback | 409 claimed / 409 `already_rolled_back` |
| rollback after the task changed in ClickUp | 409 `task_changed_since_action`, 0 writes — *a comment added since also blocks it, by design (`date_updated` moves)* |
| rollback by member / cross-tenant / wrong project / unconfirmed | 403 / 404 / 404 / 400 |

Audit rows read back from the **staging DB** (not the mock): 9 actions, 19 events, both businesses; no name/email/title anywhere in `detail` (regex scan = 0).

### Browser QA (Browser pane, real sessions, fixture accounts)

| Screen | owner-a | member-a | owner-b |
|---|---|---|---|
| Ops Home | counts from the linked folder only | same | **"—" for all four tiles** + "No project is linked…" (was `0` — bug #4, fixed) |
| Project Hub | UMINO staging `0 stuck / 3 open / 1 overdue`; Unauthorized folder **"— / —" + "ClickUp folder not authorized … tasks not read"**; Unlinked "— / —" | same | B project "— / —", not authorized |
| Workspace tabs (A1) | סקירה · משימות 2 · תקלות 1 · החלטות 1 · שיווק · קופיילוט | same, **task controls disabled** ("Owners and admins only" — bug #5, fixed); a forced change → 403 + "Change reverted" | 404 |
| Unauthorized folder workspace (A2 / B1) | header "…is not authorized for this business — tasks not read"; משימות tab: "tasks were not read" (not "No open tasks") | same | same on B1 |
| Evidence review wording | closing with a pasted URL asks **"I watched this recording and verified the definition of done."**; declined → toast "Not sent — closing needs the recording to be reviewed first.", **no request**; accepted → PATCH 200, task `done`, audit `approval{evidence_reviewed:true, evidence_url}` | controls disabled | — |
| Rollback | שחזר shown only on eligible rows; confirm text "לשחזר את המשימה למצב שלפני הפעולה? ClickUp יעודכן."; declined → no request; accepted → POST 200, task restored, row now "rolled back …"; on a changed task → 409 with "המשימה השתנתה ב־ClickUp מאז הפעולה — לא שוחזר…" | **0 buttons** | — |
| Approval card (copilot) | "No Claude API key is configured for this business" — **not exercisable** without a key (blocker) | — | — |
| Marketing tab | bound: "טרם יובאה תוכנית… לא מוצגים נתוני דוגמה"; plan for `fixture` refused ("אינה מתאימה לעסק המקושר"); plan for `umino` previewed → imported (POST 200) → schedule rendered, item linked to STG-2 shows `review · ללא אחראי`; unbound project: "לא חובר" | import control hidden | — |
| Money | `0 hours logged`, cost/revenue/margin **"—"**, "cost per client is unknown — not zero", "No time tracked in ClickUp, so cost is unknown rather than zero"; only the linked project listed | — | — |

Native dialogs are suppressed in the pane; they were observed via a `confirm`/`prompt` stub that records the wording — the declined path is the pane's default (returns false).

### Tenant isolation

Cross-business pages/API/writes/rollback → 404 (no existence disclosure); B's own audit shows its probe as `rollback_task · refused_before_write (not_found)`; the unauthorized folder (`999000111`) received **zero** requests across the HTTP matrix and the whole browser session; composite `(business_id, project_id)` FKs enforced on the staging DB (`ops-database.sql`).

### Bugs found in staging — all fixed in this commit

1. **`OPS_MARKETING_BINDINGS` malformed → every marketing call answered `400 invalid_json`.** Root cause in staging: `bash` sourcing stripped the JSON quotes. App-side: `marketingBinding` threw a raw `SyntaxError`. Now fails closed to "not connected" with a server log; moved to the pure `lib/marketing/binding.ts` and unit-tested.
2. **Stale board after a write.** The ClickUp read cache is per process; a write in one instance does not invalidate another's copy, so a reload right after a write showed the old status (STG-1 "review" while ClickUp said "working"), and the next write would be refused as changed-since-read against a stale marker. The client workspace (the only screen that writes) now reads the board fresh; dashboards keep the cache.
3. **Rollback success feedback vanished** (the button unmounts once the action is no longer eligible). Feedback now goes through the page toaster; refusal reasons also appear inline and in the audit rows (`refused_before_write (task_changed_since_action)`).
4. **Ops Home rendered `0 / 0 / 0 / 0` when nothing was read** (no linked folder, ClickUp down). `StatTiles` now takes `null` and renders "—".
5. **Members were offered task controls the server refuses.** Status/owner selects are disabled for members with "Owners and admins only"; the server 403 remains the enforcement.

Not bugs, recorded: a comment on a task moves `date_updated` in ClickUp, so rollback after a comment is refused — strict by design; Money shows `0 hours logged` next to "—" cost (the documented no-work vs no-reporting ambiguity).

### O3 fixture plan

`docs/o3-clickup-fixture-spec.md` — folder `OPS-STAGING` (owner-created, added to the allowlist as `internal`), list `Tasks` with `to do/working/review/done`, task `STAGING-ROLLBACK-1` (`working`, one owner assignee, no due date, DoD in description, one `.mp4` attached); expected update `working→review` + second assignee + due date +7d; expected rollback reverses all three including `due_date: null`; cleanup by hand in ClickUp. Not run.

### Remaining blockers

| # | Blocker | Owner |
|---|---|---|
| 1 | **O3** — real ClickUp write/rollback on the fixture task: needs the folder created, the allowlist line reviewed, and explicit approval | owner |
| 2 | Claude key for the business (approval card not exercisable), contractor rate, project specs, time-reporting practice | owner |
| 3 | Production: migrations 0005–0007 (`drizzle-kit migrate` — the exact command proven on staging), env `OPS_MARKETING_BINDINGS` with the **real** UMINO project UUID, deploy, verify deployed commit | owner |
| 4 | Neon: a truly separate staging *project* is not creatable via API in a Vercel-managed org; the schema-only branch is the isolation we have | owner (Vercel dashboard) if wanted |

**O2 STAGING VERIFIED — READY FOR OWNER APPROVAL FOR O3**
