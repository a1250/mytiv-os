import type { ActiveTimer, BoardColumn, CapabilityMap, MyTasksBuckets, Task, TaskPatch, WorkCapabilities, WorkRole, WriteResult } from "@/lib/focus/contracts/work";
import { WORK_STATUSES, type Priority, type WorkDisplayStatus, type WorkStatus } from "@/lib/focus/contracts/status";
import { daysBetween } from "@/lib/focus/format";

/**
 * Pure Mytiv Work rules shared by every view and unit-tested (tests/focus-work.vitest.ts): buckets, Kanban moves,
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
    else if (displayStatus(t, tasks) === "blocked") b.blocked.push(t);
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

export type Gate = { ok: true } | { ok: false; reason: string };

// ---------- dependencies & hierarchy ----------
/** Unfinished tasks this one depends on. */
export const openBlockers = (t: Task, all: Task[]) =>
  t.dependsOn.map((d) => all.find((x) => x.id === d.id)).filter((d): d is Task => !!d && OPEN(d));
export const isBlocked = (t: Task, all: Task[]) => openBlockers(t, all).length > 0;
/**
 * A manual block: status `waiting` + the business key `blocked` (pkg1: a status key under category `waiting`) and/or
 * a written reason. Focus always writes both; a source row may carry the key without a reason (no column yet).
 */
export const isManuallyBlocked = (t: Task) => t.status === "waiting" && (t.statusKey === "blocked" || !!t.blockedReason?.trim());
/** What the UI shows. "blocked" is derived — from an open dependency or a manual block — and never stored. */
export function displayStatus(t: Task, all: Task[]): WorkDisplayStatus {
  if (!OPEN(t) || t.status === "unknown") return t.status;
  return isBlocked(t, all) || isManuallyBlocked(t) ? "blocked" : t.status;
}
/** The text of a manual block: its reason, or — for a source status mapped to blocked without one — say so. */
export const manualBlockText = (t: Task): string => t.blockedReason?.trim() || "סומנה כחסומה במקור, בלי סיבה כתובה.";

/** Why a task shows as blocked, in words: the manual reason, else the open dependency; null when it is not blocked. */
export function blockedWhy(t: Task, all: Task[]): string | null {
  if (isManuallyBlocked(t)) return manualBlockText(t);
  const b = openBlockers(t, all);
  return b.length ? `ממתין ל״${b[0].title}״${b.length > 1 ? ` ועוד ${b.length - 1}` : ""}.` : null;
}

/** For cards: what blocks the task — the first open dependency, or the manual reason; null when not blocked. */
export function blockInfo(t: Task, all: Task[]): { by: { id: string; title: string } | null; why: string } | null {
  if (displayStatus(t, all) !== "blocked") return null;
  const b = openBlockers(t, all)[0];
  return { by: b ? { id: b.id, title: b.title } : null, why: blockedWhy(t, all) ?? "" };
}

/**
 * Another domain's item (content card, campaign row, studio card) blocked by a task: returns "תלוי ב״<task title>״"
 * while that task is open and null once it is done or cancelled — read from the live task on every render, never a
 * copied sentence that outlives the block.
 */
export function blockedByTask(taskId: string | undefined, tasks: Task[]): string | null {
  const t = taskId ? tasks.find((x) => x.id === taskId) : undefined;
  return t && OPEN(t) ? `תלוי ב״${t.title}״` : null;
}

const CANONICAL: ReadonlySet<string> = new Set<WorkStatus>(WORK_STATUSES);
/**
 * Invariant of every stored task (checked on every patch, and over the fixtures in tests): the status is canonical,
 * and a block reason exists only on a `waiting` task and is never blank. "blocked + no reason" cannot be stored.
 */
export function taskInvariant(t: Task): Gate {
  if (!CANONICAL.has(t.status)) return { ok: false, reason: `"${t.status}" אינו סטטוס שנשמר. חסימה נגזרת מתלות פתוחה או מסיבה כתובה.` };
  if (t.blockedReason !== undefined && (t.status !== "waiting" || !t.blockedReason.trim())) return { ok: false, reason: "סיבת חסימה קיימת רק במשימה ממתינה ואינה ריקה." };
  if (t.statusKey === "blocked" && t.status !== "waiting") return { ok: false, reason: "המפתח \"חסום\" קיים רק תחת הסטטוס \"ממתין\"." };
  return { ok: true };
}

