import type {
  ApprovalAction, ApproverKind, AssetAvailability, AuthenticityClass, BuilderProposal, ClientApprovalPolicy, ClientMaterialRequest, ContentRequirement,
  CopyVariant, CoverOption, DecisionKey, Move, MoveMessageDirection, MoveState, Plan, PlanNeed, Priority, PriorityPlan, Readiness, ReadinessDimension,
  ReadinessState, RefineKey, RequestStatus, RequirementStatus, DayItem, DayItemStatus, DayItemType, ProductionRow, Recommendation, RecommendationRoute, TimelineItem,
} from "@/lib/focus/contracts/plan";
import type { Reading } from "@/lib/focus/contracts/common";

/**
 * Plan rules (Plan spec §5–§17, design package global rules) — pure, no React, no clock: "today" is a parameter.
 * The fixtures are the Plan as stored; `PlanOverlay` is what the person changed in this demo session (decisions,
 * builder edits, approvals). Every screen reads `planView(fixtures, overlay)`, so the five views stay views of the same
 * records.
 */

/* ---------- the demo session's changes ---------- */

export type BuilderEdits = {
  amount?: number;
  fromDay?: number;
  toDay?: number;
  /** where money above the unallocated amount comes from */
  budgetSource?: "same_priority" | "other_priority";
  decisions?: Partial<Record<DecisionKey, { value: string; detail?: string }>>;
  /** display hours (Google "את מי" — a low-risk inline edit) */
  hours?: { from: string; to: string };
};

/** The copy choices made in a builder: which set of three is shown, the chosen direction, refinements, a combination. */
export type CopyChoice = {
  /** "main" = the three proposed directions; "alt" = three new ones asked for */
  set: "main" | "alt";
  directionId?: string;
  refinements: RefineKey[];
  /** proof points taken from other directions, as "directionId::proof" (a combination keeps the chosen promise) */
  combined?: string[];
};

export type PlanOverlay = {
  /** lifecycle state changes (and proposed moves brought into the Plan) */
  moveStates: Record<string, MoveState>;
  /** V1: a person launches by hand and marks the move live with the platform link */
  launchLinks: Record<string, string>;
  /** creative approvals made in a builder */
  creatives: Record<string, AssetAvailability>;
  recs: Record<string, { decision: "accepted" | "dismissed"; reason?: string; taskIds?: string[] }>;
  builders: Record<string, BuilderEdits>;
  /** how a content requirement is being covered (and the task created for it) */
  requirements: Record<string, { choice: CoverOption; taskId?: string; assetId?: string }>;
  /** timeline items moved (only items that are not live and need no approval) */
  reschedules: Record<string, { startDay: number; endDay: number }>;
  /** timeline / day items whose move was asked for (live / approval-gated): the request waits for approval */
  rescheduleRequests: Record<string, number>;
  /** day items added in this session (content or execution placed on an exact day) */
  dayItems: DayItem[];
  /** a day item moved to another exact day */
  dayMoves: Record<string, number>;
  /** a day item's status changed */
  dayStatus: Record<string, DayItemStatus>;
  /** spend typed in by hand where the channel reports nothing (V1) — replaces "unknown" with a known, dated value */
  manualSpend: Record<string, { amount: number; at: string }>;
  /** priorities proposed in this session ("+ נושא לקידום") — proposed, not active */
  proposedPriorities: { id: string; name: string; description: string }[];
  /** a draft plan for a next period, copied from the current one */
  copiedPeriods: string[];
  /** the copy direction chosen in each builder (and refinements) */
  copy: Record<string, CopyChoice>;
  /** client material requests, one per requirement (the task it created, whether a person marked it sent) */
  requests: Record<string, ClientMaterialRequest>;
  /** approvals given per move, by action (who approved is the policy's approver for that action) */
  approvalsGiven: Record<string, ApprovalAction[]>;
  /** UNKNOWN tracking acknowledged as a risk at approval (per move) */
  trackingAck: Record<string, true>;
};

export const EMPTY_OVERLAY: PlanOverlay = {
  moveStates: {}, launchLinks: {}, creatives: {}, recs: {}, builders: {}, requirements: {}, reschedules: {}, rescheduleRequests: {},
  dayItems: [], dayMoves: {}, dayStatus: {}, manualSpend: {}, proposedPriorities: [], copiedPeriods: [],
  copy: {}, requests: {}, approvalsGiven: {}, trackingAck: {},
};

/** Read the overlay defensively (session storage may hold an older shape, including the retired `waiting_approval` state). */
export function readOverlay(v: unknown): PlanOverlay {
  const o = (v && typeof v === "object" ? v : {}) as Partial<PlanOverlay>;
  const moveStates = Object.fromEntries(Object.entries(o.moveStates ?? {}).map(([k, s]) => [k, (s as string) === "waiting_approval" ? "ready_for_review" : s])) as Record<string, MoveState>;
  return { ...EMPTY_OVERLAY, ...o, moveStates } as PlanOverlay;
}

/* ---------- lifecycle ---------- */

/**
 * The lifecycle states in order (spec §8, locked). "Needs attention" and "optimization in progress" are overlays;
 * "waiting for approval" is a readiness status inside ready_for_review — none of them is a state.
 */
export const LIFECYCLE: readonly MoveState[] = ["idea", "planned", "building", "ready_for_review", "approved", "live", "paused", "ended"];

/** In the Plan = everything except an idea (not yet in the Plan) and nothing else. */
export const inPlan = (s: MoveState) => s !== "idea";

/** A move counts toward planned coverage from "planned" to "live"/"paused"; an ended move's contribution is history. */
export const countsTowardCoverage = (s: MoveState) => s !== "idea" && s !== "ended";

/** The legal next states a person can move a move to in this prototype (V1: launch is manual). */
export function canTransition(from: MoveState, to: MoveState): boolean {
  const next: Record<MoveState, MoveState[]> = {
    idea: ["planned", "building"],
    planned: ["building"],
    building: ["ready_for_review", "planned"],
    ready_for_review: ["approved", "building"],
    approved: ["live", "building"],
    live: ["paused", "ended"],
    paused: ["live", "ended"],
    ended: [],
  };
  return next[from].includes(to);
}

export function moveState(m: Move, o: PlanOverlay): MoveState {
  return o.moveStates[m.id] ?? m.state;
}

/** Apply the overlay to a move (state, budget committed on approval, optimizing after an accepted live change). */
export function applyMove(m: Move, o: PlanOverlay, recs: Recommendation[]): Move {
  const state = moveState(m, o);
  const rec = m.recommendationId ? o.recs[m.recommendationId] : undefined;
  const r = m.recommendationId ? recs.find((x) => x.id === m.recommendationId) : undefined;
  const builder = m.builderId ? o.builders[m.builderId] : undefined;
  const planned = builder?.amount ?? m.budget.planned;
  const committed = state === "approved" || state === "live" || state === "paused" ? (m.budget.committed ?? planned) : m.budget.committed;
  const manual = o.manualSpend[m.id];
  const spent = manual ? { kind: "known" as const, value: manual.amount } : m.budget.spent;
  return {
    ...m,
    state,
    // an accepted change on a live move = optimization in progress (activity detail, not a state)
    optimizing: state === "live" && rec?.decision === "accepted" && r ? `שינוי בביצוע: ${r.text}` : m.optimizing,
    recommendationId: rec ? null : m.recommendationId,
    budget: { ...m.budget, planned, committed, spent, ...(manual ? { manualAt: manual.at } : {}) },
  };
}

/* ---------- the view model ---------- */

export type PlanFixtures = {
  plan: Plan;
  moves: Move[];
  proposed: Move[];
  recs: Recommendation[];
  requirements: ContentRequirement[];
  builders: BuilderProposal[];
};

/** Every move of the Plan with the session's changes; proposed moves appear once they are in the Plan. */
export function planMoves(f: PlanFixtures, o: PlanOverlay): Move[] {
  const proposed = f.proposed.filter((m) => inPlan(moveState(m, o)));
  return [...f.moves, ...proposed].map((m) => applyMove(m, o, f.recs));
}

export function movesOf(pp: PriorityPlan, moves: Move[]): Move[] {
  return moves.filter((m) => m.priorityId === pp.priorityId);
}

/* ---------- coverage (planned) vs actual — never the same number ---------- */

export type Coverage = {
  target: number;
  /** expected contributions of the moves in the Plan */
  planned: number;
  /** planned short of the target (0 = fully planned) */
  gap: number;
  /** what actually happened so far — a reading, separate from coverage */
  actual: Reading;
};

export function coverage(pp: PriorityPlan, moves: Move[]): Coverage {
  const planned = movesOf(pp, moves).filter((m) => countsTowardCoverage(m.state)).reduce((s, m) => s + m.expected, 0);
  return { target: pp.goal.target, planned, gap: Math.max(0, pp.goal.target - planned), actual: pp.goal.actual };
}

