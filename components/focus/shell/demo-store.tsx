"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import type { Approval, Decision, DecisionCheck, DecisionOutcome } from "@/lib/focus/contracts/approvals";
import type { ActiveTimer, BoardColumn, Task, TaskPatch } from "@/lib/focus/contracts/work";
import { APPROVALS } from "@/lib/focus/fixtures/approvals";
import { DEMO_NOW } from "@/lib/focus/fixtures/clock";
import { VIEWER } from "@/lib/focus/fixtures/people";
import { ACTIVE_TIMER, TASKS } from "@/lib/focus/fixtures/work";
import { checkDecision } from "@/lib/focus/state/approvals";
import { execReducer, initialExec, type ExecEvent, type ExecState } from "@/lib/focus/state/execution";
import { jobStatus, type Job } from "@/lib/focus/state/jobs";
import { applyPatch, minutesToLog, pauseTimer, resumeTimer, startTimer, statusForColumn } from "@/lib/focus/state/work";

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
  timerLog: { taskId: string; minutes: number; at: number }[];
  jobs: Job[];
  formats: Record<string, string[]>;
  notifications: Notification[];
  /** demo control: make the next external action fail (to exercise the failure path) */
  failNext: boolean;
  /** demo clock for job status — advanced when a job starts or settles (never read from Date.now() during render) */
  clock: number;
  hydrated: boolean;
};

const initial: State = {
  decisions: {}, approvals: {}, executions: {}, tasks: TASKS, timer: ACTIVE_TIMER, timerLog: [], jobs: [],
  formats: {}, notifications: [], failNext: false, clock: 0, hydrated: false,
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
  | { type: "timer"; timer: ActiveTimer | null; log?: { taskId: string; minutes: number; at: number } }
  | { type: "job"; job: Job }
  | { type: "cancelJob"; id: string; at: number }
  | { type: "formats"; designId: string; formats: string[] }
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
    case "replaceTask": return { ...s, tasks: s.tasks.map((t) => (t.id === a.task.id ? a.task : t)) };
    case "addTask": return { ...s, tasks: [a.task, ...s.tasks] };
    case "removeTask": return { ...s, tasks: s.tasks.filter((t) => t.id !== a.id) };
    case "timer": return { ...s, timer: a.timer, timerLog: a.log ? [...s.timerLog, a.log] : s.timerLog };
    case "job": return { ...s, jobs: [...s.jobs.filter((j) => j.id !== a.job.id), a.job] };
    case "cancelJob": return { ...s, jobs: s.jobs.map((j) => (j.id === a.id ? { ...j, cancelledAt: a.at } : j)) };
    case "formats": return { ...s, formats: { ...s.formats, [a.designId]: a.formats } };
    case "notify": return { ...s, notifications: [a.n, ...s.notifications.filter((n) => n.id !== a.n.id)] };
    case "readNotifications": return { ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) };
    case "failNext": return { ...s, failNext: a.value };
    case "reset": return { ...initial, hydrated: true, timer: { ...ACTIVE_TIMER, startedAt: new Date().toISOString() } };
  }
}

