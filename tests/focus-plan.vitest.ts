/**
 * Mytiv Plan (Plan spec + design package): planned coverage vs actual, lifecycle vs overlays, asset availability,
 * one next action, collapse rules, timeline production rows, budget roll-ups (unknown never zero), builders, routing,
 * and the V1 model guards (one move → one priority, calendar-month periods, no overlapping plans).
 */
import { describe, expect, it } from "vitest";
import type { Move, Plan } from "@/lib/focus/contracts/plan";
import {
  APPROVAL_PRESETS, ASSET_SUMMARIES, BUILDERS, CLIENT_APPROVAL_POLICY, MOVES, PLAN_CLIENT, PLAN_MONTH_DAYS, PLAN_OCTOBER, PLAN_TODAY, PLAN_WEEK, PRIORITIES, PRODUCTION, PROPOSED_MOVES, RECOMMENDATIONS, REQUIREMENTS, TIMELINE, DAY_ITEMS, PLAN_WEEKS,
} from "@/lib/focus/fixtures/plan";
import { PEOPLE } from "@/lib/focus/fixtures/people";
import {
  EMPTY_OVERLAY, LIFECYCLE, agendaWeek, canMoveDayItem, dayItemsView, dayLoad, dayStatusWord, dayWarnings, applyMove, budgetOverflow, canReschedule, canTransition, collapsedPriority, countSlots, coverage,
  expectedRange, isHttpsUrl, missingFor, movePriorityViolations, moveBudget, nextAction, openNeeds, pace, periodViolations, planBudget,
  planMoves, priorityBudget, productionVisibility, readOverlay, requirementSlots, requirementWord, sendBlocked, tooManyPriorities,
  unverifiedClaim, type PlanFixtures, type PlanOverlay,
  APPROVAL_FLOOR, allowedPaths, approvalNeedsAck, approverFor, buildClientRequest, clientRequestText, copyState, delegatedLaunchAllowed, derivedNeeds, directionFlags,
  pathRefusal, readiness, recommendedPath, requestTooLate, requiredApprovals, requirementStatus, variantConforms, type ReadinessInput,
  addRequest, approveMaterial, canCombine, cancelRequest, coverAllowed, creativeReplacementRequirement, creativeViolation, markRequestSent, receiveMaterial,
  reopenRequest, requestCreatePlan, requestStatus, uploadCompatible,
} from "@/lib/focus/state/plan";