/** Open plan needs: a coverage gap disappears once the moves in the Plan cover the goal. */
export function openNeeds(pp: PriorityPlan, moves: Move[]): PlanNeed[] {
  const c = coverage(pp, moves);
  return pp.needs.filter((n) => (n.kind === "coverage_gap" ? c.gap > 0 : true)).map((n) => (n.kind === "coverage_gap" ? { ...n, short: c.gap, title: `חסר מהלך ל־${c.gap} ${unitWord(pp)}.` } : n));
}

const UNIT_WORD: Record<string, string> = { qualified_leads: "לידים", bookings: "הזמנות", ils: "₪", orders: "הזמנות", clients: "לקוחות" };
export const unitWord = (pp: PriorityPlan) => UNIT_WORD[pp.goal.unit] ?? "";

/* ---------- assets: approved / awaiting approval / missing stay distinct ---------- */

export function requirementSlots(req: ContentRequirement, o: PlanOverlay, builders: BuilderProposal[]): AssetAvailability[] {
  if (req.creativeIds) {
    const creatives = builders.flatMap((b) => b.creatives ?? []);
    return req.creativeIds.map((id) => o.creatives[id] ?? creatives.find((c) => c.id === id)?.availability ?? "missing");
  }
  const cover = o.requirements[req.id];
  // a chosen way to cover a missing asset makes it exist (awaiting approval) — except a request to the client, which
  // only creates a request + task: the asset is missing until the material arrives (then in review), and covers the
  // requirement once its approver accepts it
  if (cover?.choice === "request") {
    const r = o.requests[req.id];
    if (r?.approvedAt && !r.cancelledAt) return req.slots.map((s) => (s === "missing" ? "approved" : s));
    if (r?.receivedAt && !r.cancelledAt) return req.slots.map((s) => (s === "missing" ? "awaiting_approval" : s));
    return req.slots;
  }
  if (cover) return req.slots.map((s) => (s === "missing" ? "awaiting_approval" : s));
  return req.slots;
}

export type AvailabilityCount = Record<AssetAvailability, number>;
export function countSlots(slots: AssetAvailability[]): AvailabilityCount {
  const c: AvailabilityCount = { approved: 0, awaiting_approval: 0, missing: 0 };
  for (const s of slots) c[s]++;
  return c;
}

/** One state word per requirement: covered / N awaiting approval / missing — "awaiting" never reads as "missing". */
export function requirementWord(req: ContentRequirement, slots: AssetAvailability[]): { word: string; tone: "good" | "amber" | "red" | "muted" } {
  const c = countSlots(slots);
  if (c.missing > 0) return { word: c.missing === slots.length ? "חסר" : `${c.missing} חסרים`, tone: "red" };
  if (c.awaiting_approval > 0) return { word: `${c.awaiting_approval} ממתינים לאישור`, tone: "amber" };
  return { word: "מכוסה", tone: "good" };
}

export type MissingSummary = {
  /** truly missing (does not exist), the most urgent first */
  missing: { text: string; day: number | null }[];
  /** exists but not usable yet — shown on a separate line, never as missing */
  awaiting: string[];
};

export function missingFor(pp: PriorityPlan, moves: Move[], reqs: ContentRequirement[], o: PlanOverlay, builders: BuilderProposal[]): MissingSummary {
  const missing: MissingSummary["missing"] = openNeeds(pp, moves).map((n) => ({
    text: n.kind === "coverage_gap" ? `מהלך שיכסה ${n.short} ${unitWord(pp)}` : n.title, day: null,
  }));
  const awaiting: string[] = [];
  const mine = reqs.filter((r) => r.priorityId === pp.priorityId).sort((a, b) => (a.neededByDay ?? 99) - (b.neededByDay ?? 99));
  for (const r of mine) {
    const c = countSlots(requirementSlots(r, o, builders));
    if (c.missing > 0) missing.push({ text: r.title, day: r.neededByDay });
    else if (c.awaiting_approval > 0) awaiting.push(`${c.awaiting_approval} ${r.title.includes("קריאייטיב") ? "קריאייטיבים" : "נכסים"} ל־${moves.find((m) => m.id === r.moveId)?.channelLabel ?? ""}`.trim());
  }
  return { missing, awaiting };
}

/* ---------- one next action per priority ---------- */

export type NextAction = {
  kind: "decision" | "blocker" | "missing_asset" | "task" | "none";
  label: string;
  href: string | null;
  /** primary (ink) when the priority is in trouble or a decision waits; secondary otherwise */
  emphasis: "primary" | "secondary";
};

export type Routes = {
  builder: (id: string) => string;
  createMove: (needId: string) => string;
  /** where a goal's measurement source is set by hand (V1: the Plan's priority drill-down, not a connection) */
  measurement: (priorityId: string) => string;
  requirement: (id: string) => string;
};

/**
 * decision waiting › main blocker › nearest missing asset › next due task › "nothing needed" (fixed order). A move
 * with a builder speaks through its readiness (`readinessOf`), so the Plan and the builder never disagree about what
 * comes next for that move.
 */
export function nextAction(pp: PriorityPlan, moves: Move[], reqs: ContentRequirement[], o: PlanOverlay, f: Pick<PlanFixtures, "builders">, routes: Routes, readinessOf?: (m: Move) => Readiness | null): NextAction {
  const mine = movesOf(pp, moves);
  const trouble = pp.status === "at_risk" || pp.status === "off_track";
  if (readinessOf) {
    for (const m of mine) {
      if (m.state === "live" || m.state === "paused" || m.state === "ended" || m.state === "planned" || m.state === "idea") continue;
      const r = readinessOf(m);
      if (!r || !m.builderId) continue;
      if (r.overall === "waiting_approval") return { kind: "decision", label: `${r.next.label} · ${m.channelLabel}`, href: `${routes.builder(m.builderId)}#readiness`, emphasis: "primary" };
      if (r.overall !== "approved") return { kind: r.overall === "blocked" ? "blocker" : "decision", label: `${r.next.label} · ${m.longName}`, href: `${routes.builder(m.builderId)}#readiness`, emphasis: trouble || r.overall === "ready_for_review" ? "primary" : "secondary" };
    }
  }
  // 1. a decision waiting for the owner: creatives awaiting approval in a move being built, or a move ready for review
  for (const m of mine) {
    const b = m.builderId ? f.builders.find((x) => x.id === m.builderId) : undefined;
    if (m.state === "ready_for_review" && b) return { kind: "decision", label: `אשר את ${m.longName}`, href: routes.builder(b.id), emphasis: "primary" };
    const awaitingCreatives = (b?.creatives ?? []).filter((c) => (o.creatives[c.id] ?? c.availability) === "awaiting_approval");
    if (b && awaitingCreatives.length && (m.state === "building" || m.state === "planned")) {
      return { kind: "decision", label: `אשר את קריאייטיבי ${m.channelLabel}`, href: `${routes.builder(b.id)}#creative`, emphasis: "primary" };
    }
  }
  // 2. the main blocker: a plan need (coverage gap, no measurement source). V1 has no connections: a measurement
  // source is set by hand (a manual source or a measurement agreement on the move), never "connected" from here.
  for (const n of openNeeds(pp, moves)) {
    if (n.kind === "coverage_gap") return { kind: "blocker", label: `צור מהלך ל־${n.short} ${unitWord(pp)}`, href: routes.createMove(n.id), emphasis: trouble ? "primary" : "secondary" };
    return { kind: "blocker", label: "הגדר מקור מדידה ליעד", href: routes.measurement(pp.priorityId), emphasis: trouble ? "primary" : "secondary" };
  }
  // 3. the nearest missing asset
  const missingReq = reqs.filter((r) => r.priorityId === pp.priorityId && countSlots(requirementSlots(r, o, f.builders)).missing > 0)
    .sort((a, b) => (a.neededByDay ?? 99) - (b.neededByDay ?? 99))[0];
  if (missingReq) return { kind: "missing_asset", label: `כסה: ${missingReq.title}`, href: routes.requirement(missingReq.id), emphasis: trouble ? "primary" : "secondary" };
  return { kind: "none", label: "אין צורך בפעולה", href: null, emphasis: "secondary" };
}

/** With more than 3 priorities, those on track with nothing to do collapse to one row. */
export function collapsedPriority(pp: PriorityPlan, count: number, action: NextAction): boolean {
  return count > 3 && pp.status === "on_track" && action.kind === "none";
}
/** Recommended focus is 3–5 active priorities: warn above 5, never block. */
export const tooManyPriorities = (count: number) => count > 5;

/* ---------- timeline ---------- */

export type ProductionReason = "approval" | "warning" | "deadline" | "expanded" | "switch";
export const PRODUCTION_REASON: Record<ProductionReason, string> = {
  approval: "מוצג: אישור ממתין", warning: "מוצג: אזהרה", deadline: "מוצג: דדליין קרוב", expanded: "מוצג: מהלך מורחב", switch: "מוצג: הפקת תוכן",
};

/** Content production is hidden by default; it shows with a reason (approval due › warning › deadline near › expanded › switch). */
export function productionVisibility(row: ProductionRow, opts: { today: number; expanded: boolean; switchOn: boolean; nearDays?: number }): ProductionReason | null {
  if (row.approvalDue) return "approval";
  if (row.warning) return "warning";
  const near = opts.nearDays ?? 3;
  if (row.deadlineDay >= opts.today && row.deadlineDay - opts.today <= near) return "deadline";
  if (opts.expanded) return "expanded";
  if (opts.switchOn) return "switch";
  return null;
}