const SESSION_KEY = "mytiv-focus-demo-v1";
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

  // hydrate after mount (server render = fixtures, so no hydration mismatch)
  useEffect(() => {
    const session = readJson<Partial<State>>(() => sessionStorage, SESSION_KEY) ?? {};
    const timer = readJson<ActiveTimer | null | "none">(() => localStorage, TIMER_KEY);
    const t = timer === "none" ? null : timer ?? { ...ACTIVE_TIMER, startedAt: new Date().toISOString() };
    // executions that were "sending" when the page closed are resolved as failed-safe: nothing is marked sent
    const executions = Object.fromEntries(Object.entries(session.executions ?? {}).map(([k, v]) => [k, v.step === "sending" ? { step: "failed", at: Date.now(), message: "החיבור נקטע לפני שהתקבל אישור. דבר לא סומן כנשלח." } as ExecState : v]));
    const { hydrated: _h, clock: _c, ...rest } = session;
    void _h; void _c;
    dispatch({ type: "hydrate", state: { ...rest, executions, timer: t, clock: Date.now() } });
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
    }, job.durationMs + 50);
  }, []);

  const approval = useCallback((id: string): Approval | undefined => {
    const base = APPROVALS.find((a) => a.id === id);
    return base ? { ...base, ...s.approvals[id] } : undefined;
  }, [s.approvals]);

  const decide = useCallback((id: string, outcome: DecisionOutcome, reason: string): DecisionCheck => {
    const a = approval(id);
    if (!a) return { ok: false, field: "reason", error: "הפריט לא נמצא." };
    const check = checkDecision(a, outcome, reason);
    if (!check.ok) return check;
    if (outcome === "defer") return check;
    const status = outcome === "approve" ? "approved" : outcome === "request_changes" ? "changes_requested" : "rejected";
    dispatch({ type: "decide", decision: { approvalId: id, outcome, reason: reason.trim(), decidedAt: new Date().toISOString(), decidedBy: VIEWER.id }, status });
    return check;
  }, [approval]);

  const undoDecision = useCallback((id: string) => dispatch({ type: "undoDecision", id }), []);

  /** Pre-execution summary. `submit` starts the simulated target system; success is set only on its confirmation. */
  const exec = useCallback((id: string, event: ExecEvent) => {
    dispatch({ type: "exec", id, event });
    const a = APPROVALS.find((x) => x.id === id);
    const cur = s.executions[id] ?? initialExec;
    const willSend = (event.type === "submit" && cur.step === "summary" && cur.confirmed) || (event.type === "retry" && cur.step === "failed");
    if (willSend && a?.simulate) {
      const fail = s.failNext || a.simulate.outcome === "failure";
      if (s.failNext) dispatch({ type: "failNext", value: false });
      clearTimeout(timers.current[`exec-${id}`]);
      timers.current[`exec-${id}`] = setTimeout(() => {
        if (fail) dispatch({ type: "exec", id, event: { type: "targetFailed", now: Date.now(), message: a.execution?.failureDetail ?? "המערכת לא אישרה." } });
        else {
          dispatch({ type: "exec", id, event: { type: "targetConfirmed", now: Date.now() } });
          dispatch({ type: "decide", decision: { approvalId: id, outcome: "approve", reason: "", decidedAt: new Date().toISOString(), decidedBy: VIEWER.id }, status: "approved" });
        }
      }, a.simulate.latencyMs);
    }
  }, [s.executions, s.failNext]);

  const patchTask = useCallback((id: string, patch: TaskPatch, expectedVersion: number) => {
    const cur = s.tasks.find((t) => t.id === id);
    if (!cur) return { ok: false as const, conflict: null };
    const r = applyPatch(cur, patch, expectedVersion, new Date().toISOString());
    if (r.ok) dispatch({ type: "replaceTask", task: r.task });
    return r.ok ? { ok: true as const, task: r.task, previous: cur } : { ok: false as const, conflict: r.conflict };
  }, [s.tasks]);

  const restoreTask = useCallback((task: Task) => dispatch({ type: "replaceTask", task }), []);

  const moveTask = useCallback((id: string, to: BoardColumn) => {
    const cur = s.tasks.find((t) => t.id === id);
    if (!cur) return null;
    const status = statusForColumn(cur, to);
    if (status === cur.status) return null;
    const next = { ...cur, status, version: cur.version + 1, updatedAt: new Date().toISOString() };
    dispatch({ type: "replaceTask", task: next });
    return cur;
  }, [s.tasks]);

  const createTask = useCallback((draft: Pick<Task, "title" | "dueDate" | "priority"> & Partial<Task>) => {
    const t: Task = {
      id: `t-new-${Date.now()}`, notes: "", status: "todo", assigneeId: VIEWER.id, participantIds: [], startDate: null,
      estimateMinutes: null, spentMinutes: 0, subtasks: [], checklist: [], dependsOn: [], links: {}, context: {}, comments: [],
      evidence: [], activity: [{ id: "a0", at: new Date().toISOString(), actorId: VIEWER.id, text: "נוצרה ביצירה מהירה", tone: "done" }],
      source: "mytiv", state: "planned", version: 1, updatedAt: new Date().toISOString(), parentId: null, ...draft,
    };
    dispatch({ type: "addTask", task: t });
    return t;
  }, []);
  const removeTask = useCallback((id: string) => dispatch({ type: "removeTask", id }), []);

  const timerStart = useCallback((taskId: string) => {
    const t = s.tasks.find((x) => x.id === taskId);
    if (!t) return;
    const log = s.timer ? { taskId: s.timer.taskId, minutes: minutesToLog(s.timer, Date.now()), at: Date.now() } : undefined;
    dispatch({ type: "timer", timer: startTimer(t, new Date().toISOString()), log });
  }, [s.tasks, s.timer]);
  const timerPause = useCallback(() => { if (s.timer) dispatch({ type: "timer", timer: pauseTimer(s.timer, Date.now()) }); }, [s.timer]);
  const timerResume = useCallback(() => { if (s.timer) dispatch({ type: "timer", timer: resumeTimer(s.timer, new Date().toISOString()) }); }, [s.timer]);
  const timerStop = useCallback(() => {
    if (!s.timer) return null;
    const minutes = minutesToLog(s.timer, Date.now());
    const stopped = s.timer;
    const task = s.tasks.find((t) => t.id === stopped.taskId);
    if (task) dispatch({ type: "replaceTask", task: { ...task, spentMinutes: task.spentMinutes + minutes, version: task.version + 1 } });
    dispatch({ type: "timer", timer: null, log: { taskId: stopped.taskId, minutes, at: Date.now() } });
    return { stopped, minutes, task };
  }, [s.timer, s.tasks]);
  const timerRestore = useCallback((t: ActiveTimer, task?: Task) => {
    dispatch({ type: "timer", timer: { ...t, startedAt: new Date().toISOString() } });
    if (task) dispatch({ type: "replaceTask", task });
  }, []);

  const startJob = useCallback((job: Omit<Job, "startedAt">) => {
    const j = { ...job, startedAt: Date.now() };
    dispatch({ type: "job", job: j });
    dispatch({ type: "tick", at: j.startedAt });
    scheduleJobNotice(j);
    return j;
  }, [scheduleJobNotice]);
  const cancelJob = useCallback((id: string) => { clearTimeout(timers.current[id]); const at = Date.now(); dispatch({ type: "cancelJob", id, at }); dispatch({ type: "tick", at }); }, []);

  return useMemo(() => ({
    hydrated, now: DEMO_NOW, viewer: VIEWER, state: s,
    approval, decide, undoDecision, exec, resetExec: (id: string) => dispatch({ type: "resetExec", id }),
    patchTask, restoreTask, moveTask, createTask, removeTask,
    timerStart, timerPause, timerResume, timerStop, timerRestore,
    startJob, cancelJob,
    setFormats: (designId: string, formats: string[]) => dispatch({ type: "formats", designId, formats }),
    readNotifications: () => dispatch({ type: "readNotifications" }),
    setFailNext: (value: boolean) => dispatch({ type: "failNext", value }),
    reset: () => dispatch({ type: "reset" }),
  }), [hydrated, s, approval, decide, undoDecision, exec, patchTask, restoreTask, moveTask, createTask, removeTask, timerStart, timerPause, timerResume, timerStop, timerRestore, startJob, cancelJob]);
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
