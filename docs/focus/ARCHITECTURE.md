# Focus frontend — architecture

Direction C ("Focus") of Mytiv OS, built from the Claude Design handoff. Branch `auto/focus-redesign`.
Frontend only: **no DB schema, migrations, API routes or backend contracts change on this branch.**
The fixture demo runs every screen through a client-side demo store that stands in for the backend; a real business
sees an honest "not connected yet" page until the adapters exist.

## Tenant scope

| Piece | File | What it does |
|---|---|---|
| Route tree | `app/(focus)/[businessSlug]/focus/**` | Every Focus page lives under the tenant segment. There is no unscoped `app/focus` tree (a test asserts it). |
| Scope decision (pure) | `lib/focus/scope.ts` → `decideFocusScope(slug, deps)` | `_demo` → the demo scope only when prototype surfaces are on; otherwise session → membership (`resolveBusinessOrNull`, the same model as `api-guard.ts`). No user → login; not a member / unknown → notFound. The business identity comes from the resolved row, never from the URL, query or client. Unknown roles narrow to `member`. |
| Server wiring | `lib/focus/scope.server.ts` → `getFocusScope` (cached per request), `rendersFixtures(params)`, `requireDemoScope`, `fixtureMetadata` | `redirect("/login")` / `notFound()`. Every fixture page renders nothing unless the scope is the demo; prototype pages (`screens`, `reference/[id]`, `m/[n]`, `work/task`) require the demo scope in the page **and** in `generateMetadata` (Next resolves metadata even when the layout 404s). |
| Prototype switch | `prototypeSurfacesEnabled()` | `NODE_ENV !== "production"` or `VERCEL_ENV === "preview"`. Plain `next start` and Vercel production are off. |
| Layout | `app/(focus)/[businessSlug]/focus/layout.tsx` | Server layout: resolves the scope, provides it (`FocusScopeProvider`). Demo → `DemoStoreProvider` › `ToastProvider` › `NavGuardProvider` › top bar + page + screen-map button. Business → `FocusNotConnected` (server component, no store, no fixtures). |
| Links | `components/focus/ui/link.tsx` → `Link`, `useFocusRouter`, `useScopedHref` | `R.*` paths are scope-relative; `scopedHref(base, href)` resolves them into the verified scope, is idempotent, and never rewrites another scope's path or an external URL. Every Focus component imports `Link` from here (a test asserts no direct `next/link` outside it and the not-connected exit). |

## Layers

