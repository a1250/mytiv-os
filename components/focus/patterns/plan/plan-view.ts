import type { BuilderProposal, ContentRequirement, Move, PriorityPlan } from "@/lib/focus/contracts/plan";
import { PLAN_WEEK, PRIORITIES, TIMELINE } from "@/lib/focus/fixtures/plan";
import { fmtMoney, formatNumber } from "@/lib/focus/format";
import { countSlots, inWeek, requirementSlots, type PlanOverlay } from "@/lib/focus/state/plan";

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
 * The overview's "missing / awaiting" cell for a move — the most useful single line, derived (never stale):
 * creatives awaiting approval › waiting for the owner › a missing asset › not built yet › optimization in progress.
 */
export function moveNote(m: Move, o: PlanOverlay, builders: BuilderProposal[], reqs: ContentRequirement[]): { text: string; tone: "amber" | "muted" | "none" } {
  const awaiting = awaitingCreatives(m, o, builders);
  if (awaiting > 0 && (m.state === "building" || m.state === "planned")) return { text: `${awaiting} קריאייטיבים ממתינים לאישור`, tone: "amber" };
  if (m.state === "waiting_approval") return { text: "ממתין לאישורך", tone: "amber" };
  const missing = reqs.find((r) => r.moveId === m.id && countSlots(requirementSlots(r, o, builders)).missing > 0);
  if (missing) return { text: m.overviewNote ?? missing.title, tone: "amber" };
  if (m.state === "planned") return { text: "טרם נבנה", tone: "muted" };
  if (m.state === "building") return { text: "בבנייה", tone: "muted" };
  if (m.state === "approved") return { text: "מוכן להשקה ידנית", tone: "muted" };
  if (m.optimizing) return { text: "שינוי בביצוע", tone: "muted" };
  return { text: "—", tone: "none" };
}

/** Moves with something happening this week (the "השבוע" filter): items in 4–10.10 other than continuous bars. */
export function weekMoveIds(moves: Move[]): Set<string> {
  const ids = new Set<string>();
  for (const it of TIMELINE) if (it.kind !== "live" && it.kind !== "planned" && it.kind !== "waiting_flight" && inWeek(it, PLAN_WEEK)) ids.add(it.moveId);
  for (const m of moves) if (m.state === "waiting_approval" || m.state === "building") ids.add(m.id);
  return ids;
}

/** "9.10" for a day of October. */
export const dayLabel = (d: number) => `${d}.10`;
