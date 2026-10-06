/**
 * The ClickUp adapter: the only place that turns ClickUp's normalised `OpsTask` into the neutral
 * `WorkItem`, and the only place that turns neutral refs back into ClickUp ids (member ids, list ids,
 * task ids). It declares exactly the capabilities the existing ClickUp write path has: status and
 * assignee changes on the client workspace. Creates, comments and decisions stay Copilot proposals.
 */
import 'server-only';
import {
  ClickUpConfigError,
  ClickUpRateLimitError,
  getFolderLists,
  getOpenTasksWithCompleteness,
  getTasksByFolderWithCompleteness,
  getTimeByTask,
  getWorkspaceMembers,
  updateTask,
  type FolderList,
  type OpsTask,
  type RawTask,
  type UpdateTaskPatch,
  type WorkspaceMember,
} from '../clickup';
import type { ClientFolder } from '../ops-config';
import { OpsPolicyError, expectedMarker } from '../ops-policy';
import {
  CommandNotSupportedError,
  NO_CAPABILITIES,
  WorkSourceError,
  refKey,
  type ItemChange,
  type PersonRef,
  type PreparedCommand,
  type StatusOptions,
  type TaskCommandSource,
  type TaskQuerySource,
  type TaskSourceCapabilities,
  type WaitingOn,
  type WorkItem,
  type WorkItemsRead,
  type WorkKind,
  type WorkPerson,
  type WorkRef,
  type WorkStatusCategory,
} from './types';

const LABEL = 'ClickUp';

export const CLICKUP_CAPABILITIES: TaskSourceCapabilities = { provider: 'clickup', ...NO_CAPABILITIES, changeStatus: true, assign: true };

/**
 * ClickUp custom statuses whose meaning is unambiguous, by normalised name. Anything else of type
 * "custom" is `unknown` — a guess here would make a stalled item look like active work.
 */
const CUSTOM_STATUS_MEANING: Record<string, WorkStatusCategory> = {
  'in progress': 'active', 'working': 'active', 'doing': 'active', 'in development': 'active', 'בעבודה': 'active', 'בתהליך': 'active', 'בביצוע': 'active',
  'review': 'review', 'in review': 'review', 'qa': 'review', 'ready for review': 'review', 'submit for review': 'review', 'בבדיקה': 'review', 'לבדיקה': 'review', 'ממתין לאישור': 'review',
  'waiting': 'waiting', 'blocked': 'waiting', 'on hold': 'waiting', 'waiting on client': 'waiting', 'ממתין': 'waiting', 'ממתין ללקוח': 'waiting', 'חסום': 'waiting', 'מושהה': 'waiting',
  'cancelled': 'cancelled', 'canceled': 'cancelled', 'בוטל': 'cancelled',
};

/** ClickUp's status type is authoritative for open/done/closed; custom statuses map only by an explicit name. */
export function clickUpStatusCategory(statusType: string, statusName: string): WorkStatusCategory {
  if (statusType === 'open') return 'open';
  if (statusType === 'done' || statusType === 'closed') return 'done';
  if (statusType === 'custom') return CUSTOM_STATUS_MEANING[statusName.trim().toLowerCase().replace(/\s+/g, ' ')] ?? 'unknown';
  return 'unknown';
}
function kind(t: OpsTask): WorkKind {
  return t.listKind === 'bugs' ? 'bug' : t.listKind === 'decisions' ? 'decision' : t.listKind === 'tasks' ? 'task' : 'other';
}
function waitingOn(b: OpsTask['blockedOn']): WaitingOn | null {
  return b === 'Me' ? 'internal' : b === 'Client' ? 'client' : b === 'Contractor' ? 'contractor' : null;
}
const clickupRef = (id: string): WorkRef => ({ provider: 'clickup', id });

export function fromClickUpMember(m: WorkspaceMember): WorkPerson {
  return { ref: clickupRef(String(m.id)), name: m.name };
}

export function fromClickUpTask(t: OpsTask): WorkItem {
  return {
    ref: clickupRef(t.id),
    title: t.title,
    projectKey: t.clientKey,
    projectLabel: t.clientLabel,
    groupLabel: t.listName,
    statusLabel: t.status,
    statusCategory: clickUpStatusCategory(t.statusType, t.status),
    statusScope: clickupRef(t.listId),
    priority: t.priority,
    assignee: t.assignee ? fromClickUpMember(t.assignee) : null,
    kind: kind(t),
    dueDate: t.dueDate,
    overdue: t.overdue,
    updatedAt: t.updatedAt,
    daysIdle: t.daysIdle,
    waitingOn: waitingOn(t.blockedOn),
    estimateHours: t.estimateHours,
    archived: false,
    trashed: false,
    // ClickUp's change marker is the task's last update; the write path compares it (expectedMarker).
    concurrencyToken: t.updatedAt,
    sourceLabel: LABEL,
    sourceLink: { href: t.url, label: LABEL },
  };
}

