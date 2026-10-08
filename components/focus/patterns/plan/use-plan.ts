"use client";

import { useCallback, useMemo } from "react";
import type { ApprovalAction, ApproverKind, AssetAvailability, ContentRequirement, CoverOption, DayItem, DayItemStatus, Move, MoveState, Readiness, RefineKey } from "@/lib/focus/contracts/plan";
import {
  BUILDERS, CLIENT_APPROVAL_POLICY, DAY_ITEMS, MOVES, PLAN_MONTH_DAYS, PLAN_OCTOBER, PLAN_TODAY, PRIORITIES, PROPOSED_MOVES, RECOMMENDATIONS, REQUIREMENTS,
} from "@/lib/focus/fixtures/plan";
import { CLIENTS, PEOPLE_BY_ID } from "@/lib/focus/fixtures/people";
import { R } from "@/lib/focus/routes";
import {
  buildClientRequest, canTransition, clientRequestText, dayItemsView, moveState, planBudget, planMoves, readOverlay, readiness,
  type BuilderEdits, type PlanFixtures, type PlanOverlay, type Routes,
} from "@/lib/focus/state/plan";
import { useDemo } from "@/components/focus/shell/demo-store";

/**
 * The Plan's demo session: fixtures (the Plan as stored) + what the person changed here (decisions, builder edits,
 * copy direction, approvals, client requests), kept in the demo store's session drafts like every other Focus screen.
 * Nothing is sent anywhere: no platform, no Drive, no database, no message to a client.
 */
const KEY = "plan-v1";

export const PLAN_FIXTURES: PlanFixtures = { plan: PLAN_OCTOBER, moves: MOVES, proposed: PROPOSED_MOVES, recs: RECOMMENDATIONS, requirements: REQUIREMENTS, builders: BUILDERS };

export const PLAN_ROUTES: Routes = {
  builder: R.planBuilder,
  createMove: (needId) => R.planCreateMove(needId),
  // V1: a goal's measurement source is set by hand in the Plan (the priority's drill-down), never "connected" from here
  measurement: (priorityId) => `${R.plan}#pri-${priorityId}`,
  requirement: (id) => `${R.planAssets}?req=${encodeURIComponent(id)}`,
};

/** The approver's name for a kind, from the Client's policy (רון = the client's owner, דנה = the operator). */
export const approverName = (kind: ApproverKind) => PEOPLE_BY_ID[CLIENT_APPROVAL_POLICY.approvers[kind]]?.name ?? (kind === "client" ? "הלקוח" : "מנהל/ת השיווק");