/** A flight bar moves freely only when its move is not live and needs no approval; otherwise moving it is a request. */
export function canReschedule(item: TimelineItem, state: MoveState): "move" | "approval" | "fixed" {
  if (item.kind === "live") return state === "live" ? "approval" : "fixed";
  if (state === "live" || state === "ready_for_review" || state === "approved" || item.kind === "waiting_flight") return "approval";
  return "move";
}

export const inWeek = (item: { startDay: number; endDay: number }, w: { from: number; to: number }) => item.startDay <= w.to && item.endDay >= w.from;

/* ---------- day items: execution on exact days ---------- */

export const DAY_TYPE: Record<DayItemType, { word: string; short: string; publish: boolean; major?: boolean }> = {
  post: { word: "פוסט", short: "פוסט", publish: true },
  story: { word: "סטורי", short: "סטורי", publish: true },
  reel: { word: "רילס", short: "רילס", publish: true },
  email: { word: "דוא״ל", short: "מייל", publish: true },
  whatsapp: { word: "שליחת WhatsApp", short: "שליחה", publish: true },
  creative_due: { word: "יעד קריאייטיב", short: "נכס", publish: false },
  approval_due: { word: "יעד אישור", short: "אישור", publish: false },
  launch: { word: "השקה", short: "השקה", publish: true, major: true },
  campaign_review: { word: "סקירת קמפיין", short: "סקירה", publish: false },
  optimization_review: { word: "בדיקת אופטימיזציה", short: "בדיקה", publish: false },
  creative_refresh: { word: "רענון קריאייטיב", short: "רענון", publish: false },
  milestone: { word: "אבן דרך", short: "יעד", publish: false },
  moment: { word: "רגע עסקי", short: "רגע", publish: false },
};

/** The status word depends on the type: a post is published, a send is sent, a review is completed. */
export function dayStatusWord(type: DayItemType, status: DayItemStatus): string {
  if (status === "done") return DAY_TYPE[type].publish ? (type === "email" || type === "whatsapp" ? "נשלח" : type === "launch" ? "הושק" : "פורסם") : type === "moment" ? "עבר" : "הושלם";
  return { planned: "מתוכנן", in_progress: "בעבודה", ready: "מוכן", scheduled: "מתוזמן", blocked: "חסום" }[status];
}

/** Fixtures + this session's additions, moves and status changes. */
export function dayItemsView(fixtures: DayItem[], o: PlanOverlay): DayItem[] {
  return [...fixtures, ...o.dayItems].map((it) => ({ ...it, day: o.dayMoves[it.id] ?? it.day, status: o.dayStatus[it.id] ?? it.status }));
}

/**
 * Moving a day item: content and execution move freely to any exact day; what already happened or is a fact of the
 * calendar (a business moment) stays; a launch or an approval date of a move that is already approved / live / in
 * approval is a Plan change and goes through an approval request (as flight bars do).
 */
export function canMoveDayItem(item: DayItem, state: MoveState | null): "move" | "approval" | "fixed" {
  if (item.status === "done" || item.type === "moment") return "fixed";
  if ((item.type === "launch" || item.type === "approval_due") && state && (state === "live" || state === "approved" || state === "ready_for_review")) return "approval";
  return "move";
}

export type DayWarningKind = "missing_asset" | "approval_incomplete" | "launch_clash" | "overdue" | "refresh_due" | "blocked";
export type DayWarning = { kind: DayWarningKind; itemId: string; day: number; severity: "high" | "medium"; text: string };

export const DAY_WARNING_WORD: Record<DayWarningKind, string> = {
  missing_asset: "חסר נכס לפני הפרסום", approval_incomplete: "האישור לא הושלם", launch_clash: "כמה השקות באותו יום",
  overdue: "באיחור", refresh_due: "נדרש רענון", blocked: "חסום",
};

const OPEN: DayItemStatus[] = ["planned", "in_progress", "blocked"];

/**
 * Warnings derived from the day items (never stored): a publish/launch whose asset is missing; a launch whose approval
 * (or whose creatives' approval) is not done; two or more launches on one day; anything open past its day; a creative
 * refresh that is due; a blocked item. Asset "awaiting approval" is an approval warning, never "missing".
 */
export function dayWarnings(items: DayItem[], ctx: {
  today: number; overlay: PlanOverlay; requirements: ContentRequirement[]; builders: BuilderProposal[]; moveStateOf: (moveId: string) => MoveState | null;
}): DayWarning[] {
  const out: DayWarning[] = [];
  const launches: Record<number, DayItem[]> = {};
  for (const it of items) {
    if (it.status === "done") continue;
    const req = it.needs?.requirementId ? ctx.requirements.find((r) => r.id === it.needs!.requirementId) : undefined;
    const slots = req ? countSlots(requirementSlots(req, ctx.overlay, ctx.builders)) : null;
    const publishes = DAY_TYPE[it.type].publish || it.type === "creative_due" || it.type === "creative_refresh";
    if (slots && slots.missing > 0 && publishes) out.push({ kind: "missing_asset", itemId: it.id, day: it.day, severity: DAY_TYPE[it.type].publish ? "high" : "medium", text: `${req!.title} · ${slots.missing === 1 ? "חסר" : `${slots.missing} חסרים`}, לא קיים` });
    else if (slots && slots.awaiting_approval > 0 && DAY_TYPE[it.type].publish) out.push({ kind: "approval_incomplete", itemId: it.id, day: it.day, severity: "high", text: `${slots.awaiting_approval} נכסים ממתינים לאישורך` });
    if (it.needs?.approvalItemId) {
      const ap = items.find((x) => x.id === it.needs!.approvalItemId);
      const moveDone = it.moveId ? ["approved", "live"].includes(ctx.moveStateOf(it.moveId) ?? "") : false;
      if (ap && ap.status !== "done" && !moveDone && !out.some((w) => w.itemId === it.id && w.kind === "approval_incomplete")) {
        out.push({ kind: "approval_incomplete", itemId: it.id, day: it.day, severity: "high", text: `אישור הבעלים (${ap.day}.10) עוד לא ניתן` });
      }
    }
    if (it.day < ctx.today && OPEN.includes(it.status) && it.type !== "moment") out.push({ kind: "overdue", itemId: it.id, day: it.day, severity: "high", text: `היה אמור להיות מוכן ב־${it.day}.10` });
    if (it.type === "creative_refresh" && it.status !== "ready" && !out.some((w) => w.itemId === it.id && w.kind === "missing_asset")) out.push({ kind: "refresh_due", itemId: it.id, day: it.day, severity: "medium", text: "הקריאייטיב הנוכחי שחוק · צריך להחליף" });
    if (it.status === "blocked") out.push({ kind: "blocked", itemId: it.id, day: it.day, severity: "high", text: it.blockedReason ?? "חסום" });
    if (DAY_TYPE[it.type].major) (launches[it.day] ??= []).push(it);
  }
  for (const [d, ls] of Object.entries(launches)) {
    if (ls.length < 2) continue;
    for (const l of ls) out.push({ kind: "launch_clash", itemId: l.id, day: Number(d), severity: "medium", text: `${ls.length} השקות ב־${d}.10 · כדאי לפזר` });
  }
  return out.sort((a, b) => (a.severity === b.severity ? a.day - b.day : a.severity === "high" ? -1 : 1));
}

/** Load on one day: many items (execution items, not moments) or two launches = overloaded. */
export const OVERLOAD_ITEMS = 5;
export function dayLoad(items: DayItem[], d: number) {
  const on = items.filter((it) => it.day === d && it.type !== "moment");
  const launches = on.filter((it) => DAY_TYPE[it.type].major).length;
  return { count: on.length, launches, overloaded: on.length >= OVERLOAD_ITEMS || launches >= 2 };
}

/**
 * The mobile agenda: every day of the week with every item on that exact date (including done ones), plus bars that
 * start that day ("בנייה מתחילה"); moves live all week collapse into one count.
 */
export function agendaWeek(items: DayItem[], bars: TimelineItem[], w: { from: number; to: number }, liveMoves: number) {
  const days = [];
  for (let d = w.from; d <= w.to; d++) {
    days.push({ day: d, items: items.filter((it) => it.day === d), starts: bars.filter((b) => b.startDay === d && b.agenda) });
  }
  return { days, liveAllWeek: liveMoves };
}

/* ---------- budget ---------- */

export type Pace = "ok" | "fast" | "unknown" | "not_started";

export type BudgetLine = {
  planned: number;
  committed: number | null;
  /** known spend; null with `spentUnknown` = unknown, never zero */
  spent: number | null;
  spentUnknown: boolean;
  /** share of planned money spent (known spend only) */
  pct: number | null;
  pace: Pace;
  /** projected run-out day at the current daily rate (fast lines only) */
  runOutDay: number | null;
};