/**
 * Server stand-in: mint the next opaque concurrency token. Only the write path (applyPatch / revertTask, i.e. the
 * demo store today, the backend later) calls this — UI code never computes a token.
 */
export function nextVersion(v: string): string {
  const n = Number(/(\d+)$/.exec(v)?.[1] ?? 0);
  return `v${n + 1}`;
}
/**
 * Did only `actor` write task `id` between versions `from` and `to`? `writes` is the write lineage the store keeps
 * (`${id}@${version}` → the version it replaced + its writer). An open editor adopts its viewer's own writes made
 * elsewhere (timer, list toggles); a gap or anyone else's write in between is a conflict, never adopted.
 */
export function onlyOwnWrites(writes: Record<string, { prev: string; by?: string }>, id: string, from: string, to: string, actor: string): boolean {
  let v = to;
  for (let i = 0; i < 1000 && v !== from; i++) {
    const w = writes[`${id}@${v}`];
    if (!w || w.by !== actor) return false;
    v = w.prev;
  }
  return v === from;
}
export const childrenOf = (t: Task, all: Task[]) => all.filter((x) => x.parentId === t.id);
/** Tasks that wait for this one (reverse dependency) — "חוסם: …". */
export const blocking = (t: Task, all: Task[]) => all.filter((x) => x.dependsOn.some((d) => d.id === t.id) && OPEN(x));

/** Can the task be completed? Not while a dependency is open, an own child task is open, or the status is unmapped. */
export function canComplete(t: Task, all: Task[]): Gate {
  if (t.status === "unknown") return { ok: false, reason: "הסטטוס במקור לא ממופה. סגירה מתבצעת רק לפי בדיקת המקור." };
  const blockers = openBlockers(t, all);
  if (blockers.length) return { ok: false, reason: `חסום ע״י "${blockers[0].title}". אפשר לסמן כבוצע אחרי שהתלות תושלם.` };
  const kids = childrenOf(t, all).filter(OPEN);
  if (kids.length) return { ok: false, reason: `יש ${kids.length} תת־משימות פתוחות. סגור אותן קודם.` };
  return { ok: true };
}

/** Can a closed task be reopened? Not under a parent that is already done (a done parent never has open children). */
export function canReopen(t: Task, all: Task[]): Gate {
  const parent = t.parentId ? all.find((x) => x.id === t.parentId) : undefined;
  return parent && parent.status === "done" ? { ok: false, reason: `המשימה ההורה "${parent.title}" כבר סומנה כבוצעה. פתחו אותה קודם.` } : { ok: true };
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
  if (t.status === "waiting" || isBlocked(t, all)) return "blockedOrWaiting";
  if (t.status === "in_progress") return "in_progress";
  return "todo";
}

export function boardColumns(tasks: Task[]): Record<BoardColumn, Task[]> {
  const c: Record<BoardColumn, Task[]> = { todo: [], in_progress: [], blockedOrWaiting: [], done: [] };
  for (const t of tasks) if (t.status !== "unknown") c[columnOf(t, tasks)].push(t);
  return c;
}

export const BOARD_ORDER: BoardColumn[] = ["todo", "in_progress", "blockedOrWaiting", "done"];

/**
 * The canonical status a column means. "חסום / ממתין" stores `waiting` — a card shows as blocked there only when it
 * is (an open dependency, or a manual block with its reason); a move never creates a block without a reason.
 */
export function statusForColumn(to: BoardColumn): WorkStatus {
  if (to === "todo") return "todo";
  if (to === "in_progress") return "in_progress";
  if (to === "done") return "done";
  return "waiting";
}

/** Validate a Kanban move (pkg1 plan: POST tasks/[id]/move → 409 move_blocked). */
export function checkMove(t: Task, to: BoardColumn, all: Task[]): Gate {
  if (columnOf(t, all) === to) return { ok: false, reason: "המשימה כבר בעמודה הזו." };
  // a card shown in "חסום / ממתין" because of an open dependency: moving it to its own status changes nothing
  if (statusForColumn(to) === t.status) {
    const b = openBlockers(t, all);
    return { ok: false, reason: b.length ? `חסומה ע״י "${b[0].title}". היא תצא מהעמודה כשהתלות תושלם.` : "אין שינוי בסטטוס." };
  }
  if (to === "done") return canComplete(t, all);
  if (to === "in_progress") return canStart(t, all);
  return { ok: true };
}

