"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { PROJECT_UMINO } from "@/lib/focus/fixtures/projects";
import { PEOPLE } from "@/lib/focus/fixtures/people";
import { fmtDuration } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { canComplete, canDo, elapsedOf, type Gate, displayStatus } from "@/lib/focus/state/work";
import { ProjectHeader } from "@/components/focus/patterns/project/project-parts";
import { TaskBoard } from "@/components/focus/patterns/work/task-board";
import { TaskListView } from "@/components/focus/patterns/work/task-list";
import { useDemo, useTicker } from "@/components/focus/shell/demo-store";
import { TaskDrawerHost } from "@/components/focus/shell/task-drawer-host";
import { TimerBar } from "@/components/focus/shell/timer-bar";
import { SelectField } from "@/components/focus/ui/field";
import { PlannedTag } from "@/components/focus/ui/status";
import { NavTabs } from "@/components/focus/ui/tabs";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Project · execution in Mytiv Work (handoff W2 list with nested sub-tasks + dependencies, W3 Kanban, W4 drawer via
 * ?task=). Same project tasks in both views; status / assignee filters are real.
 */
const PROJECT_ID = "umino-autumn";

function Inner({ view, defaultTaskId }: { view: "list" | "board"; defaultTaskId?: string }) {
  const demo = useDemo();
  const toast = useToast();
  const { now, state } = demo;
  const [expanded, setExpanded] = useState<string[]>(["t-content"]);
  const [status, setStatus] = useState("all");
  const [owner, setOwner] = useState("all");
  const tick = useTicker(view === "board" && !!state.timer?.running, 1000);
  const project = state.tasks.filter((t) => t.links.projectId === PROJECT_ID);
  const tasks = project.filter((t) => (status === "all" || displayStatus(t, state.tasks) === status) && (owner === "all" || (owner === "none" ? !t.assigneeId : t.assigneeId === owner)));
  const counts = { mytiv: project.filter((t) => t.source === "mytiv").length, clickup: project.filter((t) => t.source === "clickup").length };
  const role = state.role;

  const toggleDone = (id: string) => {
    const t = state.tasks.find((x) => x.id === id)!;
    const gate: Gate = t.status === "done" ? { ok: true } : canComplete(t, state.tasks);
    if (!gate.ok) { toast.push({ kind: "error", title: "לא ניתן לסמן כבוצע", detail: gate.reason }); return; }
    const r = demo.patchTask(id, { status: t.status === "done" ? "todo" : "done" }, t.version);
    if (r.ok) toast.push({ title: r.task.status === "done" ? "סומן כבוצע" : "נפתח מחדש", detail: t.title, undo: { onUndo: () => demo.restoreTask({ ...r.previous!, version: r.task.version + 1 }) } });
  };

  return (
    <div className="f-proj f-wproj">
      <ProjectHeader p={PROJECT_UMINO} area="execution" now={now} />
      <div className="f-wproj__bar">
        <NavTabs label="תצוגת משימות" value={view} size="sm" className="f-wproj__views" items={[
          { key: "list", label: "List", href: R.workList },
          { key: "board", label: "Kanban", href: R.workBoard },
        ]} />
        <span className="f-wproj__planned">ציר זמן <PlannedTag /></span>
        <SelectField label="סטטוס" labelClassName="f-sr" className="f-wproj__filter" value={status} onChange={(e) => setStatus(e.target.value)} options={[
          { value: "all", label: "כל הסטטוסים" }, { value: "todo", label: "לא התחיל" }, { value: "in_progress", label: "בתהליך" },
          { value: "waiting", label: "ממתין" }, { value: "blocked", label: "חסום" }, { value: "done", label: "הושלם" },
        ]} />
        <SelectField label="אחראי" labelClassName="f-sr" className="f-wproj__filter" value={owner} onChange={(e) => setOwner(e.target.value)} options={[
          { value: "all", label: "כל האחראים" }, ...Object.values(PEOPLE).filter((p) => p.role !== "viewer").map((p) => ({ value: p.id, label: p.name })), { value: "none", label: "ללא אחראי" },
        ]} />
        <span className="f-grow" />
        <span className="f-wproj__legend"><span className="f-source-dot f-source-dot--mytiv">Mytiv {counts.mytiv}</span> <span className="f-source-dot">ClickUp {counts.clickup}</span></span>
        {canDo(role, "create") && <Link href={`${R.work}?create=1`} className="f-btn f-btn--primary">+ משימה</Link>}
      </div>
      <div className="f-wproj__body">
        {tasks.length === 0 && <p className="f-meta">אין משימות שמתאימות לסינון. <button type="button" className="f-link" onClick={() => { setStatus("all"); setOwner("all"); }}>נקה סינון</button></p>}
        {view === "list" ? (
          <>
            <TaskListView tasks={tasks} all={state.tasks} now={now} expandedIds={expanded} canEdit={canDo(role, "complete")}
              onToggleExpand={(id) => setExpanded((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]))} onToggleDone={(t) => toggleDone(t.id)} />
            {canDo(role, "create") && <Link href={`${R.work}?create=1`} className="f-wproj__new">+ משימה חדשה בפרויקט</Link>}
          </>
        ) : (
          <>
            <div className="f-wproj__boardhead"><b>{PROJECT_UMINO.name} · לוח עבודה</b><span className="f-meta">{tasks.length} משימות · מקובצות לפי סטטוס</span></div>
            <TaskBoard tasks={tasks} all={state.tasks} canEdit={canDo(role, "changeStatus")}
              timerTaskId={state.timer?.taskId} timerLabel={state.timer && demo.hydrated ? fmtDuration(elapsedOf(state.timer, tick)).slice(0, 5) : undefined}
              onMove={(id, to) => {
                const r = demo.moveTask(id, to);
                if (!r.ok) { toast.push({ kind: "error", title: "לא ניתן להזיז", detail: r.reason }); return { ok: false, reason: r.reason }; }
                toast.push({ title: "הועבר", detail: r.previous.title, undo: { onUndo: () => demo.restoreTask({ ...r.previous, version: r.previous.version + 2 }) } });
                return { ok: true };
              }} />
            <p className="f-meta-sm f-wproj__hint">שלבים נוספים (&quot;ממתין&quot;, &quot;בבדיקה&quot;) מוגדרים לכל עסק. גרירה גם במקלדת: Space לבחירה, חצים להזזה.</p>
          </>
        )}
      </div>
      <TimerBar note="רשום על המשימה · מתווסף לדוח השעות" />
      <TaskDrawerHost defaultTaskId={defaultTaskId} />
    </div>
  );
}

export default function WorkProjectScreen({ view, defaultTaskId }: { view: "list" | "board"; defaultTaskId?: string }) {
  return <Suspense><Inner view={view} defaultTaskId={defaultTaskId} /></Suspense>;
}
