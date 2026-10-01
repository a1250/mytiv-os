import { expect, test, vi } from 'vitest';
import { createElement as h, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
// Render every tab, not only the active one, so all task-bearing markup is pinned.
vi.mock('../components/ui/tabs', () => ({
  Tabs: ({ children }: { children: ReactNode }) => h('div', { 'data-tabs': '' }, children),
  TabsList: ({ children }: { children: ReactNode }) => h('div', { 'data-tablist': '' }, children),
  TabsTrigger: ({ value, children }: { value: string; children: ReactNode }) => h('button', { 'data-trigger': value }, children),
  TabsContent: ({ value, children }: { value: string; children: ReactNode }) => h('section', { 'data-panel': value }, children),
}));
import { Toaster } from '../components/ui/toast';
import { StuckList } from '../components/ops/stuck-list';
import { TaskTable } from '../components/ops/task-table';
import { ClientWorkspace } from '../components/ops/client-workspace';
import { MarketingPanel } from '../components/ops/marketing-panel';
import { StatTiles } from '../components/ops/stat-tiles';
import { statsFor } from '../lib/clickup';
import { OPS_TASKS, MEMBERS, STATUSES_BY_LIST, PLAN } from './fixtures/ops-tasks';

/**
 * Package-1 parity guard (Mytiv Work): the Ops screens' rendered HTML for a fixed ClickUp-shaped fixture.
 * The snapshot was written at e35a189, BEFORE the provider-neutral TaskSource refactor; after it the
 * same fixture goes through the ClickUp adapter and the markup must be byte-identical.
 */
vi.mock('server-only', () => ({}));
const render = (node: ReturnType<typeof h>) => renderToStaticMarkup(h(Toaster, null, node));
const tasks = OPS_TASKS;
const work = tasks.filter(t => t.listKind === 'tasks' || t.listKind === 'other');
const bugs = tasks.filter(t => t.isBug);
const decisions = tasks.filter(t => t.isDecision);
const project = { id: 'p-1', businessId: 'b-1', name: 'UMINO', client: 'UMINO', status: 'active', brief: '', budget: '', deadline: null,
  clickupFolderId: '901816026303', createdAt: new Date('2026-01-01T00:00:00Z'), updatedAt: new Date('2026-01-01T00:00:00Z'), folderState: 'linked' as const };
const marketing = { binding: 'umino-demo', plan: PLAN, canImport: true, unavailable: false, now: '2026-10-01T12:00:00Z', bindingVersion: 1, previousPlans: [], moduleEnabled: true };

test('StuckList markup is unchanged', () => {
  expect(render(h(StuckList, { tasks: work.filter(t => t.daysIdle >= 3) }))).toMatchSnapshot();
});
test('TaskTable markup is unchanged (writer and read-only)', () => {
  const props = { businessSlug: 'mytiv', projectId: 'p-1', tasks: work, members: MEMBERS, statusesByList: STATUSES_BY_LIST, emptyMessage: 'none' };
  expect(render(h(TaskTable, props))).toMatchSnapshot();
  expect(render(h(TaskTable, { ...props, readOnly: true }))).toMatchSnapshot();
  expect(render(h(TaskTable, { ...props, tasks: [] }))).toMatchSnapshot();
});
test('ClientWorkspace markup is unchanged (all tabs)', () => {
  const props = { businessSlug: 'mytiv', project, tasks: work, bugs, decisions, members: MEMBERS, statusesByList: STATUSES_BY_LIST, marketing, canWrite: true, incomplete: false };
  expect(render(h(ClientWorkspace, props))).toMatchSnapshot();
  expect(render(h(ClientWorkspace, { ...props, incomplete: true, canWrite: false }))).toMatchSnapshot();
});
test('MarketingPanel execution-status column is unchanged', () => {
  expect(render(h(MarketingPanel, { businessSlug: 'mytiv', projectId: 'p-1', tasks: [...work, ...bugs], ...marketing }))).toMatchSnapshot();
});
test('StatTiles numbers are unchanged', () => {
  const open = tasks.filter(t => !t.isDecision);
  expect(statsFor(open, 3)).toEqual({ stuck: 3, overdue: 1, openTasks: 3, openBugs: 1 });
  expect(render(h(StatTiles, { stats: statsFor(open, 3) }))).toMatchSnapshot();
});
