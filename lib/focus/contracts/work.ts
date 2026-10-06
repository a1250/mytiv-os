import type { IsoDate, IsoDateTime, PersonId } from "./common";
import type { Loadable } from "./loadable";
import type { Priority, WorkStatus } from "./status";

/**
 * Mytiv Work — UI contract (handoff README → "חוזה רכיבים"). This is the meeting point with `auto/work-pkg1`:
 * the Focus components accept exactly these shapes + callbacks and never import backend code. The mapping from
 * pkg1's provider-neutral `WorkItem` / tasks table onto these types is in docs/focus/mytiv-work-contract.md.
 */

/** Provider of a task during the transition. Shown only as a thin dot ("ClickUp ●"), never as the centre of the UI. */
export type TaskSource = "mytiv" | "clickup";
/** `planned` = the backend for this capability does not exist yet: rendered in full, labelled "מתוכנן", fed by fixtures. */
export type CapabilityState = "live" | "planned";

/** A reference to another task (a dependency). Its status is always read from the live task, never stored here. */
export type TaskRef = { id: string; title: string };

export type Subtask = { id: string; title: string; done: boolean; assigneeId?: PersonId; dueDate?: IsoDate; estimateMinutes?: number; spentMinutes?: number };
export type ChecklistItem = { id: string; label: string; checked: boolean };
export type Comment = { id: string; authorId: PersonId; at: IsoDateTime; text: string };
export type Asset = { id: string; label: string; kind: "image" | "pdf" | "link" | "file"; href?: string };
export type ActivityEvent = { id: string; at: IsoDateTime; actorId: PersonId | "system"; text: string; tone?: "default" | "risk" | "done" };

export type TaskLinks = { projectId?: string; leadId?: string; proposalId?: string; campaignId?: string };

export type Task = {
  id: string;
  title: string;
  notes: string;
  status: WorkStatus;
  /** the business's own label for the status (pkg1 `work_statuses.label_he`, e.g. "בבדיקה"); falls back to the status word */
  statusLabel?: string;
  /**
   * the business's own status key (pkg1 `work_statuses.key`) under the canonical category. `"blocked"` under
   * `waiting` is a manual block (Work contract §5) — shown as "חסום" with or without a reason from the source.
   */
  statusKey?: string;
  priority: Priority;
  assigneeId: PersonId | null;
  participantIds: PersonId[];
  startDate: IsoDate | null;
  dueDate: IsoDate | null;
  estimateMinutes: number | null;
  /** logged time; `null` = the source does not report time (unknown — never shown as 0) */
  spentMinutes: number | null;
  subtasks: Subtask[];
  checklist: ChecklistItem[];
  /** parent task in the same project (pkg1 `tasks.parent_id`); nested rows in TaskListView */
  parentId: string | null;
  /** "blocked_by" dependencies (pkg1 plan: same-project `blocks` only) */
  dependsOn: TaskRef[];
  links: TaskLinks;
  /** display labels for the links (project/client), resolved by the adapter */
  context: { client?: string; project?: string };
  /** the next concrete step ("הבא: להתקשר לצלם") */
  nextAction?: string;
  /** who we are waiting for (status `waiting`) — pkg1 `waiting_on` + a label */
  waitingFor?: string;
  /**
   * The written reason of a manual block. Only on a `waiting` task and never blank — enforced by `taskInvariant` on
   * every write; a block made in Focus always carries one (the `block` patch requires it). pkg1 has no column for
   * it yet (backend gap, contract §12) — a source block without a reason still shows as blocked via `statusKey`.
   * A task blocked by an open dependency derives its block from `dependsOn` and carries no reason here.
   */
  blockedReason?: string;
  /** follow-up date for blocked/waiting items */
  followUp?: IsoDate | null;
  comments: Comment[];
  evidence: Asset[];
  activity: ActivityEvent[];
  source: TaskSource;
  state: CapabilityState;
  /**
   * Opaque concurrency token (pkg1 `tasks.version`; ClickUp `date_updated` marker). Sent back unchanged with every
   * write; the next token always comes from the write's result — the UI never computes or compares it otherwise.
   */
  version: string;
  updatedAt: IsoDateTime;
  /** who made the last write (pkg1 audit actor); names the other side of a version conflict */
  updatedBy?: PersonId | "system";
};

export type MyTasksBuckets = {
  today: Task[];
  overdue: Task[];
  soon: Task[];
  blocked: Task[];
  waitingOnOthers: Task[];
  noDate: Task[];
  /** status the source could not map — listed apart, never counted as done or active */
  unmapped: Task[];
};

