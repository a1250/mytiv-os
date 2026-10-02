"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { HOURS_SYNC, PROJECT_UMINO } from "@/lib/focus/fixtures/projects";
import Link from "next/link";
import { PEOPLE } from "@/lib/focus/fixtures/people";
import { fmtAgo, fmtTime } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { canComplete, canDo, type Gate } from "@/lib/focus/state/work";
import { jobStatus } from "@/lib/focus/state/jobs";
import { ProjectHeader } from "@/components/focus/patterns/project/project-parts";
import { BlockedTaskPanel, type BlockedDraft, type SyncState } from "@/components/focus/patterns/work/blocked-panel";
import { TaskListView } from "@/components/focus/patterns/work/task-list";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { SelectField } from "@/components/focus/ui/field";
import { PlannedTag } from "@/components/focus/ui/status";
import { NavTabs } from "@/components/focus/ui/tabs";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Project › execution (handoff D3, prototype flow 2): tasks grouped by status with dependencies, and the selected task
 * in a side panel. Saving a ClickUp task is a sync job (success only after ClickUp confirms; failure keeps the change
 * here as "טרם סונכרן"). Switching task with unsaved edits asks first.
 */
const GROUPS = [
  { key: "blocked", title: "■ חסום", statuses: ["blocked" as const] },
  { key: "active", title: "◐ בתהליך וממתין", statuses: ["in_progress" as const, "waiting" as const] },
  { key: "todo", title: "○ לא התחיל", statuses: ["todo" as const, "unknown" as const] },
  { key: "done", title: "✓ הושלמו", statuses: ["done" as const], collapsed: true },
];

