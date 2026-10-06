# Focus — visual QA and verification

Gates (§1) re-measured on 2026-10-06 against `auto/focus-redesign` after the self-review rounds (the final SHA is in
[GPT_REVIEW_PACKET.md](GPT_REVIEW_PACKET.md)); dev server on port 3200, Chromium (Playwright), `reducedMotion: reduce`.
Routes are relative to the tenant segment and measured on the fixture demo scope `/_demo` (a business scope renders
"not connected yet"). The per-screen pixel tables (§2) were measured at `4548020`; the later commits change behaviour,
copy and routing, not layout. Every number is reproducible with the scripts in `scripts/focus/qa/` (see
[README.md](README.md)).

## 1. Gates

| Gate | Result | How |
|---|---|---|
| Typecheck | ✓ 0 errors | `npx tsc --noEmit -p .` |
| Lint (Focus code) | ✓ 0 errors, 0 warnings | `npx eslint "app/(focus)" components/focus lib/focus scripts/focus tests/focus-*.ts` |
| Lint (whole repo) | pre-existing errors only, **all in files this branch never touched** (`app/(app)/…`, `lib/google/*`, `scripts/leak-audit.ts`, the gitignored handoff bundle) | `npx eslint` + `git diff e35a189..HEAD -- <file>` per file |
| Focus unit tests | ✓ 111 / 111 (4 files: scope, work, flows, data states) | `node node_modules/vitest/vitest.mjs run --config tests/route-vitest.config.mjs tests/focus-*.vitest.ts` |
| Mutation (unit level) | ✓ 31 / 31 mutants caught — the unknown-outcome gate (retry without the target check, a statement not tied to the unknown attempt, a confirmed success repeated, an in-flight attempt not blocking, the store admitting without the gate), and tenant guard, session, prototype switch, fixtures for a business, notFound wiring, a page's scope guard, scoped links, block guard + invariant, canonical status, Kanban storing "blocked", mandatory reason, sent before confirmation, version conflict, unknown as 0, dependency cycle, parent with open child, undo window, retry / submit amount guard, proposal amount check, interrupted send as done, reload not marking unknown, drawer adopting another writer, planned capability outside the demo, Hebrew-layout shortcut | a script applies one mutation at a time to a copy and runs the Focus unit tests |
| Full existing suite | ✓ 285 / 285 vitest (24 files) + 28 / 28 `ops-security` node tests | `npm test` (dummy DB env) |
| Production build | ✓ 49 Focus routes under `/[businessSlug]/focus` | `next build` (dummy DB env + dummy `QSTASH_*` signing keys) |
| Production isolation | ✓ 18 / 18 — demo scope and every prototype surface 404 with no fixture/prototype text; business routes, forged / unsigned cookies and scope-making query parameters → `/login`; old `/focus` not a product route | `prod-surfaces.mjs --expect production` against `next start` |
| Preview QA surfaces | ✓ 6 / 6 — demo scope, screen map and reference render on `VERCEL_ENV=preview`; business routes still need a session | `prod-surfaces.mjs --expect preview` |
| Routes · console · responsive | ✓ 53 / 53 — every route × 1440/1280/1024/768/390: no console errors, no horizontal scroll, no `href="#"`, no placeholder links, 111 internal links resolve and stay in the scope, no product route imports `components/focus/reference` | `routes.mjs` |
| Accessibility (axe-core, serious + critical) | ✓ 150 / 150 — light + dark at 1440, light at 390 | `axe.mjs` |
| Keyboard-only walkthrough | ✓ 54 / 54 — skip link first (or the deep-linked dialog), visible focus on every stop, accessible names, menus / palette / dialogs open with the keyboard, Esc closes, focus returns | `keyboard.mjs` |
| Flows end to end | ✓ 43 / 43 — including Gmail and Meta UNKNOWN outcomes (interrupted in flight, reloaded: no generic CTA or ordinary retry starts another attempt, the explicit target check unlocks exactly one, a confirmed failure retries normally, a confirmed success is never repeated; a browser mutant removing the gate fails them), and the navigation guard (links, ⌘K, Back/Forward, drawer, D3), history without duplicate entries, a click queued while the guard entry is stepped off, listener counts stable, drafts kept by "save and leave", an interrupted send shown as unknown, a failed proposal send not retryable at a changed amount, quick approve never scheduling a placeholder photo, the round-3 regressions (no second mail send through a draft undo, no undo on a sent proposal, focus back on the task link after the drawer closes, a multi-step Back jump not pushed onto another page, Back-leave asking once) | `flows.mjs` |
| Theme light / dark / system | ✓ persisted, attribute on `.focus-app` set before first paint (no flash, no hydration warning), system follows `prefers-color-scheme` | `flows.mjs` §7 |
| Reduced motion | ✓ one global rule removes every transition / animation under `.focus-app`; `requestAnimationFrame` is used only to move focus and to order a queued navigation after the router's history step | code review |
| RTL + LTR content | ✓ mixed Hebrew/Latin text nodes are single LTR tokens (brand names, AI, PDF) — no reordering; e-mails / phones / numbers use `<bdi>` / `dir="ltr"`, a business name `<bdi>` (auto); typed LTR text keeps its order | scan + `flows.mjs` §8 |