/** Fast = spending at least 20 points ahead of the share of the month elapsed. */
export function pace(spent: number | null, unknown: boolean, planned: number, today: number, monthDays: number, started: boolean): Pick<BudgetLine, "pct" | "pace" | "runOutDay"> {
  if (!started) return { pct: null, pace: "not_started", runOutDay: null };
  if (unknown || spent == null) return { pct: null, pace: "unknown", runOutDay: null };
  const pct = planned > 0 ? Math.round((spent / planned) * 100) : 0;
  const elapsed = Math.round((today / monthDays) * 100);
  const fast = pct - elapsed >= 20;
  const rate = spent / today;
  const runOutDay = fast && rate > 0 ? Math.min(monthDays, Math.round(today + (planned - spent) / rate)) : null;
  return { pct, pace: fast ? "fast" : "ok", runOutDay };
}

export function readingSpend(r: Reading | null): { spent: number | null; unknown: boolean } {
  if (!r) return { spent: null, unknown: false };
  if (r.kind === "known" || r.kind === "estimated") return { spent: r.value, unknown: false };
  return { spent: null, unknown: true };
}

export function moveBudget(m: Move, today: number, monthDays: number): BudgetLine {
  const { spent, unknown } = readingSpend(m.budget.spent);
  const started = m.state === "live" || m.state === "paused" || m.state === "ended";
  return { planned: m.budget.planned, committed: m.budget.committed, spent, spentUnknown: unknown, ...pace(spent, unknown, m.budget.planned, today, monthDays, started) };
}

export function priorityBudget(pp: PriorityPlan, moves: Move[], today: number, monthDays: number): BudgetLine {
  const lines = movesOf(pp, moves).map((m) => moveBudget(m, today, monthDays));
  const committedParts = lines.filter((l) => l.committed != null);
  const spentUnknown = lines.some((l) => l.spentUnknown);
  const knownSpent = lines.filter((l) => l.spent != null);
  const spent = knownSpent.length ? knownSpent.reduce((s, l) => s + (l.spent ?? 0), 0) : null;
  const started = lines.some((l) => l.pace !== "not_started");
  // a priority whose every started move is unknown has unknown spend; partial knowledge is shown as known + unknown
  const allUnknown = spentUnknown && spent == null;
  return {
    planned: pp.allocation,
    committed: committedParts.length ? committedParts.reduce((s, l) => s + (l.committed ?? 0), 0) : null,
    spent: allUnknown ? null : spent, spentUnknown,
    ...pace(allUnknown ? null : spent, allUnknown, pp.allocation, today, monthDays, started),
  };
}

export type PlanBudget = {
  total: number;
  allocated: number;
  unallocated: number;
  /** money a proposed move would take from the unallocated amount, waiting for owner approval */
  pendingFromUnallocated: number;
  committed: number;
  spentKnown: number;
  spentUnknown: boolean;
  elapsedPct: number;
};

export function planBudget(f: PlanFixtures, o: PlanOverlay, moves: Move[], today: number, monthDays: number): PlanBudget {
  const proposedApproved = f.proposed.filter((m) => { const s = moveState(m, o); return s === "approved" || s === "live"; });
  const proposedPending = f.proposed.filter((m) => { const s = moveState(m, o); return inPlan(s) && s !== "approved" && s !== "live"; });
  const fromUnallocated = (m: Move) => { const b = f.builders.find((x) => x.id === m.builderId); return b?.budget.fromUnallocated ? (o.builders[b.id]?.amount ?? b.budget.amount) : 0; };
  const approvedTake = proposedApproved.reduce((s, m) => s + Math.min(fromUnallocated(m), unallocatedBase(f)), 0);
  const allocated = f.plan.priorities.reduce((s, p) => s + p.allocation, 0) + approvedTake;
  const lines = f.plan.priorities.map((pp) => priorityBudget(pp, moves, today, monthDays));
  return {
    total: f.plan.total,
    allocated,
    unallocated: f.plan.total - allocated,
    pendingFromUnallocated: proposedPending.reduce((s, m) => s + fromUnallocated(m), 0),
    committed: lines.reduce((s, l) => s + (l.committed ?? 0), 0),
    spentKnown: lines.reduce((s, l) => s + (l.spent ?? 0), 0),
    spentUnknown: lines.some((l) => l.spentUnknown),
    elapsedPct: Math.round((today / monthDays) * 100),
  };
}
const unallocatedBase = (f: PlanFixtures) => f.plan.total - f.plan.priorities.reduce((s, p) => s + p.allocation, 0);

/* ---------- builders ---------- */

/** Expected result range from the budget and the cost-per-result range; null when the goal is not measured. */
export function expectedRange(amount: number, cpr: { low: number; high: number } | null): { low: number; high: number } | null {
  if (!cpr) return null;
  return { low: Math.round(amount / cpr.high), high: Math.round(amount / cpr.low) };
}

/** Money above what the source can give (the unallocated amount) needs a source; another priority = Plan approval. */
export function budgetOverflow(amount: number, b: BuilderProposal, unallocated: number): number {
  if (!b.budget.fromUnallocated) return 0;
  return Math.max(0, amount - unallocated);
}

export const dailyBudget = (amount: number, fromDay: number, toDay: number) => Math.round(amount / Math.max(1, toDay - fromDay + 1));

/** Claims the Brain has not verified are refused in builder text (the same check that removed one from the proposal). */
export const PROHIBITED_CLAIMS = ["הנוף הכי יפה בעיר", "המסעדה הכי טובה", "הכי זול"];
export function unverifiedClaim(text: string): string | null {
  return PROHIBITED_CLAIMS.find((c) => text.includes(c)) ?? null;
}

/** Can the builder be sent for review? Blocked offers and unfinished edits stop it, with the reason in words. */
export function sendBlocked(b: BuilderProposal, state: MoveState): string | null {
  if (b.blocked) return `${b.blocked}. "שלח לבדיקה" לא זמין עד אימות.`;
  if (state !== "building") return state === "ready_for_review" ? "כבר נשלח לבדיקה" : "ההצעה לא בבנייה";
  return null;
}

export function isHttpsUrl(v: string): boolean {
  try { const u = new URL(v.trim()); return u.protocol === "https:" && !!u.hostname; } catch { return false; }
}

/* ---------- recommendations ---------- */

export const ROUTE_WORD: Record<RecommendationRoute, string> = {
  plan: "שינוי תוכנית · דורש אישור לקוח",
  marketing: "שינוי בביצוע המהלך · פעולת שיווק",
  work: "עבודה בלבד · נוצרות משימות",
};

/* ---------- authenticity: which cover paths a requirement allows (spec §9) ---------- */

export const AUTHENTICITY_WORD: Record<AuthenticityClass, string> = {
  authentic: "חייב להיות אמיתי", brand_fixed: "נכס מותג קבוע", adaptable: "ניתן להתאמה", illustrative: "ממחיש",
};

/**
 * The paths a class allows, in order of preference. Authentic material is never generated and never adapted from
 * something else (a testimonial cut from event footage is not a testimonial); brand-fixed material comes from the
 * approved library only; adaptable client material may be AI-adapted; illustrative material may be generated.
 */
export function allowedPaths(cls: AuthenticityClass): CoverOption[] {
  switch (cls) {
    case "authentic": return ["existing", "request"];
    case "brand_fixed": return ["existing"];
    case "adaptable": return ["existing", "ai_client", "request"];
    case "illustrative": return ["existing", "generate", "ai_client"];
  }
}

/** Why a path is not offered for this class, in words (shown disabled, never hidden). */
export function pathRefusal(cls: AuthenticityClass, path: CoverOption): string | null {
  if (allowedPaths(cls).includes(path)) return null;
  if (path === "generate") return cls === "brand_fixed" ? "נכס מותג מגיע רק מהספרייה המאושרת" : "חומר אמיתי לא נוצר ב־AI (כלל במוח העסק)";
  if (path === "ai_client") return cls === "authentic" ? "המלצה או צילום אמיתי לא נגזרים מנכס אחר" : "נכס מותג מגיע רק מהספרייה המאושרת";
  if (path === "request") return cls === "brand_fixed" ? "הלוגו והחומר המשפטי כבר בספרייה המאושרת" : "חומר ממחיש לא מבקשים מהלקוח";
  return "לא זמין לסוג הנכס";
}

/**
 * The recommended path, by rule: a fitting existing asset first; else the class rule (authentic → request, brand-fixed →
 * blocked, adaptable → AI + client asset, illustrative → generate). A fixture `recommended` wins only if the class allows it.
 */
export function recommendedPath(req: ContentRequirement): CoverOption | null {
  if (req.recommended && allowedPaths(req.authenticity).includes(req.recommended)) return req.recommended;
  if (req.existingCandidates.length) return "existing";
  switch (req.authenticity) {
    case "authentic": return "request";
    case "brand_fixed": return null;
    case "adaptable": return "ai_client";
    case "illustrative": return "generate";
  }
}

/**
 * The deadline check: a request to the client needs lead time (capture, upload, review). When the needed-by date is
 * closer than that, propose an interim fallback inside the class and say so.
 */
