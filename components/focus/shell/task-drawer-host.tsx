"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useFocusRouter } from "@/components/focus/ui/link";
import { useEffect, useState } from "react";
import type { Task, TaskPatch } from "@/lib/focus/contracts/work";
import { PEOPLE_BY_ID } from "@/lib/focus/fixtures/people";
import { CAPABILITIES } from "@/lib/focus/fixtures/work";
import { WORK } from "@/components/focus/ui/status";
import { Button } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { useToast } from "@/components/focus/ui/toast";
import { elapsedOf } from "@/lib/focus/state/work";
import { useIsDemo } from "./scope";
import { TaskDrawerBody, TaskDrawerHead } from "@/components/focus/patterns/work/task-drawer";
import { useDemo, useTicker } from "./demo-store";

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
  const taskId = params.get("task") ?? defaultTaskId ?? null;
  const task = demo.state.tasks.find((t) => t.id === taskId) ?? null;
  const [base, setBase] = useState<{ id: string; version: number } | null>(null);
  const [conflict, setConflict] = useState<{ theirs: Task; mine: TaskPatch; by: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const now = useTicker(!!demo.state.timer?.running && demo.state.timer.taskId === taskId, 1000);

  // capture the version the drawer "loaded" when it opens on a task (a later remote edit is then detectable) —
  // derived state updated during render (React's "storing information from previous renders" pattern)
  if (task && base?.id !== task.id) { setBase({ id: task.id, version: task.version }); setConflict(null); }

  const close = (force = false) => {
    if (dirty && !force) { setConfirmClose(true); return; }
    setConfirmClose(false); setDirty(false); setBase(null); setConflict(null);
    const q = new URLSearchParams(params.toString()); q.delete("task");
    router.replace(q.size ? `${path}?${q}` : path, { scroll: false });
  };

  // warn before leaving the page with an unsaved draft
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  if (!task || !base) return null;
  const version = base.version;

  const onPatch = (patch: TaskPatch, expected: number) => {
    const r = demo.patchTask(task.id, patch, expected);
    if (r.ok) {
      setBase({ id: task.id, version: r.task.version });
      if (patch.status || patch.assigneeId !== undefined) {
        const prev = r.previous!;
        toast.push({
          title: patch.status ? `סטטוס: ${WORK[patch.status].word}` : `אחראי: ${patch.assigneeId ? PEOPLE_BY_ID[patch.assigneeId]?.name : "ללא"}`,
          detail: task.source === "clickup" ? "ClickUp הוא מקור האמת — השינוי יסונכרן לשם (בדמו: נשמר כאן)." : "נשמר.",
          undo: { onUndo: () => { demo.restoreTask({ ...prev, version: r.task.version + 1 }); setBase({ id: task.id, version: r.task.version + 1 }); } },
        });
      }
      return { ok: true as const };
    }
    if ("conflict" in r) {
      setConflict({ theirs: r.conflict, mine: patch, by: "דנה" });
      return { ok: false as const, conflict: r.conflict };
    }
    return { ok: false as const, refused: r.refused };
  };

  const timer = demo.state.timer;
  return (
    <Dialog open onClose={() => close()} variant="drawer" labelledBy="task-title" className="f-tdrawer">
      <TaskDrawerHead task={task} onClose={() => close()} />
      {confirmClose && (
        <div className="f-td__confirm" role="alertdialog" aria-label="יש טיוטה שלא נשמרה">
          <b>יש טקסט שלא נשמר (תגובה, תת־משימה או זמן).</b>
          <div className="f-td__confirmactions">
            <Button variant="neutral" size="sm" onClick={() => setConfirmClose(false)}>חזור לעריכה</Button>
            <Button variant="secondary" size="sm" onClick={() => close(true)}>סגור בלי לשמור</Button>
          </div>
        </div>
      )}
      <TaskDrawerBody
        task={task}
        all={demo.state.tasks}
        now={demo.now}
        role={demo.state.role}
        caps={CAPABILITIES[task.source]}
        baseVersion={version}
        viewerId={demo.viewer.id}
        onPatch={onPatch}
        conflict={conflict}
        onResolveConflict={(keep) => {
          const theirs = demo.state.tasks.find((t) => t.id === task.id)!;
          if (keep === "mine" && conflict) {
            const r = demo.patchTask(task.id, conflict.mine, theirs.version);
            if (r.ok) setBase({ id: task.id, version: r.task.version });
          } else setBase({ id: task.id, version: theirs.version });
          setConflict(null);
        }}
        timer={{
          active: timer, elapsedMs: timer ? elapsedOf(timer, now) : 0,
          onStart: () => { const r = demo.timerStart(task.id); if (r?.conflict && r.logged) toast.push({ title: `טיימר עבר ל"${task.title}"`, detail: `הטיימר הקודם נעצר ונרשמו ${r.logged.minutes} דק׳.` }); },
          onPause: demo.timerPause, onStop: () => { const r = demo.timerStop(); if (r) toast.push({ title: `נרשמו ${r.minutes} דק׳`, detail: r.task?.title, undo: { onUndo: () => demo.timerRestore({ ...r.stopped, running: false, elapsedMs: elapsedOf(r.stopped, Date.now()) }, r.task, r.entry?.id) } }); },
        }}
        entries={demo.state.timeEntries}
        onLogTime={(m) => { const r = demo.logTime(task.id, m); toast.push({ title: `נרשמו ${m} דק׳ ידנית`, detail: task.title, undo: { onUndo: () => { demo.removeTimeEntry(r.entry.id); if (r.previous) demo.restoreTask(r.previous); } } }); }}
        onDuplicate={() => {
          // a copy starts fresh: open, unblocked (no block reason without a waiting status), no history
          const { blockedReason: _blocked, ...rest } = task;
          void _blocked;
          const copy = demo.createTask({ ...rest, id: `t-copy-${Date.now()}`, title: `${task.title} (עותק)`, status: "todo", comments: [], activity: [], version: 1, dependsOn: [], spentMinutes: 0 });
          toast.push({ title: "נוצר עותק", detail: copy.title, undo: { onUndo: () => demo.removeTask(copy.id) } });
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
