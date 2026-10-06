import { expect, test, vi } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('server-only', () => ({}));
import { CLICKUP_CAPABILITIES, clickUpAssigneeIds, clickUpStatusCategory, clickUpStatusOptions, clickupCommandSource, fromClickUpMember, fromClickUpTask } from '../lib/work-source/clickup-adapter';
import { NO_CAPABILITIES, isFinished, parseRefKey, refKey, sameWorkRef, stuckItems, workStats, type WorkItem } from '../lib/work-source/types';
import { waitingOnLabel } from '../lib/work-source/labels';
import { planItemTaskRef } from '../lib/marketing/task-ref';
import { compareEstimates } from '../lib/money';
import { Toaster } from '../components/ui/toast';
import { TaskTable } from '../components/ops/task-table';
import { StuckList } from '../components/ops/stuck-list';
import { OPS_TASKS, MEMBERS, FOLDER_LISTS } from './fixtures/ops-tasks';

// Mytiv Work package 1 — the ClickUp adapter is the only place ClickUp vocabulary meets the neutral model.
test('every OpsTask field maps to the neutral WorkItem', () => {
  const t = fromClickUpTask(OPS_TASKS[0]);
  expect(t).toEqual({
    ref: { provider: 'clickup', id: 'T-1' }, title: 'Fix menu prices', projectKey: 'umino', projectLabel: 'UMINO', groupLabel: 'משימות',
    statusLabel: 'in progress', statusCategory: 'active', statusScope: { provider: 'clickup', id: 'L-tasks' }, priority: 'high',
    assignee: { ref: { provider: 'clickup', id: '101' }, name: 'Dana' },
    kind: 'task', dueDate: '2026-09-20', overdue: true, updatedAt: '2026-09-25T08:00:00.000Z', daysIdle: 6, waitingOn: 'internal',
    estimateHours: 2.5, archived: false, trashed: false, concurrencyToken: '2026-09-25T08:00:00.000Z', sourceLabel: 'ClickUp',
    sourceLink: { href: 'https://app.clickup.com/t/T-1', label: 'ClickUp' },
  });
  for (const k of ['id', 'url', 'status', 'statusType', 'listId', 'listName', 'listKind', 'blockedOn', 'clientKey', 'isBug', 'isDecision']) expect(t).not.toHaveProperty(k);
});

test('ClickUp status types are authoritative; a custom status maps only by an explicit name, otherwise unknown', () => {
  expect(clickUpStatusCategory('open', 'to do')).toBe('open');
  expect(clickUpStatusCategory('closed', 'complete')).toBe('done');
  expect(clickUpStatusCategory('done', 'shipped')).toBe('done');
  expect(clickUpStatusCategory('custom', '  In   Progress ')).toBe('active');
  expect(clickUpStatusCategory('custom', 'submit for review')).toBe('review');
  expect(clickUpStatusCategory('custom', 'בבדיקה')).toBe('review');
  expect(clickUpStatusCategory('custom', 'ממתין ללקוח')).toBe('waiting');
  expect(clickUpStatusCategory('custom', 'Blocked')).toBe('waiting');
  expect(clickUpStatusCategory('custom', 'בוטל')).toBe('cancelled');
  // Not guessed: these could mean anything.
  for (const name of ['design', 'phase 2', 'ready', 'approved?', 'גרפיקה']) expect(clickUpStatusCategory('custom', name)).toBe('unknown');
  expect(clickUpStatusCategory('weird-type', 'in progress')).toBe('unknown');
  expect(clickUpStatusOptions(FOLDER_LISTS)['clickup:L-tasks']).toEqual([{ label: 'to do', category: 'open' }, { label: 'in progress', category: 'active' }, { label: 'complete', category: 'done' }]);
});

test('unknown is never finished, never active, and never changes the Ops counts', () => {
  expect(isFinished('unknown')).toBe(false);
  expect(isFinished('done')).toBe(true);
  expect(isFinished('cancelled')).toBe(true);
  const items = OPS_TASKS.map(fromClickUpTask).filter((i) => i.kind !== 'decision');
  const asUnknown: WorkItem[] = items.map((i) => ({ ...i, statusCategory: 'unknown' }));
  expect(workStats(asUnknown, 3)).toEqual(workStats(items, 3)); // counts never read the category
  expect(asUnknown.filter((i) => i.statusCategory === 'active')).toHaveLength(0);
});

test('an unmapped status is shown as such, and nothing else changes for mapped ones', () => {
  const unknownItem: WorkItem = { ...fromClickUpTask(OPS_TASKS[0]), statusLabel: 'design', statusCategory: 'unknown' };
  const props = { businessSlug: 'mytiv', projectId: 'p', members: MEMBERS.map(fromClickUpMember), statusOptions: clickUpStatusOptions(FOLDER_LISTS), capabilities: CLICKUP_CAPABILITIES, emptyMessage: '-' };
  expect(renderToStaticMarkup(h(Toaster, null, h(TaskTable, { ...props, tasks: [unknownItem] })))).toContain('Unmapped status');
  expect(renderToStaticMarkup(h(Toaster, null, h(TaskTable, { ...props, tasks: [fromClickUpTask(OPS_TASKS[0])] })))).not.toContain('Unmapped status');
  expect(renderToStaticMarkup(h(StuckList, { tasks: [unknownItem] }))).toContain('(unmapped status)');
});

