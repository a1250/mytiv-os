/**
 * Provider-neutral work model (Mytiv Work, ADR-0001). Everything above a TaskSource adapter — Ops
 * screens, stats, the marketing panel — works with these types and never sees a provider's field
 * names, list ids, URLs or vocabulary. ClickUp is one adapter (clickup-adapter.ts); Mytiv's own
 * tasks will be the other. Pure types: safe to import from client components.
 */
export type WorkProvider = 'clickup' | 'mytiv';

/** Identity of a work item: opaque within its provider. Two refs are equal only if both parts are. */
export type WorkRef = { provider: WorkProvider; id: string };

/** What a status means, whatever the source calls it. */
export type WorkStatusCategory = 'open' | 'active' | 'done' | 'closed';

/** What the item is: work, a production bug, a decision record, or unclassified work. */
export type WorkKind = 'task' | 'bug' | 'decision' | 'other';

/** On whom the item is waiting. `internal` = on us. */
export type WaitingOn = 'client' | 'contractor' | 'internal';

export type WorkPriority = 'urgent' | 'high' | 'normal' | 'low' | null;

/** A person who can own work. `ref` is opaque and provider-scoped (never parse it outside the adapter). */
export type WorkPerson = { ref: string; name: string };

export type WorkItem = {
  ref: WorkRef;
  title: string;
  /** The project/client the item belongs to (key for filters, label for display). */
  projectKey: string;
  projectLabel: string;
  /** The collection the item sits in, as the source names it — display only. */
  groupLabel: string;
  /** The status as the source names it (shown to people and sent back on a status change). */
  statusLabel: string;
  statusCategory: WorkStatusCategory;
  /** Opaque key of the status vocabulary this item's status belongs to (see `StatusOptions`). */
  statusScope: string;
  priority: WorkPriority;
  assignee: WorkPerson | null;
  kind: WorkKind;
  /** YYYY-MM-DD, or null when nobody committed to a date. */
  dueDate: string | null;
  overdue: boolean;
  /** ISO timestamp of the last change, '' when unknown. */
  updatedAt: string;
  daysIdle: number;
  waitingOn: WaitingOn | null;
  /** Estimate in hours, or null when nobody set one. */
  estimateHours: number | null;
  /** Opaque optimistic-concurrency token: send it back unchanged with a write; a write against a moved item is refused. */
  concurrencyToken: string;
  /** Who holds the item ("ClickUp", "Mytiv") — for sentences such as "This will update …". */
  sourceLabel: string;
  /** Where to open the item at its source, or null when it has no page of its own. */
  sourceLink: { href: string; label: string } | null;
};

/** Allowed status labels per `statusScope` — the vocabulary can differ per scope. */
export type StatusOptions = Record<string, string[]>;

/** A read that may have stopped short: `complete: false` means counts are unknown, never partial. */
export type WorkItemsRead = { items: WorkItem[]; complete: boolean };

export type WorkStats = { stuck: number; overdue: number; openTasks: number; openBugs: number };

export type ItemTime = { itemId: string; itemName: string; hours: number };
export type TimeByItem = { totalHours: number; perItem: ItemTime[] };

/** Why a source could not be read. The message is the source's own, unchanged. */
export class WorkSourceError extends Error {
  constructor(public reason: 'not_configured' | 'rate_limited' | 'failed', message: string, public retryAfterSeconds: number | null = null) {
    super(message);
  }
}

/** The read side of one project's work, whatever holds it. Writes stay provider-specific until Mytiv Work PR 12. */
export interface ProjectTaskSource {
  readonly provider: WorkProvider;
  items(options?: { fresh?: boolean; includeClosed?: boolean }): Promise<WorkItemsRead>;
  statusOptions(): Promise<StatusOptions>;
  people(): Promise<WorkPerson[]>;
  timeByItem(range: { from: Date; to: Date }): Promise<TimeByItem>;
}

export function sameWorkRef(a: WorkRef | null | undefined, b: WorkRef | null | undefined): boolean {
  return Boolean(a && b && a.provider === b.provider && a.id === b.id);
}

/** Counts for the Ops tiles. `open` must already exclude decision records. */
export function workStats(open: WorkItem[], thresholdDays: number): WorkStats {
  return {
    stuck: open.filter((t) => t.daysIdle >= thresholdDays).length,
    overdue: open.filter((t) => t.overdue).length,
    openTasks: open.filter((t) => t.kind !== 'bug').length,
    openBugs: open.filter((t) => t.kind === 'bug').length,
  };
}

/** Untouched for `thresholdDays` or more, worst first. */
export function stuckItems(open: WorkItem[], thresholdDays: number): WorkItem[] {
  return open.filter((t) => t.daysIdle >= thresholdDays).sort((a, b) => b.daysIdle - a.daysIdle);
}