export const REQUEST_LEAD_DAYS = 5;
export function requestTooLate(req: ContentRequirement, today: number): string | null {
  if (req.neededByDay == null) return null;
  if (req.neededByDay - today >= REQUEST_LEAD_DAYS) return null;
  const fallback = req.authenticity === "adaptable" ? "התאמת נכס קיים (AI + נכס של הלקוח)" : req.authenticity === "illustrative" ? "יצירה חדשה" : null;
  return `נותרו ${Math.max(0, req.neededByDay - today)} ימים; בקשה מהלקוח צריכה כ־${REQUEST_LEAD_DAYS}.${fallback ? ` פתרון ביניים: ${fallback}.` : " לא קיים פתרון ביניים לחומר אמיתי: הבקשה נשלחת, ומועד ההשקה בסיכון."}`;
}

/** State-layer guard: a cover path the requirement's authenticity class refuses is never stored. */
export function coverAllowed(req: ContentRequirement, choice: CoverOption): boolean {
  return allowedPaths(req.authenticity).includes(choice);
}

/**
 * Upload compatibility (an upload arrives under "use existing" or as a client's material): brand-fixed material only
 * comes from the approved library; video material needs a video file; photo / graphic / logo needs an image.
 */
export function uploadCompatible(req: ContentRequirement, file: { name: string; type: string }): string | null {
  if (req.authenticity === "brand_fixed") return "נכס מותג מגיע רק מהספרייה המאושרת, לא מהעלאה";
  const video = req.assetType === "video" || req.assetType === "testimonial";
  if (video && !file.type.startsWith("video/")) return `${req.title}: נדרש קובץ וידאו (${req.format}${req.duration ? `, ${req.duration}` : ""})`;
  if (!video && !file.type.startsWith("image/")) return `${req.title}: נדרש קובץ תמונה (${req.format})`;
  return null;
}

/** A creative that shows real people or a real event may only be adapted minorly (crop, resize, format). */
export function creativeViolation(c: { authentic?: boolean; origin: string; adaptation?: "minor" | "material" }): string | null {
  if (c.authentic && c.origin === "ai_edited" && c.adaptation !== "minor") return "חומר אמיתי (אנשים או אירוע אמיתיים) לא עובר התאמת AI מהותית";
  return null;
}

/** Requirement status (spec §9): open → partly covered → covered → approved, from the slots. */
export function requirementStatus(slots: AssetAvailability[]): RequirementStatus {
  const c = countSlots(slots);
  if (c.missing === slots.length) return "open";
  if (c.missing > 0) return "partly_covered";
  if (c.awaiting_approval > 0) return "covered";
  return "approved";
}
export const REQUIREMENT_STATUS_WORD: Record<RequirementStatus, string> = { open: "פתוח", partly_covered: "מכוסה חלקית", covered: "מכוסה · ממתין לאישור", approved: "מאושר" };

/* ---------- copy: three Move Message Directions (spec §8) ---------- */

export const REFINE_WORD: Record<RefineKey, string> = { shorter: "קצר יותר", warmer: "חם יותר", more_proof: "יותר הוכחה", lead_offer: "פתח בהצעה" };

export type CopyState = {
  /** the three directions on screen (main or the three new ones) */
  directions: MoveMessageDirection[];
  chosen: MoveMessageDirection | null;
  /** the variants under the chosen direction, with refinements and combined proof applied (display only) */
  variants: CopyVariant[];
  refinements: RefineKey[];
  /** proof points combined from other directions (all verified — an unverified one is never combined) */
  combined: { directionId: string; directionName: string; proof: string }[];
  /** "3 כיוונים חדשים" is possible only when the builder has alternatives */
  canAskNew: boolean;
};

/** Apply plain refinements to a variant's text — demo behaviour; the promise (anchors) is never touched. */
export function refineVariant(v: CopyVariant, d: MoveMessageDirection, refinements: RefineKey[]): CopyVariant {
  let body = v.body;
  let hook = v.hook;
  for (const r of refinements) {
    // shorter keeps the one sentence that carries the promise (an anchor), so no refinement can break it
    if (r === "shorter") { const parts = body.split(". ").map((x) => x.replace(/\.$/, "")); body = (parts.find((x) => d.anchors.some((a) => x.includes(a))) ?? parts[0]) + "."; }
    if (r === "warmer") hook = `${hook} ❤`;
    if (r === "more_proof" && d.proof[0] && !body.includes(d.proof[0])) body = `${body} ${d.proof[0]}.`;
    if (r === "lead_offer") hook = `${d.promise}`;
  }
  return { ...v, hook, body };
}

/** A proof point may be combined into another direction only when the Brain holds it (not unverified, no refused claim). */
export function canCombine(source: MoveMessageDirection, proof: string): { ok: boolean; reason?: string } {
  if (!source.proof.includes(proof)) return { ok: false, reason: "נקודת הוכחה לא קיימת בכיוון" };
  if (source.unverified?.includes(proof)) return { ok: false, reason: `"${proof}" לא במוח העסק — לא משלבים עובדה שלא אומתה` };
  const claim = unverifiedClaim(proof);
  if (claim) return { ok: false, reason: `טענה שלא אושרה: "${claim}"` };
  return { ok: true };
}

export function copyState(b: BuilderProposal, o: PlanOverlay): CopyState {
  const choice = o.copy[b.id] ?? { set: "main", refinements: [] };
  const all = [...b.copy.directions, ...b.copy.alternatives];
  const directions = choice.set === "alt" && b.copy.alternatives.length ? b.copy.alternatives : b.copy.directions;
  const chosen = choice.directionId ? all.find((d) => d.id === choice.directionId) ?? null : null;
  // combined parts are revalidated on every read: a part that is no longer allowed is dropped, never shown
  const combined = (choice.combined ?? []).flatMap((key) => {
    const [directionId, proof] = key.split("::");
    const src = all.find((d) => d.id === directionId);
    if (!src || !chosen || src.id === chosen.id || !proof || !canCombine(src, proof).ok) return [];
    return [{ directionId, directionName: src.name, proof }];
  });
  const variants = chosen
    ? b.copy.variants.filter((v) => v.directionId === chosen.id).map((v) => {
        const r = refineVariant(v, chosen, choice.refinements);
        const extra = combined.map((c) => c.proof).filter((p) => !r.body.includes(p));
        return extra.length ? { ...r, body: `${r.body} ${extra.join(" · ")}.` } : r;
      })
    : [];
  return { directions, chosen, variants, refinements: choice.refinements, combined, canAskNew: b.copy.alternatives.length > 0 };
}

/**
 * A variant conforms to its direction when it keeps the promise (every anchor word appears in hook, body or headline)
 * and carries no claim the Brain refuses. Variants may adapt hook, proof, wording and CTA — never the promise.
 */
export function variantConforms(v: CopyVariant, d: MoveMessageDirection): { ok: boolean; reason?: string } {
  const text = `${v.hook} ${v.body} ${v.headline}`;
  const claim = unverifiedClaim(text);
  if (claim) return { ok: false, reason: `טענה שלא אושרה: "${claim}"` };
  const missing = d.anchors.find((a) => !text.includes(a));
  if (missing) return { ok: false, reason: `הגרסה איבדה את ההבטחה ("${missing}")` };
  return { ok: true };
}

/** The flags on a direction: an unverified fact (from the fixture) and any refused claim in its text. */
export function directionFlags(d: MoveMessageDirection): string[] {
  const out: string[] = [];
  if (d.flag) out.push(d.flag);
  for (const u of d.unverified ?? []) if (!d.flag?.includes(u)) out.push(`"${u}" לא במוח העסק — אשר או הסר`);
  const claim = unverifiedClaim(`${d.promise} ${d.proof.join(" ")}`);
  if (claim) out.push(`טענה שלא אושרה במוח העסק: "${claim}"`);
  return out;
}

/* ---------- client approval policy (spec §4) ---------- */

export const APPROVAL_ACTION_WORD: Record<ApprovalAction, string> = {
  plan: "אישור התוכנית", direction: "כיוון המסר", variants: "גרסאות הטקסט", new_creative: "קריאייטיב חדש לפרסום ממומן",
  material_adaptation: "התאמת AI מהותית לנכס של הלקוח", minor_adaptation: "התאמה קלה (חיתוך, פורמט)", launch: "השקת המהלך", in_priority_change: "שינוי בתוך הקצאת הנושא",
};

/** The floor: these need the Client under every preset; a policy can never move them to the operator. */
export const APPROVAL_FLOOR: readonly ApprovalAction[] = ["plan", "material_adaptation"];

/** Who approves an action for this Client: the policy's answer, never below the floor. */
export function approverFor(policy: ClientApprovalPolicy, action: ApprovalAction): ApproverKind {
  if (APPROVAL_FLOOR.includes(action)) return "client";
  return policy.rules[action];
}

export type RequiredApproval = { action: ApprovalAction; by: ApproverKind; given: boolean; /** why it lands on this approver */ reason?: string };

/** The context a policy decision needs that is not on the move: whether the Client approved the period's Plan. */
export type ApprovalContext = { planApproved: boolean };

