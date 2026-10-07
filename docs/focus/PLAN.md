# Mytiv Plan — implementation notes (design package `design_handoff_mytiv_plan`)

Demo / fixture-backed only. Routes under `/{businessSlug}/focus/plan` render only in the fixture scope
(`rendersFixtures`), like every other Focus prototype surface. No migrations, no persistence beyond the session demo
store, no platform calls: builders never publish, launch is manual in V1 (owner marks a move live with an https link).

| Screen | Route | File |
|---|---|---|
| Plan Overview (desktop + mobile) | `/focus/plan` | `components/focus/screens/plan-overview.tsx` |
| Monthly Timeline (+ mobile agenda) | `/focus/plan/timeline` | `plan-timeline.tsx` |
| Moves / Campaign Map | `/focus/plan/moves` | `plan-moves.tsx` |
| Asset Map | `/focus/plan/assets` | `plan-assets.tsx` |
| Budget | `/focus/plan/budget` | `plan-budget.tsx` |
| Create Move | `?create=<needId>` on Overview / Moves | `patterns/plan/create-move.tsx` |
| Google / Meta Campaign Builder (+ change panel) | `/focus/plan/build/<id>` | `plan-builder.tsx` |

Model: `lib/focus/contracts/plan.ts` · data: `lib/focus/fixtures/plan.ts` (UMINO, October 2026) · pure rules:
`lib/focus/state/plan.ts` (lifecycle, coverage vs actual, asset availability, next action, timeline production rows,
budget/pace, builder guards, V1 guards) · tests: `tests/focus-plan.vitest.ts` · flows: section 9 of
`scripts/focus/qa/flows.mjs`.

Semantic rules enforced in code: planned coverage is always shown as "כיסוי מתוכנן: X / Y" with actual separate;
"דורש תשומת לב" is an overlay, not a state; "שינוי בביצוע" (optimizing) is activity detail, not a state; asset
availability keeps approved / awaiting approval / missing distinct; one move → one priority; calendar-month periods.

Deliberate deviations from the package (for review):
- Plan "today" is 7.10 (the package's snapshot); the global Focus demo clock stays 1.10 for the reviewed flows.
- Money uses the Focus format (`6,000 ₪`), not `₪6,000`.
- Plan is one extra item in the existing nav; the package's 6-item nav redesign is out of scope.
- Timeline drag is replaced by an accessible reschedule panel (non-live items move; live / gated items create an
  approval request, labelled demo).
- Derived numbers where the mock is hand-drawn: mobile agenda live count (4), Meta run-out (~12.10), fastest-pace tile.