export type ActiveTimer = { taskId: string; title: string; context: string; startedAt: IsoDateTime; elapsedMs: number; running: boolean };

/** Patch accepted by TaskDrawer.onPatch — only fields the user can change in the UI. */
export type TaskPatch = Partial<Pick<Task, "title" | "notes" | "status" | "priority" | "assigneeId" | "startDate" | "dueDate" | "estimateMinutes" | "nextAction" | "followUp" | "participantIds">> & {
  subtask?: { id: string; done: boolean };
  addSubtask?: { id: string; title: string };
  checklistItem?: { id: string; checked: boolean };
  addChecklistItem?: { id: string; label: string };
  addComment?: Comment;
  addDependency?: TaskRef;
  /** manual block: sets status `waiting` + the written reason (required, non-blank) */
  block?: { reason: string };
  /** lifts a manual block (the task stays `waiting` until its status changes) */
  unblock?: true;
  /** logged time to add (timer or manual entry; 1..1440). An increment — unknown time (`null`) stays unknown. */
  logMinutes?: number;
};

export type BoardColumn = "todo" | "in_progress" | "blockedOrWaiting" | "done";

export type TimeEntry = { id: string; taskId: string; personId: PersonId; start: IsoDateTime; minutes: number; source: "timer" | "manual"; certainty: "known" | "estimated" };
export type TimeReportRow = { key: string; label: string; initial?: string; hours: number; budgetHours: number | null; certainty: "known" | "estimated"; note?: string };
export type TimeReportGroup = "employee" | "project" | "client" | "task";
export type TimeReportData = {
  range: { from: IsoDate; to: IsoDate };
  groupBy: TimeReportGroup;
  rows: TimeReportRow[];
  totals: { hours: number; unreported: number; budgetHours: number; overBudgetProjects: { count: number; label: string } };
  basis: string;
};

/**
 * The capability keys a task source may support — the shape of pkg1 `TaskSourceCapabilities` (booleans there, minus
 * archive/trash). Focus does not read these booleans: it reads a `CapabilityMap` (each key live or planned).
 */
export type WorkCapabilities = {
  changeStatus: boolean; assign: boolean; create: boolean; comment: boolean; setDueDate: boolean;
  trackTime: boolean; depend: boolean; checklist: boolean; nest: boolean;
};

/** What Focus reads per task source: each capability live (real backend) or planned (demo only, labelled "מתוכנן"). */
export type CapabilityMap = Record<keyof WorkCapabilities, CapabilityState>;

/**
 * Business membership role (pkg1). owner/admin: everything; member: edits work (not delete); viewer: reads and
 * comments only — the matrix is `canDo` in lib/focus/state/work.ts.
 */
export type WorkRole = "owner" | "admin" | "member" | "viewer";

/** Every Mytiv Work view can be in one of these system states besides ready (handoff W6). */
export type WorkViewState =
  | { kind: "empty"; title: string; hint: string }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "unavailable"; reason: string; since?: IsoDateTime }
  | { kind: "permissionDenied"; reason: string }
  | { kind: "versionConflict"; mine: Task; theirs: Task; theirsBy: string; field: keyof Task };

/** Result of every task write: the new task (with its new token), a version conflict (nothing written), or a refusal. */
export type WriteResult = { ok: true; task: Task } | { ok: false; conflict: Task } | { ok: false; refused: string };

/**
 * The Mytiv Work commands the components call (the demo store implements them today and is checked against this
 * type; the pkg1 adapter will implement the same shape over its API). Every write takes the token it last saw.
 */
export type WorkCommands = {
  patchTask(taskId: string, patch: TaskPatch, expectedVersion: string): WriteResult & { previous?: Task };
  moveTask(taskId: string, to: BoardColumn, expectedVersion: string): WriteResult & { previous?: Task };
  /** undo = a compensating write back to `previous`, only if the task is still at the token the action produced */
  undoTask(previous: Task, expectedVersion: string): WriteResult;
  createTask(draft: Pick<Task, "title" | "dueDate" | "priority"> & Partial<Task>): Task;
  /** the undo of a create: refused when the task changed since `expectedVersion` or has children (their work stays) */
  removeTask(taskId: string, expectedVersion?: string): { ok: true } | { ok: false; refused: string };
  /** `entry` is null when the write was refused — no time entry exists without the task write */
  logTime(taskId: string, minutes: number): { entry: TimeEntry | null; result: WriteResult; previous?: Task };
};

export type MyTasksData = { buckets: Loadable<MyTasksBuckets>; activeTimer: ActiveTimer | null };
