"use client";

import type { BoardColumn, Task, WriteResult } from "@/lib/focus/contracts/work";
import { CAPABILITIES } from "@/lib/focus/fixtures/work";
import { CAPABILITY_FOR, canComplete, canDo, type WorkAction } from "@/lib/focus/state/work";
import { jobStatus } from "@/lib/focus/state/jobs";
import { useToast } from "@/components/focus/ui/toast";
import { useDemo } from "./demo-store";
import { useIsDemo } from "./scope";

/**
 * Shared Mytiv Work actions for the screens (one implementation, not one per screen). Every write carries the token
 * the screen rendered; undo is a compensating write that is refused — with the reason — when the task changed since.
 */

const why = (r: WriteResult) => ("refused" in r ? r.refused : "המשימה עודכנה בינתיים על ידי מישהו אחר. רעננו ונסו שוב.");

/**
 * The gate for a write on a task: the viewer's role AND the task source's capability map (a capability that is not
 * live is refused; a planned one runs only in the fixture demo, and `planned` lets the toast say so). Every quick
 * action uses it, like the drawer does.
 */
export function useTaskGate() {
  const { state } = useDemo();
  const isDemo = useIsDemo();
  return (t: Task, action: WorkAction): { ok: boolean; planned?: string; refused?: string } => {
    const caps = CAPABILITIES[t.source];
    if (!canDo(state.role, action, caps, isDemo)) return { ok: false, refused: "אין הרשאה או שהפעולה לא זמינה למשימה הזו במקור שלה." };
    const cap = CAPABILITY_FOR[action];
    return { ok: true, planned: cap && caps[cap] === "planned" ? "יכולת מתוכננת — בהדגמה בלבד, לא במקור." : undefined };
  };
}

/** `onUndo` for a task write: back to `previous` only while the task is still at `token`; false = refused (and said why). */
export function useTaskUndo() {
  const demo = useDemo();
  const toast = useToast();
  return (previous: Task, token: string, alsoOnUndo?: () => string | void) => (): string | false => {
    const r = demo.undoTask(previous, token);
    if (r.ok) return alsoOnUndo?.() || "בוטל.";
    toast.push({ kind: "error", title: "הביטול לא בוצע", detail: why(r) });
    return false;
  };
}

/** `onUndo` for a create: removes the new task only while nobody changed it since (versioned, like every undo). */
export function useCreateUndo() {
  const demo = useDemo();
  const toast = useToast();
  return (t: Task) => (): string | false => {
    const r = demo.removeTask(t.id, t.version);
    if (r.ok) return "בוטל. המשימה הוסרה.";
    toast.push({ kind: "error", title: "הביטול לא בוצע", detail: r.refused });
    return false;
  };
}

/**
 * After undoing a write that goes to ClickUp: a sync still running is cancelled (nothing reached ClickUp); a sync
 * ClickUp already confirmed gets a revert sync — never "nothing changed" when the source already has the change.
 */
export function useRevertSync() {
  const demo = useDemo();
  return (taskId: string, href?: string): string | void => {
    const id = `sync-${taskId}`;
    const j = demo.getLatest().jobs.find((x) => x.id === id && !x.cancelledAt);
    if (!j) return;
    const st = jobStatus(j, Date.now());
    if (st.state === "running") { demo.cancelJob(id); return "בוטל לפני שהגיע ל־ClickUp."; }
    if (st.state === "done") {
      demo.startJob({ id, kind: "sync_clickup", label: "מחזיר את השינוי ב־ClickUp", detail: "", durationMs: 1500, outcome: "success", href });
      return "בוטל כאן · ההחזרה ב־ClickUp בדרך.";
    }
  };
}

/** Mark done / reopen from a list (gates: open dependency, open children, done parent), with undo. */
export function useToggleDone() {
  const demo = useDemo();
  const toast = useToast();
  const undo = useTaskUndo();
  const gate = useTaskGate();
  return (t: Task) => {
    const reopen = t.status === "done";
    const g0 = gate(t, "complete");
    if (!g0.ok) { toast.push({ kind: "error", title: reopen ? "לא ניתן לפתוח מחדש" : "לא ניתן לסמן כבוצע", detail: g0.refused }); return; }
    if (!reopen) { const g = canComplete(t, demo.state.tasks); if (!g.ok) { toast.push({ kind: "error", title: "לא ניתן לסמן כבוצע", detail: g.reason }); return; } }
    const r = demo.patchTask(t.id, { status: reopen ? "todo" : "done" }, t.version);
    if (!r.ok) { toast.push({ kind: "error", title: reopen ? "לא ניתן לפתוח מחדש" : "לא ניתן לסמן כבוצע", detail: why(r) }); return; }
    toast.push({ title: reopen ? "נפתח מחדש" : "סומן כבוצע", detail: g0.planned ? `${t.title} · ${g0.planned}` : t.title, undo: { onUndo: undo(r.previous!, r.task.version) } });
  };
}

/** Kanban move with the token the board rendered; refusals and conflicts are explained, the move can be undone. */
export function useBoardMove() {
  const demo = useDemo();
  const toast = useToast();
  const undo = useTaskUndo();
  const gate = useTaskGate();
  return (id: string, to: BoardColumn, token: string): { ok: boolean; reason?: string } => {
    const t = demo.state.tasks.find((x) => x.id === id);
    const g = t ? gate(t, "changeStatus") : { ok: false, refused: "המשימה לא נמצאה." };
    if (!g.ok) { toast.push({ kind: "error", title: "לא ניתן להזיז", detail: g.refused }); return { ok: false, reason: g.refused }; }
    const r = demo.moveTask(id, to, token);
    if (!r.ok) { const reason = why(r); toast.push({ kind: "error", title: "לא ניתן להזיז", detail: reason }); return { ok: false, reason }; }
    toast.push({ title: "הועבר", detail: g.planned ? `${r.task.title} · ${g.planned}` : r.task.title, undo: { onUndo: undo(r.previous!, r.task.version) } });
    return { ok: true };
  };
}
