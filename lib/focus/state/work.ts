import type { ActiveTimer, BoardColumn, MyTasksBuckets, Task, TaskPatch, WorkCapabilities, WorkRole } from "@/lib/focus/contracts/work";
import type { Priority } from "@/lib/focus/contracts/status";
import { daysBetween } from "@/lib/focus/format";

/**
 * Pure Mytiv Work rules shared by every view and unit-tested (tests/focus/work.test.ts): buckets, Kanban moves,
 * parent/sub-task and dependency rules, patches with optimistic concurrency, permissions, quick-create parsing,
 * manual time and the timer. The demo store and, later, the pkg1 adapter call these.
 */
const OPEN = (t: Task) => t.status !== "done" && t.status !== "cancelled";

/** My Tasks buckets — by time, never set by hand (handoff: "מסודר לפי זמן"). */
export function bucketsFor(tasks: Task[], viewerId: string, now: string): MyTasksBuckets {
  const mine = tasks.filter((t) => OPEN(t) && (t.assigneeId === viewerId || t.participantIds.includes(viewerId)));
  const b: MyTasksBuckets = { today: [], overdue: [], soon: [], blocked: [], waitingOnOthers: [], noDate: [], unmapped: [] };
  for (const t of mine) {
    if (t.status === "unknown") b.unmapped.push(t);
    else if (t.status === "blocked" || isBlocked(t, tasks)) b.blocked.push(t);
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

export const openCount = (b: MyTasksBuckets) => b.today.length + b.overdue.length + b.soon.length + b.blocked.length + b.waitingOnOthers.length + b.noDate.length + b.unmapped.length;

// ---------- dependencies & hierarchy ----------
/** Unfinished tasks this one depends on. */
export const openBlockers = (t: Task, all: Task[]) =>
  t.dependsOn.map((d) => all.find((x) => x.id === d.id)).filter((d): d is Task => !!d && OPEN(d));
export const isBlocked = (t: Task, all: Task[]) => openBlockers(t, all).length > 0;
export const childrenOf = (t: Task, all: Task[]) => all.filter((x) => x.parentId === t.id);
/** Tasks that wait for this one (reverse dependency) — "חוסם: …". */
export const blocking = (t: Task, all: Task[]) => all.filter((x) => x.dependsOn.some((d) => d.id === t.id) && OPEN(x));

export type Gate = { ok: true } | { ok: false; reason: string };

/** Can the task be completed? Not while a dependency is open, an own child task is open, or the status is unmapped. */
export function canComplete(t: Task, all: Task[]): Gate {
  if (t.status === "unknown") return { ok: false, reason: "הסטטוס במקור לא ממופה. סגירה מתבצעת רק לפי בדיקת המקור." };
  const blockers = openBlockers(t, all);
  if (blockers.length) return { ok: false, reason: `חסום ע״י "${blockers[0].title}". אפשר לסמן כבוצע אחרי שהתלות תושלם.` };
  const kids = childrenOf(t, all).filter(OPEN);
  if (kids.length) return { ok: false, reason: `יש ${kids.length} תת־משימות פתוחות. סגור אותן קודם.` };
  return { ok: true };
}

/** Can the task be started (moved to in progress)? Not while blocked by an open dependency. */
export function canStart(t: Task, all: Task[]): Gate {
  if (t.status === "unknown") return { ok: false, reason: "הסטטוס במקור לא ממופה." };
  const blockers = openBlockers(t, all);
  return blockers.length ? { ok: false, reason: `חסום ע״י "${blockers[0].title}".` } : { ok: true };
}

/** A dependency must stay in the same project and must not create a cycle (pkg1 plan: same-project `blocks` only). */
export function canDepend(t: Task, on: Task, all: Task[]): Gate {
  if (t.id === on.id) return { ok: false, reason: "משימה לא יכולה לחכות לעצמה." };
  if ((t.links.projectId ?? null) !== (on.links.projectId ?? null)) return { ok: false, reason: "תלות אפשרית רק בתוך אותו פרויקט." };
  const seen = new Set<string>();
  const reaches = (from: Task): boolean => {
    if (from.id === t.id) return true;
    if (seen.has(from.id)) return false;
    seen.add(from.id);
    return from.dependsOn.some((d) => { const x = all.find((y) => y.id === d.id); return !!x && reaches(x); });
  };
  return reaches(on) ? { ok: false, reason: "התלות יוצרת מעגל." } : { ok: true };
}

// ---------- board ----------
export function columnOf(t: Task, all: Task[] = []): BoardColumn {
  if (t.status === "done" || t.status === "cancelled") return "done";
  if (t.status === "blocked" || t.status === "waiting" || isBlocked(t, all)) return "blockedOrWaiting";
  if (t.status === "in_progress") return "in_progress";
  return "todo";
}

export function boardColumns(tasks: Task[]): Record<BoardColumn, Task[]> {
  const c: Record<BoardColumn, Task[]> = { todo: [], in_progress: [], blockedOrWaiting: [], done: [] };
  for (const t of tasks) if (t.status !== "unknown") c[columnOf(t, tasks)].push(t);
  return c;
}

export const BOARD_ORDER: BoardColumn[] = ["todo", "in_progress", "blockedOrWaiting", "done"];

/** The status a column means. Moving into "blocked/waiting" keeps a waiting task waiting. */
export function statusForColumn(t: Task, to: BoardColumn): Task["status"] {
  if (to === "todo") return "todo";
  if (to === "in_progress") return "in_progress";
  if (to === "done") return "done";
  return t.status === "waiting" ? "waiting" : "blocked";
}

/** Validate a Kanban move (pkg1 plan: POST tasks/[id]/move → 409 move_blocked). */
export function checkMove(t: Task, to: BoardColumn, all: Task[]): Gate {
  if (columnOf(t, all) === to) return { ok: false, reason: "המשימה כבר בעמודה הזו." };
  if (to === "done") return canComplete(t, all);
  if (to === "in_progress") return canStart(t, all);
  if (to === "blockedOrWaiting" && !t.blockedReason && t.status !== "waiting") return { ok: true };
  return { ok: true };
}

// ---------- patches ----------
export type PatchResult = { ok: true; task: Task } | { ok: false; conflict: Task } | { ok: false; refused: string };

/** Apply a patch only if the caller saw the current version; otherwise report a conflict (nothing is overwritten). */
export function applyPatch(current: Task, patch: TaskPatch, expectedVersion: number, now: string, all: Task[] = [current]): PatchResult {
  if (current.version !== expectedVersion) return { ok: false, conflict: current };
  if (patch.status === "done") { const g = canComplete(current, all); if (!g.ok) return { ok: false, refused: g.reason }; }
  if (patch.status === "in_progress") { const g = canStart(current, all); if (!g.ok) return { ok: false, refused: g.reason }; }
  if (patch.title !== undefined && !patch.title.trim()) return { ok: false, refused: "כותרת היא שדה חובה." };
  if (patch.startDate && (patch.dueDate ?? current.dueDate) && patch.startDate > (patch.dueDate ?? current.dueDate)!) return { ok: false, refused: "תאריך ההתחלה אחרי היעד." };
  if (patch.dueDate && current.startDate && patch.dueDate < current.startDate) return { ok: false, refused: "היעד לפני תאריך ההתחלה." };
  const { subtask, addSubtask, checklistItem, addChecklistItem, addComment, addDependency, ...fields } = patch;
  if (addDependency) {
    const on = all.find((x) => x.id === addDependency.id);
    if (on) { const g = canDepend(current, on, all); if (!g.ok) return { ok: false, refused: g.reason }; }
  }
  const next: Task = { ...current, ...fields, version: current.version + 1, updatedAt: now };
  if (subtask) next.subtasks = current.subtasks.map((s) => (s.id === subtask.id ? { ...s, done: subtask.done } : s));
  if (addSubtask) next.subtasks = [...current.subtasks, { id: addSubtask.id, title: addSubtask.title, done: false }];
  if (checklistItem) next.checklist = current.checklist.map((c) => (c.id === checklistItem.id ? { ...c, checked: checklistItem.checked } : c));
  if (addChecklistItem) next.checklist = [...current.checklist, { id: addChecklistItem.id, label: addChecklistItem.label, checked: false }];
  if (addComment) next.comments = [...current.comments, addComment];
  if (addDependency) next.dependsOn = [...current.dependsOn, addDependency];
  return { ok: true, task: next };
}

// ---------- permissions ----------
export type WorkAction = "edit" | "assign" | "changeStatus" | "complete" | "delete" | "comment" | "trackTime" | "create";

/** Matrix (pkg1 plan §8): owner/admin all; member edits work but cannot delete; viewer reads and comments only. */
export function canDo(role: WorkRole, action: WorkAction, caps?: Partial<WorkCapabilities>): boolean {
  const capFor: Partial<Record<WorkAction, keyof WorkCapabilities>> = { assign: "assign", changeStatus: "changeStatus", complete: "changeStatus", comment: "comment", trackTime: "trackTime", create: "create" };
  const cap = capFor[action];
  if (caps && cap && caps[cap] === false) return false;
  if (role === "viewer") return action === "comment";
  if (role === "member") return action !== "delete";
  return true;
}

// ---------- quick create ----------
export type QuickDraft = { title: string; dueDate: string | null; dueLabel: string | null; priority: Priority | null; assignee: string | null; client: string | null };

const PRI: Record<string, Priority> = { "דחוף": "urgent", "גבוה": "high", "בינוני": "medium", "נמוך": "low" };

/** Parse "לעצב באנר מחר גבוה @דנה #UMINO" (handoff W1/W6 quick create). Unknown @/# tokens stay null — never guessed. */
export function parseQuickTask(text: string, now: string, people: { id: string; name: string }[], clients: string[]): QuickDraft & { assigneeId: string | null } {
  let title = text;
  let dueDate: string | null = null, dueLabel: string | null = null, priority: Priority | null = null, assignee: string | null = null, assigneeId: string | null = null, client: string | null = null;
  const take = (re: RegExp) => { const m = title.match(re); if (m) title = title.replace(m[0], " "); return m; };
  const day = (offset: number) => { const d = new Date(new Date(now).getTime() + offset * 86_400_000); return d.toISOString().slice(0, 10); };
  if (take(/(^|\s)היום(?=\s|$)/)) { dueDate = day(0); dueLabel = "היום"; }
  else if (take(/(^|\s)מחר(?=\s|$)/)) { dueDate = day(1); dueLabel = "מחר"; }
  const p = take(/(^|\s)(דחוף|גבוה|בינוני|נמוך)(?=\s|$)/);
  if (p) priority = PRI[p[2]];
  const a = take(/@(\S+)/);
  if (a) { const person = people.find((x) => x.name === a[1]); assignee = person ? person.name : null; assigneeId = person?.id ?? null; }
  const c = take(/#(\S+)/);
  if (c) client = clients.find((x) => x.toLowerCase() === c[1].toLowerCase()) ?? null;
  return { title: title.replace(/\s+/g, " ").trim(), dueDate, dueLabel, priority, assignee, assigneeId, client };
}

// ---------- manual time ----------
/** "1:30" → 90 · "90" → 90 · "1.5h" → 90 · "45m" → 45. Returns null for anything else or outside 1..1440. */
export function parseDuration(input: string): number | null {
  const s = input.trim();
  let m: RegExpMatchArray | null;
  let minutes: number | null = null;
  if ((m = s.match(/^(\d{1,2}):([0-5]\d)$/))) minutes = +m[1] * 60 + +m[2];
  else if ((m = s.match(/^(\d+(?:\.\d+)?)\s*(h|ש|שע׳)$/))) minutes = Math.round(+m[1] * 60);
  else if ((m = s.match(/^(\d+)\s*(m|ד|דק׳)?$/))) minutes = +m[1];
  return minutes != null && minutes >= 1 && minutes <= 1440 ? minutes : null;
}

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
/** Minutes to log when the timer is stopped (rounded up to a whole minute; nothing under 30 seconds). */
export const minutesToLog = (t: ActiveTimer, nowMs: number) => { const ms = elapsedOf(t, nowMs); return ms < 30_000 ? 0 : Math.ceil(ms / 60_000); };

/** Starting a timer while another runs: one timer per person — the running one is stopped and logged first. */
export function switchTimer(current: ActiveTimer | null, task: Pick<Task, "id" | "title" | "context">, nowIso: string): { next: ActiveTimer; logged: { taskId: string; minutes: number } | null; conflict: boolean } {
  const nowMs = new Date(nowIso).getTime();
  if (current && current.taskId === task.id) return { next: resumeTimer(current, nowIso), logged: null, conflict: false };
  const logged = current ? { taskId: current.taskId, minutes: minutesToLog(current, nowMs) } : null;
  return { next: startTimer(task, nowIso), logged, conflict: !!current };
}
