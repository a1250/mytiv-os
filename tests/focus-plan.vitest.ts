/**
 * Mytiv Plan (Plan spec + design package): planned coverage vs actual, lifecycle vs overlays, asset availability,
 * one next action, collapse rules, timeline production rows, budget roll-ups (unknown never zero), builders, routing,
 * and the V1 model guards (one move → one priority, calendar-month periods, no overlapping plans).
 */
import { describe, expect, it } from "vitest";
import type { Move, Plan } from "@/lib/focus/contracts/plan";
import {
  ASSET_SUMMARIES, BUILDERS, MOVES, PLAN_MONTH_DAYS, PLAN_OCTOBER, PLAN_TODAY, PLAN_WEEK, PRODUCTION, PROPOSED_MOVES, RECOMMENDATIONS, REQUIREMENTS, TIMELINE,
} from "@/lib/focus/fixtures/plan";
import {
  EMPTY_OVERLAY, LIFECYCLE, agendaForWeek, applyMove, budgetOverflow, canReschedule, canTransition, collapsedPriority, countSlots, coverage,
  expectedRange, isHttpsUrl, missingFor, movePriorityViolations, moveBudget, nextAction, openNeeds, pace, periodViolations, planBudget,
  planMoves, priorityBudget, productionVisibility, readOverlay, requirementSlots, requirementWord, sendBlocked, tooManyPriorities,
  unverifiedClaim, type PlanFixtures, type PlanOverlay,
} from "@/lib/focus/state/plan";

const F: PlanFixtures = { plan: PLAN_OCTOBER, moves: MOVES, proposed: PROPOSED_MOVES, recs: RECOMMENDATIONS, requirements: REQUIREMENTS, builders: BUILDERS };
const routes = { builder: (id: string) => `/b/${id}`, createMove: (id: string) => `/c/${id}`, connections: "/conn", requirement: (id: string) => `/r/${id}` };
const pp = (id: string) => PLAN_OCTOBER.priorities.find((p) => p.priorityId === id)!;
const o = (patch: Partial<PlanOverlay> = {}): PlanOverlay => ({ ...EMPTY_OVERLAY, ...patch });
const moves = (ov = o()) => planMoves(F, ov);

describe("demo data adds up (design package → Demo data)", () => {
  it("total = priority allocations + ₪1,200 unallocated; committed ₪8,500; spent ₪4,250 + unknown", () => {
    const b = planBudget(F, o(), moves(), PLAN_TODAY, PLAN_MONTH_DAYS);
    expect(b.total).toBe(14000);
    expect(b.allocated).toBe(12800);
    expect(b.unallocated).toBe(1200);
    expect(b.committed).toBe(8500);
    expect(b.spentKnown).toBe(4250);
    expect(b.spentUnknown).toBe(true);
    expect(b.elapsedPct).toBe(23);
  });
  it("each priority's moves add up to its allocation", () => {
    for (const p of PLAN_OCTOBER.priorities) expect(MOVES.filter((m) => m.priorityId === p.priorityId).reduce((s, m) => s + m.budget.planned, 0)).toBe(p.allocation);
  });
  it("asset counts across priorities = 45", () => expect(ASSET_SUMMARIES.reduce((s, a) => s + a.total, 0)).toBe(45));
});

describe("coverage is planned; actual stays separate", () => {
  it("Corporate Events: planned coverage 40 / 40 leads while actual is 11 (known)", () => {
    const c = coverage(pp("p-events"), moves());
    expect(c).toMatchObject({ target: 40, planned: 40, gap: 0 });
    expect(c.actual).toEqual({ kind: "known", value: 11 });
    expect(c.planned).not.toBe((c.actual as { value: number }).value);
  });
  it("Sunset: 300 / 320 planned → a 20-booking plan need; saving the Google move as planned closes the gap", () => {
    expect(coverage(pp("p-sunset"), moves())).toMatchObject({ planned: 300, gap: 20 });
    expect(openNeeds(pp("p-sunset"), moves())).toHaveLength(1);
    const ov = o({ moveStates: { "m-sunset-google": "planned" } });
    expect(coverage(pp("p-sunset"), moves(ov))).toMatchObject({ planned: 320, gap: 0 });
    expect(openNeeds(pp("p-sunset"), moves(ov))).toHaveLength(0);
  });
  it("Delivery: actual unknown (no measurement source) — never 0", () => {
    const c = coverage(pp("p-delivery"), moves());
    expect(c.actual.kind).toBe("unknown");
    expect(c.planned).toBe(45000);
  });
  it("an idea (not in the Plan) and an ended move do not count toward planned coverage", () => {
    expect(planMoves(F, o()).some((m) => m.id === "m-sunset-google")).toBe(false);
    const ended = planMoves(F, o({ moveStates: { "m-events-linkedin": "ended" } }));
    expect(coverage(pp("p-events"), ended).planned).toBe(33);
  });
});