/**
 * DELEGATED launch (owner decision L14): the operator may approve a launch only when the move is inside a
 * Client-approved Plan, its budget stays inside the approved allocation, total spend does not rise, no mandatory
 * Client approval is outstanding, and no material change was introduced outside the approved Plan.
 */
export function delegatedLaunchAllowed(input: {
  planApproved: boolean; withinAllocation: boolean; totalSpendUnchanged: boolean; clientApprovalsOutstanding: number; materialChangeOutsidePlan: boolean;
}): { ok: boolean; reason?: string } {
  if (!input.planApproved) return { ok: false, reason: "התוכנית עוד לא אושרה על ידי הלקוח" };
  if (!input.withinAllocation) return { ok: false, reason: "התקציב חורג מההקצאה המאושרת" };
  if (!input.totalSpendUnchanged) return { ok: false, reason: "ההוצאה הכוללת עולה" };
  if (input.clientApprovalsOutstanding > 0) return { ok: false, reason: "אישור לקוח חובה עדיין פתוח" };
  if (input.materialChangeOutsidePlan) return { ok: false, reason: "הוכנס שינוי מהותי מחוץ לתוכנית המאושרת" };
  return { ok: true };
}

/** The money of a move comes from outside its Priority's approved allocation (the unallocated pool or another Priority). */
export function outsideAllocation(b: BuilderProposal, o: PlanOverlay): boolean {
  return b.budget.fromUnallocated || o.builders[b.id]?.budgetSource === "other_priority";
}

/** A change to what the move promotes, its result or its audience after the Plan was approved. */
export function materialChange(b: BuilderProposal, o: PlanOverlay): boolean {
  const d = o.builders[b.id]?.decisions ?? {};
  return !!(d.promote || d.result || d.audience);
}

/**
 * The approvals a move needs before launch, from the Client's policy — the real path readiness and the builder use:
 * - a Plan change (money from outside the Priority's allocation) → `plan`, the Client under every preset (floor);
 * - the direction and the variants under it;
 * - every new creative; an AI-edited creative adds `material_adaptation` (floor: the Client) or `minor_adaptation`;
 * - the launch: under DELEGATED the operator only when `delegatedLaunchAllowed` holds, otherwise the Client.
 * A move that reached approved / live in an older session without stored approvals counts them as given (legacy).
 */
export function requiredApprovals(m: Move, b: BuilderProposal | undefined, policy: ClientApprovalPolicy, o: PlanOverlay, ctx: ApprovalContext = { planApproved: true }): RequiredApproval[] {
  const legacy = (m.state === "approved" || m.state === "live" || m.state === "paused" || m.state === "ended") && o.approvalsGiven[m.id] === undefined;
  const given = o.approvalsGiven[m.id] ?? [];
  const out: RequiredApproval[] = [];
  const add = (action: ApprovalAction, reason?: string, by: ApproverKind = approverFor(policy, action)) => {
    if (!out.some((a) => a.action === action)) out.push({ action, by, given: legacy || given.includes(action), ...(reason ? { reason } : {}) });
  };
  if (b && outsideAllocation(b, o)) add("plan", "הכסף מגיע מחוץ להקצאת הנושא · שינוי תוכנית");
  add("direction");
  add("variants");
  if (b?.creatives?.length) {
    add("new_creative");
    const edited = b.creatives.filter((c) => c.origin === "ai_edited");
    if (edited.some((c) => c.adaptation !== "minor")) add("material_adaptation", `התאמת AI מהותית: ${edited.filter((c) => c.adaptation !== "minor").map((c) => c.label).join(", ")}`);
    if (edited.some((c) => c.adaptation === "minor")) add("minor_adaptation", `חיתוך / פורמט: ${edited.filter((c) => c.adaptation === "minor").map((c) => c.label).join(", ")}`);
  }
  // the launch: DELEGATED moves it to the operator only inside the L14 conditions
  let launchBy = approverFor(policy, "launch");
  let launchReason: string | undefined;
  if (launchBy === "operator" && b) {
    const clientOpen = out.filter((a) => a.by === "client" && !a.given).length;
    const d = delegatedLaunchAllowed({
      planApproved: ctx.planApproved, withinAllocation: !outsideAllocation(b, o), totalSpendUnchanged: !outsideAllocation(b, o),
      clientApprovalsOutstanding: clientOpen, materialChangeOutsidePlan: materialChange(b, o),
    });
    if (!d.ok) { launchBy = "client"; launchReason = `השקה באישור הלקוח: ${d.reason}`; }
  }
  add("launch", launchReason, launchBy);
  return out;
}

/* ---------- client material request (spec §9) ---------- */

/** Build the structured request from the requirement: never "send us content". One per requirement (dedup by id). */
export function buildClientRequest(req: ContentRequirement, move: Move, priority: Priority, taskId: string, launchDay: number | undefined, at = "2026-10-07"): ClientMaterialRequest {
  const item = { what: req.title, quantity: req.quantity, format: req.format + (req.dimensions ? ` (${req.dimensions})` : ""), ...(req.duration ? { duration: req.duration } : {}) };
  const needed = req.neededByDay ?? launchDay ?? 31;
  return {
    id: `cmr-${req.id}`, requirementId: req.id, moveId: move.id, priorityId: priority.id,
    title: `${priority.name} — ${move.longName}`,
    items: [item],
    neededByDay: needed,
    why: `נדרש ל${move.longName}${launchDay ? `, שמתוכנן לעלות ב־${launchDay}.10` : ""}. תפקידו במהלך: ${req.purpose}.`,
    captureInstructions: req.captureInstructions ?? "לצלם באור טבעי, בפורמט המבוקש, בלי פילטרים.",
    uploadTo: "תיקיית UMINO · חומרים לשיווק (קישור ישלח עם הבקשה; תיקיית Mytiv ב־Drive תחובר בהמשך)",
    taskId, sentAt: null, receivedAt: null, approvedAt: null, cancelledAt: null,
    history: [{ at, text: "הבקשה נוצרה (טיוטה)" }],
  };
}

/**
 * The requirement for replacing ONE creative of a builder: exactly that slot (quantity 1), keyed by the creative, with
 * the creative's own authenticity (real people → authentic). Never the parent requirement's quantity.
 */
export function creativeReplacementRequirement(base: ContentRequirement, c: { id: string; label: string; authentic?: boolean }): ContentRequirement {
  return {
    ...base, id: `${base.id}--${c.id}`, title: `קריאייטיב חלופי · ${c.label}`, gapLabel: `קריאייטיב חלופי · ${c.label}`,
    quantity: 1, slots: ["missing"], creativeIds: undefined, existingCandidates: [], recommended: undefined,
    authenticity: c.authentic ? "authentic" : base.authenticity, purpose: `החלפת "${c.label}" (${base.purpose})`,
    spec: `${base.format}${base.dimensions ? ` · ${base.dimensions}` : ""} · מחליף את "${c.label}"`,
  };
}

/** Where a request is in its lifecycle (derived from its dates). */
export function requestStatus(r: ClientMaterialRequest): RequestStatus {
  if (r.cancelledAt) return "cancelled";
  if (r.approvedAt) return "approved";
  if (r.receivedAt) return "in_review";
  if (r.sentAt) return "sent";
  return "drafted";
}
export const REQUEST_STATUS_WORD: Record<RequestStatus, string> = {
  drafted: "טיוטה · עוד לא נשלחה", sent: "נשלחה ידנית · ממתינה לחומר", received: "החומר התקבל", in_review: "התקבל · בבדיקה", approved: "אושר · מכסה את הדרישה", cancelled: "בוטלה",
};

/**
 * What creating a request for this key should do — the dedup rule lives in the state layer: an open request is
 * returned as is; a cancelled one is re-opened (same task, history kept); only a key with no request ever creates one.
 */
export function requestCreatePlan(o: PlanOverlay, key: string): "existing" | "reopen" | "create" {
  const r = o.requests[key];
  if (!r) return "create";
  return r.cancelledAt ? "reopen" : "existing";
}

const pushHistory = (r: ClientMaterialRequest, at: string, text: string): ClientMaterialRequest => ({ ...r, history: [...r.history, { at, text }] });

/** Store a new request and point the requirement (or the replaced creative) at it. */
export function addRequest(o: PlanOverlay, r: ClientMaterialRequest): PlanOverlay {
  if (o.requests[r.requirementId] && !o.requests[r.requirementId].cancelledAt) return o;
  return { ...o, requests: { ...o.requests, [r.requirementId]: r }, ...(r.creativeId ? {} : { requirements: { ...o.requirements, [r.requirementId]: { choice: "request" as const, taskId: r.taskId } } }) };
}

export function reopenRequest(o: PlanOverlay, key: string, at: string): PlanOverlay {
  const r = o.requests[key];
  if (!r?.cancelledAt) return o;
  const reopened = pushHistory({ ...r, cancelledAt: null, sentAt: null, receivedAt: null, approvedAt: null, fileName: undefined }, at, "הבקשה נפתחה מחדש (אותה משימה)");
  return { ...o, requests: { ...o.requests, [key]: reopened }, ...(r.creativeId ? {} : { requirements: { ...o.requirements, [key]: { choice: "request" as const, taskId: r.taskId } } }) };
}

