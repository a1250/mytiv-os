import type { IsoDate, IsoDateTime, PersonId } from "./common";
import type { Loadable } from "./loadable";
import type { Priority, WorkStatus } from "./status";

/**
 * Mytiv Work — UI contract (handoff README → "חוזה רכיבים"). This is the meeting point with `auto/work-pkg1`:
 * the Focus components accept exactly these shapes + callbacks and never import backend code. The mapping from
 * pkg1's provider-neutral `WorkItem` / tasks table onto these types is documented in docs/focus/mytiv-work-contract.md.
 */

/** Provider of a task during the transition. Shown only as a thin dot ("ClickUp ●"), never as the centre of the UI. */
export type TaskSource = "mytiv" | "clickup";
/** `planned` = the backend for this capability does not exist yet: rendered in full, labelled "מתוכנן", fed by fixtures. */
export type CapabilityState = "live" | "planned";

export type TaskRef = { id: string; title: string; status: WorkStatus };

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
  priority: Priority;
  assigneeId: PersonId | null;
  participantIds: PersonId[];
  startDate: IsoDate | null;
  dueDate: IsoDate | null;
  estimateMinutes: number | null;
  spentMinutes: number;
  subtasks: Subtask[];
  checklist: ChecklistItem[];
  /** parent task in the same project (pkg1 `tasks.parent_id`); nested rows in TaskListView */
  parentId: string | null;
  /** "blocked_by" dependencies */
  dependsOn: TaskRef[];
  links: TaskLinks;
  /** display labels for the links (project/client), resolved by the adapter */
  context: { client?: string; project?: string };
  /** the next concrete step ("הבא: להתקשר לצלם") */
  nextAction?: string;
  /** who we are waiting for (status `waiting`) */
  waitingFor?: string;
  comments: Comment[];
  evidence: Asset[];
  activity: ActivityEvent[];
  source: TaskSource;
  state: CapabilityState;
  /** optimistic concurrency (pkg1 `tasks.version`) — sent back with every patch */
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
};

export type ActiveTimer = { taskId: string; title: string; context: string; startedAt: IsoDateTime; elapsedMs: number; running: boolean };

/** Patch accepted by TaskDrawer.onPatch — only fields the user can change in the UI. */
export type TaskPatch = Partial<Pick<Task, "title" | "notes" | "status" | "priority" | "assigneeId" | "startDate" | "dueDate" | "estimateMinutes">> & {
  subtask?: { id: string; done: boolean };
  checklistItem?: { id: string; checked: boolean };
};

export type BoardColumn = "todo" | "in_progress" | "blockedOrWaiting" | "done";

export type TimeEntry = { id: string; taskId: string; personId: PersonId; start: IsoDateTime; minutes: number; certainty: "known" | "estimated" };
export type TimeReportRow = { key: string; label: string; hours: number; budgetHours: number | null; certainty: "known" | "estimated"; note?: string };
export type TimeReportData = { range: { from: IsoDate; to: IsoDate }; groupBy: "employee" | "project" | "client" | "task"; rows: TimeReportRow[] };

/** Every Mytiv Work view can be in one of these system states besides ready (handoff W6). */
export type WorkViewState =
  | { kind: "empty"; title: string; hint: string }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "permissionDenied"; reason: string }
  | { kind: "versionConflict"; mine: Task; theirs: Task; theirsBy: string };

/** Callbacks the Mytiv Work components emit. The demo store implements them; pkg1 will implement them over its API. */
export type WorkCommands = {
  onPatch(taskId: string, patch: TaskPatch, expectedVersion: number): void;
  onMove(taskId: string, to: BoardColumn): void;
  onCreate(draft: { title: string; dueDate: IsoDate | null; assigneeId: PersonId | null; projectId?: string; priority: Priority }): void;
  onStartTimer(taskId: string): void;
  onPauseTimer(): void;
  onResumeTimer(): void;
  onStopTimer(): void;
};

export type MyTasksData = { buckets: Loadable<MyTasksBuckets>; activeTimer: ActiveTimer | null };