| Folder | What lives there | Rules |
|---|---|---|
| `lib/focus/contracts/` | Types only: status language (canonical `WorkStatus` has no "blocked"; `WorkDisplayStatus` adds the derived one), `Loadable<T>`, `Reading`/`Metric`, approvals, today, projects, work (`Task`, `TaskPatch`, `WriteResult`, `WorkCommands`, `CapabilityMap`), studio, sales, reports | The UI's data contract. Adapters map backend shapes onto these. No React. |
| `lib/focus/fixtures/` | Demo data per domain, on a fixed demo clock (`clock.ts`, `DEMO_NOW` = Thu 1.10.2026 08:10); demo e-mails use `@demo.example` | Absolute ISO timestamps only; screens format them relative to the clock. Rendered only in the demo scope. |
| `lib/focus/state/` | Pure logic, unit-tested: approval rules, execution state machine (`execReducer`, with the `blocked` send guard), jobs (`jobStatus`, `interruptExternal`), undo windows, Mytiv Work rules (`applyPatch`, `revertTask`, `checkMove`, `displayStatus`, `blockedWhy`, `taskInvariant`, `onlyOwnWrites`, `canDo`, timer), layout-safe shortcuts (`plainShortcut`) | No React, no hidden `Date.now()` — time is a parameter. |
| `lib/focus/format.ts` | d.m.yyyy, 24h, `8,750 ₪`, "ממתין יומיים", "לפני 4 דק׳" | Deterministic on server and client (explicit time zone, own Hebrew names). |
| `lib/focus/routes.ts` | Every scope-relative URL (`R.approval(id)`, `R.task(id)` …) | Links go through `R` and the scoped `Link`; no `href="#"`. |
| `components/focus/ui/` | Primitives: `Button`/`ButtonLink`/`IconButton`, status family, fields, `Tabs`/`NavTabs`/`Chips`, `Banner`/`EmptyState`/`Skeleton`/`LoadableView`, `ToastProvider`/`useToast` (undo window; an undo that was refused never shows "בוטל"), `Dialog` (native `<dialog>`, labelled + described), `Link`, `Bdi`, `Icon` | Typed, accessible, no product knowledge. Styles in `ui.css`. |
| `components/focus/patterns/` | Product building blocks per area (approval, work, sales, clients, comms, marketing, studio, reports) | Pure views + callbacks. One CSS file per area. |
| `components/focus/shell/` | Scope provider, not-connected page, top bar, focus bar, timer bar, command palette, theme, demo store, `task-actions.ts` (shared Work actions), `use-queue.ts`, `nav-guard.tsx`, task drawer host | Mounted once in the Focus layout. |
| `components/focus/screens/` | One composed screen per product view | Composition only: store → patterns. No raw colours, no layout-by-inline-style. |
| `components/focus/reference/` | The raw conversion of every handoff frame (`/_demo/focus/reference/<ID>`) | **Visual source of truth only** — used by the parity checks, never imported by product screens. |

## Demo store — the write path for Work and approvals (temporary backend)

`components/focus/shell/demo-store.tsx` holds decisions, executions, tasks, timer, jobs, drafts, notifications.
Session state → `sessionStorage` (`mytiv-focus-demo-v3`); the timer → `localStorage`. Two small session stores sit
beside it for screens that have no Work semantics: sales leads / proposal draft (`patterns/sales/sales-store.ts`) and
wizard-created projects (`patterns/clients/session-projects.ts`); the proposal send guard reads the sales store.
- **Mytiv Work writes** implement `WorkCommands` (checked with `satisfies`): `patchTask`, `moveTask`, `undoTask`,
  `createTask`, `removeTask`, `logTime`. Each takes the opaque token (`Task.version: string`) the caller rendered;
  every rule runs in `applyPatch` / `revertTask` (canonical status, block needs a written reason, reopen gate,
  dependency rules, stored-task invariant). Tokens are minted only there (`nextVersion`; a created task starts at `v1`); `updatedBy` is the actor.
  The store keeps a write lineage (`writes`) so an open drawer adopts the viewer's own writes made elsewhere and
  treats anyone else's as a conflict (`onlyOwnWrites`).
- **Undo** is a versioned compensating write (`useTaskUndo`, `useCreateUndo`) that is refused — and says why — when
  the task moved on; the toast then never claims "בוטל". Undoing a write already synced to ClickUp starts a revert
  sync (`useRevertSync`) instead of claiming nothing changed. Undo callbacks read the latest committed state
  (`getLatest`), never a stale render.
- **Quick-write gate** (`useTaskGate`): role + the task source's capability map. A planned capability runs only in
  the demo scope and its toast says "יכולת מתוכננת — בהדגמה בלבד".
- **External actions** (proposal send, mail send, Meta schedule) succeed only on the simulated target's
  confirmation. `exec` checks every submit **and every retry** against what was approved (`proposalSendBlock`, the
  same function the summary screen shows), from the latest state. A send or schedule still running when the page
  reloads has an unknown outcome (`interruptExternal`; a reloaded pre-execution summary asks for re-confirmation);
  it is never shown as sent or as a plain failure inviting a blind retry.
- Jobs still running at reload are rescheduled for their remaining time; drafts are updated functionally
  (`updateDraft`).

Replacing it with the real backend = implementing the same commands over the endpoints (see `mytiv-work-contract.md`).

## Unsaved changes — one guard

