"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useFocusRouter } from "@/components/focus/ui/link";
import { useState } from "react";
import type { Task, TaskPatch } from "@/lib/focus/contracts/work";
import { PEOPLE_BY_ID } from "@/lib/focus/fixtures/people";
import { CAPABILITIES } from "@/lib/focus/fixtures/work";
import { WORK } from "@/components/focus/ui/status";
import { Button } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { useToast } from "@/components/focus/ui/toast";
import { elapsedOf, onlyOwnWrites } from "@/lib/focus/state/work";
import { useIsDemo } from "./scope";
import { useCreateUndo, useTaskUndo, useTimerStopUndo } from "./task-actions";
import { TaskDrawerBody, TaskDrawerHead } from "@/components/focus/patterns/work/task-drawer";
import { useDemo, useTicker } from "./demo-store";
import { useNavGuard } from "./nav-guard";

/**
 * Opens the TaskDrawer for `?task=<id>` on any Mytiv Work route, wires it to the demo store (patch with the version
 * the drawer last saw → conflict handling, timer, manual time, duplicate) and guards unsaved drafts on close.
 * Remove `?task` → closed. Deep links work (e.g. /focus/work/list?task=t-post45).
 */
export function TaskDrawerHost({ defaultTaskId }: { defaultTaskId?: string }) {
  const params = useSearchParams();
  const router = useFocusRouter();
  const path = usePathname();
  const demo = useDemo();
  const toast = useToast();
  const isDemo = useIsDemo();
  const undo = useTaskUndo();
  const undoCreate = useCreateUndo();
  const stopUndo = useTimerStopUndo();
  const taskId = params.get("task") ?? defaultTaskId ?? null;
  const task = demo.state.tasks.find((t) => t.id === taskId) ?? null;
  const [base, setBase] = useState<{ id: string; version: string } | null>(null);
  const [conflict, setConflict] = useState<{ theirs: Task; mine: TaskPatch; by: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const now = useTicker(!!demo.state.timer?.running && demo.state.timer.taskId === taskId, 1000);

  // capture the version the drawer "loaded" when it opens on a task (a later remote edit is then detectable) —
  // derived state updated during render (React's "storing information from previous renders" pattern)
  // (another task = a fresh drawer: no conflict, no draft, no pending close confirmation)
  if (task && base?.id !== task.id) { setBase({ id: task.id, version: task.version }); setConflict(null); setDirty(false); setConfirmClose(false); }
  // the viewer's own writes from elsewhere (timer, manual time, undo, list toggles) move the base with them — but only
  // when every write since the base was the viewer's; anyone else's write in between stays a conflict
  else if (task && base && !conflict && task.version !== base.version && onlyOwnWrites(demo.state.writes, task.id, base.version, task.version, demo.viewer.id)) setBase({ id: task.id, version: task.version });

  const close = (force = false) => {
    if (dirty && !force) { setConfirmClose(true); return; }
    setConfirmClose(false); setDirty(false); setBase(null); setConflict(null);
    const q = new URLSearchParams(params.toString()); q.delete("task");
    router.replace(q.size ? `${path}?${q}` : path, { scroll: false });
  };

  // unsaved changes: every way out asks first (links, search, Back, closing the tab) — see NavGuardProvider
  useNavGuard({ dirty: dirty, what: "יש טקסט שלא נשמר במשימה (תגובה, תת־משימה או זמן)." });

  if (!task || !base) return null;
  const version = base.version;

  const caps = CAPABILITIES[task.source];
  const writer = (t: Task) => (t.updatedBy && t.updatedBy !== "system" ? PEOPLE_BY_ID[t.updatedBy]?.name : undefined) ?? "משתמש אחר";
  const onPatch = (patch: TaskPatch, expected: string) => {
    const r = demo.patchTask(task.id, patch, expected);
    if (r.ok) {
      setBase({ id: task.id, version: r.task.version });
      if (patch.status || patch.assigneeId !== undefined || patch.block || patch.unblock) {
        const cap = patch.assigneeId !== undefined ? caps.assign : caps.changeStatus;
        toast.push({
          title: patch.block ? "סומן כחסום" : patch.unblock ? "החסימה הוסרה" : patch.status ? `סטטוס: ${WORK[patch.status].word}` : `אחראי: ${patch.assigneeId ? PEOPLE_BY_ID[patch.assigneeId]?.name : "ללא"}`,
          // honest about where it lives: a planned capability runs on the demo data only, never "saved" at the source
          detail: cap === "planned" ? "יכולת מתוכננת — נשמר בהדגמה בלבד, לא במקור." : task.source === "clickup" ? "ClickUp הוא מקור האמת — השינוי יסונכרן לשם (בדמו: נשמר כאן)." : "נשמר.",
          undo: { onUndo: undo(r.previous!, r.task.version) },
        });
      }
      return { ok: true as const };
    }
    if ("conflict" in r) {
      setConflict({ theirs: r.conflict, mine: patch, by: writer(r.conflict) });
      return { ok: false as const, conflict: r.conflict };
    }
    return { ok: false as const, refused: r.refused };
  };

  const timer = demo.state.timer;
  return (
    <Dialog open onClose={() => close()} variant="drawer" labelledBy="task-title" className="f-tdrawer">
      <TaskDrawerHead task={task} onClose={() => close()} />
      {confirmClose && (
        // focus moves into the question (its first, safe answer); the text is its description
        <div className="f-td__confirm" role="alertdialog" aria-label="יש טיוטה שלא נשמרה" aria-describedby="td-confirm-text">
          <b id="td-confirm-text">יש טקסט שלא נשמר (תגובה, תת־משימה או זמן).</b>
          <div className="f-td__confirmactions">
            <Button variant="neutral" size="sm" autoFocus onClick={() => { setConfirmClose(false); requestAnimationFrame(() => document.querySelector<HTMLElement>(".f-tdrawer .f-td__close")?.focus()); }}>חזור לעריכה</Button>
            <Button variant="secondary" size="sm" onClick={() => close(true)}>סגור בלי לשמור</Button>
          </div>
        </div>
      )}
      <TaskDrawerBody
        key={task.id}
        task={task}
        all={demo.state.tasks}
        now={demo.now}
        role={demo.state.role}
        caps={caps}
        allowPlanned={isDemo}
        baseVersion={version}
        viewerId={demo.viewer.id}
        onPatch={onPatch}
        conflict={conflict}
        onResolveConflict={(keep) => {
          const theirs = demo.state.tasks.find((t) => t.id === task.id)!;
          if (keep === "mine" && conflict) {
            const r = demo.patchTask(task.id, conflict.mine, theirs.version);
            if (r.ok) setBase({ id: task.id, version: r.task.version });
            else {
              // re-applying mine is refused by the rules on the newer version: say so, keep theirs
              setBase({ id: task.id, version: theirs.version });
              toast.push({ kind: "error", title: "השינוי שלך לא נשמר", detail: "refused" in r ? r.refused : "המשימה השתנתה שוב. פתחו אותה מחדש ונסו שוב." });
            }
          } else setBase({ id: task.id, version: theirs.version });
          setConflict(null);
        }}
        timer={{
          active: timer, elapsedMs: timer ? (demo.hydrated ? elapsedOf(timer, now) : timer.elapsedMs) : 0, // no clock math before hydration
          onStart: () => { const r = demo.timerStart(task.id); if (r?.conflict && r.logged) toast.push({ title: `טיימר עבר ל"${task.title}"`, detail: `הטיימר הקודם נעצר ונרשמו ${r.logged.minutes} דק׳.` }); },
          onPause: demo.timerPause, onStop: () => {
            const r = demo.timerStop();
            if (!r) return;
            if (r.minutes > 0 && !r.write?.ok) { toast.push({ kind: "error", title: "הטיימר נעצר, אבל הזמן לא נרשם", detail: r.write && "refused" in r.write ? r.write.refused : "המשימה עודכנה בינתיים." }); return; }
            toast.push({ title: r.minutes > 0 ? `נרשמו ${r.minutes} דק׳` : "הטיימר נעצר", detail: r.minutes > 0 ? `${r.task?.title ?? ""}${caps.trackTime === "planned" ? " · יכולת מתוכננת — בהדגמה בלבד" : ""}` : "פחות מחצי דקה — לא נרשם זמן.", undo: { onUndo: stopUndo(r) } });
          },
        }}
        entries={demo.state.timeEntries}
        onLogTime={(m) => {
          const r = demo.logTime(task.id, m);
          if (!r.result.ok || !r.entry) { toast.push({ kind: "error", title: "הזמן לא נרשם", detail: "refused" in r.result ? r.result.refused : "המשימה עודכנה בינתיים." }); return; }
          toast.push({ title: `נרשמו ${m} דק׳ ידנית`, detail: caps.trackTime === "planned" ? `${task.title} · יכולת מתוכננת — בהדגמה בלבד` : task.title, undo: { onUndo: undo(r.previous!, r.result.task.version, () => demo.removeTimeEntry(r.entry!.id)) } });
        }}
        onDuplicate={() => {
          // a copy starts fresh: open, unblocked, no history — and it is a local Mytiv task (creating at ClickUp is
          // not a live capability); a parent that is already done is not kept (createTask drops it)
          const { blockedReason: _blocked, statusKey: _key, version: _v, updatedBy: _by, ...rest } = task;
          void _blocked; void _key; void _v; void _by;
          const copy = demo.createTask({ ...rest, id: `t-copy-${Date.now()}`, title: `${task.title} (עותק)`, status: "todo", source: "mytiv", state: "live", comments: [], activity: [], dependsOn: [], spentMinutes: 0 });
          toast.push({ title: "נוצר עותק ב־Mytiv", detail: copy.title, undo: { onUndo: undoCreate(copy) } });
        }}
        onClose={() => close()}
        onDirtyChange={setDirty}
      />
      {isDemo && (
        <div className="f-td__demo">
          <button type="button" className="f-link" onClick={() => demo.simulateRemoteEdit(task.id, { assigneeId: task.assigneeId === "u-dana" ? "u-yoav" : "u-dana" })}>דמו: מישהו אחר עורך את המשימה עכשיו</button>
        </div>
      )}
    </Dialog>
  );
}
