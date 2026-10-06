/**
 * Provider-neutral work model (Mytiv Work, ADR-0001). Everything above a source adapter — Ops screens,
 * stats, the marketing panel — works with these types and never sees a provider's field names, list ids,
 * URLs, numeric member ids or vocabulary. ClickUp is one adapter (clickup-adapter.ts); Mytiv's own tasks
 * will be the other. Every identity (item, person, status scope, logged-time row) carries its provider, so
 * a ClickUp id and a Mytiv id that happen to be equal can never collide in a merged list, a filter, a React
 * key, a time report or a write. Pure types and helpers: safe to import from client components.
 */
export type WorkProvider = 'clickup' | 'mytiv';
const PROVIDERS: readonly WorkProvider[] = ['clickup', 'mytiv'];

/** Identity of anything a source holds (an item, a person, a status scope). `id` is opaque within its provider. */
export type WorkRef = { provider: WorkProvider; id: string };
export type PersonRef = WorkRef;
export type StatusScopeRef = WorkRef;

/** A ref as one string — for React keys, map keys, <option> values. Never parse provider ids out of it outside an adapter. */
export function refKey(ref: WorkRef): string {
  return `${ref.provider}:${ref.id}`;
}
/** Inverse of refKey; null for anything that is not `<known provider>:<non-empty id>`. */
export function parseRefKey(key: unknown): WorkRef | null {
  if (typeof key !== 'string') return null;
  const i = key.indexOf(':');
  const provider = key.slice(0, i) as WorkProvider;
  const id = key.slice(i + 1);
  return i > 0 && PROVIDERS.includes(provider) && id.length > 0 && id.length <= 200 ? { provider, id } : null;
}
export function sameWorkRef(a: WorkRef | null | undefined, b: WorkRef | null | undefined): boolean {
  return Boolean(a && b && a.provider === b.provider && a.id === b.id);
}

/**
 * What a status means, whatever the source calls it. `unknown` = the source's status could not be mapped
 * safely: it is never counted as done, never counted as active, is shown as unmapped, and no action may
 * branch on it (closing rules use the source's own authoritative check, server-side). Archive and trash are
 * separate flags on the item, never categories.
 */
export type WorkStatusCategory = 'open' | 'active' | 'waiting' | 'review' | 'done' | 'cancelled' | 'unknown';
export const WORK_STATUS_CATEGORIES: readonly WorkStatusCategory[] = ['open', 'active', 'waiting', 'review', 'done', 'cancelled', 'unknown'];

/** What the item is: work, a production bug, a decision record, or unclassified work. */
export type WorkKind = 'task' | 'bug' | 'decision' | 'other';

/** On whom the item is waiting. `internal` = on us. */
export type WaitingOn = 'client' | 'contractor' | 'internal';

export type WorkPriority = 'urgent' | 'high' | 'normal' | 'low' | null;

/** A person who can own work. */
export type WorkPerson = { ref: PersonRef; name: string };

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
  /** The status vocabulary this item's status belongs to (see `StatusOptions`). */
  statusScope: StatusScopeRef;
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
  /** Archived/trashed are flags, not statuses. ClickUp reads exclude both, so they are false there. */
  archived: boolean;
  trashed: boolean;
  /** Opaque optimistic-concurrency token: send it back unchanged with a write; a write against a moved item is refused. */
  concurrencyToken: string;
  /** Who holds the item ("ClickUp", "Mytiv") — for sentences such as "This will update …". */
  sourceLabel: string;
  /** Where to open the item at its source, or null when it has no page of its own. */
  sourceLink: { href: string; label: string } | null;
};

/** One status a scope allows, with what it means (from the same mapping the items use). */
export type StatusOption = { label: string; category: WorkStatusCategory };
/** Allowed statuses per status scope, keyed by `refKey(scope)` — the vocabulary can differ per scope. */
export type StatusOptions = Record<string, StatusOption[]>;

/** A read that may have stopped short: `complete: false` means counts are unknown, never partial. */
export type WorkItemsRead = { items: WorkItem[]; complete: boolean };