Unit-test coverage map (the requested list): approval rules and mandatory reason · execution state machine (pre-execution
summary: confirm → sending → sent / failed, retry) · undo window · processing jobs · My Tasks buckets · Kanban
transitions · parent / sub-task rules · dependency blocking (same project, no cycles) · timer start / pause / resume /
switch / sub-30s · unknown vs zero · unavailable vs empty vs error · theme preference parsing · permissions hiding actions
· keyboard shortcuts never firing in text fields and matching the physical key on Hebrew / AZERTY layouts · versioned
writes with an opaque token (conflict overwrites nothing) · derived "blocked" and the stored-task invariant · versioned
undo · write lineage (adopt only own writes) · source capability gate · send / retry refused at a changed amount ·
interrupted external jobs unknown · tenant scope decision, server redirect / notFound wiring and static route-tree
guarantees.

Fixed during this QA round (all committed): dark-mode contrast on marketing briefs / plan (panel tokens), task-drawer
selects losing their label at 390px, drawer date fields' focus ring, D4 column alignment, E1 note outside its card,
E3 doubled save state, M3 decision bar without gutter, M4 step label, M7b contact card width, M8 decision buttons
~1,900px down the page (now a pinned bar), M9 timer bar clipping, M10 hidden time count and over-wide assignee chip,
4:5 design headline spilling out of its frame (D7 / M8), LTR text order.

## 2. Pass 1 — match to the handoff

Δ% = share of pixels that differ after a ±1px shift tolerance (channel delta > 24), full page at 1440 for desktop
frames; for phone frames, the phone screen cropped out of the reference vs the product at 390×794.

