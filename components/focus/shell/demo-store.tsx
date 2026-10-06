"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import type { Approval, Decision, DecisionCheck, DecisionOutcome } from "@/lib/focus/contracts/approvals";
import type { ActiveTimer, BoardColumn, Task, TaskPatch, TimeEntry, WorkCommands, WorkRole } from "@/lib/focus/contracts/work";
import { APPROVALS } from "@/lib/focus/fixtures/approvals";
import { DEMO_NOW, demoIso } from "@/lib/focus/fixtures/clock";
import { VIEWER } from "@/lib/focus/fixtures/people";
import { ACTIVE_TIMER, TASKS, TIME_ENTRIES } from "@/lib/focus/fixtures/work";
import { checkDecision } from "@/lib/focus/state/approvals";
import { getSales, proposalSendBlock } from "@/components/focus/patterns/sales/sales-store";
import { execReducer, initialExec, type ExecEvent, type ExecState } from "@/lib/focus/state/execution";
import { interruptExternal, jobStatus, type Job } from "@/lib/focus/state/jobs";
import { applyPatch, checkMove, elapsedOf, minutesToLog, nextVersion, pauseTimer, resumeTimer, revertTask, statusForColumn, switchTimer, taskInvariant, type PatchResult } from "@/lib/focus/state/work";

/**
 * Demo store — the temporary stand-in for the backend. It holds every stateful flow on fixtures so screens behave for
 * real (decisions, pre-execution summary, processing jobs, undo, tasks, timer) without touching any API.
 * Session data → sessionStorage; the timer → localStorage (handoff: "localStorage בדמו → POST /work/timers").
 * Replacing it = implementing the same actions over the real endpoints (see docs/focus/mytiv-work-contract.md).
 */
export type Notification = { id: string; title: string; detail: string; href?: string; at: number; read: boolean };

type State = {
  decisions: Record<string, Decision>;
  approvals: Record<string, Partial<Approval>>;
  executions: Record<string, ExecState>;
  tasks: Task[];
  timer: ActiveTimer | null;
  timeEntries: TimeEntry[];
  /** demo role switcher (owner by default) — drives permission-based hiding of actions */
  role: WorkRole;
  jobs: Job[];
  formats: Record<string, string[]>;
  /** unsent drafts kept across navigation (forms, briefs) */
  drafts: Record<string, unknown>;
  notifications: Notification[];
  /** demo control: make the next external action fail (to exercise the failure path) */
  failNext: boolean;
  /** demo clock for job status — advanced when a job starts or settles (never read from Date.now() during render) */
  clock: number;
  hydrated: boolean;
  /** task write lineage, `${taskId}@${version}` → the version it replaced and who wrote it (drawer adoption of own writes) */
  writes: Record<string, { prev: string; by?: string }>;
};

const initial: State = {
  decisions: {}, approvals: {}, executions: {}, tasks: TASKS, timer: ACTIVE_TIMER, timeEntries: TIME_ENTRIES, role: "owner", jobs: [],
  formats: {}, drafts: {}, notifications: [], failNext: false, clock: 0, hydrated: false, writes: {},
};

