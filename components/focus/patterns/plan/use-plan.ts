"use client";

import { useCallback, useMemo } from "react";
import type { AssetAvailability, CoverOption, DayItem, DayItemStatus, MoveState } from "@/lib/focus/contracts/plan";
import {
  BUILDERS, DAY_ITEMS, MOVES, PLAN_MONTH_DAYS, PLAN_OCTOBER, PLAN_TODAY, PROPOSED_MOVES, RECOMMENDATIONS, REQUIREMENTS,
} from "@/lib/focus/fixtures/plan";
import { R } from "@/lib/focus/routes";
import {
  canTransition, dayItemsView, moveState, planBudget, planMoves, readOverlay, type BuilderEdits, type PlanFixtures, type PlanOverlay, type Routes,
} from "@/lib/focus/state/plan";
import { useDemo } from "@/components/focus/shell/demo-store";

/**
 * The Plan's demo session: fixtures (the Plan as stored) + what the person changed here (decisions, builder edits,
 * approvals), kept in the demo store's session drafts like every other Focus screen. Nothing is sent anywhere:
 * no platform, no Drive, no database.
 */
const KEY = "plan-v1";

export const PLAN_FIXTURES: PlanFixtures = { plan: PLAN_OCTOBER, moves: MOVES, proposed: PROPOSED_MOVES, recs: RECOMMENDATIONS, requirements: REQUIREMENTS, builders: BUILDERS };

export const PLAN_ROUTES: Routes = {
  builder: R.planBuilder,
  createMove: (needId) => R.planCreateMove(needId),
  connections: R.settings,
  requirement: (id) => `${R.planAssets}?req=${encodeURIComponent(id)}`,
};

export function usePlan() {
  const demo = useDemo();
  const overlay = readOverlay(demo.state.drafts[KEY]);
  const update = useCallback((fn: (o: PlanOverlay) => PlanOverlay) => demo.updateDraft<PlanOverlay>(KEY, (prev) => fn(readOverlay(prev))), [demo]);
  const moves = useMemo(() => planMoves(PLAN_FIXTURES, overlay), [overlay]);
  const budget = useMemo(() => planBudget(PLAN_FIXTURES, overlay, moves, PLAN_TODAY, PLAN_MONTH_DAYS), [overlay, moves]);
  const dayItems = useMemo(() => dayItemsView(DAY_ITEMS, overlay), [overlay]);

  const actions = useMemo(() => ({
    /** a lifecycle step — refused (false) unless it is a legal transition */
    setMoveState: (moveId: string, to: MoveState): boolean => {
      const m = [...MOVES, ...PROPOSED_MOVES].find((x) => x.id === moveId);
      if (!m) return false;
      const from = moveState(m, overlay);
      if (!canTransition(from, to)) return false;
      update((o) => ({ ...o, moveStates: { ...o.moveStates, [moveId]: to } }));
      return true;
    },
    markLive: (moveId: string, link: string) => update((o) => ({ ...o, moveStates: { ...o.moveStates, [moveId]: "live" }, launchLinks: { ...o.launchLinks, [moveId]: link } })),
    setCreative: (id: string, a: AssetAvailability) => update((o) => ({ ...o, creatives: { ...o.creatives, [id]: a } })),
    decideRec: (id: string, decision: "accepted" | "dismissed", extra: { reason?: string; taskIds?: string[] } = {}) =>
      update((o) => ({ ...o, recs: { ...o.recs, [id]: { decision, ...extra } } })),
    editBuilder: (id: string, patch: BuilderEdits) => update((o) => ({ ...o, builders: { ...o.builders, [id]: { ...o.builders[id], ...patch, decisions: { ...o.builders[id]?.decisions, ...patch.decisions } } } })),
    coverRequirement: (id: string, choice: CoverOption, extra: { taskId?: string; assetId?: string } = {}) =>
      update((o) => ({ ...o, requirements: { ...o.requirements, [id]: { choice, ...extra } } })),
    clearRequirement: (id: string) => update((o) => { const r = { ...o.requirements }; delete r[id]; return { ...o, requirements: r }; }),
    reschedule: (itemId: string, startDay: number, endDay: number) => update((o) => ({ ...o, reschedules: { ...o.reschedules, [itemId]: { startDay, endDay } } })),
    requestReschedule: (itemId: string, day: number) => update((o) => ({ ...o, rescheduleRequests: { ...o.rescheduleRequests, [itemId]: day } })),
    /** place a new content / execution item on an exact day (browser session only) */
    addDayItem: (item: Omit<DayItem, "id" | "added">): DayItem => {
      const created: DayItem = { ...item, id: `di-u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, added: true };
      update((o) => ({ ...o, dayItems: [...o.dayItems, created] }));
      return created;
    },
    moveDayItem: (id: string, day: number) => update((o) => ({ ...o, dayMoves: { ...o.dayMoves, [id]: day } })),
    setDayStatus: (id: string, status: DayItemStatus) => update((o) => ({ ...o, dayStatus: { ...o.dayStatus, [id]: status } })),
    enterSpend: (moveId: string, amount: number, at: string) => update((o) => ({ ...o, manualSpend: { ...o.manualSpend, [moveId]: { amount, at } } })),
    addPriority: (name: string, description: string) => update((o) => ({ ...o, proposedPriorities: [...o.proposedPriorities, { id: `pp-${o.proposedPriorities.length + 1}`, name, description }] })),
    copyPeriod: (month: string) => update((o) => ({ ...o, copiedPeriods: o.copiedPeriods.includes(month) ? o.copiedPeriods : [...o.copiedPeriods, month] })),
  }), [overlay, update]);

  return { f: PLAN_FIXTURES, overlay, moves, budget, dayItems, today: PLAN_TODAY, monthDays: PLAN_MONTH_DAYS, hydrated: demo.hydrated, demo, ...actions };
}

export type PlanApi = ReturnType<typeof usePlan>;
