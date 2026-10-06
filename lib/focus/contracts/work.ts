import type { IsoDate, IsoDateTime, PersonId } from "./common";
import type { Loadable } from "./loadable";
import type { Priority, WorkDisplayStatus, WorkStatus } from "./status";

/**
 * Mytiv Work — UI contract (handoff README → "חוזה רכיבים"). This is the meeting point with `auto/work-pkg1`:
 * the Focus components accept exactly these shapes + callbacks and never import backend code. The mapping from
 * pkg1's provider-neutral `WorkItem` / tasks table onto these types is in docs/focus/mytiv-work-contract.md.
 */

/** Provider of a task during the transition. Shown only as a thin dot ("ClickUp ●"), never as the centre of the UI. */
export type TaskSource = "mytiv" | "clickup";
/** `planned` = the backend for this capability does not exist yet: rendered in full, labelled "מתוכנן", fed by fixtures. */
export type CapabilityState = "live" | "planned";

/** A summary of another task as shown (its display status, which may be the derived "blocked"). */
export type TaskRef = { id: string; title: string; status: WorkDisplayStatus };

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
   * Manual block (handoff: "חסום" only with a written reason). Only on a `waiting` task and never blank — enforced by
   * `taskInvariant` on every patch. pkg1: the business status key `blocked` under category `waiting`, reason in
   * `waiting_on`. A task blocked by an open dependency derives its block from `dependsOn` and carries no reason here.
   */
  blockedReason?: string;
  /** follow-up date for blocked/waiting items */
  followUp?: IsoDate | null;
  comments: Comment[];
  evidence: Asset[];
  activity: ActivityEvent[];
  source: TaskSource;
  state: CapabilityState;
  /** optimistic concurrency (pkg1 `tasks.version`; ClickUp `date_updated` marker) — sent back with every patch */
  version: number;
  updatedAt: IsoDateTime;
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

/** What the current source supports (mirrors pkg1 `TaskSourceCapabilities` + the planned work API). */
export type WorkCapabilities = {
  changeStatus: boolean; assign: boolean; create: boolean; comment: boolean; setDueDate: boolean;
  trackTime: boolean; depend: boolean; checklist: boolean; nest: boolean;
};

/** Viewer role (pkg1 business membership role). Members edit their own work; viewers only read and comment. */
export type WorkRole = "owner" | "admin" | "member" | "viewer";

/** Every Mytiv Work view can be in one of these system states besides ready (handoff W6). */
export type WorkViewState =
  | { kind: "empty"; title: string; hint: string }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "unavailable"; reason: string; since?: IsoDateTime }
  | { kind: "permissionDenied"; reason: string }
  | { kind: "versionConflict"; mine: Task; theirs: Task; theirsBy: string; field: keyof Task };

/** Callbacks the Mytiv Work components emit. The demo store implements them; pkg1 will implement them over its API. */
export type WorkCommands = {
  onPatch(taskId: string, patch: TaskPatch, expectedVersion: number): void;
  onMove(taskId: string, to: BoardColumn): void;
  onCreate(draft: { title: string; dueDate: IsoDate | null; assigneeId: PersonId | null; projectId?: string; priority: Priority }): void;
  onStartTimer(taskId: string): void;
  onPauseTimer(): void;
  onResumeTimer(): void;
  onStopTimer(): void;
  onLogTime(taskId: string, minutes: number): void;
};

export type MyTasksData = { buckets: Loadable<MyTasksBuckets>; activeTimer: ActiveTimer | null };