type Action =
  | { type: "hydrate"; state: Partial<State> }
  | { type: "decide"; decision: Decision; status: Approval["status"] }
  | { type: "undoDecision"; id: string }
  | { type: "exec"; id: string; event: ExecEvent }
  | { type: "resetExec"; id: string }
  | { type: "replaceTask"; task: Task }
  | { type: "addTask"; task: Task }
  | { type: "removeTask"; id: string }
  | { type: "timer"; timer: ActiveTimer | null }
  | { type: "timeEntry"; entry: TimeEntry }
  | { type: "removeTimeEntry"; id: string }
  | { type: "role"; role: WorkRole }
  | { type: "job"; job: Job }
  | { type: "cancelJob"; id: string; at: number }
  | { type: "formats"; designId: string; formats: string[] }
  | { type: "draft"; key: string; value: unknown }
  | { type: "draftUpdate"; key: string; fn: (prev: unknown) => unknown }
  | { type: "notify"; n: Notification }
  | { type: "readNotifications" }
  | { type: "failNext"; value: boolean }
  | { type: "tick"; at: number }
  | { type: "reset" };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "hydrate": return { ...s, ...a.state, hydrated: true };
    case "tick": return { ...s, clock: Math.max(s.clock, a.at) };
    case "decide": return {
      ...s,
      decisions: { ...s.decisions, [a.decision.approvalId]: a.decision },
      approvals: { ...s.approvals, [a.decision.approvalId]: { ...s.approvals[a.decision.approvalId], status: a.status } },
    };
    case "undoDecision": {
      const decisions = { ...s.decisions }; delete decisions[a.id];
      const approvals = { ...s.approvals }; delete approvals[a.id];
      return { ...s, decisions, approvals };
    }
    case "exec": return { ...s, executions: { ...s.executions, [a.id]: execReducer(s.executions[a.id] ?? initialExec, a.event) } };
    case "resetExec": { const executions = { ...s.executions }; delete executions[a.id]; return { ...s, executions }; }
    case "replaceTask": {
      const old = s.tasks.find((t) => t.id === a.task.id);
      const writes = old && old.version !== a.task.version ? { ...s.writes, [`${a.task.id}@${a.task.version}`]: { prev: old.version, by: a.task.updatedBy } } : s.writes;
      return { ...s, tasks: s.tasks.map((t) => (t.id === a.task.id ? a.task : t)), writes };
    }
    case "addTask": return { ...s, tasks: [a.task, ...s.tasks] };
    case "removeTask": return { ...s, tasks: s.tasks.filter((t) => t.id !== a.id) };
    case "timer": return { ...s, timer: a.timer };
    case "timeEntry": return { ...s, timeEntries: [...s.timeEntries, a.entry] };
    case "removeTimeEntry": return { ...s, timeEntries: s.timeEntries.filter((e) => e.id !== a.id) };
    case "role": return { ...s, role: a.role };
    case "job": return { ...s, jobs: [...s.jobs.filter((j) => j.id !== a.job.id), a.job] };
    case "cancelJob": return { ...s, jobs: s.jobs.map((j) => (j.id === a.id ? { ...j, cancelledAt: a.at } : j)) };
    case "formats": return { ...s, formats: { ...s.formats, [a.designId]: a.formats } };
    case "draft": { const drafts = { ...s.drafts }; if (a.value === undefined) delete drafts[a.key]; else drafts[a.key] = a.value; return { ...s, drafts }; }
    case "draftUpdate": { const drafts = { ...s.drafts }; const v = a.fn(s.drafts[a.key]); if (v === undefined) delete drafts[a.key]; else drafts[a.key] = v; return { ...s, drafts }; }
    case "notify": return { ...s, notifications: [a.n, ...s.notifications.filter((n) => n.id !== a.n.id)] };
    case "readNotifications": return { ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) };
    case "failNext": return { ...s, failNext: a.value };
    case "reset": return { ...initial, hydrated: true, timer: { ...ACTIVE_TIMER, startedAt: new Date().toISOString() } };
  }
}

const SESSION_KEY = "mytiv-focus-demo-v3"; // v3: "blocked" is derived, never stored
const TIMER_KEY = "mytiv-focus-timer-v1";