test('the UI offers only what the source declares', () => {
  const props = { businessSlug: 'mytiv', projectId: 'p', tasks: [fromClickUpTask(OPS_TASKS[0])], members: MEMBERS.map(fromClickUpMember), statusOptions: clickUpStatusOptions(FOLDER_LISTS), emptyMessage: '-' };
  const none = renderToStaticMarkup(h(Toaster, null, h(TaskTable, { ...props, capabilities: { provider: 'mytiv', ...NO_CAPABILITIES } })));
  expect(none.match(/<select[^>]*disabled=""/g)).toHaveLength(2);
  const clickup = renderToStaticMarkup(h(Toaster, null, h(TaskTable, { ...props, capabilities: CLICKUP_CAPABILITIES })));
  expect(clickup.match(/<select[^>]*disabled=""/g)).toBeNull();
  // No source, or an item from another provider than the source's: nothing is offered.
  expect(renderToStaticMarkup(h(Toaster, null, h(TaskTable, { ...props, capabilities: null }))).match(/<select[^>]*disabled=""/g)).toHaveLength(2);
  const foreign = { ...props.tasks[0], ref: { provider: 'mytiv' as const, id: 'T-1' } };
  expect(renderToStaticMarkup(h(Toaster, null, h(TaskTable, { ...props, tasks: [foreign], capabilities: CLICKUP_CAPABILITIES }))).match(/<select[^>]*disabled=""/g)).toHaveLength(2);
  expect(CLICKUP_CAPABILITIES).toEqual({ provider: 'clickup', changeStatus: true, assign: true, create: false, comment: false, setDueDate: false, trackTime: false, archive: false, trash: false, nest: false, depend: false, checklist: false });
});

test('identities carry their provider: equal ids from two sources never collide', () => {
  const a = fromClickUpTask(OPS_TASKS[0]);
  const b: WorkItem = { ...a, ref: { provider: 'mytiv', id: 'T-1' } };
  expect(refKey(a.ref)).not.toBe(refKey(b.ref));
  expect(sameWorkRef(a.ref, b.ref)).toBe(false);
  expect(new Set([a, b].map((i) => refKey(i.ref))).size).toBe(2);
  // Money: estimates and logged time keyed by provider+id — a Mytiv estimate is never applied to ClickUp time.
  const estimates = new Map([[refKey(b.ref), { name: 'mytiv', estimateHours: 1 }]]);
  expect(compareEstimates([{ taskId: refKey(a.ref), taskName: 'clickup', hours: 3 }], estimates)[0]).toMatchObject({ estimateHours: null, overrunPct: null });
  expect(parseRefKey('clickup:101')).toEqual({ provider: 'clickup', id: '101' });
  expect(parseRefKey('mytiv:a:b')).toEqual({ provider: 'mytiv', id: 'a:b' });
  for (const bad of ['101', 'jira:1', ':1', 'clickup:', 7, null]) expect(parseRefKey(bad)).toBeNull();
});

test('person refs reach ClickUp only as ClickUp member ids; a Mytiv ref is refused even if numeric', () => {
  const members = new Set(MEMBERS.map((m) => m.id));
  expect(MEMBERS.map(fromClickUpMember)).toEqual([{ ref: { provider: 'clickup', id: '101' }, name: 'Dana' }, { ref: { provider: 'clickup', id: '102' }, name: 'Noam' }]);
  expect(clickUpAssigneeIds([{ provider: 'clickup', id: '101' }, { provider: 'clickup', id: '102' }], members)).toEqual([101, 102]);
  expect(clickUpAssigneeIds([101, '102'], members)).toEqual([101, 102]); // legacy clients
  expect(clickUpAssigneeIds(undefined, members)).toEqual([]);
  for (const bad of [[{ provider: 'mytiv', id: '101' }], [{ id: '101' }], ['999'], ['clickup:101'], ['10a'], [1.5], 'x', Array(51).fill('101'), [null]]) {
    expect(() => clickUpAssigneeIds(bad, members)).toThrow('invalid_assignee');
  }
});

test('the ClickUp command source refuses foreign targets and empty changes before any write', async () => {
  await expect(clickupCommandSource.prepare({ provider: 'mytiv', id: 'T-1' }, { status: 'done' })).rejects.toThrow('invalid_target');
  await expect(clickupCommandSource.prepare({ provider: 'clickup', id: 'T-1' }, {})).rejects.toThrow('nothing_to_update');
  expect(await clickupCommandSource.prepare({ provider: 'clickup', id: 'T-1' }, { status: 'complete' })).toEqual({ target: { provider: 'clickup', id: 'T-1' }, change: { status: 'complete' }, payload: { status: 'complete' } });
});

test('stats, stuck ordering, waiting-on labels and plan refs are what Ops showed before', () => {
  const open = OPS_TASKS.map(fromClickUpTask).filter((i) => i.kind !== 'decision');
  expect(workStats(open, 3)).toEqual({ stuck: 3, overdue: 1, openTasks: 3, openBugs: 1 });
  expect(stuckItems(open, 3).map((i) => i.ref.id)).toEqual(['T-1', 'B-1', 'T-3']);
  expect(['internal', 'client', 'contractor'].map((w) => waitingOnLabel(w as 'internal'))).toEqual(['Me', 'Client', 'Contractor']);
  expect(planItemTaskRef({ clickupTaskId: 'T-1' })).toEqual({ provider: 'clickup', id: 'T-1' });
  expect(planItemTaskRef({})).toBeNull();
});
