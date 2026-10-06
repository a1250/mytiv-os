"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { HOURS_SYNC, PROJECT_UMINO } from "@/lib/focus/fixtures/projects";
import { demoIso } from "@/lib/focus/fixtures/clock";
import Link, { useFocusRouter } from "@/components/focus/ui/link";
import { PEOPLE } from "@/lib/focus/fixtures/people";
import { fmtAgo, fmtTime } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { canDo } from "@/lib/focus/state/work";
import { jobStatus } from "@/lib/focus/state/jobs";
import { ProjectHeader } from "@/components/focus/patterns/project/project-parts";
import { BlockedTaskPanel, type BlockedDraft, type SyncState } from "@/components/focus/patterns/work/blocked-panel";
import { TaskListView } from "@/components/focus/patterns/work/task-list";
import { useDemo } from "@/components/focus/shell/demo-store";
import { useTaskUndo, useToggleDone } from "@/components/focus/shell/task-actions";
import { Button } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { SelectField } from "@/components/focus/ui/field";
import { PlannedTag } from "@/components/focus/ui/status";
import { NavTabs } from "@/components/focus/ui/tabs";
import { useToast } from "@/components/focus/ui/toast";
import { AUTUMN_PROJECT_ID } from "@/lib/focus/fixtures/work";

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
  const undo = useTaskUndo();
  const router = useFocusRouter();
  const params = useSearchParams();
  const { now, state } = demo;
  const selected = params.get("task") ?? "t-photo-shoot";
  const [owner, setOwner] = useState("all");
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const project = state.tasks.filter((t) => t.links.projectId === AUTUMN_PROJECT_ID);
  const tasks = project.filter((t) => owner === "all" || t.assigneeId === owner);
  const task = state.tasks.find((t) => t.id === selected) ?? null;
  const job = state.jobs.find((j) => j.id === `sync-${selected}`);
  const js = job && !job.cancelledAt ? jobStatus(job, state.clock) : null;
  const sync: SyncState = !js ? { kind: "idle" } : js.state === "running" ? { kind: "syncing" } : js.state === "done" ? { kind: "synced", at: fmtTime(demoIso(js.at)) } : { kind: "failed", message: "ClickUp לא אישר את השינוי." };
  const onDirty = useCallback((d: boolean) => setDirty(d), []);
  const refreshJob = state.jobs.find((j) => j.id === "refresh-clickup");
  const refreshing = refreshJob && !refreshJob.cancelledAt && jobStatus(refreshJob, state.clock).state === "running";

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  // the token the panel's draft is based on: set when a task is selected, adopted while there is no draft
  const [draftBase, setDraftBase] = useState<{ id: string; version: string } | null>(null);
  if (task && (draftBase?.id !== task.id || (!dirty && draftBase.version !== task.version))) setDraftBase({ id: task.id, version: task.version });

  const select = (id: string) => { if (dirty) { setPending(id); return; } router.replace(`${R.projectExecution("umino")}?task=${id}`, { scroll: false }); };

  const save = (d: BlockedDraft) => {
    if (!task || !draftBase) return;
    // the token the draft started from: a change made meanwhile (here or elsewhere) is a conflict, never overwritten
    const r = demo.patchTask(task.id, { assigneeId: d.assigneeId, nextAction: d.nextAction, followUp: d.followUp, ...(d.note.trim() ? { addComment: { id: `c-${Date.now()}`, authorId: demo.viewer.id, at: demoIso(), text: d.note.trim() } } : {}) }, draftBase.version);
    if (!r.ok) { toast.push({ kind: "error", title: "לא נשמר", detail: "refused" in r ? r.refused : "המשימה עודכנה בזמן שערכת. השינוי שלך לא נשמר — בדקו את הערכים החדשים ונסו שוב." }); return; }
    setDraftBase({ id: task.id, version: r.task.version });
    setDirty(false);
    if (task.source === "clickup") {
      const fail = state.failNext; if (fail) demo.setFailNext(false);
      demo.startJob({ id: `sync-${task.id}`, kind: "sync_clickup", label: "מסנכרן ל־ClickUp", detail: "שומר אחראי, צעד הבא ותאריך מעקב.", durationMs: 1800, outcome: fail ? "failure" : "success", href: R.projectExecution("umino") });
    }
    toast.push({ title: task.source === "clickup" ? "נשמר · מסנכרן ל־ClickUp" : "נשמר", detail: "\"סונכרן\" יוצג רק אחרי ש־ClickUp יאשר.", undo: { onUndo: undo(r.previous!, r.task.version, () => demo.cancelJob(`sync-${task.id}`)) } });
  };

  const toggleDone = useToggleDone();

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
            {canDo(state.role, "create") && <Link href={R.workCreate(AUTUMN_PROJECT_ID)} className="f-btn f-btn--primary f-btn--sm">+ משימה</Link>}
          </div>
          <div className="f-exec__sync" role="status">
            <span className="f-source-dot f-source-dot--mytiv">Mytiv {project.filter((t) => t.source === "mytiv").length}</span>
            <span className="f-source-dot">ClickUp {project.filter((t) => t.source === "clickup").length} · בתקופת מעבר</span>
            <span className="f-grow" />
            <span className="f-meta-sm">{refreshing ? "מרענן מ־ClickUp…" : `סונכרן ${refreshJob ? "עכשיו" : fmtAgo(HOURS_SYNC.at, now)}`}</span>
            <Button variant="quiet" size="sm" disabled={!!refreshing} onClick={() => demo.startJob({ id: "refresh-clickup", kind: "sync_clickup", label: "מרענן מ־ClickUp", detail: "", durationMs: 1200, outcome: "success" })}>רענן</Button>
          </div>
          <TaskListView tasks={tasks} all={state.tasks} now={now} expandedIds={[]} onToggleExpand={() => {}} onToggleDone={toggleDone} selectedId={selected} canEdit={canDo(state.role, "complete")}
            groupBy="status" groupOrder={GROUPS.map((g) => ({ ...g, collapsed: g.collapsed && !showDone }))} columns={["assignee", "due", "dependency"]} onOpen={(t) => select(t.id)} />
          <Button variant="quiet" size="sm" onClick={() => setShowDone(!showDone)}>{showDone ? "הסתר שהושלמו" : `הצג ${project.filter((t) => t.status === "done").length} שהושלמו`}</Button>
        </div>
        {task && (
          // keyed by the adopted draft token: it only moves while the panel is clean (or on save), so a draft is never
          // discarded by a remount and a clean panel shows the new values
          <BlockedTaskPanel key={`${task.id}:${draftBase?.version ?? task.version}`} task={task} all={state.tasks} now={now} viewerId={demo.viewer.id} sync={sync}
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
