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
    spentMinutes: null, // Mytiv time entries are not connected yet (0014): unknown, never 0
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
    comments: [], evidence: [],
    activity: activityOf(r.activity ?? []),
    source: "mytiv", state: "live",
    version: String(r.version),
    updatedAt: r.updatedAt,
    ...(r.updatedBy ? { updatedBy: r.updatedBy } : {}),
  };
}

/**
 * What the Mytiv source supports today in a business scope (live = a DB function backs it; planned = not connected
 * yet, refused outside the demo). Comments, time and checklist arrive with 0014/0015.
 */
export const MYTIV_LIVE_CAPABILITIES: CapabilityMap = {
  changeStatus: "live", assign: "live", create: "live", setDueDate: "live", depend: "live", nest: "live",
  comment: "planned", trackTime: "planned", checklist: "planned",
};