function Inner() {
  const demo = useDemo();
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const { now, state } = demo;
  const selected = params.get("task") ?? "t-photo-shoot";
  const [owner, setOwner] = useState("all");
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const project = state.tasks.filter((t) => t.links.projectId === "umino-autumn");
  const tasks = project.filter((t) => owner === "all" || t.assigneeId === owner);
  const task = state.tasks.find((t) => t.id === selected) ?? null;
  const job = state.jobs.find((j) => j.id === `sync-${selected}`);
  const js = job && !job.cancelledAt ? jobStatus(job, state.clock) : null;
  const sync: SyncState = !js ? { kind: "idle" } : js.state === "running" ? { kind: "syncing" } : js.state === "done" ? { kind: "synced", at: fmtTime(new Date(js.at).toISOString()) } : { kind: "failed", message: "ClickUp לא אישר את השינוי." };
  const onDirty = useCallback((d: boolean) => setDirty(d), []);
  const refreshJob = state.jobs.find((j) => j.id === "refresh-clickup");
  const refreshing = refreshJob && !refreshJob.cancelledAt && jobStatus(refreshJob, state.clock).state === "running";

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const select = (id: string) => { if (dirty) { setPending(id); return; } router.replace(`${R.projectExecution("umino")}?task=${id}`, { scroll: false }); };

  const save = (d: BlockedDraft) => {
    if (!task) return;
    const r = demo.patchTask(task.id, { assigneeId: d.assigneeId, nextAction: d.nextAction, followUp: d.followUp, ...(d.note.trim() ? { addComment: { id: `c-${Date.now()}`, authorId: demo.viewer.id, at: new Date().toISOString(), text: d.note.trim() } } : {}) }, task.version);
    if (!r.ok) { toast.push({ kind: "error", title: "לא נשמר", detail: "refused" in r ? r.refused : "המשימה עודכנה במקביל. רענן ונסה שוב." }); return; }
    setDirty(false);
    if (task.source === "clickup") {
      const fail = state.failNext; if (fail) demo.setFailNext(false);
      demo.startJob({ id: `sync-${task.id}`, kind: "sync_clickup", label: "מסנכרן ל־ClickUp", detail: "שומר אחראי, צעד הבא ותאריך מעקב.", durationMs: 1800, outcome: fail ? "failure" : "success", href: R.projectExecution("umino") });
    }
    toast.push({ title: task.source === "clickup" ? "נשמר · מסנכרן ל־ClickUp" : "נשמר", detail: "\"סונכרן\" יוצג רק אחרי ש־ClickUp יאשר.", undo: { onUndo: () => { demo.cancelJob(`sync-${task.id}`); demo.restoreTask({ ...r.previous!, version: r.task.version + 1 }); } } });
  };

  const toggleDone = (id: string) => {
    const t = state.tasks.find((x) => x.id === id)!;
    const gate: Gate = t.status === "done" ? { ok: true } : canComplete(t, state.tasks);
    if (!gate.ok) { toast.push({ kind: "error", title: "לא ניתן לסמן כבוצע", detail: gate.reason }); return; }
    const r = demo.patchTask(id, { status: t.status === "done" ? "todo" : "done" }, t.version);
    if (r.ok) toast.push({ title: r.task.status === "done" ? "סומן כבוצע" : "נפתח מחדש", detail: t.title, undo: { onUndo: () => demo.restoreTask({ ...r.previous!, version: r.task.version + 1 }) } });
  };

  return (
    <div className="f-proj f-exec">
      <ProjectHeader p={PROJECT_UMINO} area="execution" now={now} />
      <div className="f-exec__grid">
        <div className="f-exec__main">
          <div className="f-wproj__bar f-exec__bar">
            <b className="f-exec__h">ביצוע · Mytiv Work</b>
            <NavTabs label="תצוגה" value="list" size="sm" items={[{ key: "list", label: "List", href: R.projectExecution("umino") }, { key: "board", label: "Kanban", href: R.workBoard }]} />
            <span className="f-wproj__planned">ציר זמן <PlannedTag /></span>
            <SelectField label="אחראי" labelClassName="f-sr" className="f-wproj__filter" value={owner} onChange={(e) => setOwner(e.target.value)} options={[{ value: "all", label: "אחראי: כולם" }, ...Object.values(PEOPLE).filter((p) => p.role !== "viewer").map((p) => ({ value: p.id, label: p.name }))]} />
            <span className="f-grow" />
            {canDo(state.role, "create") && <Link href={`${R.work}?create=1`} className="f-btn f-btn--primary f-btn--sm">+ משימה</Link>}
          </div>
          <div className="f-exec__sync" role="status">
            <span className="f-source-dot f-source-dot--mytiv">Mytiv {project.filter((t) => t.source === "mytiv").length}</span>
            <span className="f-source-dot">ClickUp {project.filter((t) => t.source === "clickup").length} · בתקופת מעבר</span>
            <span className="f-grow" />
            <span className="f-meta-sm">{refreshing ? "מרענן מ־ClickUp…" : `סונכרן ${refreshJob ? "עכשיו" : fmtAgo(HOURS_SYNC.at, now)}`}</span>
            <Button variant="quiet" size="sm" disabled={!!refreshing} onClick={() => demo.startJob({ id: "refresh-clickup", kind: "sync_clickup", label: "מרענן מ־ClickUp", detail: "", durationMs: 1200, outcome: "success" })}>רענן</Button>
          </div>
          <TaskListView tasks={tasks} all={state.tasks} now={now} expandedIds={[]} onToggleExpand={() => {}} onToggleDone={(t) => toggleDone(t.id)} selectedId={selected} canEdit={canDo(state.role, "complete")}
            groupBy="status" groupOrder={GROUPS.map((g) => ({ ...g, collapsed: g.collapsed && !showDone }))} columns={["assignee", "due", "dependency"]} onOpen={(t) => select(t.id)} />
          <Button variant="quiet" size="sm" onClick={() => setShowDone(!showDone)}>{showDone ? "הסתר שהושלמו" : `הצג ${project.filter((t) => t.status === "done").length} שהושלמו`}</Button>
        </div>
        {task && (
          <BlockedTaskPanel key={task.id + task.version} task={task} all={state.tasks} now={now} viewerId={demo.viewer.id} sync={sync}
            canEdit={canDo(state.role, "edit")} onSave={save} onDirtyChange={onDirty}
            onRetry={() => demo.startJob({ id: `sync-${task.id}`, kind: "sync_clickup", label: "מסנכרן ל־ClickUp", detail: "", durationMs: 1500, outcome: "success" })} />
        )}
      </div>
      <Dialog open={!!pending} onClose={() => setPending(null)} label="שינויים שלא נשמרו">
        <div className="f-confirm">
          <h2 className="f-confirm__h">יש שינויים שלא נשמרו</h2>
          <p className="f-meta">אם תעבור משימה, האחראי, הצעד הבא והתאריך שבחרת לא יישמרו.</p>
          <div className="f-confirm__actions">
            <Button variant="primary" onClick={() => setPending(null)}>חזור ושמור</Button>
            <Button variant="neutral" onClick={() => { const id = pending!; setPending(null); setDirty(false); router.replace(`${R.projectExecution("umino")}?task=${id}`, { scroll: false }); }}>עבור בלי לשמור</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default function ProjectExecutionScreen() {
  return <Suspense><Inner /></Suspense>;
}
