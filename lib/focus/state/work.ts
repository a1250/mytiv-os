import type { ActiveTimer, BoardColumn, MyTasksBuckets, Task, TaskPatch } from "@/lib/focus/contracts/work";
import { daysBetween } from "@/lib/focus/format";

/**
 * Pure Mytiv Work logic shared by every view (and unit-tested): which bucket a task belongs to, Kanban columns,
 * patches with optimistic concurrency, and the timer. The demo store and, later, the pkg1 adapter call these.
 */

/** My Tasks buckets — by time, never set by hand (handoff: "מסודר לפי זמן"). */
export function bucketsFor(tasks: Task[], viewerId: string, now: string): MyTasksBuckets {
  const mine = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled" && (t.assigneeId === viewerId || t.participantIds.includes(viewerId)));
  const b: MyTasksBuckets = { today: [], overdue: [], soon: [], blocked: [], waitingOnOthers: [], noDate: [] };
  for (const t of mine) {
    if (t.status === "blocked") b.blocked.push(t);
    else if (t.status === "waiting") b.waitingOnOthers.push(t);
    else if (!t.dueDate) b.noDate.push(t);
    else {
      const d = daysBetween(now, t.dueDate);
      if (d < 0) b.overdue.push(t);
      else if (d === 0) b.today.push(t);
      else b.soon.push(t);
    }
  }
  const byDue = (a: Task, c: Task) => (a.dueDate ?? "9").localeCompare(c.dueDate ?? "9");
  b.overdue.sort(byDue); b.soon.sort(byDue);
  return b;
}

export const openCount = (b: MyTasksBuckets) => b.today.length + b.overdue.length + b.soon.length + b.blocked.length + b.waitingOnOthers.length + b.noDate.length;

export function columnOf(t: Task): BoardColumn {
  if (t.status === "done" || t.status === "cancelled") return "done";
  if (t.status === "blocked" || t.status === "waiting") return "blockedOrWaiting";
  if (t.status === "in_progress") return "in_progress";
  return "todo";
}

export function boardColumns(tasks: Task[]): Record<BoardColumn, Task[]> {
  const c: Record<BoardColumn, Task[]> = { todo: [], in_progress: [], blockedOrWaiting: [], done: [] };
  for (const t of tasks) c[columnOf(t)].push(t);
  return c;
}

/** Moving a card sets the status that column means. Moving into "blocked/waiting" keeps a waiting task waiting. */
export function statusForColumn(t: Task, to: BoardColumn): Task["status"] {
  if (to === "todo") return "todo";
  if (to === "in_progress") return "in_progress";
  if (to === "done") return "done";
  return t.status === "waiting" ? "waiting" : "blocked";
}

export const BOARD_ORDER: BoardColumn[] = ["todo", "in_progress", "blockedOrWaiting", "done"];

export type PatchResult = { ok: true; task: Task } | { ok: false; conflict: Task };

/** Apply a patch only if the caller saw the current version (pkg1 `tasks.version`); otherwise report a conflict. */
export function applyPatch(current: Task, patch: TaskPatch, expectedVersion: number, now: string): PatchResult {
  if (current.version !== expectedVersion) return { ok: false, conflict: current };
  const { subtask, checklistItem, ...fields } = patch;
  const next: Task = { ...current, ...fields, version: current.version + 1, updatedAt: now };
  if (subtask) next.subtasks = current.subtasks.map((s) => (s.id === subtask.id ? { ...s, done: subtask.done } : s));
  if (checklistItem) next.checklist = current.checklist.map((c) => (c.id === checklistItem.id ? { ...c, checked: checklistItem.checked } : c));
  return { ok: true, task: next };
}

/** Is the task blocked by an unfinished dependency? */
export const blockedBy = (t: Task, all: Task[]) =>
  t.dependsOn.map((d) => all.find((x) => x.id === d.id) ?? null).filter((d): d is Task => !!d && d.status !== "done");

// ---------- timer (persisted in localStorage in the demo → POST /work/timers in pkg1) ----------
export function elapsedOf(t: ActiveTimer, nowMs: number) {
  return t.running ? t.elapsedMs + Math.max(0, nowMs - new Date(t.startedAt).getTime()) : t.elapsedMs;
}
export function startTimer(task: Pick<Task, "id" | "title" | "context">, nowIso: string): ActiveTimer {
  return { taskId: task.id, title: task.title, context: [task.context.client, task.context.project].filter(Boolean).join(" · "), startedAt: nowIso, elapsedMs: 0, running: true };
}
export function pauseTimer(t: ActiveTimer, nowMs: number): ActiveTimer {
  return t.running ? { ...t, elapsedMs: elapsedOf(t, nowMs), running: false } : t;
}
export function resumeTimer(t: ActiveTimer, nowIso: string): ActiveTimer {
  return t.running ? t : { ...t, startedAt: nowIso, running: true };
}
/** Minutes to log when the timer is stopped (rounded up to a whole minute). */
export const minutesToLog = (t: ActiveTimer, nowMs: number) => Math.ceil(elapsedOf(t, nowMs) / 60_000);