describe("lifecycle vs overlays", () => {
  it("the lifecycle has exactly the eight states; needs attention and optimizing are not states", () => {
    expect([...LIFECYCLE]).toEqual(["idea", "planned", "building", "waiting_approval", "approved", "live", "paused", "ended"]);
    expect(LIFECYCLE).not.toContain("needs_attention");
    expect(LIFECYCLE).not.toContain("optimizing");
  });
  it("a live Google Search that needs attention stays LIVE with an attention overlay", () => {
    const g = moves().find((m) => m.id === "m-events-google")!;
    expect(g.state).toBe("live");
    expect(g.attention).toBeTruthy();
  });
  it("accepting a recommendation on a live move = optimization in progress, still LIVE", () => {
    const ov = o({ recs: { "r-events-negatives": { decision: "accepted" } } });
    const g = moves(ov).find((m) => m.id === "m-events-google")!;
    expect(g.state).toBe("live");
    expect(g.optimizing).toMatch(/שינוי בביצוע/);
    expect(g.recommendationId).toBeNull();
  });
  it("legal transitions only (V1 launch is manual: approved → live)", () => {
    expect(canTransition("building", "waiting_approval")).toBe(true);
    expect(canTransition("waiting_approval", "approved")).toBe(true);
    expect(canTransition("approved", "live")).toBe(true);
    expect(canTransition("planned", "live")).toBe(false);
    expect(canTransition("building", "live")).toBe(false);
    expect(canTransition("ended", "live")).toBe(false);
  });
  it("approval commits the planned money", () => {
    const m = applyMove(MOVES.find((x) => x.id === "m-events-meta")!, o({ moveStates: { "m-events-meta": "approved" } }), RECOMMENDATIONS);
    expect(m.budget.committed).toBe(2500);
  });
});

describe("asset availability: approved / awaiting approval / missing never merge", () => {
  it("the 2 Meta creatives are awaiting approval, not missing", () => {
    const req = REQUIREMENTS.find((r) => r.id === "req-events-vertical")!;
    const slots = requirementSlots(req, o(), BUILDERS);
    expect(countSlots(slots)).toEqual({ approved: 1, awaiting_approval: 2, missing: 0 });
    expect(requirementWord(req, slots).word).toBe("2 ממתינים לאישור");
    const m = missingFor(pp("p-events"), moves(), REQUIREMENTS, o(), BUILDERS);
    expect(m.missing.map((x) => x.text)).not.toContain("3 קריאייטיבים אנכיים 9:16");
    expect(m.awaiting.join()).toMatch(/2 קריאייטיבים ל־Meta/);
  });
  it("approving a creative in the builder updates the requirement", () => {
    const req = REQUIREMENTS.find((r) => r.id === "req-events-vertical")!;
    expect(countSlots(requirementSlots(req, o({ creatives: { "cr-table": "approved", "cr-toast": "approved" } }), BUILDERS)).approved).toBe(3);
  });
  it("covering with AI + client asset makes it exist (awaiting approval); a request to the client keeps it missing", () => {
    const req = REQUIREMENTS.find((r) => r.id === "req-events-testimonial")!;
    expect(requirementSlots(req, o({ requirements: { [req.id]: { choice: "ai_client" } } }), BUILDERS)).toEqual(["awaiting_approval"]);
    expect(requirementSlots(req, o({ requirements: { [req.id]: { choice: "request" } } }), BUILDERS)).toEqual(["missing"]);
  });
});