function readJson<T>(storage: () => Storage, key: string): T | null {
  try { const v = storage().getItem(key); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
function writeJson(storage: () => Storage, key: string, v: unknown) {
  try { storage().setItem(key, JSON.stringify(v)); } catch { /* private mode / blocked storage: the demo still works in memory */ }
}

type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

function useStoreValue() {
  const [s, dispatch] = useReducer(reducer, initial);
  const hydrated = s.hydrated;
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const latestTasks = useRef(s.tasks);
  useEffect(() => { latestTasks.current = s.tasks; }, [s.tasks]);
  // the latest committed state, for actions that run later (toast undo) and must not act on a stale render
  const latestState = useRef(s);
  /** createTask for callbacks that run later (a confirmed send creates its follow-up task) */
  const createRef = useRef<((draft: Pick<Task, "title" | "dueDate" | "priority"> & Partial<Task>) => Task) | null>(null);
  useEffect(() => { latestState.current = s; }, [s]);

  // hydrate after mount (server render = fixtures, so no hydration mismatch)
  useEffect(() => {
    const session = readJson<Partial<State>>(() => sessionStorage, SESSION_KEY) ?? {};
    const timer = readJson<ActiveTimer | null | "none">(() => localStorage, TIMER_KEY);
    const t = timer === "none" ? null : timer ?? { ...ACTIVE_TIMER, startedAt: new Date().toISOString() };
    // a send interrupted by a reload has an UNKNOWN outcome: nothing is marked sent, and a resend needs a fresh,
    // explicit confirmation (never a one-click retry that could send twice)
    const executions = Object.fromEntries(Object.entries(session.executions ?? {}).map(([k, v]) => [k, v.step === "sending" ? { step: "summary", confirmed: false, attempted: false, notice: "השליחה הקודמת נקטעה לפני שהתקבל אישור, ולכן לא ידוע אם נשלחה. בדקו במערכת היעד לפני שליחה חוזרת, ואשרו מחדש." } as ExecState : v]));
    const { hydrated: _h, clock: _c, ...rest } = session;
    void _h; void _c;
    // persisted tasks must satisfy the stored-task invariant; otherwise fall back to the fixtures
    if (rest.tasks && !rest.tasks.every((t) => taskInvariant(t).ok)) delete rest.tasks;
    // the same for external jobs (mail send, Meta schedule) still running when the page closed: outcome unknown
    const jobs = rest.jobs ? interruptExternal(rest.jobs, Date.now()) : rest.jobs;
    dispatch({ type: "hydrate", state: { ...rest, ...(jobs ? { jobs } : {}), executions, timer: t, clock: Date.now() } });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const { timer, hydrated: _h, clock: _c, ...session } = s;
    void _h; void _c;
    writeJson(() => sessionStorage, SESSION_KEY, session);
    writeJson(() => localStorage, TIMER_KEY, timer ?? "none");
  }, [s, hydrated]);

  // processing jobs: notify when they settle (also when the user left the screen)
  const jobsRef = useRef(s.jobs);
  useEffect(() => { jobsRef.current = s.jobs; }, [s.jobs]);
  const scheduleJobNotice = useCallback((job: Job) => {
    clearTimeout(timers.current[job.id]);
    timers.current[job.id] = setTimeout(() => {
      dispatch({ type: "tick", at: Date.now() });
      const j = jobsRef.current.find((x) => x.id === job.id);
      if (!j || j.cancelledAt) return;
      const st = jobStatus(j, Date.now());
      dispatch({ type: "notify", n: { id: `job-${j.id}`, title: st.state === "done" ? `מוכן: ${j.label.replace(/^יוצר |^מסנכרן |^בודק /, "")}` : `נכשל: ${j.label}`, detail: st.state === "done" ? "התוצאה ממתינה לך." : "מה שנשמר לא נמחק. אפשר לנסות שוב.", href: j.href, at: Date.now(), read: false } });
    }, Math.max(0, job.startedAt + job.durationMs - Date.now()) + 50); // the remaining time (also after a reload)
  }, []);

  // jobs still running when the page was reloaded: their completion tick/notice is scheduled again, so a send or a
  // sync never stays "running" forever (the outcome is derived from the clock, so it settles exactly once)
  useEffect(() => {
    if (!hydrated) return;
    for (const j of jobsRef.current) if (!j.cancelledAt && jobStatus(j, Date.now()).state === "running") scheduleJobNotice(j);
  }, [hydrated, scheduleJobNotice]);

  const approval = useCallback((id: string): Approval | undefined => {
    const base = APPROVALS.find((a) => a.id === id);
    return base ? { ...base, ...s.approvals[id] } : undefined;
  }, [s.approvals]);

  /** Records a decision; returns its `decidedAt`, so an undo can target exactly this decision and no later one. */
  const decide = useCallback((id: string, outcome: DecisionOutcome, reason: string): DecisionCheck & { decidedAt?: string } => {
    const a = approval(id);
    if (!a) return { ok: false, field: "reason", error: "הפריט לא נמצא." };
    const check = checkDecision(a, outcome, reason);
    if (!check.ok) return check;
    if (outcome === "defer") return check;
    const status = outcome === "approve" ? "approved" : outcome === "request_changes" ? "changes_requested" : "rejected";
    const decidedAt = demoIso();
    dispatch({ type: "decide", decision: { approvalId: id, outcome, reason: reason.trim(), decidedAt, decidedBy: VIEWER.id }, status });
    return { ...check, decidedAt };
  }, [approval]);

  const undoDecision = useCallback((id: string) => dispatch({ type: "undoDecision", id }), []);

  /** Pre-execution summary. `submit` starts the simulated target system; success is set only on its confirmation. */
  const exec = useCallback((id: string, event: ExecEvent) => {
    const a = APPROVALS.find((x) => x.id === id);
    const latest = latestState.current;
    // every send — the first submit and every retry — is checked against what was approved, here and not only in the UI
    const ev: ExecEvent = (event.type === "submit" || event.type === "retry") && a
      ? { ...event, blocked: proposalSendBlock(a, getSales().proposal) }
      : event;
    const cur = latest.executions[id] ?? initialExec;
    const next = execReducer(cur, ev);
    dispatch({ type: "exec", id, event: ev });
    latestState.current = { ...latest, executions: { ...latest.executions, [id]: next } };
    const willSend = cur.step !== "sending" && next.step === "sending";
    if (willSend && a?.simulate) {
      const fail = latest.failNext || a.simulate.outcome === "failure";
      if (latest.failNext) dispatch({ type: "failNext", value: false });
      clearTimeout(timers.current[`exec-${id}`]);
      timers.current[`exec-${id}`] = setTimeout(() => {
        if (fail) dispatch({ type: "exec", id, event: { type: "targetFailed", now: Date.now(), message: a.execution?.failureDetail ?? "המערכת לא אישרה." } });
        else {
          dispatch({ type: "exec", id, event: { type: "targetConfirmed", now: Date.now() } });
          // the decision behind an external action is the explicit confirmation itself — recorded as its reason
          dispatch({ type: "decide", decision: { approvalId: id, outcome: "approve", reason: `אישור מפורש לפני ביצוע: ${a.execution?.confirmText ?? ""}`.trim(), decidedAt: demoIso(), decidedBy: VIEWER.id }, status: "approved" });
          // the follow-up the summary promised exists only now, after the target confirmed
          const f = a.execution?.followUpTask;
          if (f && !latestTasks.current.some((t) => t.id === `t-followup-${id}`)) createRef.current?.({ id: `t-followup-${id}`, title: f.title, dueDate: f.dueDate, priority: "medium", assigneeId: f.assigneeId });
        }
      }, a.simulate.latencyMs);
    }
  }, []);

  // ---- Mytiv Work commands (WorkCommands): every write goes through applyPatch / revertTask with the token the caller saw
  const patchTask = useCallback((id: string, patch: TaskPatch, expectedVersion: string): PatchResult & { previous?: Task } => {
    const cur = s.tasks.find((t) => t.id === id);
    if (!cur) return { ok: false, refused: "המשימה לא נמצאה." };
    const r = applyPatch(cur, patch, expectedVersion, demoIso(), s.tasks, VIEWER.id);
    if (r.ok) dispatch({ type: "replaceTask", task: r.task });
    return { ...r, previous: cur };
  }, [s.tasks]);

  /**
   * Undo = compensating write: refused if the task moved on since the undone action, or if the rules forbid it now.
   * Undo runs later (from a toast), so it checks the latest committed tasks, not the ones of the render that made it.
   */
  const undoTask = useCallback((previous: Task, expectedVersion: string): PatchResult => {
    const tasks = latestTasks.current;
    const cur = tasks.find((t) => t.id === previous.id);
    if (!cur) return { ok: false, refused: "המשימה לא נמצאה." };
    const r = revertTask(cur, previous, expectedVersion, demoIso(), tasks, VIEWER.id);
    if (r.ok) { dispatch({ type: "replaceTask", task: r.task }); latestTasks.current = tasks.map((t) => (t.id === r.task.id ? r.task : t)); }
    return r;
  }, []);

  /** Demo: another person edits the task meanwhile (new token, named writer) — exercises the version-conflict state. */
  const simulateRemoteEdit = useCallback((id: string, patch: Partial<Task>, by: Task["updatedBy"] = "u-dana") => {
    const cur = s.tasks.find((t) => t.id === id);
    if (cur) dispatch({ type: "replaceTask", task: { ...cur, ...patch, version: nextVersion(cur.version), updatedAt: demoIso(), updatedBy: by } });
  }, [s.tasks]);

  /** Kanban move with the token the board rendered; the same write path (and rules) as the drawer. */
  const moveTask = useCallback((id: string, to: BoardColumn, expectedVersion: string): PatchResult & { previous?: Task } => {
    const cur = s.tasks.find((t) => t.id === id);
    if (!cur) return { ok: false, refused: "המשימה לא נמצאה." };
    if (cur.version !== expectedVersion) return { ok: false, conflict: cur };
    const gate = checkMove(cur, to, s.tasks);
    if (!gate.ok) return { ok: false, refused: gate.reason };
    const r = applyPatch(cur, { status: statusForColumn(to) }, expectedVersion, demoIso(), s.tasks, VIEWER.id);
    if (r.ok) dispatch({ type: "replaceTask", task: r.task });
    return { ...r, previous: cur };
  }, [s.tasks]);

  const createTask = useCallback((draft: Pick<Task, "title" | "dueDate" | "priority"> & Partial<Task>) => {
    const t: Task = {
      id: `t-new-${Date.now()}`, notes: "", status: "todo", assigneeId: VIEWER.id, participantIds: [], startDate: null,
      estimateMinutes: null, spentMinutes: 0, subtasks: [], checklist: [], dependsOn: [], links: {}, context: {}, comments: [],
      evidence: [], activity: [{ id: "a0", at: demoIso(), actorId: VIEWER.id, text: "נוצרה ביצירה מהירה", tone: "done" }],
      source: "mytiv", state: "live", parentId: null, ...draft, version: "v1", updatedAt: demoIso(), updatedBy: VIEWER.id,
    };
    // the same stored-task invariant as every write: canonical status, no block reason off a waiting task,
    // and no open child under a done parent
    const parent = t.parentId ? s.tasks.find((x) => x.id === t.parentId) : undefined;
    if (parent?.status === "done" && t.status !== "done") t.parentId = null;
    const inv = taskInvariant(t);
    if (!inv.ok) throw new Error(`createTask: ${inv.reason}`);
    dispatch({ type: "addTask", task: t });
    latestTasks.current = [t, ...latestTasks.current];
    return t;
  }, [s.tasks]);
  useEffect(() => { createRef.current = createTask; }, [createTask]);
  /**
   * Remove a task — the undo of a create. With `expectedVersion` it is versioned like every other undo: refused when
   * the task was changed since it was created (someone worked on it), so the undo never deletes their work.
   */
  const removeTask = useCallback((id: string, expectedVersion?: string): { ok: true } | { ok: false; refused: string } => {
    const cur = latestTasks.current.find((t) => t.id === id);
    if (!cur) return { ok: false, refused: "המשימה כבר לא קיימת." };
    if (expectedVersion && cur.version !== expectedVersion) return { ok: false, refused: "המשימה עודכנה מאז שנוצרה, ולכן לא נמחקה." };
    if (latestTasks.current.some((t) => t.parentId === id)) return { ok: false, refused: "נוספו לה תתי־משימות, ולכן לא נמחקה." };
    if (latestState.current.timer?.taskId === id) return { ok: false, refused: "טיימר רשום עליה. עצרו אותו קודם." };
    dispatch({ type: "removeTask", id });
    latestTasks.current = latestTasks.current.filter((t) => t.id !== id);
    return { ok: true };
  }, []);

  const addEntry = (taskId: string, minutes: number, source: TimeEntry["source"]) => {
    const entry: TimeEntry = { id: `te-${Date.now()}-${taskId}`, taskId, personId: VIEWER.id, start: demoIso(), minutes, source, certainty: "known" };
    dispatch({ type: "timeEntry", entry });
    return entry;
  };
  /** Logged time is a write like any other (new token, actor) — so it never shows up as someone else's conflict. */
  const addSpent = useCallback((task: Task | undefined, minutes: number): PatchResult | null => {
    if (!task) return null;
    const r = applyPatch(task, { logMinutes: minutes }, task.version, demoIso(), s.tasks, VIEWER.id);
    if (r.ok) dispatch({ type: "replaceTask", task: r.task });
    return r;
  }, [s.tasks]);

  /** One timer per person: starting another task stops and logs the running one first (switchTimer). */
  const timerStart = useCallback((taskId: string) => {
    const t = s.tasks.find((x) => x.id === taskId);
    if (!t) return null;
    const r = switchTimer(s.timer, t, new Date().toISOString());
    const prevTask = r.logged ? s.tasks.find((x) => x.id === r.logged!.taskId) : undefined;
    if (r.logged && r.logged.minutes > 0 && prevTask) {
      addEntry(r.logged.taskId, r.logged.minutes, "timer");
      addSpent(prevTask, r.logged.minutes);
    }
    dispatch({ type: "timer", timer: r.next });
    return r;
  }, [s.tasks, s.timer, addSpent]);
  const timerPause = useCallback(() => { if (s.timer) dispatch({ type: "timer", timer: pauseTimer(s.timer, Date.now()) }); }, [s.timer]);
  const timerResume = useCallback(() => { if (s.timer) dispatch({ type: "timer", timer: resumeTimer(s.timer, new Date().toISOString()) }); }, [s.timer]);
  const timerStop = useCallback(() => {
    if (!s.timer) return null;
    const stoppedAt = Date.now();
    const stopped = s.timer;
    const elapsedMs = elapsedOf(stopped, stoppedAt);
    const task = s.tasks.find((t) => t.id === stopped.taskId);
    // a timer that outlived its task (e.g. one created in a closed tab) logs nothing — no orphan time entries
    const minutes = task ? minutesToLog(stopped, stoppedAt) : 0;
    const write = minutes > 0 ? addSpent(task, minutes) : null;
    // the entry exists only when the logged time was written to the task
    const entry = write?.ok ? addEntry(stopped.taskId, minutes, "timer") : null;
    dispatch({ type: "timer", timer: null });
    return { stopped, elapsedMs, minutes, task, entry, write, orphan: !task };
  }, [s.timer, s.tasks, addSpent]);
  /** Undo a stop: the timer resumes paused at the time it had when stopped (the gap is not counted), the entry goes. */
  const timerRestore = useCallback((t: ActiveTimer, elapsedMs: number, entryId?: string) => {
    dispatch({ type: "timer", timer: { ...t, running: false, elapsedMs, startedAt: new Date().toISOString() } });
    if (entryId) dispatch({ type: "removeTimeEntry", id: entryId });
  }, []);
  /** Manual time (validated by parseDuration in the caller). */
  const logTime = useCallback((taskId: string, minutes: number) => {
    const task = s.tasks.find((t) => t.id === taskId);
    const result = addSpent(task, minutes) ?? { ok: false as const, refused: "המשימה לא נמצאה." };
    // the time entry exists only when the task write went through (no orphan entries for a refused write)
    const entry = result.ok ? addEntry(taskId, minutes, "manual") : null;
    return { entry, result, previous: task };
  }, [s.tasks, addSpent]);
  const removeTimeEntry = useCallback((id: string) => dispatch({ type: "removeTimeEntry", id }), []);

  const startJob = useCallback((job: Omit<Job, "startedAt">) => {
    const j = { ...job, startedAt: Date.now() };
    dispatch({ type: "job", job: j });
    dispatch({ type: "tick", at: j.startedAt });
    scheduleJobNotice(j);
    return j;
  }, [scheduleJobNotice]);
  const cancelJob = useCallback((id: string) => { clearTimeout(timers.current[id]); const at = Date.now(); dispatch({ type: "cancelJob", id, at }); dispatch({ type: "tick", at }); }, []);

  /** dispatch-only actions — stable identities, safe in effect dependencies */
  const stable = useMemo(() => ({
    resetExec: (id: string) => dispatch({ type: "resetExec", id }),
    getLatest: () => latestState.current,
    restoreEntry: (entry: TimeEntry) => dispatch({ type: "timeEntry", entry }),
    setRole: (role: WorkRole) => dispatch({ type: "role", role }),
    setFormats: (designId: string, formats: string[]) => dispatch({ type: "formats", designId, formats }),
    setDraft: (key: string, value: unknown) => dispatch({ type: "draft", key, value }),
    /** functional update on the latest stored draft (safe from toasts / undo that run later) */
    updateDraft: <T,>(key: string, fn: (prev: T | undefined) => T | undefined) => dispatch({ type: "draftUpdate", key, fn: fn as (prev: unknown) => unknown }),
    readNotifications: () => dispatch({ type: "readNotifications" }),
    setFailNext: (value: boolean) => dispatch({ type: "failNext", value }),
    // a reset also stops every pending simulated answer (a send, a job notice) — nothing settles into the fresh state
    reset: () => { Object.values(timers.current).forEach(clearTimeout); timers.current = {}; dispatch({ type: "reset" }); },
  }), []);

  return useMemo(() => ({
    hydrated, now: DEMO_NOW, viewer: VIEWER, state: s,
    approval, decide, undoDecision, exec, ...stable,
    ...({ patchTask, moveTask, undoTask, createTask, removeTask, logTime } satisfies WorkCommands),
    simulateRemoteEdit,
    timerStart, timerPause, timerResume, timerStop, timerRestore, removeTimeEntry,
    startJob, cancelJob,
  }), [hydrated, s, stable, approval, decide, undoDecision, exec, patchTask, undoTask, moveTask, createTask, removeTask, simulateRemoteEdit, timerStart, timerPause, timerResume, timerStop, timerRestore, logTime, removeTimeEntry, startJob, cancelJob]);
}

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemo() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDemo outside DemoStoreProvider");
  return c;
}

/** Re-render every `ms` while `active` (timers, job progress, undo countdowns). */
export function useTicker(active: boolean, ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const iv = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(iv);
  }, [active, ms]);
  return now;
}