export type WorkStats = { stuck: number; overdue: number; openTasks: number; openBugs: number };

/** Logged time per item. `item` is null for time the source could not attach to an item. */
export type ItemTime = { item: WorkRef | null; itemName: string; hours: number };
export type TimeByItem = { totalHours: number; perItem: ItemTime[] };

/**
 * What a source supports. The UI asks before offering an action; a command source refuses anything it
 * does not declare. New capabilities default to false in every adapter.
 */
export type TaskSourceCapabilities = {
  provider: WorkProvider;
  /** Change an item's status to one of `StatusOptions[scope]`. */
  changeStatus: boolean;
  /** Replace an item's (single) assignee. */
  assign: boolean;
  /** Create an item directly from the UI (not via an assistant proposal). */
  create: boolean;
  comment: boolean;
  setDueDate: boolean;
  trackTime: boolean;
  archive: boolean;
  trash: boolean;
  nest: boolean;
  depend: boolean;
  checklist: boolean;
};
export const NO_CAPABILITIES: Omit<TaskSourceCapabilities, 'provider'> = {
  changeStatus: false, assign: false, create: false, comment: false, setDueDate: false, trackTime: false,
  archive: false, trash: false, nest: false, depend: false, checklist: false,
};

/** Why a source could not be read. The message is the source's own, unchanged. */
export class WorkSourceError extends Error {
  constructor(public reason: 'not_configured' | 'rate_limited' | 'failed', message: string, public retryAfterSeconds: number | null = null) {
    super(message);
  }
}

/** The read side of one project's work, whatever holds it. */
export interface TaskQuerySource {
  readonly provider: WorkProvider;
  readonly capabilities: TaskSourceCapabilities;
  items(options?: { fresh?: boolean; includeClosed?: boolean }): Promise<WorkItemsRead>;
  statusOptions(): Promise<StatusOptions>;
  people(): Promise<WorkPerson[]>;
  timeByItem(range: { from: Date; to: Date }): Promise<TimeByItem>;
}

/** Who asks for a change. Always derived server-side from the session — never taken from a request body. */
export type CommandActor = { businessId: string; userId: string; role: string };

/** A change to one item. Fields left out are not touched. */
export type ItemChange = {
  status?: string;
  /** Neutral person refs; each must belong to the target's provider. */
  assignees?: { add: PersonRef[]; remove: PersonRef[] };
};

/** Optional observers for audit capture: the adapter reports the item before and after, in its own shape. */
export type CommandObserver = { before?(state: unknown): void; after?(state: unknown): void };

export type CommandResult = { ok: true; sourceLink: { href: string; label: string } | null; concurrencyToken: string | null };

/** Refused because the source does not support the command (UI should never offer it). */
export class CommandNotSupportedError extends Error {
  constructor(public capability: keyof Omit<TaskSourceCapabilities, 'provider'>) {
    super('command_not_supported');
  }
}

/** A change validated against its source, ready to apply. `payload` is the source's own form, for the audit record. */
export type PreparedCommand = { target: WorkRef; change: ItemChange; payload: unknown };

/**
 * The write side. Adapters implement only what their capabilities declare; anything else is refused with
 * CommandNotSupportedError. `prepare` validates against the source (capabilities, people, provider of every
 * ref) without writing; `apply` performs exactly the prepared change. Authorization, confirmation and audit
 * stay with the caller (route handler), which records `payload` before `apply` runs.
 */
export interface TaskCommandSource {
  readonly provider: WorkProvider;
  readonly capabilities: TaskSourceCapabilities;
  prepare(target: WorkRef, change: ItemChange): Promise<PreparedCommand>;
  apply(prepared: PreparedCommand, context: { actor: CommandActor; expectedToken?: string | null; observer?: CommandObserver }): Promise<CommandResult>;
}

/** Status categories that count as finished work. `unknown` is deliberately absent. */
export function isFinished(category: WorkStatusCategory): boolean {
  return category === 'done' || category === 'cancelled';
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
