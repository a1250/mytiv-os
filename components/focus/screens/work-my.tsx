"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { CLIENTS, PEOPLE } from "@/lib/focus/fixtures/people";
import { fmtLongDate } from "@/lib/focus/format";
import { bucketsFor, canDo, elapsedOf, openCount } from "@/lib/focus/state/work";
import { MyTasksView } from "@/components/focus/patterns/work/my-tasks";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { QuickCreate } from "@/components/focus/patterns/work/quick-create";
import { TaskBoard } from "@/components/focus/patterns/work/task-board";
import { TaskListView } from "@/components/focus/patterns/work/task-list";
import { useDemo, useTicker } from "@/components/focus/shell/demo-store";
import { useBoardMove, useToggleDone } from "@/components/focus/shell/task-actions";
import { TaskDrawerHost } from "@/components/focus/shell/task-drawer-host";
import { TimerBar } from "@/components/focus/shell/timer-bar";
import { Banner } from "@/components/focus/ui/feedback";
import { Tabs } from "@/components/focus/ui/tabs";
import { useToast } from "@/components/focus/ui/toast";
import { fmtDuration } from "@/lib/focus/format";

/**
 * "המשימות שלי" — Mytiv Work (handoff W1, mobile M9). One task set, three views of the SAME tasks (by time / list /
 * Kanban). Quick create, the persistent timer, and the drawer (?task=) all run on the demo store.
 */
type View = "time" | "list" | "board";

function Inner() {
  const demo = useDemo();
  const toast = useToast();
  const params = useSearchParams();
  const [view, setView] = useState<View>("time");
  // "?create=1" opens the form — also when it arrives while this screen is already mounted (top-bar create menu)
  const createParam = params.get("create") === "1";
  const [createOpen, setCreateOpen] = useState(createParam);
  const [seenCreate, setSeenCreate] = useState(createParam);
  if (createParam !== seenCreate) { setSeenCreate(createParam); if (createParam) setCreateOpen(true); }
  const [expanded, setExpanded] = useState<string[]>([]);
  const { now, viewer, state } = demo;
  const buckets = bucketsFor(state.tasks, viewer.id, now);
  const mine = state.tasks.filter((t) => t.assigneeId === viewer.id || t.participantIds.includes(viewer.id));
  const role = state.role;
  // the timer is a write (time entries): offered only to roles that may track time
  const timer = canDo(role, "trackTime")
    ? { activeTaskId: state.timer?.running ? state.timer.taskId : null, onStart: (id: string) => { const r = demo.timerStart(id); if (r?.conflict && r.logged) toast.push({ title: "הטיימר עבר משימה", detail: `הטיימר הקודם נעצר ונרשמו ${r.logged.minutes} דק׳.` }); }, onPause: demo.timerPause }
    : undefined;
  const toggleDone = useToggleDone();
  const onMove = useBoardMove();
  const tick = useTicker(view === "board" && !!state.timer?.running, 1000);

  const total = openCount(buckets);
  return (
    <Page className="f-wmy">
      <PageHeader
        eyebrow={`עבודה · ${fmtLongDate(now)}`}
        title="המשימות שלי"
        status={`${total} משימות פתוחות · ${buckets.overdue.length} באיחור · ${buckets.blocked.length} ${buckets.blocked.length === 1 ? "חסומה" : "חסומות"}.`}
        actions={canDo(state.role, "create") ? <button type="button" className="f-wmy__plus" aria-expanded={createOpen} aria-label="משימה חדשה" onClick={() => setCreateOpen((o) => !o)}>+</button> : undefined}
        aside={<Tabs label="תצוגה" value={view} onChange={setView} className="f-wmy__views" items={[{ key: "time", label: "לפי זמן" }, { key: "list", label: "List" }, { key: "board", label: "Kanban" }]} />}
      />
      {role === "viewer" && <Banner kind="unavailable" title="צפייה בלבד" detail="אין לך הרשאה ליצור או לערוך משימות. אפשר להגיב ולעקוב." />}
      {canDo(role, "create") && (
        <div className={createOpen ? "f-wmy__create f-wmy__create--open" : "f-wmy__create"}><QuickCreate
          now={now}
          autoFocus={params.get("create") === "1"}
          people={Object.values(PEOPLE).map((p) => ({ id: p.id, name: p.name }))}
          clients={Object.values(CLIENTS).map((c) => c.name)}
          onCreate={(d, keep) => {
            const t = demo.createTask({ title: d.title, dueDate: d.dueDate ?? now.slice(0, 10), priority: d.priority, assigneeId: d.assigneeId ?? viewer.id, context: d.client ? { client: d.client } : {} });
            toast.push({ title: "נוצרה משימה", detail: `${t.title}${keep ? " · אפשר להוסיף עוד" : ""}`, undo: { onUndo: () => demo.removeTask(t.id) } });
            if (!keep) setCreateOpen(false);
          }}
        /></div>
      )}
      {view === "time" && <MyTasksView buckets={buckets} all={state.tasks} now={now} timer={timer} />}
      {view === "list" && (
        <TaskListView tasks={mine.filter((t) => t.status !== "done")} all={state.tasks} now={now} expandedIds={expanded} canEdit={canDo(role, "complete")}
          onToggleExpand={(id) => setExpanded((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]))}
          onToggleDone={toggleDone} />
      )}
      {view === "board" && (
        <TaskBoard tasks={mine} all={state.tasks} canEdit={canDo(role, "changeStatus")}
          timerTaskId={state.timer?.taskId} timerLabel={state.timer && demo.hydrated ? fmtDuration(elapsedOf(state.timer, tick)).slice(0, 5) : undefined}
          onMove={onMove} />
      )}
      <TimerBar note="רשום על המשימה · מתווסף לדוח השעות" />
      <TaskDrawerHost />
    </Page>
  );
}

export default function WorkMyScreen() {
  return <Suspense><Inner /></Suspense>;
}