**Reading the numbers.** Light desktop median **5.5%**, phone median **15.5%**; 20 of 59 captures ≤ 5%, 43 ≤ 10%.
Dark diffs (median 13.8%) are indicative only: the reference conversion hard-codes some light surfaces, so a correct
dark screen still differs. High numbers are mostly *state* (what the capture shows), not layout: all screens read one
shared fixture set (lists and counts differ from each frame's hand-written data), jobs captured mid-run, drawers and
popovers the frame shows open, and rules the frame ignores (e.g. a blocked task cannot be completed).

Verdicts: **match** · **intended** (data, real state, accessibility, documented product decision) · **fixed** (found in
this pass and corrected) · **deviation** (layout drift that remains, severity in brackets: L low, M medium — listed in §4).

| Frame | Screen | Route | View | Light Δ% | Dark Δ% | Verdict | Differences (pass 1) | Interaction state | Accessibility |
|---|---|---|---|---:|---:|---|---|---|---|
| D1 | היום שלי · לפי זמן | `/focus` | 1440 | 3.19 | 6.44 | intended | Layout matches; only fixture data differs (task lists/counts, project chip "דורש מעקב"). | time board + action cards; quick approve (A) → job → undo toast; one-by-one focus mode; timer | axe ✓ · keyboard ✓ |
| D2 | סביבת פרויקט › סקירה | `/focus/projects/umino` | 1440 | 2.63 | 3.79 | intended | Layout matches; active nav + client chip reflect the real route; decisions count from fixtures. | tabs (overview/execution/content/results); hero CTA → focus queue; sources open drawers | axe ✓ · keyboard ✓ |
| D3 | סביבת פרויקט › ביצוע › משימות | `/focus/projects/umino/execution` | 1440 | 9.21 | 34.46 | intended | Same project header as D2 (consistent across tabs); dense task table instead of card rows (shared Mytiv Work list). Date inputs follow the browser locale (open issue L). | D3 execution: list ⇄ drawer, unsaved-switch guard, blocked panel with save & sync job (ClickUp) | axe ✓ · keyboard ✓ |
| D4 | מרכז האישורים · רשימה | `/focus/approvals` | 1440 | 5.47 | 11.58 | fixed | Waiting-on-others columns now align with the main table (zero-height header kept for AT). Type/project filters are selects; one low-risk row adds quick approve. | filters, quick approve on low risk, waiting-on-others, decided with undo | axe ✓ · keyboard ✓ |
| D5 | אישור · פירוט · מצב פוקוס | `/focus/approvals/promo-1plus1` | 1440 | 2.61 | 15.18 | intended | Layout matches; queue side panel and reason field state come from fixtures (reason empty until typed). | mandatory reason (medium+), A/R/J shortcuts off in fields, leave guard, undo window | axe ✓ · keyboard ✓ |
| D6 | אישורים · מצב פוקוס · סיכום לפני ביצוע | `/focus/approvals/proposal-noa` | 1440 | 4.27 | 14.66 | intended | Confirmation unticked, red action locked until ticked; card shorter so the action bar sits under the content. | pre-execution summary: checkbox before red action, sending → sent only on confirm, failure keeps draft + retry | axe ✓ · keyboard ✓ |
| D7 | אישור תוכן · בקשת תיקון | `/focus/approvals/content-sushi-story` | 1440 | 5.18 | 5.75 | intended | Step "4 מתוך 4" (queue state); fix notes gain remove buttons; 4:5 headline now wraps inside its frame. | content review: pinned notes, mandatory reason, comment-only, approve anyway / reject; leave guard | axe ✓ · keyboard ✓ |
| D8 | היום שלי · מנהלת · נתונים חלקיים ותקלה | `/focus/today-manager` | 1440 | 3.95 | 14.77 | deviation | "פרטי התקלה" sits inline beside the Instagram text instead of below it (L). KPI/now-column differences are data. | partial ClickUp read (counts hidden), 'load all' job, assign-to-me + sync, view-only preview | axe ✓ · keyboard ✓ |
| E1 | קמפיין | `/focus/marketing/campaigns/thursday-sushi` | 1440 | 6.48 | 12.67 | fixed | Results note moved inside the results card (ResultsCard footer slot). Plan rows add "לאישור" links; edit is "מתוכנן". | approval states live from the store; Kanban/calendar views planned | axe ✓ · keyboard ✓ |
| E2 | סטודיו התוכן · מסך פתיחה | `/focus/studio` | 1440 | 5.54 | 10.36 | intended | Format tiles in plain language; client filter is a select; recent work from fixtures; planned tags. | stage/client filters, start-new flow, live approval stage | axe ✓ · keyboard ✓ |
| E3 | יצירה · שלבים 1–3: מטרה, פורמט ובריף | `/focus/studio/new` | 1440 | 5.14 | 7.7 | fixed | Save state is one status line ("בריף חדש · אין שינויים לשמור"); language is a select. | steps 1–3, format selection (≥1 required), AI draft job fills empty fields, close guard | axe ✓ · keyboard ✓ |
| E4 | יצירה · שלב 4: כיוונים | `/focus/studio/new/directions` | 1440 | 13.64 | 13.97 | intended | Captured while the 3 direction jobs run (processing state); the frame shows them finished. Ready state is covered by flows.mjs. | 3 AI direction jobs: running → ready / failed, cancel, retry, 'more like this' | axe ✓ · keyboard ✓ |
| E5 | סטודיו התוכן · כל הפורמטים יחד | `/focus/studio/thursday-sushi` | 1440 | 21.52 | 22.68 | deviation | Formats in one bottom-aligned row of solid cards; the frame stacks square + banner in a dashed column; Brand Kit moved to the side panel (M). | adaptation jobs per format, fixable warning, send for approval | axe ✓ · keyboard ✓ |
| E6 | עורך · פורמט יחיד · אזורי בטיחות | `/focus/studio/thursday-sushi/edit` | 1440 | 6.19 | 13.53 | match | Near-identical; contrast value computed (14.7), hidden-layer state shown. | layers, undo/redo, safe-zone checks (warn, never block), autosaved draft | axe ✓ · keyboard ✓ |
| E7 | יצוא ופרסום · אחרי אישור | `/focus/studio/thursday-sushi/publish` | 1440 | 9.26 | 13.19 | intended | Downloads "מתוכנן"; scheduling validated + pre-execution summary. Date input follows browser locale (open issue L). | schedule at Meta via pre-execution summary (job; 'scheduled' only on confirm); downloads planned | axe ✓ · keyboard ✓ |
| F1 | לידים · רשימה | `/focus/sales` | 1440 | 2.39 | 14.92 | intended | More leads (fixtures); completeness as outlined chips; sort is a select; "ידוע" certainty labels. | stage filters/sort, set next action (undo), new lead dialog (validated) | axe ✓ · keyboard ✓ |
| F2 | מסך ליד | `/focus/sales/leads/noa-cohen` | 1440 | 2.59 | 10.96 | intended | Note box has a real label + save; header contact actions are "מתוכנן". | next action → proposal; notes timeline; external contact planned; contact-search job | axe ✓ · keyboard ✓ |
| F3 | הצעת מחיר · עריכה ותצוגה מקדימה | `/focus/sales/proposals/corporate-hosting` | 1440 | 2.11 | 3.52 | intended | Template/validity are real selects with help; delete targets 44px; payment-terms note. | live totals (VAT 18%), autosave draft, invalid field blocks leaving, → pre-execution summary | axe ✓ · keyboard ✓ |
| F4 | פניות יזומות · טיוטה ובדיקת עובדות | `/focus/sales/outreach` | 1440 | 6.49 | 10.18 | intended | Fact-check issues carry fix buttons; sources show "אומת"; recipient help text. | editable draft, fact-check marks + fixes, rewrite job with undo; Gmail draft planned | axe ✓ · keyboard ✓ |
| F5 | משימות · כל הפרויקטים | `/focus/work/all-tasks` | 1440 | 3.56 | 40.8 | deviation | Grouped by project; no per-row completion checkbox (completion is the "סמן כהושלם" quick action) (L). | all tasks across projects: filters, grouping, drawer deep link | axe ✓ · keyboard ✓ |
| F6 | דואר · שיחה וטיוטת תשובה | `/focus/comms` | 1440 | 3.09 | 11.84 | intended | "בדוק ושלח" through a confirm dialog replaces "open in Gmail"; save-draft; verified-fact badges. | search/filters, editable AI draft with highlighted claims, rewrite job, send via confirm dialog | axe ✓ · keyboard ✓ |
| G1 | דוחות › יעדים וביצועים · מגירת מקור הנתון | `/focus/reports` | 1440 | 16.97 | 29.76 | intended | The source drawer opens on click (frame shows it open); month select, planned export, richer source column. | every number has source/freshness/certainty; source drawer; chart + table + summary | axe ✓ · keyboard ✓ |
| G2 | שעות ורווחיות | `/focus/reports/hours` | 1440 | 10.12 | 14.3 | intended | Banner wraps; KPI "מקור" links; utilisation %, risk reasons, fallback notes (fixtures). | ≈ estimates with basis, usage bars, source drawers | axe ✓ · keyboard ✓ |
| G3 | סקירה שבועית | `/focus/reports/weekly` | 1440 | 2.24 | 2.29 | intended | Share is "מתוכנן"; every line links its source; "מקושר למקור" badges; editable summary. | focus mode; AI sections 'not verified' until checked; editable summary with leave guard; PDF planned | axe ✓ · keyboard ✓ |
| G4 | יומן פעולות | `/focus/reports/activity` | 1440 | 4.07 | 16.82 | intended | Person filter is a select; rows add details; irreversible rows explain why. | undo/redo of reversible rows, irreversible explained, failed sync retry job | axe ✓ · keyboard ✓ |
| G5 | מוח העסק · UMINO | `/focus/clients/umino/brain` | 1440 | 3.1 | 4.37 | intended | Popover adds source links and "שנה מקור"; status icons. | verify (undo), edit with validation, mark wrong / ask client (undo) | axe ✓ · keyboard ✓ |
| G6 | הגדרות › חיבורים · תקלה ב־Instagram | `/focus/settings/connections` | 1440 | 5.31 | 7.16 | intended | Drawer adds the role-aware request section; "מתוכנן" on disconnect/Brand Kit; affected-items links. | reconnect job (owner only): running → done / failed (data kept); other roles request | axe ✓ · keyboard ✓ |
| H1 | כל הפרויקטים | `/focus/projects` | 1440 | 7.21 | 11.65 | intended | Frame has a duplicated top bar (artifact); filters show values; only real routes are active, others "מתוכנן". | cards ⇄ table, filters, search, sort; wizard-created projects listed | axe ✓ · keyboard ✓ |
| H2 | לקוח · UMINO | `/focus/clients/umino` | 1440 | 7.47 | 8.35 | intended | Contacts gain e-mails + copy; Instagram row links to settings. | projects, results with certainty, contacts, brain summary, connections | axe ✓ · keyboard ✓ |
| H3 | פרויקט חדש · שלב 3 מתוך 6 | `/focus/projects/new` | 1440 | 3.28 | 6.35 | intended | Wizard opens at step 1 (frame shows step 3); steps validated, back keeps values. | 6-step wizard: per-step validation, back keeps values, leave guard, local create | axe ✓ · keyboard ✓ |
| H4 | תוכנית שיווק | `/focus/marketing/plan` | 1440 | 8.49 | 13.78 | intended | Rows add edit; "+ מהלך"; assumptions get "סמן כאומת"; client verification request "מתוכנן". | editable plan, moves with approval state, assumptions to verify, send-to-client via confirm (sending planned) | axe ✓ · keyboard ✓ |
| H5 | לוח עבודה · Kanban | `/focus/marketing/board` | 1440 | 3.56 | 14.57 | intended | Same columns; drag handles; empty column says so; view toggle beside the title. | content Kanban (keyboard + drag), list view; calendar planned; rule-refused moves explained | axe ✓ · keyboard ✓ |
| H6 | השראה ומודבורדים | `/focus/marketing/inspiration` | 1440 | 7.78 | 20.83 | intended | Upload "מתוכנן" (never fakes); moodboard filter checkbox; data from fixtures. | filters, moodboards, save link (validated, undo); upload planned | axe ✓ · keyboard ✓ |
| H7 | הזדמנויות ומגמות | `/focus/marketing/trends` | 1440 | 5.81 | 14.28 | intended | "הוסף לקמפיין" "מתוכנן"; match basis line per card. | save / dismiss with undo, restore, refresh job | axe ✓ · keyboard ✓ |
| H8 | גילוי לידים · חיפוש ברקע | `/focus/sales/discovery` | 1440 | 5.2 | 12.88 | intended | Shows the finished search (frame: in progress); duplicates refused; category select. | search as background job, add as lead (undo), duplicate refused with reason | axe ✓ · keyboard ✓ |
| H9 | הצעות מחיר · רשימה | `/focus/sales/proposals` | 1440 | 4.18 | 6.08 | intended | Status filter chips; live status from the approvals queue. | filters, live status from approvals queue, follow-up task; reminder planned | axe ✓ · keyboard ✓ |
| H10 | יומן · שבוע | `/focus/comms/calendar` | 1440 | 3.59 | 18.94 | intended | Prev/next/today; now-line; event placement from fixtures. | day/week/month, prev/today/next, add event (validated, undo), sync banner | axe ✓ · keyboard ✓ |
| H11 | בריפים · תוצאת ניתוח | `/focus/marketing/briefs` | 1440 | 7.32 | 14.65 | intended | "הוסף לחוט העסק" disabled with its reason until facts are confirmed; planned tags. | confirm/edit facts, AI conclusions marked, conflict, questions; contacting client planned | axe ✓ · keyboard ✓ |
| H12 | פרומפטים · בונה וספרייה | `/focus/marketing/prompts` | 1440 | 8.75 | 9.04 | intended | Category select, favourites, constraints input, real checkboxes; save disabled without changes (with reason). | search/filters, edit → new version (undo), copy, AI improve job with diff | axe ✓ · keyboard ✓ |
| H13 | הגדרות › משתמשים והרשאות | `/focus/settings/users` | 1440 | 3.99 | 6.65 | intended | Matrix cells carry words (כן/לא/בכפוף) under symbols; role selects; owner fixed. | role select with undo, revoke (confirmed, undo), invite locally; e-mail planned | axe ✓ · keyboard ✓ |
| H14 | הגדרות › AI · העסק · Brand Kit | `/focus/settings/business` | 1440 | 5.91 | 8.56 | intended | Settings layout shared with G6/H13 (side nav + header with save); real checkboxes; hex input with contrast check; logo upload "מתוכנן". | validated settings, contrast check, save + undo, leave guard; AI check job | axe ✓ · keyboard ✓ |
| H15 | התראות · ארבע קבוצות | `/focus/notifications` | 1440 | 2.9 | 8.38 | deviation | A notifications page instead of the frame's bell popover over "היום שלי"; tabs and items match (M). | 4 tabs with counts (arrows), store-raised notifications, mark all read | axe ✓ · keyboard ✓ |
| M1 | היום שלי | `/focus` | 390 | 10.93 | 20.48 | intended | Close match; a second card carries its own "בדוק ואשר" button (real action), ~40px lower. | as D1 at 390 (bottom nav) | axe ✓ · keyboard ✓ |
| M2 | אישורים · תור | `/focus/approvals` | 390 | 24.81 | 25.31 | intended | App header and five filters (wrapping); each card has a 48px action button instead of a whole-card tap. | as D4 at 390 | axe ✓ · keyboard ✓ |
| M3 | פירוט אישור · מבצע 1+1 | `/focus/approvals/promo-1plus1` | 390 | 10.63 | 16.67 | fixed | Decision bar now has its 16px gutter (fixed bar had negative margins); reason field empty until typed. | as D5 at 390, decision bar pinned | axe ✓ · keyboard ✓ |
| M4 | סיכום לפני ביצוע · גיליון תחתון | `/focus/approvals/proposal-noa` | 390 | 58.36 | 60.45 | fixed | Step chip reads "שלב 2 מתוך 3 · סיכום סופי"; unticked confirmation, locked red action (intended). | as D6 at 390, bottom sheet | axe ✓ · keyboard ✓ |
| M5 | פרויקט · סקירה | `/focus/projects/umino` | 390 | 13.09 | 13.45 | deviation | Pending approvals drawn as nested tinted cards with status lines (taller than the frame's compact rows) (L). | as D2 at 390 | axe ✓ · keyboard ✓ |
| M6 | משימות | `/focus/work/all-tasks` | 390 | 15.54 | 17.41 | deviation | No round completion checkbox on cards (completion via quick action); app header + full-width "+ משימה" instead of FAB; chips scroll horizontally (L). | as F5 at 390 | axe ✓ · keyboard ✓ |
| M7 | לידים · ליד | `/focus/sales` | 390 | 3.85 | 5.46 | intended | Close match; more leads; status chips scroll horizontally. | as F1 / F2 at 390 | axe ✓ · keyboard ✓ |
| M7b | לידים · ליד | `/focus/sales/leads/noa-cohen` | 390 | 6.63 | 7.09 | fixed | Contact card spans the full width. | as F1 / F2 at 390 | axe ✓ · keyboard ✓ |
| M8 | אישור תוכן | `/focus/approvals/content-sushi-story` | 390 | 35.69 | 20.8 | fixed | Decision bar pinned at the bottom; 4:5 headline wraps inside its frame. Opens in request-changes mode (fixture holds draft notes); the frame shows decide. | as D7 at 390, decision bar pinned | axe ✓ · keyboard ✓ |
| M9 | עבודה · המשימות שלי | `/focus/work` | 390 | 19.86 | 18.96 | fixed | Timer bar title and context on one line each with ellipsis. FAB on its own row (L). | as W1 at 390, '+' opens quick create | axe ✓ · keyboard ✓ |
| M10 | מגירת משימה · גיליון תחתון | `/focus/work/list?task=t-post45` | 390 | 54.18 | 54.41 | fixed | Time count "0h / 4h" visible; assignee chip sized to its value. Sheet is near full height (frame: half sheet) and "תגובה" is not in the footer (L). | as W4 at 390, bottom sheet | axe ✓ · keyboard ✓ |
| W1 | עבודה › המשימות שלי | `/focus/work` | 1440 | 5.64 | 21.81 | intended | Layout matches; fixture data; extra "לא ממופה במקור" bucket (unmapped status never hidden); fixed timer bar. | buckets by time/state; quick create parses text; list/Kanban toggle; drawer | axe ✓ · keyboard ✓ |
| W2 | סביבת פרויקט › ביצוע › Mytiv Work · List | `/focus/work/list` | 1440 | 8.71 | 55.82 | intended | Project header above the tabs (same as D2/D3 for context, +110px); list columns and grouping match. | list grouped by status, parent/subtasks, dependencies, drawer, active timer bar | axe ✓ · keyboard ✓ |
| W3 | ביצוע › Kanban לפי סטטוס | `/focus/work/board` | 1440 | 9.6 | 37.44 | deviation | Board toolbar lacks the frame's "קבץ לפי: סטטוס" button (L); project header above (as W2); drag handles + source labels. | Kanban: Space/arrows/Esc + drag, rule-refused moves announced | axe ✓ · keyboard ✓ |
| W4 | מגירת פרטי משימה | `/focus/work/list?task=t-post45` | 1440 | 41.01 | 42.45 | intended | Real list behind the drawer (frame: skeleton); disabled complete with reason; "מתוכנן" tags; dev-only demo strip. Dates follow browser locale (L). | drawer: status/priority/assignee/dates, checklist, subtasks, deps, timer, manual time, conflict UI, dirty guard | axe ✓ · keyboard ✓ |
| W5 | פס טיימר קבוע · דוח שעות בסיסי | `/focus/work/time` | 1440 | 12.21 | 9.47 | deviation | Time report is one flat card with an unboxed table; the frame splits header and a boxed table (L). | timer start/pause/stop/switch, manual entry (undo), time report | axe ✓ · keyboard ✓ |
| W6 | מצבי מערכת · יצירה מהירה · מתוכנן | `/focus/work/states` | 1440 | 12.93 | 51.67 | deviation | Quick create is the inline W1 bar, not the frame's modal (L); conflict card is amber full-width; extra "ClickUp לא זמין" state. | all view states (loading/empty/error/unavailable/partial/forbidden/conflict) + planned | axe ✓ · keyboard ✓ |

Accessibility column: every route passes axe (serious/critical) in light and dark and the keyboard walk; the
reference routes are excluded from both (they are a visual record, not product).

## 3. Pass 2 — product quality

Reviewed per area against the brief's rules, independent of pixel parity. Nothing here was "fixed" towards the
pixels at the expense of accessibility (targets stay ≥ 44px, labels stay, focus stays visible).

**Hierarchy.** Every screen has one primary action and it is visually first (filled accent); secondary actions are
outlined, tertiary are links. Focus-mode screens (D5–D7, E3–E7, F3, G3, H3) drop the global navigation and keep a
single exit. Risk is always symbol + word + colour, never colour alone. *Open:* E5's formats row gives the 4:5 post and
the story equal weight, where the frame made the story the hero (M).

**Density.** Desktop lists keep the frame's density; mobile cards trade density for 48px actions (M2 shows ~2.5 cards
per screen instead of 4, M5's pending approvals are taller). Acceptable for touch, but a compact card variant would
recover the frame's scan rate (L).

**Readability.** Body text ≥ 13px, meta ≥ 12px, contrast AA in both themes (axe). Unknown values read "—" / "לא ידוע"
with the reason, estimates carry "≈" and their basis. Typed LTR text no longer reorders. *Open:* native date inputs show
the browser's locale format (e.g. 10/03/2026 in an en-US browser) where the frame shows 3.10.2026 (L).

**Discoverability.** Every list item opens its detail by a real link; deep links (`?task=`) open the drawer with focus
inside it; the screen map lists every frame. *Open:* notifications are a page (H15) rather than the frame's bell
popover (M); task completion in F5 / M6 lives in the quick-action column, not a row checkbox (L); W3 lacks the
"group by" control (L).

**Permissions.** Actions the role may not take are hidden or replaced by a request ("בקש מרון לחבר מחדש"), never shown
disabled without a reason; the screen map switches role (owner / admin / member / viewer) and `canDo` is unit-tested.
Capabilities a source lacks are "מתוכנן", never a working-looking button.

**Error states.** Every data region is a `Loadable`: loading, empty, error, unavailable, partial, forbidden and version
conflict render differently (W6 shows them side by side); a failure is never an empty list and a partial read hides the
counts that depend on it (D8). External failures keep the draft and offer retry (D6, F6, E7, G6). Version conflicts show
both values and overwrite nothing until decided.

**Dangerous actions.** The red action exists only in the pre-execution summary: confirmation box first, "sending"
until the target confirms, "sent" only after it did, failure keeps everything. Medium / high risk decisions require a
reason; undo is offered for 10s where the action is reversible and is refused — with the reason, never a false
"בוטל" — when the item moved on; leaving an edit or approval with unsaved input asks first through one shared guard
(dialog for links, search, J, exit buttons and Back/Forward; browser prompt on reload / close). A retry is checked
like the first send (a proposal edited after approval cannot be sent or re-sent), and a send interrupted by a reload
is "unknown — check the target first", never "sent" and never a one-click retry. On phones the decision bar is pinned so the consequential
buttons are always reachable (M3, M8).

## 4. Open issues by severity

No P1 (security, tenant leak, data loss, false claim of an external effect) is open: the three independent review
rounds' P1 findings are fixed and covered by tests (see [GPT_REVIEW_PACKET.md](GPT_REVIEW_PACKET.md) §3). Integration
prerequisites are listed separately in [mytiv-work-contract.md](mytiv-work-contract.md) §12–13.

**Medium (design deviations, unchanged)**
- H15 notifications render as a page; the frame designs a bell popover over the current screen.
- E5 "all formats": formats arranged in one row of solid cards (frame: story as hero + dashed stacked column); Brand
  Kit moved to the side panel.
- Sales detail routes are single fixtures (`/focus/sales/leads/noa-cohen`, `/focus/sales/proposals/corporate-hosting`);
  other leads / proposals have no dynamic route yet.
- Cross-screen data consistency: G3 / G4 tell the content-approval story differently from the approvals queue state;
  G1's Instagram row does not read the reconnect state set in G6.
- M10 task drawer on phones is near full height (frame: half sheet with a grabber) and has no "תגובה" footer action.

**Low / P3 (known, not fixed in this branch)**
- Production bundle: the Focus layout's client bundle (demo store, fixture modules) is downloaded on a business's
  "not connected" page too — nothing is rendered from it and the data is fictional, but the demo shell should get its
  own route tree before real data lands. Not verified on a production build with a real session.
- A jump of several history entries at once while a screen is dirty (Back's long-press menu) cannot be held by a page:
  the guard lets it go cleanly; an in-memory draft is lost (store-backed drafts, e.g. mail, survive).
- History edges of the guard: a multi-step jump that lands on an earlier entry with the same URL as the dirty page is
  treated as one Back (asked, forward history cut); discarding a draft steps off the guard entry, which then stays as
  a forward entry (Forward twice reopens the discarded state); "leave" from a page whose only history is another
  origin goes to the Focus home rather than back to that site.
- Mail: switching threads while a draft is unsaved uses the guard entry up; a later Back leaves without asking (the
  drafts stay per thread in the store, nothing is lost).
- Timer across tabs: two tabs of the same browser share the `localStorage` timer; stopping it in both can log twice
  (the server timer in the integration plan removes this).
- Task-title links in dense tables are 22px tall (under the project's 44px rule; WCAG 2.5.8 is met by spacing).
- A menu whose link is held by the leave dialog may stay open behind it (not reproduced).
- Native date inputs follow the browser locale format (D3, E7, W4, M10).
- F5 / M6: no per-row completion checkbox (completion via quick action); M6 header + full-width "+ משימה" instead of a FAB.
- D8 "פרטי התקלה" inline instead of below; W3 missing "קבץ לפי"; W5 report card styling flatter; W6 quick create is the
  inline bar, not the frame's modal; M5 nested pending cards; M9 FAB on its own row.
- Shared patterns: `ActionCard` has no tag / footer slots (D8 copies its markup); H5's content board duplicates the
  TaskBoard keyboard / drag model instead of sharing it.
- Chromium's date-picker button inside a date field draws its own focus ring (author CSS cannot reach it).
- `next build` needs dummy `QSTASH_*` keys because an unrelated API route checks them at build time; the whole-repo
  lint has pre-existing errors outside this branch.
- The task drawer shows a "remote edit" demo control in the fixture demo scope only (absent for a business and in
  production, where the demo scope does not exist).

## 5. Reproduce

```bash
export PLAYWRIGHT_MODULE=/path/to/node_modules/playwright
node scripts/focus/qa/routes.mjs && node scripts/focus/qa/axe.mjs && node scripts/focus/qa/keyboard.mjs && node scripts/focus/qa/flows.mjs
```
```bash
BASE=http://localhost:3300 node scripts/focus/qa/prod-surfaces.mjs --expect production
```
```bash
BASE=http://localhost:3301 node scripts/focus/qa/prod-surfaces.mjs --expect preview
```
```bash
node scripts/focus/qa/visual.mjs --json visual.json --out shots/
```
