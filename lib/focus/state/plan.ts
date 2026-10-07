import type {
  AssetAvailability, BuilderProposal, ContentRequirement, CoverOption, DecisionKey, Move, MoveState, Plan, PlanNeed, PriorityPlan,
  ProductionRow, Recommendation, RecommendationRoute, TimelineItem,
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
  /** timeline items whose move was asked for (live / approval-gated): the request waits for approval */
  rescheduleRequests: Record<string, number>;
  /** spend typed in by hand where the channel reports nothing (V1) — replaces "unknown" with a known, dated value */
  manualSpend: Record<string, { amount: number; at: string }>;
  /** priorities proposed in this session ("+ נושא לקידום") — proposed, not active */
  proposedPriorities: { id: string; name: string; description: string }[];
  /** a draft plan for a next period, copied from the current one */
  copiedPeriods: string[];
};

export const EMPTY_OVERLAY: PlanOverlay = {
  moveStates: {}, launchLinks: {}, creatives: {}, recs: {}, builders: {}, requirements: {}, reschedules: {}, rescheduleRequests: {},
  manualSpend: {}, proposedPriorities: [], copiedPeriods: [],
};

/** Read the overlay defensively (session storage may hold an older shape). */
export function readOverlay(v: unknown): PlanOverlay {
  const o = (v && typeof v === "object" ? v : {}) as Partial<PlanOverlay>;
  return { ...EMPTY_OVERLAY, ...o } as PlanOverlay;
}

/* ---------- lifecycle ---------- */

/** The lifecycle states in order. "Needs attention" and "optimization in progress" are overlays, never states. */
export const LIFECYCLE: readonly MoveState[] = ["idea", "planned", "building", "waiting_approval", "approved", "live", "paused", "ended"];

/** In the Plan = everything except an idea (not yet in the Plan) and nothing else. */
export const inPlan = (s: MoveState) => s !== "idea";

/** A move counts toward planned coverage from "planned" to "live"/"paused"; an ended move's contribution is history. */
export const countsTowardCoverage = (s: MoveState) => s !== "idea" && s !== "ended";

/** The legal next states a person can move a move to in this prototype (V1: launch is manual). */
export function canTransition(from: MoveState, to: MoveState): boolean {
  const next: Record<MoveState, MoveState[]> = {
    idea: ["planned", "building"],
    planned: ["building"],
    building: ["waiting_approval", "planned"],
    waiting_approval: ["approved", "building"],
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
  // a chosen way to cover a missing asset makes it exist (awaiting approval) — except a request to the client,
  // which only creates a task: the asset is still missing until it arrives
  if (cover && cover.choice !== "request") return req.slots.map((s) => (s === "missing" ? "awaiting_approval" : s));
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
  connections: string;
  requirement: (id: string) => string;
};

/** decision waiting › main blocker › nearest missing asset › next due task › "nothing needed" (fixed order). */
export function nextAction(pp: PriorityPlan, moves: Move[], reqs: ContentRequirement[], o: PlanOverlay, f: Pick<PlanFixtures, "builders">, routes: Routes): NextAction {
  const mine = movesOf(pp, moves);
  const trouble = pp.status === "at_risk" || pp.status === "off_track";
  // 1. a decision waiting for the owner: creatives awaiting approval in a move being built, or a move waiting approval
  for (const m of mine) {
    const b = m.builderId ? f.builders.find((x) => x.id === m.builderId) : undefined;
    if (m.state === "waiting_approval" && b) return { kind: "decision", label: `אשר את ${m.longName}`, href: routes.builder(b.id), emphasis: "primary" };
    const awaitingCreatives = (b?.creatives ?? []).filter((c) => (o.creatives[c.id] ?? c.availability) === "awaiting_approval");
    if (b && awaitingCreatives.length && (m.state === "building" || m.state === "planned")) {
      return { kind: "decision", label: `אשר את קריאייטיבי ${m.channelLabel}`, href: `${routes.builder(b.id)}#creative`, emphasis: "primary" };
    }
  }
  // 2. the main blocker: a plan need (coverage gap, no measurement source)
  for (const n of openNeeds(pp, moves)) {
    if (n.kind === "coverage_gap") return { kind: "blocker", label: `צור מהלך ל־${n.short} ${unitWord(pp)}`, href: routes.createMove(n.id), emphasis: trouble ? "primary" : "secondary" };
    return { kind: "blocker", label: "חבר מקור מדידה", href: routes.connections, emphasis: trouble ? "primary" : "secondary" };
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

/** A timeline item can be dragged only when it is not live and needs no approval to move. */
export function canReschedule(item: TimelineItem, state: MoveState): "move" | "approval" | "fixed" {
  if (item.kind === "post" && item.postState === "published") return "fixed";
  if (item.kind === "live" || item.kind === "optimization") return state === "live" ? "approval" : "fixed";
  if (state === "live" || state === "waiting_approval" || state === "approved" || item.kind === "approval" || item.kind === "launch" || item.kind === "waiting_flight") return "approval";
  return "move";
}

export const inWeek = (item: { startDay: number; endDay: number }, w: { from: number; to: number }) => item.startDay <= w.to && item.endDay >= w.from;

/**
 * The mobile agenda: changes only (launch, review, approval, post, send, build start/end); the moves live all week
 * collapse into one count (live moves, not bars — an organic series is live but drawn as post dots).
 */
export function agendaForWeek(items: TimelineItem[], w: { from: number; to: number }, today: number, liveMoves: number) {
  const days: Record<number, TimelineItem[]> = {};
  // the current week starts at today: what already happened this week is not an upcoming change
  const from = today >= w.from && today <= w.to ? today : w.from;
  const add = (d: number, it: TimelineItem) => { if (d >= from) (days[d] ??= []).push(it); };
  for (const it of items) {
    if (!inWeek(it, w) || it.kind === "live" || !it.agenda) continue;
    if (it.startDay === it.endDay) add(it.startDay, it);
    else if (it.startDay >= w.from) add(it.startDay, it);
    else if (today >= w.from && today <= w.to && it.endDay >= today) add(today, it); // a span running through today
  }
  return { days: Object.entries(days).map(([d, its]) => ({ day: Number(d), items: its })).sort((a, b) => a.day - b.day), liveAllWeek: liveMoves };
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

/** Can the builder be sent for approval? Blocked offers and unfinished edits stop it, with the reason in words. */
export function sendBlocked(b: BuilderProposal, state: MoveState): string | null {
  if (b.blocked) return `${b.blocked}. "שלח לאישור" לא זמין עד אימות.`;
  if (state !== "building") return state === "waiting_approval" ? "כבר נשלח לאישור" : "ההצעה לא בבנייה";
  return null;
}

export function isHttpsUrl(v: string): boolean {
  try { const u = new URL(v.trim()); return u.protocol === "https:" && !!u.hostname; } catch { return false; }
}

/* ---------- recommendations ---------- */

export const ROUTE_WORD: Record<RecommendationRoute, string> = {
  plan: "שינוי תוכנית · דורש אישור בעלים",
  marketing: "שינוי בביצוע המהלך · פעולת שיווק",
  work: "עבודה בלבד · נוצרות משימות",
};

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
