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

## V1 completion (canonical Product Model rev 110, gap review backlog)

- Lifecycle is the locked chain `idea → planned → building → ready_for_review → approved → live → paused / ended`
  (`LIFECYCLE`). "Waiting for approval" is a readiness status inside `ready_for_review`, never a state; an older session
  overlay holding `waiting_approval` is migrated on read (`readOverlay`).
- Campaign Readiness (`readiness()`, `patterns/plan/readiness.tsx`): eight dimensions — strategy, targeting, budget,
  copy, creative, landing, tracking, approval — each READY / WAITING / MISSING / BLOCKED / UNKNOWN with the reason;
  one overall status (first match wins), exactly one next action, at most two blockers. Derived, never stored, never
  lifecycle. Building → "שלח לבדיקה" only when every dimension except Approval is ready or unknown.
- Tracking in V1 is UNKNOWN unless a move carries a manual measurement agreement: shown as a risk ("לא נבדק (V1)"),
  never as healthy or zero; it does not block review; approval needs the acknowledgment checkbox (`trackingAck`).
  Builder fixtures carry what was declared by hand (`tracking.checked`) and what is known missing (`tracking.missing`).
- Client Approval Policy (`CLIENT_APPROVAL_POLICY`, UMINO = STANDARD): who approves direction / variants / new
  creative / material adaptation / minor adaptation / launch / in-priority change; `APPROVAL_FLOOR` keeps the Plan and
  material adaptations with the client under every preset. Readiness's Approval dimension lists the open approvals
  with their approver; the builder's footer gives them one by one (demo viewer = the client's owner; operator approvals
  are given "as דנה" with a note). `delegatedLaunchAllowed()` encodes owner decision L14.
- Copy Builder (`patterns/plan/copy-directions.tsx`): three Move Message Directions per builder (promise, proof, tone,
  CTA, one-line why, `anchors` = the promise words every variant keeps, an optional unverified-fact `flag`); choose
  one → its variants (Meta: warm / lookalike / cold; Google: per ad group); refine chips (shorter / warmer / more
  proof / lead with the offer) keep the anchors; "3 כיוונים חדשים" swaps to `copy.alternatives`; "שלב את ההוכחה"
  combines a proof point. `variantConforms()` refuses a variant that drops an anchor or carries a refused claim. All
  fixtures; no model is called; no prompt box.
- Content requirements are typed (`assetType`, `format`, `dimensions`, `duration`, `quantity`, `purpose`,
  `placement`, `neededByDay`, `authenticity`, `approval`); status open → partly covered → covered → approved
  (`requirementStatus`). Four cover paths; `allowedPaths(class)` / `pathRefusal()` — authentic material (testimonial,
  real dishes) is never generated or adapted from other footage, brand-fixed comes from the library only, adaptable
  may be AI-adapted, illustrative may be generated; refused paths stay visible, disabled, with the reason. An upload
  from the computer arrives under "use existing". `requestTooLate()` proposes an interim fallback inside the class.
- Client Material Request (`patterns/plan/client-request-sheet.tsx`, `buildClientRequest()`): what, quantity, format,
  duration, needed-by, why (move + launch), capture instructions, upload placeholder, linked requirement; one per
  requirement (id derived from it); creates one Work task whose notes carry the same text; sending is manual (copy
  text → "סמן כנשלח ידנית"). The requirement stays missing until the material arrives; readiness waits for the client.
- Plan needs: planning kinds typed in the Plan (coverage gap, no measurement source) + build-level kinds derived from
  readiness (`derivedNeeds`: not built, missing content, client material, missing approval), each with its resolver;
  the Overview drill-down lists them. V1 has no connections: "no measurement source" routes to the Plan (set by hand),
  never to a connections screen.
- Builders are labelled "הצעה לדוגמה · אין חיבור (V1)"; earlier-move figures are "הוזן ידנית"; Meta shows the
  irreversible classic-vs-dynamic creative choice under "פרטים לבדיקה"; the lead form lists the privacy link and the
  thank-you screen; the Meta structure follows the three-temperature template with mutual exclusions (Channel Policy
  seeded from the Meta skill as fixture reference only — no API path).