describe("one next action per priority (decision › blocker › missing asset › task › nothing)", () => {
  it("Events → approve the Meta creatives (a decision waits)", () => {
    expect(nextAction(pp("p-events"), moves(), REQUIREMENTS, o(), F, routes)).toMatchObject({ kind: "decision", label: "אשר את קריאייטיבי Meta", emphasis: "primary" });
  });
  it("Sunset → create a move for 20 bookings (coverage gap)", () => {
    expect(nextAction(pp("p-sunset"), moves(), REQUIREMENTS, o(), F, routes)).toMatchObject({ kind: "blocker", label: "צור מהלך ל־20 הזמנות", href: "/c/need-sunset-20" });
  });
  it("Delivery → connect a measurement source", () => {
    expect(nextAction(pp("p-delivery"), moves(), REQUIREMENTS, o(), F, routes)).toMatchObject({ kind: "blocker", label: "חבר מקור מדידה" });
  });
  it("after the creatives are approved, Events moves to its nearest missing asset", () => {
    const ov = o({ creatives: { "cr-table": "approved", "cr-toast": "approved" } });
    expect(nextAction(pp("p-events"), moves(ov), REQUIREMENTS, ov, F, routes)).toMatchObject({ kind: "missing_asset", label: "כסה: סרטון המלצה מלקוח עסקי" });
  });
  it("a move waiting for approval is a decision too", () => {
    const ov = o({ moveStates: { "m-sunset-google": "waiting_approval" } });
    expect(nextAction(pp("p-sunset"), moves(ov), REQUIREMENTS, ov, F, routes)).toMatchObject({ kind: "decision", label: "אשר את Google Search · שקיעה" });
  });
  it("collapse only above 3 priorities, only on-track with nothing to do; warn only above 5", () => {
    const none = { kind: "none" as const, label: "", href: null, emphasis: "secondary" as const };
    expect(collapsedPriority(pp("p-sunset"), 3, none)).toBe(false);
    expect(collapsedPriority(pp("p-sunset"), 4, none)).toBe(true);
    expect(collapsedPriority(pp("p-events"), 4, none)).toBe(false);
    expect(tooManyPriorities(5)).toBe(false);
    expect(tooManyPriorities(6)).toBe(true);
  });
});

describe("timeline", () => {
  it("content production is hidden by default and shown with a reason", () => {
    const meta = PRODUCTION.find((r) => r.moveId === "m-events-meta")!;
    const sunset = PRODUCTION.find((r) => r.moveId === "m-sunset-meta")!;
    expect(productionVisibility(meta, { today: PLAN_TODAY, expanded: false, switchOn: false })).toBe("approval");
    expect(productionVisibility(sunset, { today: PLAN_TODAY, expanded: false, switchOn: false })).toBeNull();
    expect(productionVisibility(sunset, { today: 12, expanded: false, switchOn: false })).toBe("deadline");
    expect(productionVisibility(sunset, { today: PLAN_TODAY, expanded: true, switchOn: false })).toBe("expanded");
    expect(productionVisibility(sunset, { today: PLAN_TODAY, expanded: false, switchOn: true })).toBe("switch");
  });
  it("only items that are not live move freely; live or approval-gated items open an approval", () => {
    const linkedinBuild = TIMELINE.find((t) => t.id === "tl-el-build")!;
    const googleLive = TIMELINE.find((t) => t.id === "tl-eg-live")!;
    const launch = TIMELINE.find((t) => t.id === "tl-em-launch")!;
    expect(canReschedule(linkedinBuild, "planned")).toBe("move");
    expect(canReschedule(googleLive, "live")).toBe("approval");
    expect(canReschedule(launch, "building")).toBe("approval");
  });
  it("mobile agenda = changes only; live bars collapse into a count", () => {
    const live = moves().filter((m) => m.state === "live").length;
    const a = agendaForWeek(TIMELINE, PLAN_WEEK, PLAN_TODAY, live);
    expect(a.liveAllWeek).toBe(4);
    expect(a.days.map((d) => d.day)).toEqual([7, 8, 9, 10]);
    expect(a.days.find((d) => d.day === 7)!.items.map((i) => i.agenda)).toContain("Meta לידים · בבנייה");
    expect(a.days.flatMap((d) => d.items).some((i) => i.kind === "live")).toBe(false);
  });
});

