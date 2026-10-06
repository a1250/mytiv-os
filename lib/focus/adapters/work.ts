import type { ActivityEvent, CapabilityMap, Task } from "@/lib/focus/contracts/work";
import type { Priority, WorkStatus } from "@/lib/focus/contracts/status";

/**
 * Mytiv Work (DB, migrations 0012–0013) → the Focus Work contract. Pure: the server read model (lib/work/read.ts)
 * returns these rows; the business-scope store maps them with `taskFromRow`. Ids are the DB uuids; the version is
 * the DB integer as an opaque string.
 */
export type WorkTaskRow = {
  id: string; title: string; notes: string; statusKey: string | null; statusLabel: string | null; category: string | null; legacyStatus: string;
  priority: string; ownerUserId: string | null; startOn: string | null; dueOn: string | null; estimateMinutes: number | null;
  parentId: string | null; projectId: string | null; leadId: string | null; projectName: string | null; client: string | null;
  nextAction: string | null; followUpOn: string | null; blockedReason: string | null; waitingOn: string | null;
  version: number; updatedAt: string; updatedBy: string | null;
  participants: string[]; dependsOn: { id: string; title: string }[];
  children: { id: string; title: string; done: boolean; ownerUserId: string | null; dueOn: string | null }[];
  activity: { id: string; at: string; actorId: string; event: string; detail: Record<string, unknown> }[];
  /** 0015: comments (oldest first) and the total logged minutes; absent on a server without 0015 */
  comments?: { id: string; authorId: string; at: string; text: string }[];
  spentMinutes?: number | null;
};
export type WorkPersonRow = { id: string; name: string; role: string; active: boolean };
export type WorkProjectRow = { id: string; name: string; client: string | null; workSource: "clickup" | "mytiv" };

const BY_CATEGORY: Record<string, WorkStatus> = { open: "todo", active: "in_progress", review: "in_progress", waiting: "waiting", done: "done", cancelled: "cancelled" };
const BY_LEGACY: Record<string, WorkStatus> = { backlog: "todo", todo: "todo", in_progress: "in_progress", waiting: "waiting", done: "done" };
/** The canonical category decides; a legacy row without one (before the backfill) maps from its old status; else unknown. */
export function statusOf(category: string | null, legacy: string): WorkStatus {
  if (category) return BY_CATEGORY[category] ?? "unknown";
  return BY_LEGACY[legacy] ?? "unknown";
}
/** Focus status → the business's system status key (0012 templates). */
export const STATUS_KEY: Record<Exclude<WorkStatus, "unknown">, string> = { todo: "todo", in_progress: "in_progress", waiting: "waiting", done: "done", cancelled: "cancelled" };

const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];
const WAITING_ON: Record<string, string> = { client: "הלקוח", contractor: "ספק חיצוני", internal: "הצוות" };
const FIELD_WORDS: Record<string, string> = {
  statusKey: "סטטוס", block: "חסימה", unblock: "הסרת חסימה", ownerUserId: "אחראי", dueOn: "תאריך יעד", startOn: "תאריך התחלה",
  priority: "עדיפות", title: "כותרת", notes: "תיאור", nextAction: "הצעד הבא", followUpOn: "מעקב", estimateMinutes: "הערכת זמן",
  addDependency: "תלות", removeDependency: "הסרת תלות", addParticipant: "משתתף", removeParticipant: "הסרת משתתף",
};

export function activityOf(rows: WorkTaskRow["activity"]): ActivityEvent[] {
  return rows.map((e) => {
    if (e.event === "created") return { id: e.id, at: e.at, actorId: e.actorId, text: "יצר/ה את המשימה", tone: "default" as const };
    if (e.event === "commented") return { id: e.id, at: e.at, actorId: e.actorId, text: "הוסיף/ה תגובה", tone: "default" as const };
    if (e.event === "time_logged") return { id: e.id, at: e.at, actorId: e.actorId, text: `רשם/ה ${Number(e.detail.minutes) || 0} דק׳ (${e.detail.source === "timer" ? "טיימר" : "ידני"})`, tone: "default" as const };
    const fields = Array.isArray(e.detail.fields) ? (e.detail.fields as string[]) : [];
    const to = (e.detail.to ?? {}) as { status?: string };
    const done = to.status === "done" && fields.includes("statusKey");
    return { id: e.id, at: e.at, actorId: e.actorId, text: `עדכן/ה: ${fields.map((f) => FIELD_WORDS[f] ?? f).join(", ") || "פרטים"}`, tone: done ? ("done" as const) : ("default" as const) };
  });
}

