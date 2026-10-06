"use client";

import type { BoardColumn, Task, WriteResult } from "@/lib/focus/contracts/work";
import { canComplete } from "@/lib/focus/state/work";
import { useToast } from "@/components/focus/ui/toast";
import { useDemo } from "./demo-store";

/**
 * Shared Mytiv Work actions for the screens (one implementation, not one per screen). Every write carries the token
 * the screen rendered; undo is a compensating write that is refused — with the reason — when the task changed since.
 */

const why = (r: WriteResult) => ("refused" in r ? r.refused : "המשימה עודכנה בינתיים על ידי מישהו אחר. רעננו ונסו שוב.");

/** `onUndo` for a task write: back to `previous` only while the task is still at `token`. */
export function useTaskUndo() {
  const demo = useDemo();
  const toast = useToast();
  return (previous: Task, token: string, alsoOnUndo?: () => void) => () => {
    const r = demo.undoTask(previous, token);
    if (r.ok) alsoOnUndo?.();
    else toast.push({ kind: "error", title: "הביטול לא בוצע", detail: why(r) });
  };
}

/** Mark done / reopen from a list (gates: open dependency, open children, done parent), with undo. */
export function useToggleDone() {
  const demo = useDemo();
  const toast = useToast();
  const undo = useTaskUndo();
  return (t: Task) => {
    const reopen = t.status === "done";
    if (!reopen) { const g = canComplete(t, demo.state.tasks); if (!g.ok) { toast.push({ kind: "error", title: "לא ניתן לסמן כבוצע", detail: g.reason }); return; } }
    const r = demo.patchTask(t.id, { status: reopen ? "todo" : "done" }, t.version);
    if (!r.ok) { toast.push({ kind: "error", title: reopen ? "לא ניתן לפתוח מחדש" : "לא ניתן לסמן כבוצע", detail: why(r) }); return; }
    toast.push({ title: reopen ? "נפתח מחדש" : "סומן כבוצע", detail: t.title, undo: { onUndo: undo(r.previous!, r.task.version) } });
  };
}

/** Kanban move with the token the board rendered; refusals and conflicts are explained, the move can be undone. */
export function useBoardMove() {
  const demo = useDemo();
  const toast = useToast();
  const undo = useTaskUndo();
  return (id: string, to: BoardColumn, token: string): { ok: boolean; reason?: string } => {
    const r = demo.moveTask(id, to, token);
    if (!r.ok) { const reason = why(r); toast.push({ kind: "error", title: "לא ניתן להזיז", detail: reason }); return { ok: false, reason }; }
    toast.push({ title: "הועבר", detail: r.task.title, undo: { onUndo: undo(r.previous!, r.task.version) } });
    return { ok: true };
  };
}
