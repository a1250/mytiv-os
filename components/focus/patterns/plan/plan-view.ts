import type { DayItem, BuilderProposal, ContentRequirement, Move, PriorityPlan, Readiness } from "@/lib/focus/contracts/plan";
import { DAY_ITEMS, PLAN_WEEK, PRIORITIES, TIMELINE } from "@/lib/focus/fixtures/plan";
import { fmtMoney, formatNumber } from "@/lib/focus/format";
import { READINESS_OVERALL_WORD, countSlots, inWeek, requirementSlots, type PlanOverlay } from "@/lib/focus/state/plan";

/** View helpers shared by the Plan screens (pure — derived from fixtures + the session overlay). */

export const priorityOf = (id: string) => PRIORITIES.find((p) => p.id === id)!;

const UNIT_SHORT: Record<string, string> = { qualified_leads: "לידים", bookings: "הזמנות", orders: "הזמנות", clients: "לקוחות" };
/** "18 לידים" · "180 הזמנות" · "30,000 ₪" */
export function expectedText(pp: PriorityPlan, n: number) {
  return pp.goal.unit === "ils" ? fmtMoney(n) : `${formatNumber(n)} ${UNIT_SHORT[pp.goal.unit] ?? ""}`.trim();
}

export function awaitingCreatives(m: Move, o: PlanOverlay, builders: BuilderProposal[]) {
  const b = m.builderId ? builders.find((x) => x.id === m.builderId) : undefined;
  return (b?.creatives ?? []).filter((c) => (o.creatives[c.id] ?? c.availability) === "awaiting_approval").length;
}

/**
 * The overview's "missing / awaiting" cell for a move — the most useful single line, derived (never stale). A move with
 * a builder reads its readiness (overall status + the one next action, naming the approver when it waits for one);
 * other moves fall back to: a missing asset › not built yet › optimization in progress.
 */
export function moveNote(m: Move, o: PlanOverlay, builders: BuilderProposal[], reqs: ContentRequirement[], r?: Readiness | null): { text: string; tone: "amber" | "muted" | "none" } {
  if (r && m.state !== "live" && m.state !== "paused" && m.state !== "ended") {
    if (r.overall === "waiting_approval") return { text: `ממתין לאישור · ${r.approver ?? ""}`.trim(), tone: "amber" };
    if (r.overall === "approved") return { text: "אושר · מוכן להשקה ידנית", tone: "muted" };
    if (r.overall === "ready_for_review") return { text: m.state === "ready_for_review" ? "נבדק · ממתין לאישור" : "מוכן לבדיקה", tone: "amber" };
    return { text: `${READINESS_OVERALL_WORD[r.overall]} · ${r.next.label}`, tone: "amber" };
  }
  const awaiting = awaitingCreatives(m, o, builders);
  if (awaiting > 0 && (m.state === "building" || m.state === "planned")) return { text: `${awaiting} קריאייטיבים ממתינים לאישור`, tone: "amber" };
  if (m.state === "ready_for_review") return { text: "נבדק · ממתין לאישור", tone: "amber" };
  const missing = reqs.find((r) => r.moveId === m.id && countSlots(requirementSlots(r, o, builders)).missing > 0);
  if (missing) return { text: m.overviewNote ?? missing.title, tone: "amber" };
  if (m.state === "planned") return { text: "טרם נבנה", tone: "muted" };
  if (m.state === "building") return { text: "בבנייה", tone: "muted" };
  if (m.state === "approved") return { text: "אושר · מוכן להשקה ידנית", tone: "muted" };
  if (m.optimizing) return { text: "שינוי בביצוע", tone: "muted" };
  return { text: "—", tone: "none" };
}

/** Moves with something happening this week (the "השבוע" filter): items in 4–10.10 other than continuous bars. */
export function weekMoveIds(moves: Move[], dayItems: DayItem[] = DAY_ITEMS): Set<string> {
  const ids = new Set<string>();
  for (const it of TIMELINE) if ((it.kind === "build" || it.kind === "review") && inWeek(it, PLAN_WEEK)) ids.add(it.moveId);
  for (const it of dayItems) if (it.moveId && it.day >= PLAN_WEEK.from && it.day <= PLAN_WEEK.to) ids.add(it.moveId);
  for (const m of moves) if (m.state === "ready_for_review" || m.state === "building") ids.add(m.id);
  return ids;
}

/** "9.10" for a day of October. */
export const dayLabel = (d: number) => `${d}.10`;