export function taskFromRow(r: WorkTaskRow): Task {
  const status = statusOf(r.category, r.legacyStatus);
  return {
    id: r.id, title: r.title, notes: r.notes ?? "",
    status, statusLabel: r.statusLabel ?? undefined, statusKey: r.statusKey ?? undefined,
    priority: PRIORITIES.includes(r.priority as Priority) ? (r.priority as Priority) : "medium",
    assigneeId: r.ownerUserId, participantIds: r.participants ?? [],
    startDate: r.startOn, dueDate: r.dueOn && /^\d{4}-\d{2}-\d{2}$/.test(r.dueOn) ? r.dueOn : null,
    estimateMinutes: r.estimateMinutes,
    spentMinutes: typeof r.spentMinutes === "number" ? r.spentMinutes : null, // without 0015 the time is unknown, never 0
    subtasks: (r.children ?? []).map((c) => ({ id: c.id, title: c.title, done: c.done, ...(c.ownerUserId ? { assigneeId: c.ownerUserId } : {}), ...(c.dueOn ? { dueDate: c.dueOn } : {}) })),
    checklist: [],
    parentId: r.parentId,
    dependsOn: r.dependsOn ?? [],
    links: { ...(r.projectId ? { projectId: r.projectId } : {}), ...(r.leadId ? { leadId: r.leadId } : {}) },
    context: { ...(r.client ? { client: r.client } : {}), ...(r.projectName ? { project: r.projectName } : {}) },
    ...(r.nextAction ? { nextAction: r.nextAction } : {}),
    ...(status === "waiting" && r.waitingOn ? { waitingFor: WAITING_ON[r.waitingOn] ?? r.waitingOn } : {}),
    ...(status === "waiting" && r.blockedReason?.trim() ? { blockedReason: r.blockedReason } : {}),
    followUp: r.followUpOn,
    comments: (r.comments ?? []).map((c) => ({ id: c.id, authorId: c.authorId, at: c.at, text: c.text })), evidence: [],
    activity: activityOf(r.activity ?? []),
    source: "mytiv", state: "live",
    version: String(r.version),
    updatedAt: r.updatedAt,
    ...(r.updatedBy ? { updatedBy: r.updatedBy } : {}),
  };
}

/**
 * What the Mytiv source supports today in a business scope (live = a DB function backs it; planned = not connected
 * yet, refused outside the demo). Comments and logged time are live with 0015; the checklist is not connected.
 */
export const MYTIV_LIVE_CAPABILITIES: CapabilityMap = {
  changeStatus: "live", assign: "live", create: "live", setDueDate: "live", depend: "live", nest: "live",
  comment: "live", trackTime: "live", checklist: "planned",
};

/** A business member as a Focus person (initial for avatars; admin shown as manager). */
export function personFromRow(p: WorkPersonRow): import("@/lib/focus/contracts/common").Person {
  const role = p.role === "owner" ? "owner" : p.role === "admin" ? "manager" : "member";
  return { id: p.id, name: p.name, initial: Array.from(p.name.trim())[0] ?? "?", role };
}

/** The server's patch vocabulary (lib/work/commands.ts UpdatePatch), restated here so the client never imports server code. */
export type ServerPatch = Partial<{
  title: string; notes: string; priority: string; ownerUserId: string | null; startOn: string | null; dueOn: string | null;
  estimateMinutes: number | null; nextAction: string | null; followUpOn: string | null; statusKey: string;
  block: { reason: string }; unblock: true; addDependency: string; removeDependency: string; addParticipant: string; removeParticipant: string;
}>;
export type ServerCreate = { title: string; notes?: string; statusKey?: string; priority?: string; ownerUserId?: string | null; projectId?: string | null; parentId?: string | null; startOn?: string | null; dueOn?: string | null; estimateMinutes?: number | null; nextAction?: string | null };

/**
 * One Focus edit → the server writes that perform it, in order: the task's own patch, then sub-task writes (a Focus
 * sub-task is a child task: adding one creates it, ticking it changes its status; a comment and logged time are
 * their own append-only writes). Edits with no live backend (the checklist, removing logged time) come back in
 * `unsupported` — the caller refuses them, never fakes them.
 */
