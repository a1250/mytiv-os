# Focus redesign — independent review packet

Prepared 2026-10-06 for the final independent re-check of the Focus (Direction C) frontend, after the first review's
findings, three self-review rounds, two verification rounds and the final review's one P2 family (§3, last table). Draft PR only: **no merge, no deploy, no backend integration.**

| | |
|---|---|
| Repository | `a1250/mytiv-os` — draft PR a1250/mytiv-os#9 |
| Branch | `auto/focus-redesign` |
| Base branch | `auto/preview-mvp-app` (draft a1250/mytiv-os#8, stacked on #7 → `main`) |
| Base SHA | `e35a189f7cbb545bdf1c7dd0a70c860bf3ea5031` — unchanged since the branch forked |
| Head reviewed the first time | `62fbb6e` |
| Final implementation SHA | `a1d02fd7cadddc05519c8634223f92aff7cafa45` — every number below was measured here |
| Packet commit | this file is committed on top of `a1d02fd` (docs only; it changes no code) |
| Diff vs base | 298 files changed, 43248 insertions(+) — purely additive outside `.gitignore` |

## 1. The first independent review — findings and fixes

| Finding | Fix | Where | Proven by |
|---|---|---|---|
| **P1** Focus bypassed the authenticated tenant boundary (`/focus`, fixtures for anyone) | Focus moved under the tenant segment `/{businessSlug}/focus`; the server layout resolves the scope like `api-guard`: session → membership → the business row (never the URL/query). Only the fixture demo scope `/_demo` renders fixtures, and only where prototype surfaces are on; a member business sees an honest "not connected yet" page. Every page and its metadata are scope-guarded. | `lib/focus/scope.ts`, `lib/focus/scope.server.ts`, `app/(focus)/[businessSlug]/focus/layout.tsx`, every `page.tsx`, `components/focus/shell/{scope,not-connected}.tsx`, `components/focus/ui/link.tsx` | `tests/focus-scope.vitest.ts` (25: decisions, real redirect/notFound wiring, static route-tree guarantees); `prod-surfaces.mjs` production 18/18; mutation: tenant guard, session, prototype switch, fixtures for a business, notFound, a page's guard, scoped links — all caught |
| **P2** Prototype QA/reference surfaces reachable in production | Screen map, reference frames, phone-frame and `work/task` redirects, demo controls and the remote-edit control exist only in the demo scope (page **and** `generateMetadata`); the demo scope 404s in any production build | same + `requireDemoScope`, `fixtureMetadata` | `prod-surfaces.mjs` production 18/18 (404 with no prototype/fixture text, forged cookies and scope-making query params → `/login`), preview 6/6 |
| **P2** Blocked state could violate the Work contract (blocked without a reason) | "Blocked" is derived, never stored: canonical `WorkStatus` has no blocked; a manual block = `waiting` + business key / written reason; `applyPatch` refuses a block without a reason and checks the stored-task invariant on every write and on hydrate | `lib/focus/contracts/{status,work}.ts`, `lib/focus/state/work.ts`, `components/focus/patterns/work/task-drawer.tsx` | `tests/focus-work.vitest.ts` (derivation, refusals, reason lifecycle, fixture invariant, a 2,000-step randomised patch/move run); mutations: block guard, invariant, canonical status, Kanban storing blocked — caught |
| **P3** PR / packet metadata drift | Packet regenerated from git at the final SHA; PR description rewritten to the final state | this file | — |

## 2. What to review

- `docs/focus/ARCHITECTURE.md` — tenant scope, layers, the demo store's write path, the one navigation guard, conventions;
- `docs/focus/mytiv-work-contract.md` — Work UI ↔ `auto/work-pkg1` contract: commands, opaque token, derived blocked, capabilities per control, errors, integration order;
- `docs/focus/QA.md` — gates, per-screen visual QA, open issues by severity;
- `lib/focus/{scope,scope.server}.ts`, `lib/focus/state/*`, `components/focus/shell/{demo-store,nav-guard,task-actions,task-drawer-host,use-queue}.ts(x)` and `tests/focus-*.vitest.ts` — where the rules live and are tested.

`components/focus/reference/*` is the generated handoff conversion, served only in the demo scope as a visual record; no product route imports it (`routes.mjs` enforces it).

## 3. Self-review — findings and fixes

Three independent review rounds over the whole Focus diff (security/scope/navigation, state/flows/writes, a11y/quality/docs), each followed by fixes, regression tests and a full re-run, then two verification rounds on those fixes (round 4 re-checked round 3, round 5 re-checked round 4) until nothing above P3 remained. Severity: P1 = security / tenant leak / data loss / false claim of an external effect / broken core flow; P2 = a real defect a user hits; P3 = minor.

### Round 1 (whole diff, after the first review's fixes)

| Sev | Finding | Fix | Files |
|---|---|---|---|
| P1 | Concurrency token was a client-computed number; Kanban moves ignored the rendered version | Opaque string token minted only by the write path; moves send the rendered token; WorkCommands type-checks the store | lib/focus/contracts/work.ts, lib/focus/state/work.ts, demo-store.tsx, task-board.tsx |
| P1 | Undo was a client rollback that could overwrite newer work | Versioned compensating write (revertTask), refused with a reason; reads latest state | lib/focus/state/work.ts, shell/task-actions.ts |
| P2 | Logged time showed up as someone else's conflict; conflicts named the wrong writer | logMinutes is an increment through applyPatch with the actor; conflicts name updatedBy | demo-store.tsx, task-drawer-host.tsx |
| P2 | Reopen under a done parent; duplicate kept block/parent; no-op Kanban move reported success | canReopen, duplicate as a fresh local task, checkMove refuses no-ops | lib/focus/state/work.ts, task-drawer-host.tsx |
| P2 | Planned capabilities looked live; timer offered to roles that cannot track time | canDo(role, action, caps, allowPlanned); timer gated by role | lib/focus/state/work.ts, task-drawer.tsx, timer-bar.tsx, work-my.tsx |
| P1 | Mail drafts and sends lost on navigation; a reply could be sent twice | Drafts + send job in the demo store; second send refused | comms-mail.tsx, demo-store.tsx |
| P1 | A send interrupted by reload could look sent / one-click resend | Reloaded summary with an unknown-outcome notice and fresh confirmation | demo-store.tsx, pre-exec.tsx |
| P2 | Approval undo ignored the decision identity and its window; Meta schedule not cancelled | Undo targets decidedAt, honours the reversibility window, cancels the schedule | shell/use-queue.ts |
| P1 | A proposal edited after approval could be sent at the new amount | Send blocked when the saved total differs from the approved amount | approval.tsx, pre-exec.tsx |
| P2 | Single-key shortcuts dead on a Hebrew layout | plainShortcut also matches the physical key | lib/focus/state/keyboard.ts |
| P1 | Unsaved-changes guard bypassed by top bar, side cards, ⌘K, browser Back/Forward | One NavGuardProvider: capture-phase links, palette attempt, history guard entry, beforeunload | shell/nav-guard.tsx, ui/link.tsx, screens |
| P2 | Other domains copied a task's block sentence that outlived the block | blockedByTask reads the live task | lib/focus/state/work.ts, clients-board.tsx, marketing-campaign.tsx, marketing-studio-home.tsx |
| P3 | scopedHref doubled a path for a business slugged 'focus'; reference id 'constructor' → 500; dead exports | Idempotent scopedHref, Object.hasOwn, dead code removed | lib/focus/scope.ts, reference/[id]/page.tsx |
| P3 | Frame server accepted posts from any origin | Origin allowlist | scripts/focus/frame-server.py |

### Round 2

| Sev | Finding | Fix | Files |
|---|---|---|---|
| P1 | Retrying a failed proposal send skipped the amount check | The store checks every submit and retry (proposalSendBlock, same function the screen shows); execReducer refuses blocked submit/retry; proposal locked while sending | lib/focus/state/execution.ts, demo-store.tsx, sales-store.ts, sales-proposal.tsx |
| P1 | Toast showed 'בוטל' even when the undo was refused | onUndo returns false/text; toast closes without claiming | ui/toast.tsx, task-actions.ts, use-queue.ts |
| P1 | Manager board showed 'סונכרן ל־ClickUp' without a confirmed job | Shown only for a done sync job, else 'טרם סונכרן' | comms-today-manager.tsx |
| P1 | History races in the guard: a click right after a screen turned clean was undone; flows goto aborted | Step off the guard entry in the same commit; navigations queued until the history step lands | shell/nav-guard.tsx, ui/link.tsx |
| P2 | Drawer adopted any write by the viewer even across someone else's | Write lineage; adopt only an unbroken chain of own writes (onlyOwnWrites) | demo-store.tsx, lib/focus/state/work.ts, task-drawer-host.tsx |
| P2 | Drawer kept dirty state across tasks | Body keyed by task id, dirty/confirm reset | task-drawer-host.tsx |
| P2 | Interrupted mail send / Meta schedule settled as done after reload | interruptExternal → failed + unknown, with 'check first' copy | lib/focus/state/jobs.ts, comms-mail.tsx, marketing-publish.tsx, use-queue.ts |
| P2 | Quick writes skipped the source capability gate | useTaskGate at every quick write, planned writes say so | task-actions.ts, all-tasks.tsx, comms-today-manager.tsx, project-execution.tsx, work-my.tsx, timer-bar.tsx |
| P2 | Board undo restored the whole board | Undo only the moved item, only if still there | clients-board.tsx |
| P2 | Studio brief kept its own leave dialog (duplicate mechanism) | Uses the shared guard with save-and-leave | studio-new.tsx |
| P3 | logTime wrote an entry for a refused write; create-undo not versioned; quick create invented today's date; approvals counts ≠ rows | Fixed each; removeTask versioned in WorkCommands | demo-store.tsx, contracts/work.ts, work-my.tsx, approvals-list.tsx |
| P3 | a11y: drawer confirm focus, block form focus/select, pre-exec reason description, LeaveDialog description, bdi on business name | Fixed | task-drawer(-host).tsx, pre-exec.tsx, nav-guard.tsx, not-connected.tsx, dialog.tsx |

### Round 3

| Sev | Finding | Fix | Files |
|---|---|---|---|
| P1 | A sent mail could be sent again by undoing an earlier 'save draft' | Draft undo refused after a send or later edit; send guard counts every send job of the thread | comms-mail.tsx |
| P1 | Proposal undo toasts could change a proposal being sent or already sent | Undo refused once sending/sent or after later edits | sales-proposal.tsx |
| P1 | 'סונכרן ל־ClickUp' inherited by later writes that started no sync | Sync job per write (syncJobId(task, version)); revert sync for an undo | lib/focus/state/jobs.ts, task-actions.ts, comms-today-manager.tsx, project-execution.tsx |
| P2 | Quick approve scheduled a post whose photo is a placeholder | Approve only; Meta waits for the photo task | use-queue.ts, marketing-publish.tsx |
| P2 | Undo claimed Meta cancelled without asking Meta; unknown schedule retried in one click | Cancel is its own request job; 'checked first' retry; risk stated | use-queue.ts, action-card.tsx |
| P2 | Proposal undo threw away later edits | Undo only while its change is the latest | sales-proposal.tsx |
| P2 | Manager 'חסום' tag outlived the block | Tag read from the live task | comms-today-manager.tsx |
| P2 | Timer-stop undo erased a running timer | Refused while another timer runs | task-actions.ts, timer-bar.tsx, task-drawer-host.tsx |
| P2 | Multi-step Back jump while dirty pushed a guard entry onto the other page | Detected and let go without touching history | nav-guard.tsx |
| P2 | Back → leave raised the browser prompt too | No beforeunload once the user chose to leave | nav-guard.tsx |
| P2 | Fact editor and lead dialogs not covered by the guard | useNavGuard registered | fact-editor.tsx, lead-forms.tsx |
| P2 | Focus dropped to <body> when the drawer closed / on the busy send button | Dialog restores focus when removed; loading buttons stay focusable | ui/dialog.tsx, ui/button.tsx |
| P2 | Unbacked claims: follow-up task, 1-minute timeout, 'saved to brain/engine', D3 'טרם סונכרן' / reminder | Follow-up task really created on confirmation; other copy made true | fixtures/approvals.ts, demo-store.tsx, approval.tsx, blocked-panel.tsx |
| P2 | Unknown time exposed as a 0 meter; toasts and banners announced twice / on load | Meter only when known; one announcement; banners polite | task-drawer.tsx, ui/toast.tsx, ui/feedback.tsx, pre-exec.tsx |
| P2 | Docs claims that did not match the code | Docs rewritten to the code | docs/focus/*.md |
| P3 | Discard left an extra history entry; leave with no history did nothing; reset left pending answers; done count ignored the filter; duplicated reason texts; capability gates for dates/dependencies/subtasks/checklist/participants; 'ממתין' on a manual block; dead code; frame server Host | Fixed each | nav-guard.tsx, ui/link.tsx, demo-store.tsx, project-execution.tsx, marketing-publish.tsx, task-drawer.tsx, frame-server.py |

### Round 4 (verification of round 3)

| Sev | Finding | Fix | Files |
|---|---|---|---|
| P2 | Proposal undo overwrote later edits after the editor was left and reopened | Undo compares the stored proposal, not a ref inside one editor instance | sales-proposal.tsx |
| P2 | Undo toasts unreachable while the task drawer (modal) is open | Toasts render inside the topmost open modal dialog | ui/toast.tsx, ui/dialog.tsx |
| P2 | Back → leave into a slow previous document briefly showed the Focus home | 'Nothing behind' decided up front (Navigation API); timer only as a fallback, cancelled on pagehide | nav-guard.tsx |
| P2 | Focus to <body> when a deep-linked drawer closes; D3 save dropped focus | Fallback to #main; save keeps focus on its button | ui/dialog.tsx, project-execution.tsx |
| P2 | Follow-up task unfindable; 'saved to the business brain' hint | Task is the viewer's, with lead/client context and a system activity line; hint and brief copy made true | fixtures/approvals.ts, demo-store.tsx, marketing-brief.tsx |
| P3 | Mail refusal reason, Meta cancel/approve wording, re-schedule racing a cancel, D3 unknown sync, timer >24h edges, load-time failure alerts, silent drawer writes, busy 'נסח מחדש' | Fixed each | comms-mail.tsx, use-queue.ts, blocked-panel.tsx, demo-store.tsx, timer-bar.tsx, ui/status.tsx, ui/feedback.tsx, task-drawer-host.tsx |

### Round 5 (convergence check of round 4)

| Sev | Finding | Fix | Files |
|---|---|---|---|
| P2 | Error banners of saved failed states were alerts read on page load | Failures announce assertively through a live region, never role=alert | ui/feedback.tsx, ui/status.tsx |
| P2 | After reopening the proposal editor, an earlier visit's undo changed the stored proposal but not the page | The editor follows a stored change made outside it | sales-proposal.tsx |
| P3 | D3 save still dropped focus (loading/disabled save button); a refused undo inside a modal sent focus to the inert page | Focus to the panel heading; stays inside the modal | project-execution.tsx, blocked-panel.tsx, ui/toast.tsx |

### Final independent review (d93d1a4) — one P2 family

| Sev | Finding | Fix | Files |
|---|---|---|---|
| P2 | Gmail: after an UNKNOWN send outcome the generic 'בדוק ושלח' (and its dialog) could start another send without a verified Gmail check | UNKNOWN is a gated state in the store: startExternal → admitExternal/externalGate per target; the send dialog requires 'בדקתי בתיקיית נשלח ב־Gmail וההודעה הקודמת לא נשלחה' for that attempt; spent by the one send it unlocks | lib/focus/state/jobs.ts, demo-store.tsx, comms-mail.tsx, patterns/comms/mail.tsx |
| P2 | Meta: an UNKNOWN schedule outcome was retried as an ordinary failure ('נסה שוב לתזמן', Today card retry) | Same gate (meta:<approval>) for quick approve, the Today card (link to the check screen, no direct retry) and the publish summary, which requires 'בדקתי ב־Meta Business Suite והתזמון הקודם לא קיים'; no in-dialog retry of an unknown attempt | use-queue.ts, action-card.tsx, marketing-publish.tsx, patterns/marketing/publish.tsx |

## 4. Commits since the first review (`62fbb6e..a1d02fd`, oldest first)

| SHA | Subject |
|---|---|
| `cacf52d` | fix(focus): blocked is derived, never stored — canonical WorkStatus has no "blocked" (Work contract §5) |
| `16a0061` | feat(focus): canonical tenant boundary — Focus lives under /{businessSlug}/focus, scoped like api-guard (P1, P2) |
| `4fea1e0` | test(focus): tenant/prototype regression — scope decision + real redirect/notFound wiring, static route-tree guarantees, production/preview HTTP checks |
| `c54b903` | test(focus): manual-block refusal asserts the first guard, not only the invariant (mutation-found gap) |
| `78b0159` | fix(focus): Work writes are versioned end to end — opaque token, versioned undo, no false conflicts, capability + role gates (self-review) |
| `2bdf445` | fix(focus): high-risk flows (self-review, part 1) — mail drafts/sends survive navigation, no double send, versioned approval undo with window + Meta cancel, interrupted send needs re-confirmation |
| `5724d78` | fix(focus): high-risk flows (self-review, part 2) — proposal sent only at the approved amount, shortcuts work on a Hebrew layout, quiet toast countdown, honest hints |
| `ed18bd8` | chore(focus): routing + code quality (self-review) — one project id, create-in-project, idempotent scopedHref, reference ids, dead code, demo e-mails |
| `3f5896a` | fix(focus): one unsaved-changes guard for every way out — links, search (⌘K), browser Back/Forward, tab close (self-review P1) |
| `c03cfe8` | fix(focus): other domains read a task's block live; frame server accepts only its own origin (self-review) |
| `db75f50` | fix(focus): layout-safe single-key shortcuts (Hebrew/AZERTY by physical key); reports exit uses the one nav guard (self-review round 2) |
| `e1eb6c7` | fix(focus): one leave guard, no history races — clean steps off the guard entry in the same commit, navigations wait for it, Back with nothing behind recovers; studio brief uses the shared guard (save and leave); dialog described by its text; browser checks for history, listeners, drafts (self-review round 2) |
| `8099de8` | fix(focus): self-review round 2 — sends and retries checked against the approved amount in the store, toast never claims an undo that was refused, no 'synced' without a confirmed job, interrupted external sends are unknown, drawer adopts only its own write lineage, capability gate at every quick write, versioned create-undo, honest counts and copy, a11y focus/description fixes, stale docs |
| `f8fb20c` | docs(focus): README, architecture, Work contract and QA gates describe the built system — tenant scope, demo-only prototype surfaces, one write path, derived blocked, opaque token, versioned undo, capability gate, send guard, one navigation guard; removeTask is part of WorkCommands |
| `84b3749` | fix(focus): self-review round 3 (state) — no second mail send through a draft undo, proposal undos never touch a sent/sending proposal or later edits, sync status per write (never an inherited 'synced'), quick approve never schedules a placeholder photo, Meta cancel is its own request, unknown-outcome retry says 'checked first', manager tags read the live task, timer-stop undo cannot erase a running timer, honest planned/time toasts, drawer capability gates for due date/dependencies/subtasks/checklist, reset stops pending answers |
| `c8d8282` | fix(focus): self-review round 3 (navigation, a11y, honesty) — a multi-step Back jump is never pushed onto another page, Back-leave asks once, discarding a draft leaves no history entry, leave with nothing behind goes home; fact editor and lead dialogs join the guard; focus returns when the drawer closes and stays on a busy button; toasts and banners announce once and not on load; a confirmed proposal send creates the promised follow-up task; claims without a backing removed; unknown time is not a 0 meter; capability gates for start date and participants; dead code removed; frame server checks Host; regression flows |
| `a911f9c` | docs(focus): docs match the code after round 3 — drawer routes, conflict UI, sync per write, capability map per control, side stores, announcement policy, guard behaviour incl. its limits, open issues by severity |
| `934f2bd` | fix(focus): round-4 verification findings — proposal undo checks the stored proposal (also across a reopened editor), undo toasts reachable while a modal is open, focus falls back to the page when the opener is gone, D3 save keeps focus, the confirmed send's follow-up task is the viewer's and system-created, no 'saved to the brain' claims, unknown ClickUp sync says so, Meta cancel/approve wording + no re-schedule racing a cancel, timer switch/stop never logs without the task write, load-time failures are not alerts, Back-leave with no history decided up front |
| `d93d1a4` | fix(focus): round-5 convergence — failures announce assertively without role=alert (never read on load), the proposal editor follows a stored change made by an earlier visit's undo, D3 save keeps focus in the panel, a refused undo inside a modal keeps focus there |
| `ab691f0` | docs(focus): review packet at the final SHA — first-review findings and fixes, five self-review rounds with every finding and its fix, commits, files, boundary, gates, mutation, visual, remaining issues, owner gates |
| `9104117` | fix(focus): UNKNOWN external outcome is a gated state — a Gmail send or Meta schedule after an interrupted attempt starts only with the explicit target-system statement for that attempt, from every entry point (store gate admitExternal/externalGate), consumed by the one attempt it unlocks; a confirmed failure keeps the normal retry, a confirmed success is never repeated (final review P2) |
| `a1d02fd` | docs(focus): the UNKNOWN-outcome gate in architecture and QA gates (unit 111, mutation 31, suite 285, flows 43) |

<details><summary>All 52 commits since the base</summary>

| SHA | Subject |
|---|---|
| `6442091` | feat(focus): Direction C redesign foundation — light RTL theme, app shell, 'היום שלי' home (mock data) |
| `d57a0c7` | feat(focus): C2 project environment (סביבת פרויקט) + projects list, route-aware switcher |
| `5e718c2` | feat(focus): C3 approvals focus mode (אישורים · מצב פוקוס) with irreversible-send confirmation |
| `9bd6c82` | feat(focus): align tokens to the Design System spec + dark mode + IBM Plex Mono (full handoff received) |
| `8a903ce` | feat(focus): all 58 handoff screens as routes — converted from the rendered Claude Design frames |
| `b5d1548` | refactor(focus): architecture gate — reference screens, contracts, fixtures, UI library, shell, Today archetype |
| `90d8dc6` | feat(focus): approvals archetype — focus mode, mandatory reason, pre-execution summary, content review |
| `9614877` | feat(focus): project environment archetype (D2/M5) — header + area tabs, milestones, next action, hours, blockers, decisions, results |
| `0dcccfc` | feat(focus): studio editor archetype (E6) — layers, safety zones, brand swatches, live checks, undo/redo history |
| `19f0f1a` | docs(focus): architecture guide + per-area stylesheets for the remaining screen migration |
| `e2f42c0` | feat(focus): Mytiv Work — my tasks, project list/Kanban, task drawer, timer, time, states, D3 execution, all tasks |
| `485ad31` | chore(focus): marketing area stylesheet for the screen migration |
| `1cf655b` | feat(focus): approvals list (D4/M2) and the studio new-content flow (E3 brief, E4 directions, E5 all formats) |
| `e630180` | feat(focus): mobile frames M1–M10 are the real responsive screens — /focus/m/<n> redirects; screen map with phone previews and demo controls |
| `92d6895` | feat(focus): flows — safe exit with an unsaved reason (exit/skip/J/tab close), editor autosave, demo-time timestamps, stable store actions |
| `8abf1b9` | test(focus): unit tests for approval rules, execution state machine, undo window, jobs, work buckets, Kanban, hierarchy and dependencies, conflicts, permissions, timer, unknown-vs-zero, unavailable-vs-empty, theme, keyboard |
| `15ce3e9` | test(focus): render LoadableView states without the children prop |
| `0983d38` | fix(focus): accessibility from QA — keyboard focus ring on restyled selects, dark contrast (timer text, hero), nested-interactive canvas, 24px+ mobile targets; RTL select arrow, usage bar, link-button padding, tab aria-controls |
| `cc829be` | feat(focus): remaining desktop screens — reports & control (G1–G6) and clients/projects (H1–H5) |
| `ad9b522` | feat(focus): remaining desktop screens — marketing & studio (H6, H7, H11, H12, E1, E2, E7) and comms & settings (F6, H10, H13, H14, H15, D8) |
| `3112c3a` | feat(focus): remaining desktop + mobile screens — sales (F1–F4, H8, H9; M7 phones) |
| `8c157ef` | fix(focus): a11y — dark panels use panel tokens (contrast); drawer selects keep labels on mobile |
| `b974930` | fix(focus): keyboard QA — ring on wrappers and UA date picker recognised; deep-linked modal owns first stop |
| `9545632` | fix(focus): Mytiv Work — typed LTR text keeps its order; mobile drawer time count, assignee chip, one-line timer bar |
| `13d91c7` | fix(focus): desktop screens — E1 results note inside its card (ResultsCard footer slot), E3 save state on one line |
| `088d956` | fix(focus): approvals + mobile — D4 waiting-on-others columns align; M8 decision bar pinned; M3 bar gutter; M4 step label; M7b contact card width |
| `17edebd` | test(focus): flows — LTR content check; wait on navigation, busy jobs and live region instead of fixed sleeps |
| `4548020` | fix(focus): design preview — a layer with a bounded width wraps inside the frame (4:5 headline no longer spills, D7/M8) |
| `93f2182` | docs(focus): QA.md (gates, two-pass visual QA per screen, open issues) and README for the built architecture |
| `62fbb6e` | docs(focus): independent review packet (base/final SHA, commits, files, test + browser + visual evidence, deviations, boundary, owner gates) |
| `cacf52d` | fix(focus): blocked is derived, never stored — canonical WorkStatus has no "blocked" (Work contract §5) |
| `16a0061` | feat(focus): canonical tenant boundary — Focus lives under /{businessSlug}/focus, scoped like api-guard (P1, P2) |
| `4fea1e0` | test(focus): tenant/prototype regression — scope decision + real redirect/notFound wiring, static route-tree guarantees, production/preview HTTP checks |
| `c54b903` | test(focus): manual-block refusal asserts the first guard, not only the invariant (mutation-found gap) |
| `78b0159` | fix(focus): Work writes are versioned end to end — opaque token, versioned undo, no false conflicts, capability + role gates (self-review) |
| `2bdf445` | fix(focus): high-risk flows (self-review, part 1) — mail drafts/sends survive navigation, no double send, versioned approval undo with window + Meta cancel, interrupted send needs re-confirmation |
| `5724d78` | fix(focus): high-risk flows (self-review, part 2) — proposal sent only at the approved amount, shortcuts work on a Hebrew layout, quiet toast countdown, honest hints |
| `ed18bd8` | chore(focus): routing + code quality (self-review) — one project id, create-in-project, idempotent scopedHref, reference ids, dead code, demo e-mails |
| `3f5896a` | fix(focus): one unsaved-changes guard for every way out — links, search (⌘K), browser Back/Forward, tab close (self-review P1) |
| `c03cfe8` | fix(focus): other domains read a task's block live; frame server accepts only its own origin (self-review) |
| `db75f50` | fix(focus): layout-safe single-key shortcuts (Hebrew/AZERTY by physical key); reports exit uses the one nav guard (self-review round 2) |
| `e1eb6c7` | fix(focus): one leave guard, no history races — clean steps off the guard entry in the same commit, navigations wait for it, Back with nothing behind recovers; studio brief uses the shared guard (save and leave); dialog described by its text; browser checks for history, listeners, drafts (self-review round 2) |
| `8099de8` | fix(focus): self-review round 2 — sends and retries checked against the approved amount in the store, toast never claims an undo that was refused, no 'synced' without a confirmed job, interrupted external sends are unknown, drawer adopts only its own write lineage, capability gate at every quick write, versioned create-undo, honest counts and copy, a11y focus/description fixes, stale docs |
| `f8fb20c` | docs(focus): README, architecture, Work contract and QA gates describe the built system — tenant scope, demo-only prototype surfaces, one write path, derived blocked, opaque token, versioned undo, capability gate, send guard, one navigation guard; removeTask is part of WorkCommands |
| `84b3749` | fix(focus): self-review round 3 (state) — no second mail send through a draft undo, proposal undos never touch a sent/sending proposal or later edits, sync status per write (never an inherited 'synced'), quick approve never schedules a placeholder photo, Meta cancel is its own request, unknown-outcome retry says 'checked first', manager tags read the live task, timer-stop undo cannot erase a running timer, honest planned/time toasts, drawer capability gates for due date/dependencies/subtasks/checklist, reset stops pending answers |
| `c8d8282` | fix(focus): self-review round 3 (navigation, a11y, honesty) — a multi-step Back jump is never pushed onto another page, Back-leave asks once, discarding a draft leaves no history entry, leave with nothing behind goes home; fact editor and lead dialogs join the guard; focus returns when the drawer closes and stays on a busy button; toasts and banners announce once and not on load; a confirmed proposal send creates the promised follow-up task; claims without a backing removed; unknown time is not a 0 meter; capability gates for start date and participants; dead code removed; frame server checks Host; regression flows |
| `a911f9c` | docs(focus): docs match the code after round 3 — drawer routes, conflict UI, sync per write, capability map per control, side stores, announcement policy, guard behaviour incl. its limits, open issues by severity |
| `934f2bd` | fix(focus): round-4 verification findings — proposal undo checks the stored proposal (also across a reopened editor), undo toasts reachable while a modal is open, focus falls back to the page when the opener is gone, D3 save keeps focus, the confirmed send's follow-up task is the viewer's and system-created, no 'saved to the brain' claims, unknown ClickUp sync says so, Meta cancel/approve wording + no re-schedule racing a cancel, timer switch/stop never logs without the task write, load-time failures are not alerts, Back-leave with no history decided up front |
| `d93d1a4` | fix(focus): round-5 convergence — failures announce assertively without role=alert (never read on load), the proposal editor follows a stored change made by an earlier visit's undo, D3 save keeps focus in the panel, a refused undo inside a modal keeps focus there |
| `ab691f0` | docs(focus): review packet at the final SHA — first-review findings and fixes, five self-review rounds with every finding and its fix, commits, files, boundary, gates, mutation, visual, remaining issues, owner gates |
| `9104117` | fix(focus): UNKNOWN external outcome is a gated state — a Gmail send or Meta schedule after an interrupted attempt starts only with the explicit target-system statement for that attempt, from every entry point (store gate admitExternal/externalGate), consumed by the one attempt it unlocks; a confirmed failure keeps the normal retry, a confirmed success is never repeated (final review P2) |
| `a1d02fd` | docs(focus): the UNKNOWN-outcome gate in architecture and QA gates (unit 111, mutation 31, suite 285, flows 43) |

</details>

## 5. Changed files (vs base)

| Area | Files |
|---|---|
| `.gitignore` | `.gitignore` |
| `app/(focus)/[businessSlug]/focus/**` | 51 files |
| `components/focus/patterns` | 59 files |
| `components/focus/reference` | 58 generated reference files (visual record only) |
| `components/focus/screens` | 45 files |
| `components/focus/shell` | 14 files |
| `components/focus/ui` | `button.tsx`, `cx.ts`, `dialog.tsx`, `feedback.tsx`, `field.tsx`, `icon.tsx`, `link.tsx`, `misc.tsx`, `status.tsx`, `tabs.tsx`, `toast.tsx`, `ui.css` |
| `docs/focus` | `ARCHITECTURE.md`, `GPT_REVIEW_PACKET.md`, `QA.md`, `README.md`, `mytiv-work-contract.md` |
| `lib/focus` | `color.ts`, `format.ts`, `routes.ts`, `scope.server.ts`, `scope.ts`, `screens.ts` |
| `lib/focus/contracts` | 14 files |
| `lib/focus/fixtures` | 13 files |
| `lib/focus/state` | `approvals.ts`, `editor.ts`, `execution.ts`, `jobs.ts`, `keyboard.ts`, `undo.ts`, `work.ts` |
| `scripts/focus` | `convert-handoff.py`, `frame-server.py` |
| `scripts/focus/qa` | `axe.mjs`, `flows.mjs`, `keyboard.mjs`, `lib.mjs`, `prod-surfaces.mjs`, `routes.mjs`, `visual.mjs` |
| `tests/focus-data-states.vitest.ts` | `tests/focus-data-states.vitest.ts` |
| `tests/focus-flows.vitest.ts` | `tests/focus-flows.vitest.ts` |
| `tests/focus-scope.vitest.ts` | `tests/focus-scope.vitest.ts` |
| `tests/focus-work.vitest.ts` | `tests/focus-work.vitest.ts` |

## 6. Boundary confirmation — backend, API, DB, migrations, pkg1 untouched

- Everything outside the Focus folders: `1 file changed, 3 insertions(+)` (`.gitignore` only).
- `git diff --name-only e35a189..a1d02fd -- lib/db app/api drizzle db migrations` → empty. No API route, schema, migration, seed or production configuration changed.
- `auto/work-pkg1` was read only, as a contract source; nothing was merged or cherry-picked from it.
- Nothing under Focus makes network calls; external actions (Gmail, Meta, ClickUp, AI) are simulated by the demo store, in the demo scope only.

## 7. Test evidence (measured at `a1d02fd`)

| Check | Result | Command |
|---|---|---|
| Typecheck | ✓ 0 errors | `npx tsc --noEmit -p .` |
| Focus lint | ✓ 0 errors / 0 warnings | `npx eslint "app/(focus)" components/focus lib/focus scripts/focus tests/focus-*.ts` |
| Focus unit tests | ✓ 111 / 111 (4 files) | `node node_modules/vitest/vitest.mjs run --config tests/route-vitest.config.mjs tests/focus-*.vitest.ts` |
| Full existing suite | ✓ 285 / 285 vitest (24 files) + 28 / 28 `ops-security` node tests | `npm test` (dummy DB env) |
| Production build | ✓ 49 Focus routes under `/[businessSlug]/focus` | `next build` (dummy DB env + dummy `QSTASH_*`) |
| Production isolation | ✓ 18 / 18 | `prod-surfaces.mjs --expect production` against `next start` |
| Preview QA surfaces | ✓ 6 / 6 | `prod-surfaces.mjs --expect preview` (`VERCEL_ENV=preview next start`) |
| Routes · console · responsive | ✓ 53 / 53 (111 internal links, all inside the scope) | `routes.mjs` |
| Accessibility (axe, serious + critical) | ✓ 150 / 150 — light + dark at 1440, light at 390 | `axe.mjs` |
| Keyboard-only walkthrough | ✓ 54 / 54 | `keyboard.mjs` |
| Flows end to end | ✓ 43 / 43 (incl. Gmail + Meta UNKNOWN-outcome gate: interrupt, reload, no generic CTA / ordinary retry bypass, one attempt per explicit target check, confirmed failure retries normally, confirmed success never repeated) | `flows.mjs` |
| Mutation | ✓ 31 / 31 caught (unit) + browser mutant removing the gate (UI + store) fails the Gmail and Meta flows | scratch script, one mutation at a time on a copy |

**Mutation testing.** One mutation at a time applied to a copy of the tree, Focus unit tests run against it:
31 / 31 mutants caught. The five new ones target the UNKNOWN-outcome gate: retry without the target check, a statement not tied to the unknown attempt (never consumed), a confirmed success repeated, an in-flight attempt not blocking, the store admitting without the gate. Browser level: removing the gate in both the UI and the store fails 4 of the Gmail/Meta flows; removing only the Gmail dialog gate fails 2 (the store still refuses); removing only the Meta summary check is equivalent (the store refuses, the screen says why). Earlier mutants: tenant guard removed, no-session not redirected, prototype surfaces on in production, fixtures for a business, notFound ignored, a page losing its scope guard, scoped links not scoped, block guard removed, block guard + invariant removed, non-canonical status accepted, Kanban storing "blocked", mandatory reason bypassed, "sent" before target confirmation, version conflict ignored, unknown rendered as 0, dependency cycle allowed, parent completing with an open child, undo after the window, retry / first submit skipping the approved-amount guard, proposal amount check never blocking, interrupted send counted as done, reload not marking external jobs unknown, drawer adopting another writer's write, planned capability allowed outside the demo, Hebrew-layout shortcut.

## 8. Visual QA summary

Pixel diff (±1px shift tolerance) re-run during the self-review (at `f8fb20c`; later commits change behaviour and copy, not layout): 118 captures; light desktop median 5.5%, phone 15.5%; dark desktop 13.0% (indicative only — the reference hard-codes some light surfaces). Only two captures moved by more than 1 point against the per-screen table below (measured at `4548020`): F5 dark 40.8 → 51.0 (data: blocked/derived rows) and M4 light 58.4 → 59.4. Verdicts per frame and reasons: `docs/focus/QA.md` §2.

| Frame | Route | Width | Light Δ% | Dark Δ% | Verdict |
|---|---|---|---:|---:|---|
| D1 | `/focus` | 1440 | 3.19 | 6.44 | intended |
| D2 | `/focus/projects/umino` | 1440 | 2.63 | 3.79 | intended |
| D3 | `/focus/projects/umino/execution` | 1440 | 9.21 | 34.46 | intended |
| D4 | `/focus/approvals` | 1440 | 5.47 | 11.58 | fixed |
| D5 | `/focus/approvals/promo-1plus1` | 1440 | 2.61 | 15.18 | intended |
| D6 | `/focus/approvals/proposal-noa` | 1440 | 4.27 | 14.66 | intended |
| D7 | `/focus/approvals/content-sushi-story` | 1440 | 5.18 | 5.75 | intended |
| D8 | `/focus/today-manager` | 1440 | 3.95 | 14.77 | deviation |
| E1 | `/focus/marketing/campaigns/thursday-sushi` | 1440 | 6.48 | 12.67 | fixed |
| E2 | `/focus/studio` | 1440 | 5.54 | 10.36 | intended |
| E3 | `/focus/studio/new` | 1440 | 5.14 | 7.7 | fixed |
| E4 | `/focus/studio/new/directions` | 1440 | 13.64 | 13.97 | intended |
| E5 | `/focus/studio/thursday-sushi` | 1440 | 21.52 | 22.68 | deviation |
| E6 | `/focus/studio/thursday-sushi/edit` | 1440 | 6.19 | 13.53 | match |
| E7 | `/focus/studio/thursday-sushi/publish` | 1440 | 9.26 | 13.19 | intended |
| F1 | `/focus/sales` | 1440 | 2.39 | 14.92 | intended |
| F2 | `/focus/sales/leads/noa-cohen` | 1440 | 2.59 | 10.96 | intended |
| F3 | `/focus/sales/proposals/corporate-hosting` | 1440 | 2.11 | 3.52 | intended |
| F4 | `/focus/sales/outreach` | 1440 | 6.49 | 10.18 | intended |
| F5 | `/focus/work/all-tasks` | 1440 | 3.56 | 40.8 | deviation |
| F6 | `/focus/comms` | 1440 | 3.09 | 11.84 | intended |
| G1 | `/focus/reports` | 1440 | 16.97 | 29.76 | intended |
| G2 | `/focus/reports/hours` | 1440 | 10.12 | 14.3 | intended |
| G3 | `/focus/reports/weekly` | 1440 | 2.24 | 2.29 | intended |
| G4 | `/focus/reports/activity` | 1440 | 4.07 | 16.82 | intended |
| G5 | `/focus/clients/umino/brain` | 1440 | 3.1 | 4.37 | intended |
| G6 | `/focus/settings/connections` | 1440 | 5.31 | 7.16 | intended |
| H1 | `/focus/projects` | 1440 | 7.21 | 11.65 | intended |
| H2 | `/focus/clients/umino` | 1440 | 7.47 | 8.35 | intended |
| H3 | `/focus/projects/new` | 1440 | 3.28 | 6.35 | intended |
| H4 | `/focus/marketing/plan` | 1440 | 8.49 | 13.78 | intended |
| H5 | `/focus/marketing/board` | 1440 | 3.56 | 14.57 | intended |
| H6 | `/focus/marketing/inspiration` | 1440 | 7.78 | 20.83 | intended |
| H7 | `/focus/marketing/trends` | 1440 | 5.81 | 14.28 | intended |
| H8 | `/focus/sales/discovery` | 1440 | 5.2 | 12.88 | intended |
| H9 | `/focus/sales/proposals` | 1440 | 4.18 | 6.08 | intended |
| H10 | `/focus/comms/calendar` | 1440 | 3.59 | 18.94 | intended |
| H11 | `/focus/marketing/briefs` | 1440 | 7.32 | 14.65 | intended |
| H12 | `/focus/marketing/prompts` | 1440 | 8.75 | 9.04 | intended |
| H13 | `/focus/settings/users` | 1440 | 3.99 | 6.65 | intended |
| H14 | `/focus/settings/business` | 1440 | 5.91 | 8.56 | intended |
| H15 | `/focus/notifications` | 1440 | 2.9 | 8.38 | deviation |
| M1 | `/focus` | 390 | 10.93 | 20.48 | intended |
| M2 | `/focus/approvals` | 390 | 24.81 | 25.31 | intended |
| M3 | `/focus/approvals/promo-1plus1` | 390 | 10.63 | 16.67 | fixed |
| M4 | `/focus/approvals/proposal-noa` | 390 | 58.36 | 60.45 | fixed |
| M5 | `/focus/projects/umino` | 390 | 13.09 | 13.45 | deviation |
| M6 | `/focus/work/all-tasks` | 390 | 15.54 | 17.41 | deviation |
| M7 | `/focus/sales` | 390 | 3.85 | 5.46 | intended |
| M7b | `/focus/sales/leads/noa-cohen` | 390 | 6.63 | 7.09 | fixed |
| M8 | `/focus/approvals/content-sushi-story` | 390 | 35.69 | 20.8 | fixed |
| M9 | `/focus/work` | 390 | 19.86 | 18.96 | fixed |
| M10 | `/focus/work/list?task=t-post45` | 390 | 54.18 | 54.41 | fixed |
| W1 | `/focus/work` | 1440 | 5.64 | 21.81 | intended |
| W2 | `/focus/work/list` | 1440 | 8.71 | 55.82 | intended |
| W3 | `/focus/work/board` | 1440 | 9.6 | 37.44 | deviation |
| W4 | `/focus/work/list?task=t-post45` | 1440 | 41.01 | 42.45 | intended |
| W5 | `/focus/work/time` | 1440 | 12.21 | 9.47 | deviation |
| W6 | `/focus/work/states` | 1440 | 12.93 | 51.67 | deviation |

## 9. Remaining issues by severity

No P1 is open. P2: none open from the review rounds. Remaining items (design deviations and P3s) are listed with their reasons in `docs/focus/QA.md` §4:

- **Medium** — Design deviations: H15 notifications as a page; E5 formats row; single-fixture sales detail routes; G3/G4/G1 cross-screen story; M10 sheet height.
- **P3** — The Focus layout's client bundle (demo store, fixtures) is downloaded on a business's "not connected" page too (nothing rendered, fictional data) — give the demo shell its own route tree before real data.
- **P3** — History edges of the guard: a multi-step jump of several entries cannot be held (in-memory draft lost; store drafts survive); a jump onto an earlier same-URL entry is treated as one Back; a discarded draft's state stays as a forward entry; 'leave' with only another origin behind goes home.
- **P3** — Mail thread switch while dirty uses the guard entry up (drafts kept per thread, nothing lost).
- **P3** — Timer across two tabs of one browser can log twice (server timer removes it).
- **P3** — Dense-table title links are 22px tall (WCAG 2.5.8 met by spacing); a held menu link may leave its menu open behind the dialog (not reproduced).
- **Low** — Native date inputs follow the browser locale; F5/M6 completion via quick action; small layout deviations (D8, W3, W5, W6, M5, M9); shared-pattern duplication (ActionCard, content board); Chromium date-picker focus ring; build needs dummy QSTASH keys.
- **P3** — A refused time write during a timer switch drops the previous timer's elapsed time (not reachable in the demo: logged minutes are capped and invalid tasks are discarded).

## 10. Backend boundary and integration prerequisites

The Focus branch is fixture / demo-store backed, in the demo scope only. Not implemented yet (contract §12):

1. Work read API returning the neutral `WorkItem` with its concurrency token, for "mine" and per project.
2. Governed write API under `/work` with `expectedVersion` + `requestId` and a 409 conflict response (the UI's token is already an opaque string).
3. Assignee, start-date and estimate writes for Mytiv tasks.
4. Checklist, dependencies (`blocks`, same project), sub-task creation (`parent_id`), move with `move_blocked`.
5. Comments and activity per task.
6. Timers, manual time entries and the time report (the timer is in `localStorage` today).
7. Per-business permissions (viewer, per-project `work_authorize`) and the per-business status vocabulary.
8. Fields with no column yet: participants, next action, follow-up date, blocked reason.
9. Focus adapters behind `requireBusinessScope(scope)` replacing the "not connected" page per area.

## 11. Owner gates (before any integration)

- **Migration `0012_work_expand`** (pkg1): additive, not applied anywhere. Staging first, then production, before any deploy of the dual-write code.
- **Role split:** the runtime connects as the DB owner; a least-privilege app role needs owner approval.
- **Production report:** the read-only legacy tasks report (pkg1 PR 2) must run against production, with owner approval, before the backfill.
- **Merge / deploy of this PR:** owner decision after the independent review; the PR stays a draft until then.

No merge, deploy, shared migration, secrets change, or production write was performed.