export function markRequestSent(o: PlanOverlay, key: string, at: string): PlanOverlay {
  const r = o.requests[key];
  if (!r || requestStatus(r) !== "drafted") return o;
  return { ...o, requests: { ...o.requests, [key]: pushHistory({ ...r, sentAt: at }, at, "נשלחה ידנית ללקוח") } };
}

/** The material arrived (uploaded by hand): it enters the library and waits for its approver. Only after sending. */
export function receiveMaterial(o: PlanOverlay, key: string, fileName: string, at: string): PlanOverlay {
  const r = o.requests[key];
  if (!r || requestStatus(r) !== "sent") return o;
  const next = { ...o, requests: { ...o.requests, [key]: pushHistory({ ...r, receivedAt: at, fileName }, at, `החומר התקבל: ${fileName} · בבדיקה`) } };
  return r.creativeId ? { ...next, creatives: { ...next.creatives, [r.creativeId]: "awaiting_approval" } } : next;
}

/** The approver accepts the material: it covers the requirement (or replaces the creative). Only from review. */
export function approveMaterial(o: PlanOverlay, key: string, at: string, by: string): PlanOverlay {
  const r = o.requests[key];
  if (!r || requestStatus(r) !== "in_review") return o;
  const next = { ...o, requests: { ...o.requests, [key]: pushHistory({ ...r, approvedAt: at }, at, `אושר על ידי ${by} · מכסה את הדרישה`) } };
  return r.creativeId ? { ...next, creatives: { ...next.creatives, [r.creativeId]: "approved" } } : next;
}

/** Cancel keeps the request, its history and its task; the requirement is free to be covered another way. */
export function cancelRequest(o: PlanOverlay, key: string, at: string): PlanOverlay {
  const r = o.requests[key];
  if (!r || r.cancelledAt) return o;
  const req = { ...o.requirements };
  if (req[key]?.choice === "request") delete req[key];
  return { ...o, requirements: req, requests: { ...o.requests, [key]: pushHistory({ ...r, cancelledAt: at }, at, "הבקשה בוטלה (ההיסטוריה והמשימה נשמרו)") } };
}

/** The request as plain text a person can paste into WhatsApp or an email (V1 sending is manual). */
export function clientRequestText(r: ClientMaterialRequest): string {
  const items = r.items.map((i) => `• ${i.quantity} × ${i.what} · ${i.format}${i.duration ? ` · ${i.duration}` : ""}`).join("\n");
  return `${r.title}\n\nאנחנו צריכים:\n${items}\n\nעד: ${r.neededByDay}.10\nלמה: ${r.why}\n\nאיך לצלם: ${r.captureInstructions}\n\nלהעלות ל: ${r.uploadTo}`;
}

/* ---------- campaign readiness (spec §8, derived — never lifecycle) ---------- */

export const READINESS_DIM_WORD: Record<ReadinessDimension, string> = {
  strategy: "אסטרטגיה", targeting: "קהל", budget: "תקציב", copy: "טקסט", creative: "קריאייטיב", landing: "יעד / דף נחיתה", tracking: "מעקב", approval: "אישור",
};
export const READINESS_STATE_WORD: Record<ReadinessState, string> = { ready: "מוכן", waiting: "ממתין", missing: "חסר", blocked: "חסום", unknown: "לא ידוע" };
export const READINESS_OVERALL_WORD: Record<Readiness["overall"], string> = {
  blocked: "חסום", waiting_client: "ממתין לחומר מהלקוח", missing: "חסר", waiting_decision: "ממתין להחלטה", ready_for_review: "מוכן לבדיקה", waiting_approval: "ממתין לאישור", approved: "אושר · מוכן להשקה",
};

export type ReadinessInput = {
  move: Move; builder: BuilderProposal; state: MoveState; requirements: ContentRequirement[]; overlay: PlanOverlay; builders: BuilderProposal[];
  policy: ClientApprovalPolicy; approverName: (kind: ApproverKind) => string; unallocated: number;
  /** whether the Client approved the period's Plan (DELEGATED launch needs it); default true */
  planApproved?: boolean;
};

/**
 * Readiness: eight dimensions, an overall status (first match wins), exactly one next action and at most two blockers.
 * Tracking in V1 is UNKNOWN (a risk, never healthy or zero) unless a measurement agreement replaces platform tracking.
 * "Waiting for approval" names the approver. Readiness never changes the lifecycle by itself.
 */
