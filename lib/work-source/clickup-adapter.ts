/**
 * The ClickUp adapter: the only place that turns ClickUp's normalised `OpsTask` into the neutral
 * `WorkItem`, and the only place that turns a neutral person ref back into a ClickUp member id.
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
  type OpsTask,
  type WorkspaceMember,
} from '../clickup';
import type { ClientFolder } from '../ops-config';
import { OpsPolicyError } from '../ops-policy';
import { WorkSourceError, type ProjectTaskSource, type WaitingOn, type WorkItem, type WorkItemsRead, type WorkKind, type WorkPerson, type WorkStatusCategory } from './types';

const LABEL = 'ClickUp';

function category(statusType: string): WorkStatusCategory {
  return statusType === 'closed' ? 'closed' : statusType === 'done' ? 'done' : statusType === 'custom' ? 'active' : 'open';
}
function kind(t: OpsTask): WorkKind {
  return t.listKind === 'bugs' ? 'bug' : t.listKind === 'decisions' ? 'decision' : t.listKind === 'tasks' ? 'task' : 'other';
}
function waitingOn(b: OpsTask['blockedOn']): WaitingOn | null {
  return b === 'Me' ? 'internal' : b === 'Client' ? 'client' : b === 'Contractor' ? 'contractor' : null;
}

export function fromClickUpMember(m: WorkspaceMember): WorkPerson {
  return { ref: String(m.id), name: m.name };
}

export function fromClickUpTask(t: OpsTask): WorkItem {
  return {
    ref: { provider: 'clickup', id: t.id },
    title: t.title,
    projectKey: t.clientKey,
    projectLabel: t.clientLabel,
    groupLabel: t.listName,
    statusLabel: t.status,
    statusCategory: category(t.statusType),
    statusScope: t.listId,
    priority: t.priority,
    assignee: t.assignee ? fromClickUpMember(t.assignee) : null,
    kind: kind(t),
    dueDate: t.dueDate,
    overdue: t.overdue,
    updatedAt: t.updatedAt,
    daysIdle: t.daysIdle,
    waitingOn: waitingOn(t.blockedOn),
    estimateHours: t.estimateHours,
    // ClickUp's change marker is the task's last update; the write route compares it (expectedMarker).
    concurrencyToken: t.updatedAt,
    sourceLabel: LABEL,
    sourceLink: { href: t.url, label: LABEL },
  };
}

/**
 * Neutral person refs (or, for older clients, raw member ids) → ClickUp member ids. Every id must be a
 * current workspace member; anything else is refused before a write is attempted.
 */
export function clickUpAssigneeIds(input: unknown, memberIds: Set<number>): number[] {
  if (input === undefined) return [];
  if (!Array.isArray(input) || input.length > 50) throw new OpsPolicyError('invalid_assignee');
  return input.map((v) => {
    const id = typeof v === 'number' ? v : typeof v === 'string' && /^[0-9]{1,15}$/.test(v) ? Number(v) : NaN;
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

export function clickupProjectSource(folder: ClientFolder): ProjectTaskSource {
  return {
    provider: 'clickup',
    async items(options = {}) {
      const { tasks, incomplete } = await read(() => getTasksByFolderWithCompleteness(folder, options));
      return { items: tasks.map(fromClickUpTask), complete: !incomplete };
    },
    async statusOptions() {
      const lists = await read(() => getFolderLists(folder));
      return Object.fromEntries(lists.map((l) => [l.id, l.statuses]));
    },
    async people() {
      return (await read(() => getWorkspaceMembers())).map(fromClickUpMember);
    },
    async timeByItem(range) {
      const { totalHours, perTask } = await read(() => getTimeByTask(folder, range));
      return { totalHours, perItem: perTask.map((t) => ({ itemId: t.taskId, itemName: t.taskName, hours: t.hours })) };
    },
  };
}

/** Open work (decision records excluded) across several ClickUp folders. */
export async function clickupOpenItems(folders: ClientFolder[]): Promise<WorkItemsRead> {
  const { tasks, incomplete } = await read(() => getOpenTasksWithCompleteness(folders));
  return { items: tasks.map(fromClickUpTask), complete: !incomplete };
}