/**
 * Person refs (or, from older clients, raw member ids) → ClickUp member ids. Every entry must be a ClickUp
 * ref (a Mytiv person is refused even if its id looks numeric) of a current workspace member.
 */
export function clickUpAssigneeIds(input: unknown, memberIds: Set<number>): number[] {
  if (input === undefined) return [];
  if (!Array.isArray(input) || input.length > 50) throw new OpsPolicyError('invalid_assignee');
  return input.map((v) => {
    let raw: unknown = v;
    if (v && typeof v === 'object') {
      const ref = v as Partial<PersonRef>;
      if (ref.provider !== 'clickup') throw new OpsPolicyError('invalid_assignee');
      raw = ref.id;
    }
    const id = typeof raw === 'number' ? raw : typeof raw === 'string' && /^[0-9]{1,15}$/.test(raw) ? Number(raw) : NaN;
    if (!Number.isSafeInteger(id) || !memberIds.has(id)) throw new OpsPolicyError('invalid_assignee');
    return id;
  });
}

/** ClickUp errors keep their message; only the reason becomes neutral. */
async function read<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ClickUpConfigError) throw new WorkSourceError('not_configured', err.message);
    if (err instanceof ClickUpRateLimitError) throw new WorkSourceError('rate_limited', err.message, err.retryAfterSeconds);
    throw new WorkSourceError('failed', err instanceof Error ? err.message : 'Unknown error');
  }
}

export function clickupProjectSource(folder: ClientFolder): TaskQuerySource {
  return {
    provider: 'clickup',
    capabilities: CLICKUP_CAPABILITIES,
    async items(options = {}) {
      const { tasks, incomplete } = await read(() => getTasksByFolderWithCompleteness(folder, options));
      return { items: tasks.map(fromClickUpTask), complete: !incomplete };
    },
    async statusOptions() {
      return clickUpStatusOptions(await read(() => getFolderLists(folder)));
    },
    async people() {
      return (await read(() => getWorkspaceMembers())).map(fromClickUpMember);
    },
    async timeByItem(range) {
      const { totalHours, perTask } = await read(() => getTimeByTask(folder, range));
      // "(no task)" is ClickUp's bucket for time not attached to a task: it has no item.
      return { totalHours, perItem: perTask.map((t) => ({ item: t.taskId === '(no task)' ? null : clickupRef(t.taskId), itemName: t.taskName, hours: t.hours })) };
    },
  };
}

/** Each list's statuses, with the category the item mapping would give them. */
export function clickUpStatusOptions(lists: Pick<FolderList, 'id' | 'statuses' | 'statusTypes'>[]): StatusOptions {
  return Object.fromEntries(lists.map((l) => [refKey(clickupRef(l.id)), l.statuses.map((label) => ({ label, category: clickUpStatusCategory(l.statusTypes[label] ?? 'unknown', label) }))]));
}

/** Open work (decision records excluded) across several ClickUp folders. */
export async function clickupOpenItems(folders: ClientFolder[]): Promise<WorkItemsRead> {
  const { tasks, incomplete } = await read(() => getOpenTasksWithCompleteness(folders));
  return { items: tasks.map(fromClickUpTask), complete: !incomplete };
}

/**
 * The ClickUp write side: status and assignee changes through `updateTask` (pre-read, PUT, verifying
 * post-read). Scope checks, closing evidence, confirmation and the audit record stay in the route.
 */
export const clickupCommandSource: TaskCommandSource = {
  provider: 'clickup',
  capabilities: CLICKUP_CAPABILITIES,
  async prepare(target: WorkRef, change: ItemChange): Promise<PreparedCommand> {
    if (target.provider !== 'clickup' || !target.id) throw new OpsPolicyError('invalid_target');
    const patch: UpdateTaskPatch = {};
    if (change.status !== undefined) {
      if (!CLICKUP_CAPABILITIES.changeStatus) throw new CommandNotSupportedError('changeStatus');
      patch.status = change.status;
    }
    if (change.assignees !== undefined) {
      if (!CLICKUP_CAPABILITIES.assign) throw new CommandNotSupportedError('assign');
      const members = new Set((await getWorkspaceMembers()).map((m) => m.id));
      patch.assignees = { add: clickUpAssigneeIds(change.assignees.add, members), rem: clickUpAssigneeIds(change.assignees.remove, members) };
    }
    if (!Object.keys(patch).length) throw new OpsPolicyError('nothing_to_update');
    return { target, change, payload: patch };
  },
  async apply(prepared, { expectedToken, observer }) {
    const { post, raw } = await updateTask(prepared.target.id, prepared.payload as UpdateTaskPatch, {
      expectedDateUpdated: expectedMarker(expectedToken),
      onPre: (pre: RawTask) => observer?.before?.(pre),
    });
    observer?.after?.(post);
    return { ok: true, sourceLink: raw.url ? { href: raw.url, label: LABEL } : null, concurrencyToken: post.date_updated == null ? null : String(post.date_updated) };
  },
};
