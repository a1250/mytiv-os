import { expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { clickUpAssigneeIds, fromClickUpMember, fromClickUpTask } from '../lib/work-source/clickup-adapter';
import { sameWorkRef, stuckItems, workStats } from '../lib/work-source/types';
import { waitingOnLabel } from '../lib/work-source/labels';
import { planItemTaskRef } from '../lib/marketing/task-ref';
import { OPS_TASKS, MEMBERS } from './fixtures/ops-tasks';

// Mytiv Work package 1 — the ClickUp adapter is the only place ClickUp vocabulary meets the neutral model.
test('every OpsTask field maps to the neutral WorkItem', () => {
  const t = fromClickUpTask(OPS_TASKS[0]);
  expect(t).toEqual({
    ref: { provider: 'clickup', id: 'T-1' }, title: 'Fix menu prices', projectKey: 'umino', projectLabel: 'UMINO', groupLabel: 'משימות',
    statusLabel: 'in progress', statusCategory: 'active', statusScope: 'L-tasks', priority: 'high', assignee: { ref: '101', name: 'Dana' },
    kind: 'task', dueDate: '2026-09-20', overdue: true, updatedAt: '2026-09-25T08:00:00.000Z', daysIdle: 6, waitingOn: 'internal',
    estimateHours: 2.5, concurrencyToken: '2026-09-25T08:00:00.000Z', sourceLabel: 'ClickUp',
    sourceLink: { href: 'https://app.clickup.com/t/T-1', label: 'ClickUp' },
  });
  // No ClickUp field name survives in the neutral item.
  for (const k of ['id', 'url', 'status', 'statusType', 'listId', 'listName', 'listKind', 'blockedOn', 'clientKey', 'isBug', 'isDecision']) expect(t).not.toHaveProperty(k);
});

test('status types, list kinds and blocked-on map onto neutral categories', () => {
  const items = OPS_TASKS.map(fromClickUpTask);
  expect(items.map((i) => [i.ref.id, i.statusCategory, i.kind, i.waitingOn])).toEqual([
    ['T-1', 'active', 'task', 'internal'], ['T-2', 'open', 'task', 'client'], ['T-3', 'open', 'other', 'contractor'],
    ['B-1', 'open', 'bug', null], ['D-1', 'closed', 'decision', null], ['D-2', 'open', 'decision', null],
  ]);
  expect(fromClickUpTask({ ...OPS_TASKS[0], statusType: 'done' }).statusCategory).toBe('done');
  expect(['internal', 'client', 'contractor'].map((w) => waitingOnLabel(w as 'internal'))).toEqual(['Me', 'Client', 'Contractor']);
});

test('stats and stuck ordering are the same numbers Ops showed from ClickUp', () => {
  const open = OPS_TASKS.map(fromClickUpTask).filter((i) => i.kind !== 'decision');
  expect(workStats(open, 3)).toEqual({ stuck: 3, overdue: 1, openTasks: 3, openBugs: 1 });
  expect(stuckItems(open, 3).map((i) => i.ref.id)).toEqual(['T-1', 'B-1', 'T-3']);
});

test('person refs round-trip to ClickUp member ids; anything else is refused before a write', () => {
  const members = new Set(MEMBERS.map((m) => m.id));
  expect(MEMBERS.map(fromClickUpMember)).toEqual([{ ref: '101', name: 'Dana' }, { ref: '102', name: 'Noam' }]);
  expect(clickUpAssigneeIds(['101', '102'], members)).toEqual([101, 102]);
  expect(clickUpAssigneeIds([101], members)).toEqual([101]); // legacy numeric ids still accepted
  expect(clickUpAssigneeIds(undefined, members)).toEqual([]);
  for (const bad of [['999'], ['10a'], [' 101'], ['1e2'], [1.5], 'x', Array(51).fill('101'), [null]]) expect(() => clickUpAssigneeIds(bad, members)).toThrow('invalid_assignee');
});

test('marketing plan items resolve to a neutral ref; refs compare by provider and id', () => {
  expect(planItemTaskRef({ clickupTaskId: 'T-1' })).toEqual({ provider: 'clickup', id: 'T-1' });
  expect(planItemTaskRef({})).toBeNull();
  expect(sameWorkRef({ provider: 'clickup', id: 'T-1' }, { provider: 'clickup', id: 'T-1' })).toBe(true);
  expect(sameWorkRef({ provider: 'clickup', id: 'T-1' }, { provider: 'mytiv', id: 'T-1' })).toBe(false);
  expect(sameWorkRef(null, { provider: 'clickup', id: 'T-1' })).toBe(false);
});