export type WorkWrite =
  | { kind: "update"; taskId: string; patch: ServerPatch } | { kind: "create"; fields: ServerCreate }
  | { kind: "comment"; taskId: string; body: string } | { kind: "time"; taskId: string; minutes: number; source: "timer" | "manual"; startedAt: string };
export function writesForPatch(task: Task, patch: import("@/lib/focus/contracts/work").TaskPatch): { writes: WorkWrite[]; unsupported: string[] } {
  const p: ServerPatch = {};
  const writes: WorkWrite[] = [];
  const unsupported: string[] = [];
  for (const [key, value] of Object.entries(patch)) {
    switch (key) {
      case "title": case "notes": case "priority": case "nextAction": case "estimateMinutes": (p as Record<string, unknown>)[key] = value; break;
      case "assigneeId": p.ownerUserId = (value as string | null) ?? null; break;
      case "startDate": p.startOn = (value as string | null) ?? null; break;
      case "dueDate": p.dueOn = (value as string | null) ?? null; break;
      case "followUp": p.followUpOn = (value as string | null) ?? null; break;
      case "status": {
        const s = value as WorkStatus;
        if (s === "unknown") unsupported.push("status"); else p.statusKey = STATUS_KEY[s];
        break;
      }
      case "block": p.block = value as { reason: string }; break;
      case "unblock": p.unblock = true; break;
      case "addDependency": p.addDependency = (value as { id: string }).id; break;
      case "participantIds": {
        const next = value as string[];
        const added = next.filter((x) => !task.participantIds.includes(x));
        const removed = task.participantIds.filter((x) => !next.includes(x));
        if (added.length + removed.length > 1) unsupported.push("participantIds");
        else if (added[0]) p.addParticipant = added[0];
        else if (removed[0]) p.removeParticipant = removed[0];
        break;
      }
      case "addSubtask": {
        const s = value as { title: string };
        writes.push({ kind: "create", fields: { title: s.title, parentId: task.id, projectId: task.links.projectId ?? null } });
        break;
      }
      case "subtask": {
        const s = value as { id: string; done: boolean };
        writes.push({ kind: "update", taskId: s.id, patch: { statusKey: s.done ? "done" : "todo" } });
        break;
      }
      case "addComment": writes.push({ kind: "comment", taskId: task.id, body: (value as { text: string }).text }); break;
      case "logMinutes": {
        const m = value as number;
        if (Number.isInteger(m) && m >= 1 && m <= 1440) writes.push({ kind: "time", taskId: task.id, minutes: m, source: "manual", startedAt: new Date(Date.now() - m * 60000).toISOString() });
        else unsupported.push("logMinutes"); // logged time is append-only: it is never taken back
        break;
      }
      default: unsupported.push(key); // checklistItem, addChecklistItem: not connected yet
    }
  }
  return { writes: Object.keys(p).length ? [{ kind: "update", taskId: task.id, patch: p }, ...writes] : writes, unsupported };
}

/** The Focus edit that takes `current` back to `previous` (an undo as a compensating server write). */
export function undoPatch(current: Task, previous: Task): import("@/lib/focus/contracts/work").TaskPatch {
  const p: import("@/lib/focus/contracts/work").TaskPatch = {};
  if (current.title !== previous.title) p.title = previous.title;
  if (current.notes !== previous.notes) p.notes = previous.notes;
  if (current.priority !== previous.priority) p.priority = previous.priority;
  if (current.assigneeId !== previous.assigneeId) p.assigneeId = previous.assigneeId;
  if (current.startDate !== previous.startDate) p.startDate = previous.startDate;
  if (current.dueDate !== previous.dueDate) p.dueDate = previous.dueDate;
  if ((current.nextAction ?? null) !== (previous.nextAction ?? null)) p.nextAction = previous.nextAction;
  if ((current.followUp ?? null) !== (previous.followUp ?? null)) p.followUp = previous.followUp ?? null;
  if (current.participantIds.join() !== previous.participantIds.join()) p.participantIds = previous.participantIds;
  const wasBlocked = !!previous.blockedReason, isBlocked = !!current.blockedReason;
  if (wasBlocked && previous.blockedReason !== current.blockedReason) p.block = { reason: previous.blockedReason! };
  else if (!wasBlocked && isBlocked) { p.unblock = true; if (previous.status !== "waiting") p.status = previous.status; }
  else if (current.status !== previous.status) p.status = previous.status;
  return p;
}