// ---------- patches ----------
export type PatchResult = WriteResult;

const isOpen = (s: Task["status"]) => s !== "done" && s !== "cancelled";

/**
 * Apply a patch only if the caller saw the current token; otherwise report a conflict (nothing is overwritten).
 * Every rule runs here, so the demo store and (later) the adapter share one write path. `actor` = who writes.
 */
export function applyPatch(current: Task, patch: TaskPatch, expectedVersion: string, now: string, all: Task[] = [current], actor?: Task["updatedBy"]): PatchResult {
  if (current.version !== expectedVersion) return { ok: false, conflict: current };
  if (patch.status !== undefined && isOpen(patch.status) && !isOpen(current.status)) { const g = canReopen(current, all); if (!g.ok) return { ok: false, refused: g.reason }; }
  if (patch.logMinutes !== undefined && !(Number.isInteger(patch.logMinutes) && patch.logMinutes >= 1 && patch.logMinutes <= 1440)) return { ok: false, refused: "זמן לרישום: בין דקה ל־24 שעות." };
  // the type already excludes "blocked"; this guards untyped input (adapters, persisted demo state)
  if (patch.status !== undefined && !CANONICAL.has(patch.status)) return { ok: false, refused: `"${patch.status}" אינו סטטוס שאפשר לשמור. לחסימה ידנית יש לכתוב סיבה.` };
  if (patch.block) {
    if (!patch.block.reason?.trim()) return { ok: false, refused: "חסימה ידנית דורשת סיבה כתובה." };
    if (!OPEN(current) || current.status === "unknown") return { ok: false, refused: "אפשר לחסום רק משימה פתוחה עם סטטוס ממופה." };
  }
  if (patch.status === "done") { const g = canComplete(current, all); if (!g.ok) return { ok: false, refused: g.reason }; }
  if (patch.status === "in_progress") { const g = canStart(current, all); if (!g.ok) return { ok: false, refused: g.reason }; }
  if (patch.title !== undefined && !patch.title.trim()) return { ok: false, refused: "כותרת היא שדה חובה." };
  if (patch.startDate && (patch.dueDate ?? current.dueDate) && patch.startDate > (patch.dueDate ?? current.dueDate)!) return { ok: false, refused: "תאריך ההתחלה אחרי היעד." };
  if (patch.dueDate && current.startDate && patch.dueDate < current.startDate) return { ok: false, refused: "היעד לפני תאריך ההתחלה." };
  const { subtask, addSubtask, checklistItem, addChecklistItem, addComment, addDependency, block, unblock, logMinutes, ...fields } = patch;
  if (addDependency) {
    const on = all.find((x) => x.id === addDependency.id);
    if (on) { const g = canDepend(current, on, all); if (!g.ok) return { ok: false, refused: g.reason }; }
  }
  const next: Task = { ...current, ...fields, version: nextVersion(current.version), updatedAt: now, ...(actor ? { updatedBy: actor } : {}) };
  // logged time is an increment; a source that does not report time stays unknown (null), never "0 + n"
  if (logMinutes !== undefined && current.spentMinutes != null) next.spentMinutes = current.spentMinutes + logMinutes;
  if (subtask) next.subtasks = current.subtasks.map((s) => (s.id === subtask.id ? { ...s, done: subtask.done } : s));
  if (addSubtask) next.subtasks = [...current.subtasks, { id: addSubtask.id, title: addSubtask.title, done: false }];
  if (checklistItem) next.checklist = current.checklist.map((c) => (c.id === checklistItem.id ? { ...c, checked: checklistItem.checked } : c));
  if (addChecklistItem) next.checklist = [...current.checklist, { id: addChecklistItem.id, label: addChecklistItem.label, checked: false }];
  if (addComment) next.comments = [...current.comments, addComment];
  if (addDependency) next.dependsOn = [...current.dependsOn, addDependency];
  // a block reason lives only on a waiting task: leaving `waiting` or unblocking drops it; blocking sets both together
  if (unblock || (fields.status !== undefined && fields.status !== "waiting")) { delete next.blockedReason; if (next.statusKey === "blocked") delete next.statusKey; }
  if (block) { next.status = "waiting"; next.statusKey = "blocked"; next.blockedReason = block.reason.trim(); }
  const inv = taskInvariant(next);
  if (!inv.ok) return { ok: false, refused: inv.reason };
  return { ok: true, task: next };
}