export function readiness(i: ReadinessInput): Readiness {
  const { move: m, builder: b, state, overlay: o, policy } = i;
  const dim = (s: ReadinessState, text: string, actor?: string) => ({ state: s, text, ...(actor ? { actor } : {}) });
  const dims = {} as Readiness["dims"];

  // strategy: purpose, objective and structure, and the offer cleared by the Brain
  dims.strategy = b.blocked ? dim("blocked", b.blocked) : dim("ready", b.summary);
  // targeting
  const aud = b.decisions.find((d) => d.key === "audience");
  dims.targeting = aud?.value ? dim("ready", o.builders[b.id]?.decisions?.audience?.value ?? aud.value) : dim("missing", "לא הוגדר קהל");
  // budget: inside the allocation (or the unallocated pool, with a source for any overflow)
  const amount = o.builders[b.id]?.amount ?? b.budget.amount;
  const overflow = budgetOverflow(amount, b, i.unallocated);
  dims.budget = overflow > 0 && !o.builders[b.id]?.budgetSource
    ? dim("blocked", `₪${overflow.toLocaleString("he-IL")} מעל הלא מוקצה בלי מקור`)
    : dim("ready", `₪${amount.toLocaleString("he-IL")} · ${b.budget.fromUnallocated ? "מהלא מוקצה" : "בתוך הקצאת הנושא"}`);
  // copy: a direction chosen, its variants conform, no open flag
  const cs = copyState(b, o);
  if (!cs.chosen) dims.copy = dim("missing", "לא נבחר כיוון מסר");
  else {
    const bad = cs.variants.map((v) => variantConforms(v, cs.chosen!)).find((r) => !r.ok);
    const flags = directionFlags(cs.chosen);
    dims.copy = bad ? dim("blocked", bad.reason!) : flags.length ? dim("waiting", `כיוון "${cs.chosen.name}" · לאמת במוח העסק או לבחור כיוון אחר: ${flags[0]}`, i.approverName("operator")) : dim("ready", `כיוון "${cs.chosen.name}" · ${cs.variants.length} גרסאות${cs.combined.length ? ` · משולב: ${cs.combined.map((c) => c.proof).join(", ")}` : ""}`);
  }
  // creative: every requirement of the move covered; the client or a generation job may be acting
  const reqs = i.requirements.filter((r) => r.moveId === m.id);
  const slotsOf = reqs.map((r) => ({ r, slots: requirementSlots(r, o, i.builders), cover: o.requirements[r.id] }));
  const total = slotsOf.reduce((s, x) => s + x.slots.length, 0);
  const covered = slotsOf.reduce((s, x) => s + x.slots.filter((a) => a !== "missing").length, 0);
  const brandMissing = slotsOf.find((x) => x.r.authenticity === "brand_fixed" && x.slots.includes("missing"));
  const reqOf = (x: (typeof slotsOf)[number]) => (x.cover?.choice === "request" ? o.requests[x.r.id] : undefined);
  const drafted = slotsOf.find((x) => x.slots.includes("missing") && x.cover?.choice === "request" && (!reqOf(x) || requestStatus(reqOf(x)!) === "drafted"));
  const requested = slotsOf.find((x) => x.slots.includes("missing") && x.cover?.choice === "request" && reqOf(x) && requestStatus(reqOf(x)!) === "sent");
  const inReview = slotsOf.find((x) => reqOf(x) && requestStatus(reqOf(x)!) === "in_review");
  const missing = slotsOf.find((x) => x.slots.includes("missing") && !x.cover);
  // V1 prepares nothing for real: a chosen path makes the asset exist and wait for approval (no generation job runs)
  const creativeApproved = (o.approvalsGiven[m.id] ?? []).includes("new_creative");
  const awaiting = slotsOf.reduce((s, x) => s + x.slots.filter((a) => a === "awaiting_approval").length, 0);
  const count = total ? ` · ${covered} מתוך ${total}` : "";
  const badCreative = (b.creatives ?? []).find((c) => creativeViolation(c));
  if (brandMissing) dims.creative = dim("blocked", `${brandMissing.r.title}: נכס מותג חסר בספרייה המאושרת`);
  else if (badCreative) dims.creative = dim("blocked", `${badCreative.label}: ${creativeViolation(badCreative)}`);
  else if (requested) dims.creative = dim("waiting", `${requested.r.title} · בקשה ללקוח נשלחה${count}`, "הלקוח");
  else if (drafted) dims.creative = dim("waiting", `${drafted.r.title} · הבקשה עוד לא נשלחה${count}`, i.approverName("operator"));
  else if (missing) dims.creative = dim("missing", `${missing.r.title}${count}`);
  else if (inReview) dims.creative = dim("waiting", `${inReview.r.title} · החומר התקבל, בבדיקה${count}`, i.approverName(inReview.r.approval));
  else if (awaiting > 0 && !creativeApproved) dims.creative = dim("waiting", `${awaiting} נכסים ממתינים לאישור${count}`, i.approverName(approverFor(policy, "new_creative")));
  else dims.creative = dim("ready", total ? `כל הנכסים מאושרים${count}` : "אין דרישות תוכן");
  // landing / destination
  dims.landing = b.destination.exists ? dim("ready", b.destination.label) : dim("missing", `${b.destination.label} — עוד לא קיים`);
  // tracking: V1 never verifies; a measurement agreement is a READY (manual) source, otherwise UNKNOWN = risk
  const trackingRisk = !m.measurementAgreement;
  dims.tracking = m.measurementAgreement
    ? dim("ready", `מדד ידני מוסכם: ${m.measurementAgreement}`)
    : b.tracking.missing.length
      ? dim("unknown", `לא נבדק (V1) · חסר: ${b.tracking.missing[0]}`)
      : dim("unknown", `לא נבדק (V1)${b.tracking.checked.length ? ` · מוצהר ידנית: ${b.tracking.checked.join(", ")}` : ""} · סיכון עד חיבור`);
  // approval: what the Client's policy requires, who gives each
  const reqd = requiredApprovals(m, b, policy, o, { planApproved: i.planApproved ?? true });
  const open = reqd.filter((a) => !a.given);
  const reviewDone = state === "ready_for_review" || state === "approved" || state === "live" || state === "paused" || state === "ended";
  const approver = open[0] ? i.approverName(open[0].by) : undefined;
  dims.approval = !open.length ? dim("ready", "כל האישורים ניתנו")
    : reviewDone ? dim("waiting", `${open.map((a) => `${APPROVAL_ACTION_WORD[a.action]} — ${i.approverName(a.by)}`).join(" · ")}`, approver)
    : dim("missing", `${open.length} אישורים נדרשים אחרי הבדיקה: ${open.map((a) => i.approverName(a.by)).filter((v, k, arr) => arr.indexOf(v) === k).join(", ")}`);

  // overall, first match wins; the next action is exactly one, the blockers at most two
  const blockers = (Object.keys(dims) as ReadinessDimension[]).filter((k) => dims[k].state === "blocked").map((k) => `${READINESS_DIM_WORD[k]}: ${dims[k].text}`).slice(0, 2);
  const nonApprovalReady = (Object.keys(dims) as ReadinessDimension[]).filter((k) => k !== "approval").every((k) => dims[k].state === "ready" || dims[k].state === "unknown");
  let overall: Readiness["overall"];
  let next: Readiness["next"];
  const operator = i.approverName("operator");
  if (blockers.length) { overall = "blocked"; next = { label: blockers[0], actor: operator }; }
  else if (requested) { overall = "waiting_client"; next = { label: `הלקוח מעלה: ${requested.r.title}`, actor: "הלקוח" }; }
  else if (dims.copy.state === "missing") { overall = "missing"; next = { label: "בחר כיוון מסר", actor: operator }; }
  else if (drafted) { overall = "waiting_decision"; next = { label: `שלח ללקוח ידנית: ${drafted.r.title}`, actor: operator }; }
  else if (dims.creative.state === "missing") { overall = "missing"; next = { label: `כסה: ${missing!.r.title}`, actor: operator }; }
  else if (dims.landing.state === "missing") { overall = "missing"; next = { label: `הכן את ${b.destination.label}`, actor: operator }; }
  else if (dims.targeting.state === "missing") { overall = "missing"; next = { label: "הגדר קהל", actor: operator }; }
  else if (dims.copy.state === "waiting") { overall = "waiting_decision"; next = { label: dims.copy.text, actor: operator }; }
  else if (inReview) { overall = "waiting_decision"; next = { label: `אשר את החומר שהתקבל: ${inReview.r.title}`, actor: dims.creative.actor! }; }
  else if (dims.creative.state === "waiting") { overall = reviewDone ? "waiting_approval" : "ready_for_review"; next = reviewDone ? { label: "אשר את הנכסים הממתינים", actor: dims.creative.actor! } : { label: "שלח לבדיקה", actor: operator }; }
  else if (!nonApprovalReady) { overall = "missing"; next = { label: "השלם את ההצעה", actor: operator }; }
  else if (dims.approval.state === "ready") { overall = "approved"; next = { label: "העלה בפלטפורמה וסמן \"פעיל\"", actor: operator }; }
  else if (reviewDone) { overall = "waiting_approval"; next = { label: `${APPROVAL_ACTION_WORD[open[0].action]} — ${approver}`, actor: approver! }; }
  else { overall = "ready_for_review"; next = { label: "שלח לבדיקה", actor: operator }; }
  return { dims, overall, ...(overall === "waiting_approval" ? { approver: approver ?? dims.creative.actor } : {}), next, blockers, trackingRisk };
}

/** Approval of a move with UNKNOWN tracking needs the risk acknowledged first (owner decision L13). */
export function approvalNeedsAck(r: Readiness, moveId: string, o: PlanOverlay): boolean {
  return r.trackingRisk && !o.trackingAck[moveId];
}

/* ---------- plan needs derived from readiness (spec §8) ---------- */

export const NEED_RESOLVER: Record<PlanNeed["kind"], string> = {
  coverage_gap: "תוכנית", no_measurement: "תוכנית", not_built: "שיווק", missing_content: "שיווק", client_material: "הלקוח", missing_tracking: "שיווק", missing_approval: "אישורים",
};

/** Build-level needs of one priority: derived, surfaced by the Plan, resolved elsewhere. */
export function derivedNeeds(pp: PriorityPlan, moves: Move[], reqs: ContentRequirement[], o: PlanOverlay, builders: BuilderProposal[]): PlanNeed[] {
  const out: PlanNeed[] = [];
  for (const m of movesOf(pp, moves)) {
    if (m.state === "planned") out.push({ id: `need-built-${m.id}`, priorityId: pp.priorityId, moveId: m.id, kind: "not_built", title: `${m.longName}: טרם נבנה`, detail: "מהלך מתוכנן ללא בנייה", resolver: NEED_RESOLVER.not_built });
    for (const r of reqs.filter((x) => x.moveId === m.id)) {
      const slots = requirementSlots(r, o, builders);
      if (!slots.includes("missing")) continue;
      const requested = o.requirements[r.id]?.choice === "request";
      const req = o.requests[r.id];
      const sent = !!req && (requestStatus(req) === "sent");
      out.push(requested && sent
        ? { id: `need-client-${r.id}`, priorityId: pp.priorityId, moveId: m.id, kind: "client_material", title: `ממתין ללקוח: ${r.title}${r.neededByDay ? ` · עד ${r.neededByDay}.10` : ""}`, detail: "בקשת חומר נשלחה ללקוח", resolver: NEED_RESOLVER.client_material }
        : requested
          ? { id: `need-client-${r.id}`, priorityId: pp.priorityId, moveId: m.id, kind: "client_material", title: `בקשה ללקוח עוד לא נשלחה: ${r.title}`, detail: "לשלוח ידנית ולסמן כנשלח", resolver: NEED_RESOLVER.missing_content }
          : { id: `need-content-${r.id}`, priorityId: pp.priorityId, moveId: m.id, kind: "missing_content", title: r.title, detail: r.spec, resolver: NEED_RESOLVER.missing_content });
    }
    if (m.state === "ready_for_review") out.push({ id: `need-approval-${m.id}`, priorityId: pp.priorityId, moveId: m.id, kind: "missing_approval", title: `אשר את ${m.longName}`, detail: "ההצעה נבדקה וממתינה לאישור", resolver: NEED_RESOLVER.missing_approval });
  }
  return out;
}

/* ---------- consistency guards (unit-tested) ---------- */

/** One move → one priority, and its goal is that priority's goal. */
export function movePriorityViolations(plan: Plan, moves: Move[]): string[] {
  const out: string[] = [];
  for (const m of moves) {
    const pp = plan.priorities.find((p) => p.priorityId === m.priorityId);
    if (!pp) out.push(`${m.id}: no priority`);
    else if (pp.goal.id !== m.goalId) out.push(`${m.id}: goal of another priority`);
    const listed = plan.priorities.filter((p) => p.moveIds.includes(m.id));
    if (listed.length > 1) out.push(`${m.id}: listed under ${listed.length} priorities`);
  }
  return out;
}

/** V1: a Plan period is a calendar month, and a priority sits in at most one active Plan at a time. */
export function periodViolations(plans: Plan[]): string[] {
  const out: string[] = [];
  for (const p of plans) if (p.period.kind !== "month" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(p.period.month)) out.push(`${p.id}: not a calendar month`);
  const active = plans.filter((p) => p.state !== "closed" && p.state !== "draft");
  const seen = new Map<string, string>();
  for (const p of active) for (const pp of p.priorities) {
    const key = `${pp.priorityId}@${p.period.month}`;
    if (seen.has(key)) out.push(`${pp.priorityId}: in two active plans for ${p.period.month}`);
    seen.set(key, p.id);
  }
  return out;
}
