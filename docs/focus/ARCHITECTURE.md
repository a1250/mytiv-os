# Focus frontend — architecture

Direction C ("Focus") of Mytiv OS, built from the Claude Design handoff. Branch `auto/focus-redesign`.
Frontend only: **no DB schema, migrations, API routes or backend contracts change on this branch.**
Every screen runs on typed fixtures through a client-side demo store that stands in for the backend.

## Layers

| Folder | What lives there | Rules |
|---|---|---|
| `lib/focus/contracts/` | Types only: status language, `Loadable<T>`, `Reading`/`Metric`, approvals, today, projects, work (Mytiv Work), studio | The UI's data contract. Adapters map backend shapes onto these. No React. |
| `lib/focus/fixtures/` | Demo data per domain, on a fixed demo clock (`clock.ts`, `DEMO_NOW` = Thu 1.10.2026 08:10) | Absolute ISO timestamps only; screens format them relative to the clock. No dates or client names in markup. |
| `lib/focus/state/` | Pure logic, unit-tested: approval rules, execution state machine, jobs, undo windows, work buckets/board/timer, editor history | No React, no `Date.now()` hidden inside — time is a parameter. |
| `lib/focus/format.ts` | d.m.yyyy, 24h, `8,750 ₪`, "ממתין יומיים", "לפני 4 דק׳" | Deterministic on server and client (explicit time zone, own Hebrew names). |
| `lib/focus/routes.ts` | Every URL (`R.approval(id)`, `R.task(id)` …) | Links go through `R`; no `href="#"`. |
| `components/focus/ui/` | Primitives: `Button`/`ButtonLink`/`IconButton`, status family (`RiskPill`, `WorkStatusTag`, `ApprovalPill`, `VerificationTag`, `OriginTag`, `SystemLine`, `ReadingValue`), fields (`TextField`, `TextAreaField`, `SelectField`, `Checkbox`, `ReadOnlyValue`), `Tabs`/`NavTabs`/`Chips`, `Banner`/`EmptyState`/`Skeleton`/`LoadableView`, `ToastProvider`/`useToast` (undo window), `Dialog` (native `<dialog>`), `Avatar`, `SegmentProgress`, `UsageBar`, `Bdi`, `Icon` | Typed, accessible, no product knowledge. Styles in `ui.css`. |
| `components/focus/patterns/` | Product building blocks: page header, time board, action card, agenda, metrics, project card, approval parts (queue, change table, facts, decision block, pre-execution summary, content review), project parts, studio (design preview, editor panels), work (task cards, list, board, drawer, timer, time report, system states) | Pure views + callbacks. One CSS file per area. |
| `components/focus/shell/` | Top bar (desktop / tablet "עוד" / mobile header + bottom nav), focus bar, timer bar, command palette, theme (light/dark/system, no flash), demo store, queue hook | Mounted once in `app/focus/layout.tsx`. |
| `components/focus/screens/` | One composed screen per product view | Composition only: fixtures/store → patterns. No raw colours, no layout-by-inline-style. |
| `components/focus/reference/` | The raw conversion of every handoff frame (`/focus/reference/<ID>`) | **Visual source of truth only** — used by the parity checks, never imported by product screens. |

## Conventions

- **Styling**: class names `f-<block>__<elem>--<mod>` in the area's CSS file, values from the handoff. Colours only via tokens (`var(--f-…)`, defined once with `light-dark()` in `app/focus/focus.css`). The only allowed inline styles are data-driven geometry/brand colours (design canvas, progress widths).
- **Status language**: never render a glyph or a status colour by hand — use the status components (symbol + word, never colour alone).
- **Numbers**: render through `Reading` / `ReadingValue` / `MetricTile`. `unknown` and `unavailable` have no value field, so "לא ידוע" can never be 0. A failed read is `Loadable.error`, never an empty list.
- **Actions**: a button changes state; navigation is a Next `<Link>`. One primary action per area. ≥44px targets (visual or via the `::after` hit area). Red only for the final button of a pre-execution summary.
- **Keyboard**: tabs = roving tabindex + arrows (RTL-aware); menus = WAI-ARIA menu button; dialogs = native modal; A/R/J in focus mode; Space/arrows on the Kanban; ⌘K or `/` opens search.
- **RTL/bidi**: logical properties only; e-mails, codes and LTR runs in `<Bdi>`; times `dir="ltr"`.
- **Motion**: ≤180ms, disabled under `prefers-reduced-motion`.
- **Planned capabilities**: rendered in full, labelled with `PlannedTag` ("מתוכנן"), fed by fixtures — never shown as working.

## Responsive

Desktop ≥1200 (full nav, 3 time columns) · tablet 768–1199 (nav in "עוד", time columns → tabs, 2-column grids) ·
mobile <768 (header + 5-item bottom nav, one column, 16px gutters, cards instead of tables, 48px primary buttons).
The `/focus/m/<n>` routes show the real responsive screens inside a 390×844 device frame — there is no separate mobile code.

## Demo store (temporary backend)

`components/focus/shell/demo-store.tsx` — decisions, executions, tasks, timer, jobs, notifications.
Session state → `sessionStorage`; the timer → `localStorage` (handoff: "localStorage בדמו → POST /work/timers").
Replacing it with the real backend = implementing the same actions over the endpoints (see `mytiv-work-contract.md`).

## Parity

Every product screen is compared with its reference frame (`/focus/reference/<ID>`) by pixel diff with a ±1px shift
tolerance; differences are listed with their reason in `docs/focus/QA.md`.