describe("budget — unknown is never zero", () => {
  it("Delivery spend is unknown (Google not connected), not ₪0", () => {
    const b = priorityBudget(pp("p-delivery"), moves(), PLAN_TODAY, PLAN_MONTH_DAYS);
    expect(b.spent).toBeNull();
    expect(b.spentUnknown).toBe(true);
    expect(b.pace).toBe("unknown");
  });
  it("pace: Google Search 74% after 23% of the month is fast; Events overall is ok; Sunset is fast", () => {
    const g = moveBudget(moves().find((m) => m.id === "m-events-google")!, PLAN_TODAY, PLAN_MONTH_DAYS);
    expect(g).toMatchObject({ pct: 74, pace: "fast" });
    expect(priorityBudget(pp("p-events"), moves(), PLAN_TODAY, PLAN_MONTH_DAYS)).toMatchObject({ pct: 31, pace: "ok", committed: 2500, spent: 1850 });
    expect(priorityBudget(pp("p-sunset"), moves(), PLAN_TODAY, PLAN_MONTH_DAYS)).toMatchObject({ pct: 48, pace: "fast", committed: 4700, spent: 2400 });
  });
  it("a move that has not started has no pace, and no committed money", () => {
    expect(moveBudget(moves().find((m) => m.id === "m-events-meta")!, PLAN_TODAY, PLAN_MONTH_DAYS)).toMatchObject({ pace: "not_started", committed: null, spent: null, spentUnknown: false });
    expect(pace(null, false, 1000, PLAN_TODAY, PLAN_MONTH_DAYS, false).pace).toBe("not_started");
  });
  it("money a proposed move takes from the unallocated amount stays pending until the owner approves", () => {
    const pending = planBudget(F, o({ moveStates: { "m-sunset-google": "waiting_approval" } }), moves(), PLAN_TODAY, PLAN_MONTH_DAYS);
    expect(pending).toMatchObject({ unallocated: 1200, pendingFromUnallocated: 1200 });
    const approved = planBudget(F, o({ moveStates: { "m-sunset-google": "approved" } }), moves(), PLAN_TODAY, PLAN_MONTH_DAYS);
    expect(approved).toMatchObject({ unallocated: 0, pendingFromUnallocated: 0 });
  });
});

describe("builders", () => {
  const google = BUILDERS.find((b) => b.id === "sunset-google")!;
  it("expected range follows the budget; unknown when the goal is not measured", () => {
    expect(expectedRange(1200, google.budget.costPerResult)).toEqual({ low: 18, high: 24 });
    expect(expectedRange(1600, google.budget.costPerResult)).toEqual({ low: 24, high: 32 });
    expect(expectedRange(500, BUILDERS.find((b) => b.id === "fallmenu-meta")!.budget.costPerResult)).toBeNull();
  });
  it("₪1,600 from a ₪1,200 unallocated pool overflows by ₪400 (a source must be chosen)", () => {
    expect(budgetOverflow(1600, google, 1200)).toBe(400);
    expect(budgetOverflow(1200, google, 1200)).toBe(0);
    expect(budgetOverflow(9999, BUILDERS.find((b) => b.id === "events-meta")!, 0)).toBe(0);
  });
  it("an unverified claim is refused; a blocked offer cannot be sent for approval", () => {
    expect(unverifiedClaim("שולחן עם הנוף הכי יפה בעיר")).toBe("הנוף הכי יפה בעיר");
    expect(unverifiedClaim("ארוחת שקיעה מול הים")).toBeNull();
    expect(sendBlocked(BUILDERS.find((b) => b.id === "fallmenu-meta")!, "building")).toMatch(/לא אושר לפרסום/);
    expect(sendBlocked(google, "building")).toBeNull();
    expect(sendBlocked(google, "waiting_approval")).toMatch(/כבר נשלח/);
  });
  it("marking live needs a real https platform link (V1 manual launch)", () => {
    expect(isHttpsUrl("https://ads.google.com/aw/campaigns?campaignId=1")).toBe(true);
    expect(isHttpsUrl("ads.google.com")).toBe(false);
    expect(isHttpsUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("V1 model guards", () => {
  it("every move belongs to exactly one priority and serves that priority's goal", () => {
    expect(movePriorityViolations(PLAN_OCTOBER, [...MOVES, ...PROPOSED_MOVES])).toEqual([]);
    const bad: Move = { ...MOVES[0], id: "x", goalId: "g-sunset" };
    expect(movePriorityViolations(PLAN_OCTOBER, [bad])).toEqual(["x: goal of another priority"]);
  });
  it("a Plan period is a calendar month; a priority is in at most one active plan per month", () => {
    expect(periodViolations([PLAN_OCTOBER])).toEqual([]);
    const dup: Plan = { ...PLAN_OCTOBER, id: "plan-dup" };
    expect(periodViolations([PLAN_OCTOBER, dup]).length).toBeGreaterThan(0);
    expect(periodViolations([{ ...PLAN_OCTOBER, period: { kind: "month", month: "2026-13" } }])).toEqual(["plan-umino-2026-10: not a calendar month"]);
  });
  it("the overlay reader tolerates an older or empty session shape", () => {
    expect(readOverlay(undefined)).toEqual(EMPTY_OVERLAY);
    expect(readOverlay({ moveStates: { a: "live" } }).recs).toEqual({});
  });
});