/**
 * Undo as a compensating write: back to `previous` only if the task is still at the token the undone action
 * produced (otherwise someone changed it since — nothing is overwritten), and only if the rules still allow the
 * restored state (e.g. reopening under a parent that was completed meanwhile is refused).
 */
export function revertTask(current: Task, previous: Task, expectedVersion: string, now: string, all: Task[], actor?: Task["updatedBy"]): PatchResult {
  if (current.id !== previous.id) return { ok: false, refused: "משימה שגויה." };
  if (current.version !== expectedVersion) return { ok: false, refused: "המשימה השתנתה מאז הפעולה, ולכן הביטול לא בוצע (כדי לא לדרוס שינוי חדש יותר)." };
  const next: Task = { ...previous, version: nextVersion(current.version), updatedAt: now, ...(actor ? { updatedBy: actor } : {}) };
  const others = all.map((t) => (t.id === next.id ? next : t));
  if (next.status === "done" && current.status !== "done") { const g = canComplete(next, others); if (!g.ok) return { ok: false, refused: g.reason }; }
  if (isOpen(next.status) && !isOpen(current.status)) { const g = canReopen(next, others); if (!g.ok) return { ok: false, refused: g.reason }; }
  const inv = taskInvariant(next);
  return inv.ok ? { ok: true, task: next } : { ok: false, refused: inv.reason };
}

// ---------- permissions ----------
export type WorkAction = "edit" | "assign" | "changeStatus" | "complete" | "delete" | "comment" | "trackTime" | "create" | "setDueDate" | "depend" | "checklist" | "nest";

/** Which source capability an action needs (actions without one — edit, delete, priority — are gated by role only). */
export const CAPABILITY_FOR: Partial<Record<WorkAction, keyof WorkCapabilities>> = { assign: "assign", changeStatus: "changeStatus", complete: "changeStatus", comment: "comment", trackTime: "trackTime", create: "create", setDueDate: "setDueDate", depend: "depend", checklist: "checklist", nest: "nest" };

/**
 * Matrix (pkg1 plan §8): owner/admin all; member edits work but cannot delete; viewer reads and comments only.
 * With `caps` (the task source's capability map), an action whose capability is not `live` is refused — unless
 * `allowPlanned` (the fixture demo, where planned capabilities run on fixtures, labelled "מתוכנן").
 */
export function canDo(role: WorkRole, action: WorkAction, caps?: Partial<CapabilityMap>, allowPlanned = false): boolean {
  const cap = CAPABILITY_FOR[action];
  if (caps && cap && caps[cap] !== undefined && caps[cap] !== "live" && !(caps[cap] === "planned" && allowPlanned)) return false;
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
/** Minutes to log when the timer is stopped: whole minutes, nothing under 30 seconds, never more than 24 hours. */
export const MAX_LOG_MINUTES = 1440;
export const minutesToLog = (t: ActiveTimer, nowMs: number) => { const ms = elapsedOf(t, nowMs); return ms < 30_000 ? 0 : Math.min(MAX_LOG_MINUTES, Math.ceil(ms / 60_000)); };

/** Starting a timer while another runs: one timer per person — the running one is stopped and logged first. */
export function switchTimer(current: ActiveTimer | null, task: Pick<Task, "id" | "title" | "context">, nowIso: string): { next: ActiveTimer; logged: { taskId: string; minutes: number } | null; conflict: boolean } {
  const nowMs = new Date(nowIso).getTime();
  if (current && current.taskId === task.id) return { next: resumeTimer(current, nowIso), logged: null, conflict: false };
  const logged = current ? { taskId: current.taskId, minutes: minutesToLog(current, nowMs) } : null;
  return { next: startTimer(task, nowIso), logged, conflict: !!current };
}