export function usePlan() {
  const demo = useDemo();
  const overlay = readOverlay(demo.state.drafts[KEY]);
  const update = useCallback((fn: (o: PlanOverlay) => PlanOverlay) => demo.updateDraft<PlanOverlay>(KEY, (prev) => fn(readOverlay(prev))), [demo]);
  const moves = useMemo(() => planMoves(PLAN_FIXTURES, overlay), [overlay]);
  const budget = useMemo(() => planBudget(PLAN_FIXTURES, overlay, moves, PLAN_TODAY, PLAN_MONTH_DAYS), [overlay, moves]);
  const dayItems = useMemo(() => dayItemsView(DAY_ITEMS, overlay), [overlay]);

  /** Campaign readiness of a move that has a builder (derived; never stored, never a lifecycle state). */
  const readinessOf = useCallback((m: Move): Readiness | null => {
    const b = m.builderId ? BUILDERS.find((x) => x.id === m.builderId) : undefined;
    if (!b) return null;
    return readiness({ move: m, builder: b, state: m.state, requirements: REQUIREMENTS, overlay, builders: BUILDERS, policy: CLIENT_APPROVAL_POLICY, approverName, unallocated: budget.unallocated });
  }, [overlay, budget.unallocated]);

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
    /** how a content requirement is covered; an upload from the computer arrives under "use existing" */
    coverRequirement: (id: string, choice: CoverOption, extra: { taskId?: string; assetId?: string } = {}) =>
      update((o) => ({ ...o, requirements: { ...o.requirements, [id]: { choice, ...extra } } })),
    clearRequirement: (id: string) => update((o) => { const r = { ...o.requirements }; delete r[id]; const q = { ...o.requests }; delete q[id]; return { ...o, requirements: r, requests: q }; }),
    /* ---- copy: three Move Message Directions ---- */
    chooseDirection: (builderId: string, directionId: string) =>
      update((o) => ({ ...o, copy: { ...o.copy, [builderId]: { set: o.copy[builderId]?.set ?? "main", directionId, refinements: [], combined: [] } } })),
    toggleRefine: (builderId: string, key: RefineKey) =>
      update((o) => { const c = o.copy[builderId] ?? { set: "main" as const, refinements: [] }; const has = c.refinements.includes(key); return { ...o, copy: { ...o.copy, [builderId]: { ...c, refinements: has ? c.refinements.filter((k) => k !== key) : [...c.refinements, key] } } }; }),
    /** "3 כיוונים חדשים": show the alternatives (the choice is cleared — a direction is chosen again) */
    askNewDirections: (builderId: string) =>
      update((o) => { const c = o.copy[builderId]; return { ...o, copy: { ...o.copy, [builderId]: { set: c?.set === "alt" ? "main" : "alt", refinements: [], combined: [] } } }; }),
    combineInto: (builderId: string, part: string) =>
      update((o) => { const c = o.copy[builderId]; if (!c?.directionId) return o; const combined = c.combined ?? []; return { ...o, copy: { ...o.copy, [builderId]: { ...c, combined: combined.includes(part) ? combined.filter((p) => p !== part) : [...combined, part] } } }; }),
    /* ---- approvals (per the Client's policy) and the UNKNOWN-tracking acknowledgment ---- */
    giveApproval: (moveId: string, action: ApprovalAction) =>
      update((o) => { const given = o.approvalsGiven[moveId] ?? []; return given.includes(action) ? o : { ...o, approvalsGiven: { ...o.approvalsGiven, [moveId]: [...given, action] } }; }),
    ackTracking: (moveId: string) => update((o) => ({ ...o, trackingAck: { ...o.trackingAck, [moveId]: true } })),
    /* ---- client material request: structured, one per requirement, a Work task, manual sending ---- */
    createClientRequest: (req: ContentRequirement) => {
      const existing = overlay.requests[req.id];
      if (existing) return existing;
      const move = [...MOVES, ...PROPOSED_MOVES].find((m) => m.id === req.moveId)!;
      const priority = PRIORITIES.find((p) => p.id === req.priorityId)!;
      const b = move.builderId ? BUILDERS.find((x) => x.id === move.builderId) : undefined;
      const draft = buildClientRequest(req, move, priority, "", b?.launchDay ?? move.startDay);
      const due = Math.max(PLAN_TODAY + 1, draft.neededByDay - 3);
      const task = demo.createTask({
        title: `בקשה מהלקוח: ${req.title}`, dueDate: `2026-10-${String(due).padStart(2, "0")}`, priority: "high", assigneeId: move.ownerId,
        context: { client: CLIENTS.umino.name }, notes: clientRequestText(draft), nextAction: "לשלוח ללקוח ידנית (WhatsApp / מייל) ולסמן כנשלח",
      });
      const request = { ...draft, taskId: task.id };
      update((o) => ({ ...o, requests: { ...o.requests, [req.id]: request }, requirements: { ...o.requirements, [req.id]: { choice: "request", taskId: task.id } } }));
      return request;
    },
    markRequestSent: (requirementId: string) =>
      update((o) => { const r = o.requests[requirementId]; return r ? { ...o, requests: { ...o.requests, [requirementId]: { ...r, sentAt: "2026-10-07" } } } : o; }),
    /* ---- timeline / budget / plan (unchanged) ---- */
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
  }), [overlay, update, demo]);

  return { f: PLAN_FIXTURES, policy: CLIENT_APPROVAL_POLICY, approverName, overlay, moves, budget, dayItems, readinessOf, today: PLAN_TODAY, monthDays: PLAN_MONTH_DAYS, hydrated: demo.hydrated, demo, ...actions };
}

export type PlanApi = ReturnType<typeof usePlan>;
