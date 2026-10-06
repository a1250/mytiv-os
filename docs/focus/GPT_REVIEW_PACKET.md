# Focus redesign — independent review packet

Prepared 2026-10-06 for an independent review of the Focus (Direction C) frontend. Draft PR only: **no merge, no deploy,
no backend integration** at this stage.

| | |
|---|---|
| Repository | `a1250/mytiv-os` |
| Branch | `auto/focus-redesign` |
| Base branch | `auto/preview-mvp-app` (draft a1250/mytiv-os#8, itself stacked on #7 → `main`) |
| Base SHA | `e35a189f7cbb545bdf1c7dd0a70c860bf3ea5031` — the tip of `auto/preview-mvp-app`; the Focus branch forked here, and the base has not moved since |
| Final implementation SHA | `93f2182fc439e53412bf5e659192064c1dbcb955` — all QA evidence below was measured here |
| Packet commit | this file is committed on top of `93f2182` (docs only; it changes no code) |
| Diff vs base | 289 files, +40,350 / −0 — purely additive |

## 1. What to review

The redesign is a typed, accessible component library under `/focus`, running on typed fixtures and a client-side demo
store. Start with:

- `docs/focus/ARCHITECTURE.md` — layers (`components/focus/{ui,patterns,shell,screens}`, `lib/focus/{contracts,fixtures,state}`),
  data states, theming, accessibility rules;
- `docs/focus/mytiv-work-contract.md` — the Mytiv Work UI ↔ `auto/work-pkg1` contract and integration order;
- `docs/focus/QA.md` — gates, two-pass per-screen visual QA, open issues;
- `lib/focus/state/*` + `tests/focus-*.vitest.ts` — the pure rules and their tests (approvals, execution, undo, jobs,
  work rules, timer, keyboard).

`components/focus/reference/*` (58 files) is the generated handoff conversion, served only at `/focus/reference/<ID>`
as a visual record. No product route imports it; `routes.mjs` enforces that.

## 2. Commits in scope (`e35a189..93f2182`, oldest first)

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

## 3. Changed files

By area: `components/focus/patterns` 60 · `components/focus/reference` 58 (generated) · `components/focus/screens` 45 ·
`lib/focus/contracts` 14 · `lib/focus/fixtures` 13 · `components/focus/ui` 11 · `components/focus/shell` 10 ·
`lib/focus/state` 7 · `lib/focus` (root) 4 · `app/focus/**` 59 route files · `scripts/focus` 8 (QA + converter) ·
`docs/focus` 4 · `tests` 3 (`focus-*.vitest.ts`) · `.gitignore` 1 (ignores the raw handoff bundle).

<details><summary>Full list (289 files, all added except <code>.gitignore</code>)</summary>

- `.gitignore` (M)
- `app/focus/approvals/[id]/page.tsx` (A)
- `app/focus/approvals/page.tsx` (A)
- `app/focus/clients/umino/brain/page.tsx` (A)
- `app/focus/clients/umino/page.tsx` (A)
- `app/focus/comms/calendar/page.tsx` (A)
- `app/focus/comms/page.tsx` (A)
- `app/focus/focus.css` (A)
- `app/focus/layout.tsx` (A)
- `app/focus/m/[n]/page.tsx` (A)
- `app/focus/marketing/board/page.tsx` (A)
- `app/focus/marketing/briefs/page.tsx` (A)
- `app/focus/marketing/campaigns/thursday-sushi/page.tsx` (A)
- `app/focus/marketing/inspiration/page.tsx` (A)
- `app/focus/marketing/plan/page.tsx` (A)
- `app/focus/marketing/prompts/page.tsx` (A)
- `app/focus/marketing/trends/page.tsx` (A)
- `app/focus/notifications/page.tsx` (A)
- `app/focus/page.tsx` (A)
- `app/focus/projects/new/page.tsx` (A)
- `app/focus/projects/page.tsx` (A)
- `app/focus/projects/umino/execution/page.tsx` (A)
- `app/focus/projects/umino/page.tsx` (A)
- `app/focus/reference/[id]/page.tsx` (A)
- `app/focus/reports/activity/page.tsx` (A)
- `app/focus/reports/hours/page.tsx` (A)
- `app/focus/reports/page.tsx` (A)
- `app/focus/reports/weekly/page.tsx` (A)
- `app/focus/sales/discovery/page.tsx` (A)
- `app/focus/sales/leads/noa-cohen/page.tsx` (A)
- `app/focus/sales/outreach/page.tsx` (A)
- `app/focus/sales/page.tsx` (A)
- `app/focus/sales/proposals/corporate-hosting/page.tsx` (A)
- `app/focus/sales/proposals/page.tsx` (A)
- `app/focus/screens/page.tsx` (A)
- `app/focus/settings/business/page.tsx` (A)
- `app/focus/settings/connections/page.tsx` (A)
- `app/focus/settings/users/page.tsx` (A)
- `app/focus/studio/new/directions/page.tsx` (A)
- `app/focus/studio/new/page.tsx` (A)
- `app/focus/studio/page.tsx` (A)
- `app/focus/studio/thursday-sushi/edit/page.tsx` (A)
- `app/focus/studio/thursday-sushi/page.tsx` (A)
- `app/focus/studio/thursday-sushi/publish/page.tsx` (A)
- `app/focus/today-manager/page.tsx` (A)
- `app/focus/work/all-tasks/page.tsx` (A)
- `app/focus/work/board/page.tsx` (A)
- `app/focus/work/list/page.tsx` (A)
- `app/focus/work/page.tsx` (A)
- `app/focus/work/states/page.tsx` (A)
- `app/focus/work/task/page.tsx` (A)
- `app/focus/work/time/page.tsx` (A)
- `components/focus/patterns/action-card.tsx` (A)
- `components/focus/patterns/agenda.tsx` (A)
- `components/focus/patterns/approval/approval-parts.tsx` (A)
- `components/focus/patterns/approval/approval.css` (A)
- `components/focus/patterns/approval/content-review.tsx` (A)
- `components/focus/patterns/approval/decision-block.tsx` (A)
- `components/focus/patterns/approval/pre-exec.tsx` (A)
- `components/focus/patterns/clients/client-parts.tsx` (A)
- `components/focus/patterns/clients/clients.css` (A)
- `components/focus/patterns/clients/content-board.tsx` (A)
- `components/focus/patterns/clients/plan-parts.tsx` (A)
- `components/focus/patterns/clients/portfolio.tsx` (A)
- `components/focus/patterns/clients/session-projects.ts` (A)
- `components/focus/patterns/clients/wizard-parts.tsx` (A)
- `components/focus/patterns/comms/calendar.tsx` (A)
- `components/focus/patterns/comms/comms.css` (A)
- `components/focus/patterns/comms/leave-guard.tsx` (A)
- `components/focus/patterns/comms/mail.tsx` (A)
- `components/focus/patterns/comms/manager.tsx` (A)
- `components/focus/patterns/comms/notifications.tsx` (A)
- `components/focus/patterns/comms/settings.tsx` (A)
- `components/focus/patterns/marketing/marketing-parts.tsx` (A)
- `components/focus/patterns/marketing/marketing.css` (A)
- `components/focus/patterns/marketing/publish.tsx` (A)
- `components/focus/patterns/metrics.tsx` (A)
- `components/focus/patterns/page.tsx` (A)
- `components/focus/patterns/patterns.css` (A)
- `components/focus/patterns/project-card.tsx` (A)
- `components/focus/patterns/project/project-parts.tsx` (A)
- `components/focus/patterns/project/project.css` (A)
- `components/focus/patterns/reports/connection.ts` (A)
- `components/focus/patterns/reports/fact-editor.tsx` (A)
- `components/focus/patterns/reports/report-parts.tsx` (A)
- `components/focus/patterns/reports/reports.css` (A)
- `components/focus/patterns/sales/discovery-parts.tsx` (A)
- `components/focus/patterns/sales/lead-forms.tsx` (A)
- `components/focus/patterns/sales/lead-list.tsx` (A)
- `components/focus/patterns/sales/lead-page.tsx` (A)
- `components/focus/patterns/sales/outreach-parts.tsx` (A)
- `components/focus/patterns/sales/proposal-editor.tsx` (A)
- `components/focus/patterns/sales/proposal-list.tsx` (A)
- `components/focus/patterns/sales/sales-parts.tsx` (A)
- `components/focus/patterns/sales/sales-store.ts` (A)
- `components/focus/patterns/sales/sales.css` (A)
- `components/focus/patterns/stuck-panel.tsx` (A)
- `components/focus/patterns/studio/design-preview.tsx` (A)
- `components/focus/patterns/studio/editor-parts.tsx` (A)
- `components/focus/patterns/studio/new-parts.tsx` (A)
- `components/focus/patterns/studio/studio.css` (A)
- `components/focus/patterns/time-board.tsx` (A)
- `components/focus/patterns/work/blocked-panel.tsx` (A)
- `components/focus/patterns/work/my-tasks.tsx` (A)
- `components/focus/patterns/work/quick-create.tsx` (A)
- `components/focus/patterns/work/task-board.tsx` (A)
- `components/focus/patterns/work/task-card.tsx` (A)
- `components/focus/patterns/work/task-drawer.tsx` (A)
- `components/focus/patterns/work/task-list.tsx` (A)
- `components/focus/patterns/work/time-report.tsx` (A)
- `components/focus/patterns/work/work-states.tsx` (A)
- `components/focus/patterns/work/work.css` (A)
- `components/focus/reference/D1.tsx` (A)
- `components/focus/reference/D2.tsx` (A)
- `components/focus/reference/D3.tsx` (A)
- `components/focus/reference/D4.tsx` (A)
- `components/focus/reference/D5.tsx` (A)
- `components/focus/reference/D6.tsx` (A)
- `components/focus/reference/D7.tsx` (A)
- `components/focus/reference/D8.tsx` (A)
- `components/focus/reference/E1.tsx` (A)
- `components/focus/reference/E2.tsx` (A)
- `components/focus/reference/E3.tsx` (A)
- `components/focus/reference/E4.tsx` (A)
- `components/focus/reference/E5.tsx` (A)
- `components/focus/reference/E6.tsx` (A)
- `components/focus/reference/E7.tsx` (A)
- `components/focus/reference/F1.tsx` (A)
- `components/focus/reference/F2.tsx` (A)
- `components/focus/reference/F3.tsx` (A)
- `components/focus/reference/F4.tsx` (A)
- `components/focus/reference/F5.tsx` (A)
- `components/focus/reference/F6.tsx` (A)
- `components/focus/reference/G1.tsx` (A)
- `components/focus/reference/G2.tsx` (A)
- `components/focus/reference/G3.tsx` (A)
- `components/focus/reference/G4.tsx` (A)
- `components/focus/reference/G5.tsx` (A)
- `components/focus/reference/G6.tsx` (A)
- `components/focus/reference/H1.tsx` (A)
- `components/focus/reference/H10.tsx` (A)
- `components/focus/reference/H11.tsx` (A)
- `components/focus/reference/H12.tsx` (A)
- `components/focus/reference/H13.tsx` (A)
- `components/focus/reference/H14.tsx` (A)
- `components/focus/reference/H15.tsx` (A)
- `components/focus/reference/H2.tsx` (A)
- `components/focus/reference/H3.tsx` (A)
- `components/focus/reference/H4.tsx` (A)
- `components/focus/reference/H5.tsx` (A)
- `components/focus/reference/H6.tsx` (A)
- `components/focus/reference/H7.tsx` (A)
- `components/focus/reference/H8.tsx` (A)
- `components/focus/reference/H9.tsx` (A)
- `components/focus/reference/M1.tsx` (A)
- `components/focus/reference/M10.tsx` (A)
- `components/focus/reference/M2.tsx` (A)
- `components/focus/reference/M3.tsx` (A)
- `components/focus/reference/M4.tsx` (A)
- `components/focus/reference/M5.tsx` (A)
- `components/focus/reference/M6.tsx` (A)
- `components/focus/reference/M7.tsx` (A)
- `components/focus/reference/M8.tsx` (A)
- `components/focus/reference/M9.tsx` (A)
- `components/focus/reference/W1.tsx` (A)
- `components/focus/reference/W2.tsx` (A)
- `components/focus/reference/W3.tsx` (A)
- `components/focus/reference/W4.tsx` (A)
- `components/focus/reference/W5.tsx` (A)
- `components/focus/reference/W6.tsx` (A)
- `components/focus/screens/all-tasks.tsx` (A)
- `components/focus/screens/approval.tsx` (A)
- `components/focus/screens/approvals-list.tsx` (A)
- `components/focus/screens/clients-board.tsx` (A)
- `components/focus/screens/clients-client.tsx` (A)
- `components/focus/screens/clients-new-project.tsx` (A)
- `components/focus/screens/clients-plan.tsx` (A)
- `components/focus/screens/clients-projects.tsx` (A)
- `components/focus/screens/comms-business.tsx` (A)
- `components/focus/screens/comms-calendar.tsx` (A)
- `components/focus/screens/comms-mail.tsx` (A)
- `components/focus/screens/comms-notifications.tsx` (A)
- `components/focus/screens/comms-today-manager.tsx` (A)
- `components/focus/screens/comms-users.tsx` (A)
- `components/focus/screens/marketing-brief.tsx` (A)
- `components/focus/screens/marketing-campaign.tsx` (A)
- `components/focus/screens/marketing-inspiration.tsx` (A)
- `components/focus/screens/marketing-prompts.tsx` (A)
- `components/focus/screens/marketing-publish.tsx` (A)
- `components/focus/screens/marketing-studio-home.tsx` (A)
- `components/focus/screens/marketing-trends.tsx` (A)
- `components/focus/screens/project-execution.tsx` (A)
- `components/focus/screens/project.tsx` (A)
- `components/focus/screens/reports-activity.tsx` (A)
- `components/focus/screens/reports-brain.tsx` (A)
- `components/focus/screens/reports-connections.tsx` (A)
- `components/focus/screens/reports-goals.tsx` (A)
- `components/focus/screens/reports-hours.tsx` (A)
- `components/focus/screens/reports-weekly.tsx` (A)
- `components/focus/screens/sales-discovery.tsx` (A)
- `components/focus/screens/sales-lead.tsx` (A)
- `components/focus/screens/sales-leads.tsx` (A)
- `components/focus/screens/sales-outreach.tsx` (A)
- `components/focus/screens/sales-proposal.tsx` (A)
- `components/focus/screens/sales-proposals.tsx` (A)
- `components/focus/screens/screen-map.tsx` (A)
- `components/focus/screens/studio-directions.tsx` (A)
- `components/focus/screens/studio-editor.tsx` (A)
- `components/focus/screens/studio-formats.tsx` (A)
- `components/focus/screens/studio-new.tsx` (A)
- `components/focus/screens/today.tsx` (A)
- `components/focus/screens/work-my.tsx` (A)
- `components/focus/screens/work-project.tsx` (A)
- `components/focus/screens/work-states.tsx` (A)
- `components/focus/screens/work-time.tsx` (A)
- `components/focus/shell/command-palette.tsx` (A)
- `components/focus/shell/demo-store.tsx` (A)
- `components/focus/shell/focus-bar.tsx` (A)
- `components/focus/shell/menu.tsx` (A)
- `components/focus/shell/shell.css` (A)
- `components/focus/shell/task-drawer-host.tsx` (A)
- `components/focus/shell/theme.tsx` (A)
- `components/focus/shell/timer-bar.tsx` (A)
- `components/focus/shell/top-bar.tsx` (A)
- `components/focus/shell/use-queue.ts` (A)
- `components/focus/ui/button.tsx` (A)
- `components/focus/ui/cx.ts` (A)
- `components/focus/ui/dialog.tsx` (A)
- `components/focus/ui/feedback.tsx` (A)
- `components/focus/ui/field.tsx` (A)
- `components/focus/ui/icon.tsx` (A)
- `components/focus/ui/misc.tsx` (A)
- `components/focus/ui/status.tsx` (A)
- `components/focus/ui/tabs.tsx` (A)
- `components/focus/ui/toast.tsx` (A)
- `components/focus/ui/ui.css` (A)
- `docs/focus/ARCHITECTURE.md` (A)
- `docs/focus/QA.md` (A)
- `docs/focus/README.md` (A)
- `docs/focus/mytiv-work-contract.md` (A)
- `lib/focus/color.ts` (A)
- `lib/focus/contracts/approvals.ts` (A)
- `lib/focus/contracts/clients.ts` (A)
- `lib/focus/contracts/common.ts` (A)
- `lib/focus/contracts/comms.ts` (A)
- `lib/focus/contracts/loadable.ts` (A)
- `lib/focus/contracts/marketing.ts` (A)
- `lib/focus/contracts/projects.ts` (A)
- `lib/focus/contracts/reports.ts` (A)
- `lib/focus/contracts/sales.ts` (A)
- `lib/focus/contracts/settings.ts` (A)
- `lib/focus/contracts/status.ts` (A)
- `lib/focus/contracts/studio.ts` (A)
- `lib/focus/contracts/today.ts` (A)
- `lib/focus/contracts/work.ts` (A)
- `lib/focus/fixtures/approvals.ts` (A)
- `lib/focus/fixtures/clients.ts` (A)
- `lib/focus/fixtures/clock.ts` (A)
- `lib/focus/fixtures/comms.ts` (A)
- `lib/focus/fixtures/marketing.ts` (A)
- `lib/focus/fixtures/people.ts` (A)
- `lib/focus/fixtures/projects.ts` (A)
- `lib/focus/fixtures/reports.ts` (A)
- `lib/focus/fixtures/sales.ts` (A)
- `lib/focus/fixtures/settings.ts` (A)
- `lib/focus/fixtures/studio.ts` (A)
- `lib/focus/fixtures/today.ts` (A)
- `lib/focus/fixtures/work.ts` (A)
- `lib/focus/format.ts` (A)
- `lib/focus/routes.ts` (A)
- `lib/focus/screens.ts` (A)
- `lib/focus/state/approvals.ts` (A)
- `lib/focus/state/editor.ts` (A)
- `lib/focus/state/execution.ts` (A)
- `lib/focus/state/jobs.ts` (A)
- `lib/focus/state/keyboard.ts` (A)
- `lib/focus/state/undo.ts` (A)
- `lib/focus/state/work.ts` (A)
- `scripts/focus/convert-handoff.py` (A)
- `scripts/focus/frame-server.py` (A)
- `scripts/focus/qa/axe.mjs` (A)
- `scripts/focus/qa/flows.mjs` (A)
- `scripts/focus/qa/keyboard.mjs` (A)
- `scripts/focus/qa/lib.mjs` (A)
- `scripts/focus/qa/routes.mjs` (A)
- `scripts/focus/qa/visual.mjs` (A)
- `tests/focus-data-states.vitest.ts` (A)
- `tests/focus-flows.vitest.ts` (A)
- `tests/focus-work.vitest.ts` (A)

</details>

## 4. Boundary confirmation — backend, API, DB, migrations, pkg1 untouched

- `git diff --stat e35a189..93f2182 -- . ':!app/focus' ':!components/focus' ':!lib/focus' ':!docs/focus' ':!scripts/focus' ':!tests/focus-*'`
  → only `.gitignore` (+3 lines).
- `git diff --name-only e35a189..93f2182 -- lib/db app/api drizzle db migrations` → empty. No API route, schema,
  migration, seed or production configuration changed.
- `auto/work-pkg1` was read only, as a contract source. It is still at `6b6f537` (local, not pushed); nothing was
  merged or cherry-picked from it.
- Nothing under `/focus` makes network calls. External actions (Gmail, Meta, ClickUp, AI) are simulated by the demo
  store, with failure injection from the screen map.

## 5. Test evidence (measured at `93f2182`)

| Check | Result | Command |
|---|---|---|
| Typecheck | ✓ 0 errors | `npx tsc --noEmit -p .` |
| Focus lint | ✓ 0 errors / 0 warnings | `npx eslint app/focus components/focus lib/focus scripts/focus tests/focus-*.ts` |
| Focus unit tests | ✓ 45 / 45 (3 files) | `node node_modules/vitest/vitest.mjs run --config tests/route-vitest.config.mjs tests/focus-*.vitest.ts` |
| Full existing suite | ✓ 219 / 219 (23 files) + `ops-security` node tests | `npm test` (dummy DB env) |
| Production build | ✓ 125 pages, 49 `/focus` routes | `next build` with dummy `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `SECRETS_MASTER_KEY`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` |
| Whole-repo lint (context) | 56 errors / 604 warnings, **all pre-existing in files this branch never touched** | `npx eslint` + per-file `git diff e35a189..HEAD` |

The unit tests cover:
- approval rules and the mandatory reason;
- the execution state machine (confirm → sending → sent / failed, retry);
- the undo window;
- processing jobs;
- My Tasks buckets;
- Kanban transitions;
- parent / sub-task rules;
- dependency blocking (same project, no cycles);
- timer start / pause / resume / switch, and nothing logged under 30s;
- unknown vs zero;
- unavailable vs empty vs error;
- theme preference;
- permissions hiding actions;
- keyboard shortcuts never firing in text fields;
- optimistic patches with a version token (a conflict overwrites nothing).

## 6. Browser QA evidence (Chromium via Playwright, dev server, `scripts/focus/qa/`)

| Script | Result | What it asserts |
|---|---|---|
| `routes.mjs` | ✓ 52 / 52 | 50 routes × 1440 / 1280 / 1024 / 768 / 390: no console errors, no horizontal scroll, no `href="#"` or placeholder links, 109 internal links resolve, no product route imports the reference |
| `axe.mjs` | ✓ 150 / 150 | axe-core serious + critical, light and dark at 1440, light at 390 |
| `keyboard.mjs` | ✓ 54 / 54 | skip link first (or the deep-linked dialog), visible focus on every stop, accessible names, menus / palette / dialogs open by keyboard, Esc closes, focus returns |
| `flows.mjs` | ✓ 20 / 20 (three consecutive runs) | mandatory reason, confirmation before the red action, processing → success / failure with the draft kept, retry, format selection, undo window, one-by-one focus queue, unsaved-change guards, Kanban keyboard with refused moves explained, version conflict, blocked task cannot complete, theme persisted with no flash + system follows the OS, typed LTR text keeps its order |
| `visual.mjs` | 59 captures (below) | pixel diff vs the handoff frames |

Also checked:
- **Reduced motion:** one global rule removes all transitions and animations under `.focus-app`.
- **RTL with LTR content:** 169 mixed nodes on 45 routes were scanned; they are single LTR tokens, and e-mails, phones
  and numbers use `<bdi>` / `dir="ltr"`.
- **Theme:** light / dark / system.

## 7. Visual QA summary

- **Method:** ±1px shift-tolerant pixel diff.
  - Desktop: full page at 1440.
  - Phone: the reference's phone screen vs the product at 390×794.
- **Light theme:**
  - median 5.5% on desktop and 15.5% on phone;
  - 20 of 59 captures are ≤ 5%, and 43 are ≤ 10%.
- **Dark theme:** indicative only (median 13.8%), because the reference conversion hard-codes some light surfaces.
- **Verdicts:** 1 match · 40 intended · 9 fixed during QA · 9 remaining deviations (all in §8).
- **Why the high numbers are mostly state, not layout:**
  - all screens read one shared fixture set;
  - some jobs were captured mid-run;
  - drawers and popovers the frame shows open are closed in the product;
  - rules the frame ignores, e.g. a blocked task cannot be completed.
- **Pass 2 (product quality):** hierarchy, density, readability, discoverability, permissions, error states and
  dangerous actions are reviewed in `docs/focus/QA.md` §3.

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

Per-screen reasons, interaction state and accessibility state: `docs/focus/QA.md` §2.

## 8. Known deviations (all Medium / Low items from `docs/focus/QA.md` §4)

No critical or high issues are open in the Focus UI.

**Medium**
1. H15: notifications render as a page; the frame designs a bell popover over the current screen.
2. E5 "all formats":
   - the formats are arranged in one row of solid cards, where the frame has the story as hero plus a dashed stacked column;
   - Brand Kit moved to the side panel.
3. Sales detail routes are single fixtures (`/focus/sales/leads/noa-cohen`, `/focus/sales/proposals/corporate-hosting`);
   the other leads and proposals have no dynamic route yet.
4. Cross-screen data consistency:
   - G3 / G4 tell the content-approval story differently from the approvals queue state;
   - G1's Instagram row does not read the reconnect state set in G6.
5. M10: the task drawer on phones is near full height (the frame shows a half sheet with a grabber) and has no
   "תגובה" footer action.

**Low**
1. Native date inputs follow the browser locale format (D3, E7, W4, M10).
2. F5 / M6:
   - no per-row completion checkbox (completion is the quick action);
   - M6 has a header plus a full-width "+ משימה" instead of a FAB.
3. Smaller layout deviations:
   - D8 "פרטי התקלה" sits inline instead of below;
   - W3 is missing "קבץ לפי";
   - the W5 report card styling is flatter;
   - W6 quick create is the inline bar, not the frame's modal;
   - M5 shows nested pending cards;
   - M9 has its FAB on its own row.
4. Shared patterns:
   - `ActionCard` has no tag / footer slots (D8 copies its markup);
   - H5's content board duplicates the TaskBoard keyboard / drag model instead of sharing it.
5. Chromium's date-picker button inside a date field draws its own focus ring, which author CSS cannot reach. It is
   visible, but it is not the 3px ink ring.
6. Repo-level context:
   - `next build` needs dummy `QSTASH_*` keys because an unrelated API route checks them at build time;
   - whole-repo lint has 56 pre-existing errors outside this branch.
7. The task drawer shows a dev-only "remote edit" demo control (`NODE_ENV !== "production"`; absent from the build).

## 9. Backend boundary and integration prerequisites

The Focus branch is **fixture / demo-store backed**. None of the following is implemented yet:

1. Work read API returning the neutral `WorkItem` with its concurrency token, for "mine" and per project.
2. Governed write API under `/work` with `expectedVersion` + `requestId` and a conflict (409) response.
3. Concurrency integration: the UI's `version: number` becomes an opaque `concurrencyToken` string.
4. Assignee, start-date and estimate writes for Mytiv tasks.
5. Checklist, dependencies (`blocks`, same project), sub-task creation (`parent_id`), move with `move_blocked`.
6. Comments and activity per task.
7. Timers, manual time entries and the time report for Mytiv tasks. The timer is in `localStorage` today.
8. Per-business permissions (viewer role, per-project `work_authorize`) and the per-business status vocabulary
   (`work_statuses` labels).
9. Fields with no column yet: participants, next action, follow-up date, blocked reason.

Contract mismatches, resolved in the contract rather than in pkg1:
- pkg1 has no `blocked` status. Blocked is derived from an open dependency, or from a business key under `waiting`.
- pkg1's `review` maps to `in_progress` with the label "בבדיקה".

Proposed integration order (`mytiv-work-contract.md` §13):
1. Read adapter.
2. Status and assignee writes.
3. Create + due date, with the string token.
4. Hierarchy + checklist.
5. Dependencies + move.
6. Comments.
7. Timers.
8. Remove the demo store.

## 10. Owner gates (pkg1, before any integration)

- **Migration `0012_work_expand`:** additive, not applied anywhere yet. Staging first, then production, before any
  deploy of the dual-write code.
- **Role split:** the runtime still connects as `neondb_owner` (staging and production), so the DB guards are
  guardrails only; a least-privilege app role (`mytiv_app`) needs owner approval.
- **Production report:** the read-only legacy tasks data report (pkg1 PR 2) has to be run against production, with
  owner approval, before the backfill.

Until these are cleared, this PR stays a draft and frontend-only.