Deliberate deviations from the package (for review):
- Plan "today" is 7.10 (the package's snapshot); the global Focus demo clock stays 1.10 for the reviewed flows.
- Money uses the Focus format (`6,000 ₪`), not `₪6,000`.
- Plan is one extra item in the existing nav; the package's 6-item nav redesign is out of scope.
- Derived numbers where the mock is hand-drawn: mobile agenda live count (4), Meta run-out (~12.10), fastest-pace tile.

## Timeline — daily calendar refinement

- Desktop / tablet: one column per calendar day (RTL: 1.10 on the right). Flight bars (`TIMELINE`: live / build /
  review / planned / waiting) are period context and span exact day columns. Execution is `DAY_ITEMS` (post, story,
  reel, email, WhatsApp, creative due, approval due, launch, campaign review, optimization review, creative refresh,
  milestone, business moment) — one exact day each, stacked as compact chips in a "ביצוע" row per lane, "+N" when a day
  is full, a daily load row at the bottom. "השבוע" shows 4–10.10 as wide day columns with full titles.
- No drag: a day header opens the day (its items + "הוסף פריט": type, priority, campaign/move, title, status, day); an
  item opens its panel (exact day + status). A launch / approval date of a move already in approval, approved or live
  becomes an approval request; done items and business moments do not move.
- Warnings are derived (`dayWarnings`): missing asset before publish, approval not done before a launch/publish,
  2+ launches on one day, overdue, creative refresh due, blocked. Asset "awaiting approval" is never "missing".
- Mobile: the weekly agenda lists every day of the week with every item on its exact date, "+ הוסף" per day, items
  open the same panel (move / status), warnings inline. No month grid on mobile.
- Demo only: added / moved items live in the browser session (`plan-v1` overlay: `dayItems`, `dayMoves`, `dayStatus`).

## Remediation of the independent review (cb89da7)

- Approvals: `requiredApprovals(move, builder, policy, overlay, { planApproved })` is the one path readiness, the
  builder footer and the Overview use. It adds `plan` when the money comes from outside the Priority's allocation
  (floor: the Client), `material_adaptation` (floor) / `minor_adaptation` for AI-edited creatives, and under DELEGATED
  hands the launch to the operator only when `delegatedLaunchAllowed` holds (otherwise the Client, with the reason).
  Moves approved in an older session without stored approvals count them as given.
- Creatives carry `authentic` (real people / a real event) and `adaptation` (minor | material); an authentic creative
  may only be cropped (`creativeViolation`). Approving the last waiting creative in the strip records the policy's
  `new_creative` approval, so it is never asked twice.
- Replacing ONE creative and asking the client builds `creativeReplacementRequirement` — quantity 1, keyed by the
  creative, its own authenticity — and the request feeds that creative's slot when the material arrives / is approved.
- Client Material Request lifecycle (pure overlay reducers, unit-tested): `addRequest` → `markRequestSent` →
  `receiveMaterial` (upload checked by `uploadCompatible`) → in review → `approveMaterial` (covers the requirement);
  `cancelRequest` keeps history + task; `requestCreatePlan` / `reopenRequest` make it one request and one task per
  requirement, ever (plus a same-render guard in the hook). Readiness: drafted → "שלח ללקוח ידנית", sent → waiting for
  the client, received → waiting for its approver, approved → covered.
- State-layer authenticity guard (`coverAllowed`) refuses a disallowed path even outside the UI; brand-fixed material
  has no upload; uploads must match the asset type.
- Copy: a proof point is combined only when the Brain holds it (`canCombine`, `unverified`), is revalidated on every
  read, and is added to every variant (which still conforms). A flagged direction reads `waiting_decision`
  ("ממתין להחלטה"), which also replaces the unreachable "waiting for generation".
- The Overview's next action for a priority comes from the move's readiness (`nextAction(..., readinessOf)`).