`components/focus/shell/nav-guard.tsx` (`NavGuardProvider`, `useNavGuard`, `useNavGuardAttempt`). A screen registers
`useNavGuard({ dirty, what, onSaveAndLeave? })`; while any guard is dirty:
- in-app link clicks are held in the capture phase (one listener for the provider's lifetime);
- programmatic navigation (search palette, J in focus mode, a screen's own exit button, defer) asks through
  `useNavGuardAttempt()`;
- browser Back/Forward is held by a same-URL guard history entry; leaving it re-pushes the entry and asks;
- closing / reloading the tab asks the browser (`beforeunload`, registered only while dirty).

The dialog offers stay, leave without saving, and save-and-leave when the screen provides it. Leaving replaces the
guard entry with the destination (no duplicate history entry); Back-leave steps over it. When the screen turns clean
the guard entry is stepped off in the same commit, and any navigation started meanwhile is queued behind that step
(never undone by it). Discarding a draft and navigating in place (`useFocusRouter().discardAndReplace`: closing the
drawer or switching the D3 task without saving) steps off first, so the discarded state is no history entry. "Leave"
does not raise the browser's own prompt as well; with nothing behind the page it goes to the Focus home. A jump of
several entries at once (Back's long-press menu) cannot be held by any page — the guard then lets it go without
touching the other page's history (drafts kept in the store, like mail, survive it). Screens keep in-page confirmations only for in-page actions (closing the task drawer, switching
the selected task, closing a form) — never a second leave dialog.

## Conventions

- **Styling**: class names `f-<block>__<elem>--<mod>` in the area's CSS file. Colours only via tokens (`var(--f-…)`
  in `app/(focus)/[businessSlug]/focus/focus.css`); the theme attribute lives on `.focus-app` (no hydration mismatch).
  Inline styles only for data-driven geometry/brand colours.
- **Announcements**: banners are polite status regions (an error is its own variant, never an `alert` read on every
  load); a toast is announced once by its container; a result that receives focus (pre-execution sent / failed) is
  read from there, not also as a live region.
- **Status language**: never render a glyph or a status colour by hand — use the status components (symbol + word).
  "Blocked" is derived (`displayStatus`, `blockedWhy`, `manualBlockText`); other domains read a task's block live
  (`blockedByTask`), never a copied sentence.
- **Numbers**: render through `Reading` / `ReadingValue` / `MetricTile`. "לא ידוע" can never be 0. Counts equal the
  rows the filter shows.
- **Actions**: a button changes state; navigation is the scoped `<Link>`. One primary action per area. ≥44px targets.
  Red only for the final button of a pre-execution summary.
- **Keyboard**: tabs = roving tabindex + arrows (RTL-aware); menus = WAI-ARIA menu button; dialogs = native modal;
  A/R/J in focus mode and Space/arrows on the Kanban, matched by physical key on Hebrew/AZERTY layouts and never
  while typing; ⌘K or `/` opens search.
- **RTL/bidi**: logical properties only; e-mails, codes and LTR runs in `<Bdi>`; a business name in `<bdi>` (auto
  direction); times `dir="ltr"`.
- **Motion**: ≤180ms, disabled under `prefers-reduced-motion`.
- **Planned capabilities**: rendered in full, labelled "מתוכנן", fed by fixtures — never shown as working.

## Responsive

Desktop ≥1200 (full nav, 3 time columns) · tablet 768–1199 (nav in "עוד", time columns → tabs, 2-column grids) ·
mobile <768 (header + 5-item bottom nav, one column, 16px gutters, cards instead of tables, 48px primary buttons).
There is no separate mobile code; `/_demo/focus/m/<n>` redirects to the product route each phone frame shows.

## Parity

Every product screen is compared with its reference frame (`/_demo/focus/reference/<ID>`) by pixel diff with a ±1px
shift tolerance; differences are listed with their reason in `docs/focus/QA.md`.