const F: PlanFixtures = { plan: PLAN_OCTOBER, moves: MOVES, proposed: PROPOSED_MOVES, recs: RECOMMENDATIONS, requirements: REQUIREMENTS, builders: BUILDERS };
const routes = { builder: (id: string) => `/b/${id}`, createMove: (id: string) => `/c/${id}`, measurement: (id: string) => `/m/${id}`, requirement: (id: string) => `/r/${id}` };
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
    expect([...LIFECYCLE]).toEqual(["idea", "planned", "building", "ready_for_review", "approved", "live", "paused", "ended"]);
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
    expect(canTransition("building", "ready_for_review")).toBe(true);
    expect(canTransition("ready_for_review", "approved")).toBe(true);
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
  it("Delivery → set a measurement source by hand (V1 has no connections to offer)", () => {
    expect(nextAction(pp("p-delivery"), moves(), REQUIREMENTS, o(), F, routes)).toMatchObject({ kind: "blocker", label: "הגדר מקור מדידה ליעד", href: "/m/p-delivery" });
  });
  it("after the creatives are approved, Events moves to its nearest missing asset", () => {
    const ov = o({ creatives: { "cr-table": "approved", "cr-toast": "approved" } });
    expect(nextAction(pp("p-events"), moves(ov), REQUIREMENTS, ov, F, routes)).toMatchObject({ kind: "missing_asset", label: "כסה: כרטיס טקסט · 3 חבילות אירועים" });
  });
  it("a move waiting for approval is a decision too", () => {
    const ov = o({ moveStates: { "m-sunset-google": "ready_for_review" } });
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
  it("flight bars: only bars of a move that is not live move freely; live or approval-gated bars open an approval", () => {
    const linkedinBuild = TIMELINE.find((t) => t.id === "tl-el-build")!;
    const googleLive = TIMELINE.find((t) => t.id === "tl-eg-live")!;
    const flight = TIMELINE.find((t) => t.id === "tl-em-flight")!;
    expect(canReschedule(linkedinBuild, "planned")).toBe("move");
    expect(canReschedule(googleLive, "live")).toBe("approval");
    expect(canReschedule(flight, "building")).toBe("approval");
  });
  it("bars are period context only; execution sits on exact days", () => {
    expect(TIMELINE.every((t) => ["live", "build", "review", "planned", "waiting_flight"].includes(t.kind))).toBe(true);
    expect(DAY_ITEMS.every((it) => Number.isInteger(it.day) && it.day >= 1 && it.day <= PLAN_MONTH_DAYS)).toBe(true);
    // every item belongs to a known priority / move (or to the whole plan), one move → one priority
    const all = [...MOVES, ...PROPOSED_MOVES];
    for (const it of DAY_ITEMS) {
      if (it.moveId) expect(all.find((m) => m.id === it.moveId)?.priorityId).toBe(it.priorityId);
      if (it.priorityId) expect(PLAN_OCTOBER.priorities.some((p) => p.priorityId === it.priorityId)).toBe(true);
      else expect(["moment", "milestone"]).toContain(it.type);
    }
    // the plan's moments are day items on their days
    for (const mo of PLAN_OCTOBER.moments) expect(DAY_ITEMS.some((it) => it.type === "moment" && it.day === mo.day)).toBe(true);
  });
  it("a day holds several items; an added item lands on its exact day; a moved item changes day only", () => {
    const o = { ...EMPTY_OVERLAY, dayItems: [{ id: "u1", day: 12, type: "reel" as const, title: "רילס", priorityId: "p-sunset", moveId: "m-sunset-organic", status: "planned" as const, added: true }], dayMoves: { "di-so-post-9": 11 } };
    const v = dayItemsView(DAY_ITEMS, o);
    expect(v.filter((it) => it.day === 12).map((it) => it.id)).toEqual(expect.arrayContaining(["di-so-story-12", "u1"]));
    expect(v.find((it) => it.id === "di-so-post-9")!.day).toBe(11);
    expect(dayLoad(v, 14).count).toBeGreaterThanOrEqual(2);
  });
  it("moving a day item: content moves freely, done items and moments stay, a gated launch asks approval", () => {
    const it = (id: string) => DAY_ITEMS.find((x) => x.id === id)!;
    expect(canMoveDayItem(it("di-so-post-20"), "live")).toBe("move");
    expect(canMoveDayItem(it("di-so-post-2"), "live")).toBe("fixed");
    expect(canMoveDayItem(it("di-mo-fall"), null)).toBe("fixed");
    expect(canMoveDayItem(it("di-em-launch"), "building")).toBe("move");
    expect(canMoveDayItem(it("di-em-launch"), "ready_for_review")).toBe("approval");
  });
  it("warnings are derived: approval before launch, missing asset, overdue, refresh, blocked, launch clash", () => {
    const ctx = (o = EMPTY_OVERLAY) => ({ today: PLAN_TODAY, overlay: o, requirements: REQUIREMENTS, builders: BUILDERS, moveStateOf: (id: string) => MOVES.find((m) => m.id === id)?.state ?? null });
    const w = dayWarnings(DAY_ITEMS, ctx());
    const has = (itemId: string, kind: string) => w.some((x) => x.itemId === itemId && x.kind === kind);
    expect(has("di-em-launch", "approval_incomplete")).toBe(true); // 2 creatives awaiting (never "missing")
    expect(has("di-em-launch", "missing_asset")).toBe(false);
    expect(has("di-dm-launch", "missing_asset")).toBe(true);
    expect(has("di-dm-launch", "blocked")).toBe(true);
    expect(has("di-so-reel-shoot", "overdue")).toBe(true);
    expect(has("di-sm-refresh", "missing_asset")).toBe(true);
    expect(w.some((x) => x.kind === "launch_clash")).toBe(false);
    // approving the creatives and the move clears the launch's approval warning
    const ok = dayWarnings(DAY_ITEMS, { ...ctx({ ...EMPTY_OVERLAY, creatives: { "cr-table": "approved", "cr-toast": "approved" } }), moveStateOf: () => "approved" });
    expect(ok.some((x) => x.itemId === "di-em-launch")).toBe(false);
    // a second launch on 13.10 = a clash on both
    const clash = dayWarnings(dayItemsView(DAY_ITEMS, { ...EMPTY_OVERLAY, dayMoves: { "di-el-launch": 13 } }), ctx());
    expect(clash.filter((x) => x.kind === "launch_clash").map((x) => x.itemId).sort()).toEqual(["di-el-launch", "di-em-launch"]);
    expect(dayLoad(dayItemsView(DAY_ITEMS, { ...EMPTY_OVERLAY, dayMoves: { "di-el-launch": 13 } }), 13).overloaded).toBe(true);
  });
  it("status words follow the type", () => {
    expect(dayStatusWord("post", "done")).toBe("פורסם");
    expect(dayStatusWord("whatsapp", "done")).toBe("נשלח");
    expect(dayStatusWord("optimization_review", "done")).toBe("הושלם");
    expect(dayStatusWord("story", "scheduled")).toBe("מתוזמן");
  });
  it("mobile agenda: every day of the week, every item on its exact date; live moves collapse into a count", () => {
    const live = moves().filter((m) => m.state === "live").length;
    const a = agendaWeek(DAY_ITEMS, TIMELINE, PLAN_WEEK, live);
    expect(a.liveAllWeek).toBe(4);
    expect(a.days.map((d) => d.day)).toEqual([4, 5, 6, 7, 8, 9, 10]);
    expect(a.days.find((d) => d.day === 9)!.items.map((i) => i.id)).toEqual(expect.arrayContaining(["di-so-post-9", "di-em-creatives"]));
    expect(a.days.find((d) => d.day === 9)!.starts.map((b) => b.id)).toEqual(expect.arrayContaining(["tl-em-review", "tl-sc-build"]));
    expect(PLAN_WEEKS.length).toBeGreaterThan(3);
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
    const pending = planBudget(F, o({ moveStates: { "m-sunset-google": "ready_for_review" } }), moves(), PLAN_TODAY, PLAN_MONTH_DAYS);
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
    expect(sendBlocked(google, "ready_for_review")).toMatch(/כבר נשלח/);
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

/* ---------- V1 completion: readiness, approvals, authenticity, copy, client requests (spec rev 110) ---------- */

const approverName = (k: "client" | "operator") => (k === "client" ? PEOPLE.ron.name : PEOPLE.dana.name);
const builderOf = (id: string) => BUILDERS.find((b) => b.id === id)!;
const moveOf = (id: string, ov = o()) => [...moves(ov), ...PROPOSED_MOVES.map((m) => applyMove(m, ov, RECOMMENDATIONS))].find((m) => m.id === id)!;
function ready(builderId: string, ov = o(), state?: Move["state"], policy = CLIENT_APPROVAL_POLICY, planApproved = true): ReturnType<typeof readiness> {
  const b = builderOf(builderId);
  const m = moveOf(b.moveId, ov);
  const i: ReadinessInput = { move: m, builder: b, state: state ?? m.state, requirements: REQUIREMENTS, overlay: ov, builders: BUILDERS, policy, approverName, unallocated: 1200, planApproved };
  return readiness(i);
}
const AT = "2026-10-07";
const testimonial = () => REQUIREMENTS.find((r) => r.id === "req-events-testimonial")!;
/** a client request for a requirement, driven through the real lifecycle reducers up to `stage` */
function withRequest(ov: PlanOverlay, reqId: string, stage: "drafted" | "sent" | "received" | "approved"): PlanOverlay {
  const req = REQUIREMENTS.find((r) => r.id === reqId)!;
  let next = addRequest(ov, buildClientRequest(req, moveOf(req.moveId), PRIORITIES.find((p) => p.id === req.priorityId)!, `t-${reqId}`, 13, AT));
  if (stage === "drafted") return next;
  next = markRequestSent(next, reqId, AT);
  if (stage === "sent") return next;
  next = receiveMaterial(next, reqId, "testimonial.mp4", AT);
  if (stage === "received") return next;
  return approveMaterial(next, reqId, AT, PEOPLE.ron.name);
}
/** everything the Meta events move needs before approval, short of the approvals themselves (the testimonial arrived from the client and was approved) */
const eventsComplete = (extra: Partial<PlanOverlay> = {}) => withRequest(o({
  copy: { "events-meta": { set: "main", directionId: "d-em-mood", refinements: [] } },
  creatives: { "cr-table": "approved", "cr-toast": "approved" },
  requirements: { "req-events-next": { choice: "ai_client" }, "req-events-card": { choice: "generate" } },
  ...extra,
}), "req-events-testimonial", "approved");

describe("lifecycle is the locked seven-step chain; approval waiting is readiness, not a state", () => {
  it("ready_for_review replaced waiting_approval; an old session shape is migrated on read", () => {
    expect(LIFECYCLE).not.toContain("waiting_approval");
    expect(LIFECYCLE[3]).toBe("ready_for_review");
    expect(readOverlay({ moveStates: { "m-x": "waiting_approval" } }).moveStates["m-x"]).toBe("ready_for_review");
  });
  it("readiness never changes the lifecycle: a move stays ready_for_review while its overall status is waiting_approval", () => {
    const ov = eventsComplete({ moveStates: { "m-events-meta": "ready_for_review" } });
    const r = ready("events-meta", ov);
    expect(moveOf("m-events-meta", ov).state).toBe("ready_for_review");
    expect(r.overall).toBe("waiting_approval");
    expect(r.approver).toBe(PEOPLE.ron.name);
  });
});

describe("campaign readiness (derived): eight dimensions, one next action, at most two blockers", () => {
  it("every readiness has the eight dimensions and exactly one next action", () => {
    for (const b of BUILDERS) {
      const r = ready(b.id);
      expect(Object.keys(r.dims).sort()).toEqual(["approval", "budget", "copy", "creative", "landing", "strategy", "targeting", "tracking"]);
      expect(r.next.label.length).toBeGreaterThan(0);
      expect(r.blockers.length).toBeLessThanOrEqual(2);
    }
  });
  it("Meta events before any choice: copy missing → status 'missing', next = choose a direction", () => {
    const r = ready("events-meta");
    expect(r.dims.copy.state).toBe("missing");
    expect(r.overall).toBe("missing");
    expect(r.next.label).toBe("בחר כיוון מסר");
  });
  it("a testimonial request: drafted → the operator must send it; sent → WAITING for the client, 'waiting for client material'", () => {
    const base = o({ copy: { "events-meta": { set: "main", directionId: "d-em-mood", refinements: [] } } });
    const drafted = ready("events-meta", withRequest(base, "req-events-testimonial", "drafted"));
    expect(drafted.dims.creative).toMatchObject({ state: "waiting", actor: PEOPLE.dana.name });
    expect(drafted.overall).toBe("waiting_decision");
    expect(drafted.next.label).toMatch(/^שלח ללקוח ידנית/);
    const sent = ready("events-meta", withRequest(base, "req-events-testimonial", "sent"));
    expect(sent.dims.creative).toMatchObject({ state: "waiting", actor: "הלקוח" });
    expect(sent.overall).toBe("waiting_client");
    expect(sent.next).toMatchObject({ actor: "הלקוח" });
  });
  it("the fall-menu move is BLOCKED by the Brain (offer not cleared) and its destination is MISSING; blockers ≤ 2", () => {
    const r = ready("fallmenu-meta");
    expect(r.dims.strategy.state).toBe("blocked");
    expect(r.dims.landing.state).toBe("missing");
    expect(r.overall).toBe("blocked");
    expect(r.blockers).toHaveLength(1);
  });
  it("UNKNOWN tracking (V1): a risk that never reads healthy, does not block review, and needs acknowledgment at approval", () => {
    const r = ready("sunset-google", o({ copy: { "sunset-google": { set: "main", directionId: "d-sg-direct", refinements: [] } } }));
    expect(r.dims.tracking.state).toBe("unknown");
    expect(r.dims.tracking.text).toMatch(/לא נבדק/);
    expect(r.dims.tracking.text).not.toMatch(/✓|מאומת|0/);
    expect(r.trackingRisk).toBe(true);
    expect(r.overall).toBe("ready_for_review");
    expect(approvalNeedsAck(r, "m-sunset-google", o())).toBe(true);
    expect(approvalNeedsAck(r, "m-sunset-google", o({ trackingAck: { "m-sunset-google": true } }))).toBe(false);
  });
  it("a measurement agreement makes Tracking READY (manual) instead of unknown", () => {
    const r = ready("fallmenu-meta");
    expect(r.dims.tracking.state).toBe("ready");
    expect(r.dims.tracking.text).toMatch(/מדד ידני/);
    expect(r.trackingRisk).toBe(false);
  });
  it("readiness recomputes along the request lifecycle: sent → received (in review, the approver named) → approved → ready for review", () => {
    const base = o({ copy: { "events-meta": { set: "main", directionId: "d-em-mood", refinements: [] } }, creatives: { "cr-table": "approved", "cr-toast": "approved" }, requirements: { "req-events-next": { choice: "ai_client" }, "req-events-card": { choice: "generate" } } });
    expect(ready("events-meta", withRequest(base, "req-events-testimonial", "sent")).overall).toBe("waiting_client");
    const received = ready("events-meta", withRequest(base, "req-events-testimonial", "received"));
    expect(received.dims.creative).toMatchObject({ state: "waiting", actor: PEOPLE.ron.name });
    expect(received.overall).toBe("waiting_decision");
    expect(received.next.label).toMatch(/^אשר את החומר שהתקבל/);
    const approved = ready("events-meta", withRequest(base, "req-events-testimonial", "approved"));
    expect(requirementSlots(testimonial(), withRequest(base, "req-events-testimonial", "approved"), BUILDERS)).toEqual(["approved"]);
    expect(approved.overall).toBe("ready_for_review");
  });
  it("after every approval is given the move is approved / ready to launch", () => {
    const ov = eventsComplete({ moveStates: { "m-events-meta": "approved" }, approvalsGiven: { "m-events-meta": ["direction", "variants", "new_creative", "material_adaptation", "minor_adaptation", "launch"] } });
    const r = ready("events-meta", ov);
    expect(r.dims.approval.state).toBe("ready");
    expect(r.dims.creative.state).toBe("ready");
    expect(r.overall).toBe("approved");
    expect(r.next.label).toMatch(/סמן "פעיל"/);
  });
});

describe("client approval policy: STANDARD by default, a floor no preset crosses", () => {
  it("UMINO's policy is STANDARD; the client approves the direction, creatives, the material AI adaptation and the launch; the operator the variants and the crop", () => {
    expect(CLIENT_APPROVAL_POLICY.preset).toBe("standard");
    expect(CLIENT_APPROVAL_POLICY.rules).toEqual(APPROVAL_PRESETS.standard);
    const req = requiredApprovals(moveOf("m-events-meta"), builderOf("events-meta"), CLIENT_APPROVAL_POLICY, o());
    expect(req.map((a) => [a.action, a.by])).toEqual([["direction", "client"], ["variants", "operator"], ["new_creative", "client"], ["material_adaptation", "client"], ["minor_adaptation", "operator"], ["launch", "client"]]);
    expect(req.every((a) => !a.given)).toBe(true);
  });
  it("the floor: plan approval and a material AI adaptation need the client under DELEGATED too", () => {
    const delegated = { ...CLIENT_APPROVAL_POLICY, preset: "delegated" as const, rules: APPROVAL_PRESETS.delegated };
    for (const a of APPROVAL_FLOOR) expect(approverFor(delegated, a)).toBe("client");
    expect(approverFor(delegated, "launch")).toBe("operator");
    const custom = { ...CLIENT_APPROVAL_POLICY, preset: "custom" as const, rules: { ...APPROVAL_PRESETS.delegated, plan: "operator" as const } };
    expect(approverFor(custom, "plan")).toBe("client");
  });
  it("DELEGATED launch only inside a client-approved plan, within allocation, no spend rise, no client approval open, no material change", () => {
    const ok = { planApproved: true, withinAllocation: true, totalSpendUnchanged: true, clientApprovalsOutstanding: 0, materialChangeOutsidePlan: false };
    expect(delegatedLaunchAllowed(ok).ok).toBe(true);
    expect(delegatedLaunchAllowed({ ...ok, withinAllocation: false }).ok).toBe(false);
    expect(delegatedLaunchAllowed({ ...ok, totalSpendUnchanged: false }).ok).toBe(false);
    expect(delegatedLaunchAllowed({ ...ok, clientApprovalsOutstanding: 1 }).ok).toBe(false);
    expect(delegatedLaunchAllowed({ ...ok, materialChangeOutsidePlan: true }).ok).toBe(false);
    expect(delegatedLaunchAllowed({ ...ok, planApproved: false }).ok).toBe(false);
  });
  it("waiting for approval names the approver", () => {
    const r = ready("events-meta", eventsComplete({ moveStates: { "m-events-meta": "ready_for_review" } }));
    expect(r.dims.approval.state).toBe("waiting");
    expect(r.dims.approval.text).toContain(PEOPLE.ron.name);
    expect(r.next.actor).toBe(PEOPLE.ron.name);
  });
});

describe("content requirements are structured; authenticity decides the paths", () => {
  it("every requirement carries type, format, quantity, purpose, placement, authenticity and approval", () => {
    for (const r of REQUIREMENTS) {
      expect(r.assetType).toBeTruthy(); expect(r.format).toBeTruthy(); expect(r.quantity).toBeGreaterThan(0);
      expect(r.purpose).toBeTruthy(); expect(r.placement).toBeTruthy(); expect(r.authenticity).toBeTruthy(); expect(r.approval).toBeTruthy();
      expect(r.slots).toHaveLength(r.quantity);
    }
  });
  it("status: open → partly covered → covered → approved", () => {
    expect(requirementStatus(["missing", "missing"])).toBe("open");
    expect(requirementStatus(["approved", "missing"])).toBe("partly_covered");
    expect(requirementStatus(["approved", "awaiting_approval"])).toBe("covered");
    expect(requirementStatus(["approved", "approved"])).toBe("approved");
  });
  it("a testimonial is never generated or adapted from other footage: existing (a real testimonial) or a client request", () => {
    expect(allowedPaths("authentic")).toEqual(["existing", "request"]);
    expect(pathRefusal("authentic", "generate")).toMatch(/לא נוצר ב־AI/);
    expect(pathRefusal("authentic", "ai_client")).toMatch(/לא נגזרים/);
    const t = REQUIREMENTS.find((r) => r.id === "req-events-testimonial")!;
    expect(t.authenticity).toBe("authentic");
    expect(recommendedPath(t)).toBe("request");
    expect(t.existingCandidates).toHaveLength(0);
  });
  it("brand-fixed: library only; adaptable: AI + client asset; illustrative: generate", () => {
    expect(allowedPaths("brand_fixed")).toEqual(["existing"]);
    expect(allowedPaths("adaptable")).toContain("ai_client");
    expect(allowedPaths("adaptable")).not.toContain("generate");
    expect(allowedPaths("illustrative")).toContain("generate");
    expect(recommendedPath(REQUIREMENTS.find((r) => r.id === "req-events-card")!)).toBe("generate");
    expect(recommendedPath(REQUIREMENTS.find((r) => r.id === "req-events-next")!)).toBe("ai_client");
    expect(recommendedPath(REQUIREMENTS.find((r) => r.id === "req-events-logo")!)).toBeNull();
  });
  it("the deadline check: a request that cannot arrive in time proposes an interim fallback inside the class", () => {
    const fresh = REQUIREMENTS.find((r) => r.id === "req-sunset-fresh")!; // needed 14.10, today 7.10 → 7 days, fine
    expect(requestTooLate(fresh, PLAN_TODAY)).toBeNull();
    expect(requestTooLate(fresh, 12)).toMatch(/פתרון ביניים: התאמת נכס קיים/);
    const t = REQUIREMENTS.find((r) => r.id === "req-events-testimonial")!;
    expect(requestTooLate(t, 16)).toMatch(/בסיכון/);
  });
});

describe("copy: three Move Message Directions, variants beneath the chosen one", () => {
  it("every builder proposes exactly three clearly different directions, each with a one-line why", () => {
    for (const b of BUILDERS) {
      expect(b.copy.directions).toHaveLength(3);
      expect(new Set(b.copy.directions.map((d) => d.promise)).size).toBe(3);
      for (const d of b.copy.directions) { expect(d.why.length).toBeGreaterThan(10); expect(d.anchors.length).toBeGreaterThan(0); }
      expect(b.copy.alternatives.length === 0 || b.copy.alternatives.length === 3).toBe(true);
    }
  });
  it("nothing is chosen until the person chooses; choosing shows the variants of that direction only", () => {
    const b = builderOf("events-meta");
    expect(copyState(b, o()).chosen).toBeNull();
    const cs = copyState(b, o({ copy: { "events-meta": { set: "main", directionId: "d-em-direct", refinements: [] } } }));
    expect(cs.chosen?.id).toBe("d-em-direct");
    expect(cs.variants.map((v) => v.slot)).toEqual(["warm", "lookalike", "cold"]);
  });
  it("Google variants are per ad group / search intent", () => {
    const cs = copyState(builderOf("sunset-google"), o({ copy: { "sunset-google": { set: "main", directionId: "d-sg-direct", refinements: [] } } }));
    expect(cs.variants.map((v) => v.slot)).toEqual(["sunset-sea", "port"]);
  });
  it("every fixture variant conforms to its direction (keeps the promise, no refused claim)", () => {
    for (const b of BUILDERS) for (const v of b.copy.variants) {
      const d = [...b.copy.directions, ...b.copy.alternatives].find((x) => x.id === v.directionId)!;
      expect(variantConforms(v, d)).toEqual({ ok: true });
    }
  });
  it("a variant that drops the promise or adds a refused claim does not conform", () => {
    const d = builderOf("sunset-google").copy.directions[0];
    const v = builderOf("sunset-google").copy.variants[0];
    expect(variantConforms({ ...v, hook: "x", body: "y", headline: "z" }, d).ok).toBe(false);
    expect(variantConforms({ ...v, body: `${v.body} הנוף הכי יפה בעיר` }, d).ok).toBe(false);
  });
  it("refinements keep the promise; 'three new directions' works only where alternatives exist", () => {
    const b = builderOf("events-meta");
    const cs = copyState(b, o({ copy: { "events-meta": { set: "main", directionId: "d-em-direct", refinements: ["shorter", "more_proof"] } } }));
    for (const v of cs.variants) expect(variantConforms(v, cs.chosen!).ok).toBe(true);
    expect(copyState(b, o({ copy: { "events-meta": { set: "alt", refinements: [] } } })).directions.map((d) => d.id)).toEqual(b.copy.alternatives.map((d) => d.id));
    expect(copyState(builderOf("fallmenu-meta"), o()).canAskNew).toBe(false);
  });
  it("an unverified fact is flagged, never invented: the direction says 'confirm or remove'", () => {
    const flagged = builderOf("sunset-google").copy.directions.find((d) => d.id === "d-sg-proof")!;
    expect(directionFlags(flagged)[0]).toMatch(/לא במוח העסק — אשר או הסר/);
    expect(directionFlags(builderOf("events-meta").copy.directions.find((d) => d.id === "d-em-mood")!)).toEqual([]);
    const r = ready("sunset-google", o({ copy: { "sunset-google": { set: "main", directionId: "d-sg-proof", refinements: [] } } }));
    expect(r.dims.copy.state).toBe("waiting");
  });
});

describe("client material request: structured, linked, manual sending, one per requirement", () => {
  const t = REQUIREMENTS.find((r) => r.id === "req-events-testimonial")!;
  const m = moveOf("m-events-meta");
  const p = PRIORITIES.find((x) => x.id === "p-events")!;
  it("carries what, quantity, format, duration, needed-by, why, the move, capture instructions, an upload placeholder and the requirement", () => {
    const r = buildClientRequest(t, m, p, "t-1", 13);
    expect(r).toMatchObject({ requirementId: t.id, moveId: m.id, priorityId: p.id, taskId: "t-1", neededByDay: 18, sentAt: null });
    expect(r.items[0]).toMatchObject({ what: t.title, quantity: 1, duration: "15–30 שניות" });
    expect(r.items[0].format).toContain("9:16");
    expect(r.why).toContain("13.10");
    expect(r.captureInstructions).toContain("אנכי");
    expect(r.uploadTo).toMatch(/Drive/);
    const text = clientRequestText(r);
    expect(text).toContain("אנחנו צריכים");
    expect(text).not.toMatch(/^שלחו לנו תוכן$/m);
  });
  it("one request per requirement: the id is derived from the requirement, so a second attempt is the same key", () => {
    expect(buildClientRequest(t, m, p, "t-1", 13).id).toBe(buildClientRequest(t, m, p, "t-2", 13).id);
  });
  it("a request keeps the asset missing until it arrives (readiness waits for the client)", () => {
    const ov = o({ requirements: { [t.id]: { choice: "request", taskId: "t-1" } } });
    expect(requirementSlots(t, ov, BUILDERS)).toEqual(["missing"]);
  });
});

describe("plan needs: planning kinds in the Plan, build-level kinds derived", () => {
  it("Events today: not built (LinkedIn), missing content (testimonial, card, refresh), and no coverage gap", () => {
    const needs = derivedNeeds(pp("p-events"), moves(), REQUIREMENTS, o(), BUILDERS);
    expect(needs.map((n) => n.kind)).toContain("not_built");
    expect(needs.filter((n) => n.kind === "missing_content").map((n) => n.title)).toContain("סרטון המלצה מלקוח עסקי");
    expect(needs.every((n) => n.resolver)).toBe(true);
    expect(openNeeds(pp("p-events"), moves())).toHaveLength(0);
  });
  it("a requested asset: drafted reads 'not sent yet' (Marketing), sent reads 'waiting for the client'; a move ready for review becomes 'approve'", () => {
    const drafted = withRequest(o({ moveStates: { "m-events-meta": "ready_for_review" } }), "req-events-testimonial", "drafted");
    const dn = derivedNeeds(pp("p-events"), moves(drafted), REQUIREMENTS, drafted, BUILDERS);
    expect(dn.find((n) => n.kind === "client_material")).toMatchObject({ title: expect.stringMatching(/עוד לא נשלחה/), resolver: "שיווק" });
    expect(dn.map((n) => n.kind)).toContain("missing_approval");
    const sent = withRequest(o(), "req-events-testimonial", "sent");
    expect(derivedNeeds(pp("p-events"), moves(sent), REQUIREMENTS, sent, BUILDERS).find((n) => n.kind === "client_material")).toMatchObject({ title: expect.stringMatching(/^ממתין ללקוח/), resolver: "הלקוח" });
  });
});

describe("tenant isolation in fixtures", () => {
  it("every priority, move, requirement and the policy belong to the one demo client", () => {
    for (const p of PRIORITIES) expect(p.clientId).toBe(PLAN_CLIENT.id);
    for (const m of [...MOVES, ...PROPOSED_MOVES]) expect(PRIORITIES.find((p) => p.id === m.priorityId)?.clientId).toBe(PLAN_CLIENT.id);
    for (const r of REQUIREMENTS) expect(PRIORITIES.find((p) => p.id === r.priorityId)?.clientId).toBe(PLAN_CLIENT.id);
    expect(CLIENT_APPROVAL_POLICY.clientId).toBe(PLAN_CLIENT.id);
    expect(PLAN_OCTOBER.client.id).toBe(PLAN_CLIENT.id);
  });
});

/* ---------- remediation of the independent review (cb89da7): P2-1…P2-3 and the P3 safety rules ---------- */

const DELEGATED = { ...CLIENT_APPROVAL_POLICY, preset: "delegated" as const, rules: APPROVAL_PRESETS.delegated };

describe("P2-1 · the approval floor and the DELEGATED launch rule live in the real requiredApprovals / readiness path", () => {
  it("money from the unallocated pool is a Plan change: `plan` is required from the Client under every preset", () => {
    for (const policy of [CLIENT_APPROVAL_POLICY, DELEGATED]) {
      const plan = requiredApprovals(moveOf("m-sunset-google"), builderOf("sunset-google"), policy, o()).find((a) => a.action === "plan");
      expect(plan).toMatchObject({ by: "client" });
    }
    const custom = { ...DELEGATED, preset: "custom" as const, rules: { ...APPROVAL_PRESETS.delegated, plan: "operator" as const } };
    expect(requiredApprovals(moveOf("m-sunset-google"), builderOf("sunset-google"), custom, o()).find((a) => a.action === "plan")?.by).toBe("client");
  });
  it("DELEGATED: money outside the approved allocation → the launch goes back to the Client, with the reason", () => {
    const launch = requiredApprovals(moveOf("m-sunset-google"), builderOf("sunset-google"), DELEGATED, o()).find((a) => a.action === "launch")!;
    expect(launch.by).toBe("client");
    expect(launch.reason).toMatch(/השקה באישור הלקוח/);
  });
  it("DELEGATED: a material AI adaptation is a Client approval (floor); while it is open the launch stays with the Client", () => {
    const req = requiredApprovals(moveOf("m-events-meta"), builderOf("events-meta"), DELEGATED, o());
    expect(req.find((a) => a.action === "material_adaptation")?.by).toBe("client");
    expect(req.find((a) => a.action === "launch")).toMatchObject({ by: "client", reason: expect.stringMatching(/אישור לקוח חובה/) });
    const after = requiredApprovals(moveOf("m-events-meta"), builderOf("events-meta"), DELEGATED, o({ approvalsGiven: { "m-events-meta": ["material_adaptation"] } }));
    expect(after.find((a) => a.action === "launch")?.by).toBe("operator");
  });
  it("DELEGATED: no Client-approved Plan, or a material change to the proposal → the Client approves the launch", () => {
    const given = o({ approvalsGiven: { "m-events-meta": ["material_adaptation"] } });
    expect(requiredApprovals(moveOf("m-events-meta"), builderOf("events-meta"), DELEGATED, given, { planApproved: false }).find((a) => a.action === "launch")?.by).toBe("client");
    const changed = o({ ...given, builders: { "events-meta": { decisions: { audience: { value: "קהל אחר" } } } } });
    expect(requiredApprovals(moveOf("m-events-meta"), builderOf("events-meta"), DELEGATED, changed).find((a) => a.action === "launch")?.by).toBe("client");
  });
  it("readiness uses the same rule: under DELEGATED with the conditions met, the launch waits for the operator by name", () => {
    const ov = eventsComplete({ moveStates: { "m-events-meta": "ready_for_review" }, approvalsGiven: { "m-events-meta": ["direction", "variants", "new_creative", "material_adaptation", "minor_adaptation"] } });
    const r = ready("events-meta", ov, undefined, DELEGATED);
    expect(r.overall).toBe("waiting_approval");
    expect(r.approver).toBe(PEOPLE.dana.name);
    expect(ready("events-meta", ov, undefined, DELEGATED, false).approver).toBe(PEOPLE.ron.name);
  });
  it("a move approved in an older session without stored approvals counts them as given (legacy), never 'waiting' while approved", () => {
    const ov = eventsComplete({ moveStates: { "m-events-meta": "approved" } });
    expect(requiredApprovals(moveOf("m-events-meta", ov), builderOf("events-meta"), CLIENT_APPROVAL_POLICY, ov).every((a) => a.given)).toBe(true);
    expect(ready("events-meta", ov).dims.approval.state).toBe("ready");
  });
});

describe("P2-2 · replacing ONE creative asks the client for exactly that slot", () => {
  const base = REQUIREMENTS.find((r) => r.id === "req-events-vertical")!;
  const toast = builderOf("events-meta").creatives!.find((c) => c.id === "cr-toast")!;
  const table = builderOf("events-meta").creatives!.find((c) => c.id === "cr-table")!;
  it("the replacement requirement is quantity 1, keyed by the creative, named after it", () => {
    const r = creativeReplacementRequirement(base, table);
    expect(r).toMatchObject({ id: "req-events-vertical--cr-table", quantity: 1, slots: ["missing"] });
    expect(r.creativeIds).toBeUndefined();
    const req = buildClientRequest(r, moveOf("m-events-meta"), PRIORITIES.find((p) => p.id === "p-events")!, "t-1", 13);
    expect(req.items[0].quantity).toBe(1);
    expect(req.items[0].what).toContain("שולחן ערוך");
    expect(clientRequestText(req)).not.toMatch(/3 × 3/);
  });
  it("a creative that shows real staff is authentic: its replacement allows only existing or a client request", () => {
    const r = creativeReplacementRequirement(base, toast);
    expect(r.authenticity).toBe("authentic");
    expect(allowedPaths(r.authenticity)).toEqual(["existing", "request"]);
  });
  it("the replacement request feeds the creative slot: received → the creative is in review; approved → approved", () => {
    const r = creativeReplacementRequirement(base, table);
    let ov = addRequest(o(), { ...buildClientRequest(r, moveOf("m-events-meta"), PRIORITIES.find((p) => p.id === "p-events")!, "t-1", 13, AT), creativeId: "cr-table" });
    expect(ov.requirements[r.id]).toBeUndefined(); // the parent requirement is untouched
    ov = receiveMaterial(markRequestSent(ov, r.id, AT), r.id, "table.jpg", AT);
    expect(ov.creatives["cr-table"]).toBe("awaiting_approval");
    ov = approveMaterial(ov, r.id, AT, PEOPLE.ron.name);
    expect(ov.creatives["cr-table"]).toBe("approved");
  });
});

describe("P2-3 · the client material request lifecycle: drafted → sent → received → in review → approved, history kept", () => {
  const key = "req-events-testimonial";
  it("statuses follow the dates; a step cannot be skipped", () => {
    let ov = withRequest(o(), key, "drafted");
    expect(requestStatus(ov.requests[key])).toBe("drafted");
    expect(receiveMaterial(ov, key, "x.mp4", AT)).toBe(ov); // not before it was sent
    expect(approveMaterial(ov, key, AT, "רון")).toBe(ov);   // not before it arrived
    ov = markRequestSent(ov, key, AT);
    expect(requestStatus(ov.requests[key])).toBe("sent");
    expect(requirementSlots(testimonial(), ov, BUILDERS)).toEqual(["missing"]);
    ov = receiveMaterial(ov, key, "x.mp4", AT);
    expect(requestStatus(ov.requests[key])).toBe("in_review");
    expect(requirementSlots(testimonial(), ov, BUILDERS)).toEqual(["awaiting_approval"]);
    ov = approveMaterial(ov, key, AT, "רון");
    expect(requestStatus(ov.requests[key])).toBe("approved");
    expect(requirementSlots(testimonial(), ov, BUILDERS)).toEqual(["approved"]);
    expect(ov.requests[key].history.map((h) => h.text)).toHaveLength(4);
  });
  it("one request and one task per requirement, ever: an open request is returned, a cancelled one is re-opened with the same task", () => {
    let ov = withRequest(o(), key, "sent");
    expect(requestCreatePlan(ov, key)).toBe("existing");
    expect(addRequest(ov, buildClientRequest(testimonial(), moveOf("m-events-meta"), PRIORITIES[0], "t-other", 13))).toBe(ov);
    ov = cancelRequest(ov, key, AT);
    expect(requestStatus(ov.requests[key])).toBe("cancelled");
    expect(ov.requests[key].taskId).toBe(`t-${key}`);
    expect(ov.requirements[key]).toBeUndefined(); // free to cover another way
    expect(requestCreatePlan(ov, key)).toBe("reopen");
    const before = ov.requests[key].history.length;
    ov = reopenRequest(ov, key, AT);
    expect(requestStatus(ov.requests[key])).toBe("drafted");
    expect(ov.requests[key].taskId).toBe(`t-${key}`);
    expect(ov.requests[key].history.length).toBe(before + 1);
    expect(requestCreatePlan(o(), key)).toBe("create");
  });
});

describe("P3 safety rules: authenticity in the state layer, uploads, creatives, copy combination, one next action", () => {
  it("a cover path the authenticity class refuses is not allowed by the state guard", () => {
    expect(coverAllowed(testimonial(), "generate")).toBe(false);
    expect(coverAllowed(testimonial(), "ai_client")).toBe(false);
    expect(coverAllowed(testimonial(), "existing")).toBe(true);
    expect(coverAllowed(REQUIREMENTS.find((r) => r.id === "req-events-logo")!, "generate")).toBe(false);
  });
  it("uploads must fit the requirement: video for a testimonial, an image for a photo, nothing for brand-fixed", () => {
    expect(uploadCompatible(testimonial(), { name: "a.jpg", type: "image/jpeg" })).toMatch(/וידאו/);
    expect(uploadCompatible(testimonial(), { name: "a.mp4", type: "video/mp4" })).toBeNull();
    expect(uploadCompatible(REQUIREMENTS.find((r) => r.id === "req-events-next")!, { name: "a.mp4", type: "video/mp4" })).toMatch(/תמונה/);
    expect(uploadCompatible(REQUIREMENTS.find((r) => r.id === "req-events-logo")!, { name: "l.png", type: "image/png" })).toMatch(/מהספרייה/);
  });
  it("real people / a real event are authentic material: only a minor AI adaptation is allowed", () => {
    expect(creativeViolation({ authentic: true, origin: "ai_edited", adaptation: "material" })).toMatch(/לא עובר התאמת AI מהותית/);
    expect(creativeViolation({ authentic: true, origin: "ai_edited", adaptation: "minor" })).toBeNull();
    for (const b of BUILDERS) for (const c of b.creatives ?? []) expect(creativeViolation(c)).toBeNull();
  });
  it("combining proof: an unverified point is refused and a tampered one is dropped on read; a verified one reaches every variant, which still conforms", () => {
    const g = builderOf("sunset-google");
    const proofDir = g.copy.directions.find((d) => d.id === "d-sg-proof")!;
    expect(canCombine(proofDir, "מעל 1,000 סועדים בשקיעה בספטמבר").ok).toBe(false);
    expect(canCombine(proofDir, "40 מקומות בשקיעה ליום").ok).toBe(true);
    const tampered = copyState(g, o({ copy: { "sunset-google": { set: "main", directionId: "d-sg-direct", refinements: [], combined: ["d-sg-proof::מעל 1,000 סועדים בשקיעה בספטמבר"] } } }));
    expect(tampered.combined).toEqual([]);
    expect(tampered.variants.some((v) => v.body.includes("1,000"))).toBe(false);
    const ok = copyState(g, o({ copy: { "sunset-google": { set: "main", directionId: "d-sg-direct", refinements: [], combined: ["d-sg-proof::40 מקומות בשקיעה ליום"] } } }));
    expect(ok.variants.every((v) => v.body.includes("40 מקומות בשקיעה ליום"))).toBe(true);
    for (const v of ok.variants) expect(variantConforms(v, ok.chosen!).ok).toBe(true);
  });
  it("a flagged direction reads 'waiting for a decision', not 'missing'", () => {
    const r = ready("sunset-google", o({ copy: { "sunset-google": { set: "main", directionId: "d-sg-proof", refinements: [] } } }));
    expect(r.dims.copy.state).toBe("waiting");
    expect(r.overall).toBe("waiting_decision");
  });
  it("Overview and builder share one source: the Priority's next action is the move's readiness next action", () => {
    const readinessOf = (m: Move) => (m.builderId ? ready(m.builderId) : null);
    const a = nextAction(pp("p-events"), moves(), REQUIREMENTS, o(), F, routes, readinessOf);
    expect(a.label).toContain(ready("events-meta").next.label);
    expect(a.href).toBe("/b/events-meta#readiness");
  });
});
