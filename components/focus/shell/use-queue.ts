"use client";

import type { ActionItem } from "@/lib/focus/contracts/today";
import { APPROVAL_DUE, APPROVALS } from "@/lib/focus/fixtures/approvals";
import { demoIso } from "@/lib/focus/fixtures/clock";
import { columnFor, TODAY_QUEUE } from "@/lib/focus/fixtures/today";
import { fmtTime } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { canQuickApprove, queueOrder } from "@/lib/focus/state/approvals";
import { jobStatus } from "@/lib/focus/state/jobs";
import type { CardPhase } from "@/components/focus/patterns/action-card";
import { useToast } from "@/components/focus/ui/toast";
import { useDemo } from "./demo-store";

/**
 * The owner's decision queue, shared by "היום שלי", the approvals list and focus mode. Derives each card's phase from
 * the demo store (decision → processing job → done/failed) and implements quick-approve ("A", low risk only) with undo.
 * "Scheduled" appears only after the simulated Meta confirms (job settled) — never at click time.
 */
export const META_SCHEDULE_MS = 1800;

export function useQueue() {
  const demo = useDemo();
  const toast = useToast();
  const { state, approval } = demo;

  const undo = (approvalId: string) => {
    demo.cancelJob(`schedule-${approvalId}`);
    demo.undoDecision(approvalId);
    toast.push({ kind: "info", title: "ההחלטה בוטלה", detail: "הפריט חזר לתור. דבר לא פורסם." });
  };

  const scheduleWithMeta = (approvalId: string, withToast = true) => {
    const fail = state.failNext;
    if (fail) demo.setFailNext(false);
    demo.startJob({ id: `schedule-${approvalId}`, kind: "schedule_meta", label: "מבקש תזמון מ־Meta", detail: "", durationMs: META_SCHEDULE_MS, outcome: fail ? "failure" : "success", href: R.today });
    if (withToast) toast.push({ title: "האישור נשמר", detail: "מבקש תזמון מ־Meta. \"מתוזמן\" יוצג רק אחרי ש־Meta תאשר.", undo: { onUndo: () => undo(approvalId) } });
  };

  /** Quick approve — only for low risk without an external irreversible action. */
  const quickApprove = (approvalId: string) => {
    const a = approval(approvalId);
    if (!a || !canQuickApprove(a)) return;
    const r = demo.decide(approvalId, "approve", "");
    if (r.ok) scheduleWithMeta(approvalId);
  };

  const phaseOf = (item: ActionItem): CardPhase => {
    if (!item.approvalId) return { kind: "default" };
    const id = item.approvalId;
    const a = approval(id);
    if (!a || a.status === "pending") return { kind: "default" };
    const job = state.jobs.find((j) => j.id === `schedule-${id}`);
    if (job && !job.cancelledAt) {
      const st = jobStatus(job, state.clock);
      if (st.state === "running") return { kind: "working", label: "שומר ומבקש תזמון מ־Meta…" };
      if (st.state === "failed") return { kind: "failed", title: "התזמון לא בוצע", detail: "האישור נשמר. Meta לא זמינה כרגע.", onRetry: () => scheduleWithMeta(id, false) };
      return {
        kind: "done", title: "אושר ומתוזמן", detail: `Meta אישרה ב־${fmtTime(demoIso(st.at))}. הסטורי יעלה מחר ב־18:00.`,
        undo: { label: "בטל עד 18:00", onUndo: () => undo(id) },
      };
    }
    if (state.executions[id]?.step === "sent") return { kind: "done", title: "ההצעה נשלחה", detail: "Gmail אישר את השליחה." };
    const d = state.decisions[id];
    if (a.status === "approved") return { kind: "done", title: "אושר", detail: d?.reason ? `נימוק: ${d.reason}` : undefined, undo: a.impact.reversibility.kind !== "none" ? { label: "בטל", onUndo: () => undo(id) } : undefined };
    if (a.status === "changes_requested") return { kind: "done", title: "נשלח לתיקון", detail: d?.reason, undo: { label: "בטל", onUndo: () => undo(id) } };
    return { kind: "done", title: "נדחה", detail: d?.reason, undo: { label: "בטל", onUndo: () => undo(id) } };
  };

  const withDue = APPROVALS.map((a) => ({ ...approval(a.id)!, dueAt: APPROVAL_DUE[a.id] }));
  const ordered = queueOrder(withDue);
  const pending = ordered.filter((a) => a.status === "pending");

  const items = TODAY_QUEUE.map((item) => {
    const a = item.approvalId ? approval(item.approvalId) : undefined;
    return {
      item, column: columnFor(item.dueAt, demo.now), phase: phaseOf(item),
      quick: a && canQuickApprove(a) && a.status === "pending" ? () => quickApprove(a.id) : undefined,
    };
  });
  const handled = items.filter((x) => x.phase.kind === "done").length;

  return { items, handled, total: items.length, pending, ordered, quickApprove, scheduleWithMeta, undo, firstPending: pending[0]?.id ?? null };
}
