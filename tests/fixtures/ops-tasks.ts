import type { OpsTask, WorkspaceMember } from '../../lib/clickup';
import type { MarketingPlan } from '../../lib/marketing/contract';

// Fictional ClickUp-shaped rows (no real client data): one of every display branch the Ops screens have.
const base = { clientKey: 'umino', clientLabel: 'UMINO', priority: null, estimateHours: null, isBug: false, isDecision: false } as const;
export const OPS_TASKS: OpsTask[] = [
  { ...base, id: 'T-1', url: 'https://app.clickup.com/t/T-1', title: 'Fix menu prices', status: 'in progress', statusType: 'custom', assignee: { id: 101, name: 'Dana' },
    listId: 'L-tasks', listName: 'משימות', listKind: 'tasks', dueDate: '2026-09-20', overdue: true, updatedAt: '2026-09-25T08:00:00.000Z', daysIdle: 6, blockedOn: 'Me', estimateHours: 2.5, priority: 'high' },
  { ...base, id: 'T-2', url: 'https://app.clickup.com/t/T-2', title: 'Shoot reels', status: 'to do', statusType: 'open', assignee: null,
    listId: 'L-tasks', listName: 'משימות', listKind: 'tasks', dueDate: null, overdue: false, updatedAt: '2026-09-30T08:00:00.000Z', daysIdle: 1, blockedOn: 'Client' },
  { ...base, id: 'T-3', url: 'https://app.clickup.com/t/T-3', title: 'Other list item', status: 'open', statusType: 'open', assignee: { id: 102, name: 'Noam' },
    listId: 'L-other', listName: 'Ideas', listKind: 'other', dueDate: '2026-12-01', overdue: false, updatedAt: '2026-09-28T08:00:00.000Z', daysIdle: 3, blockedOn: 'Contractor' },
  { ...base, id: 'B-1', url: 'https://app.clickup.com/t/B-1', title: 'Checkout crash', status: 'open', statusType: 'open', assignee: { id: 102, name: 'Noam' },
    listId: 'L-bugs', listName: 'תקלות', listKind: 'bugs', dueDate: '2026-10-05', overdue: false, updatedAt: '2026-09-26T08:00:00.000Z', daysIdle: 5, blockedOn: null, isBug: true },
  { ...base, id: 'D-1', url: 'https://app.clickup.com/t/D-1', title: 'Use Instagram first', status: 'complete', statusType: 'closed', assignee: null,
    listId: 'L-dec', listName: 'יומן החלטות', listKind: 'decisions', dueDate: null, overdue: false, updatedAt: '2026-09-01T08:00:00.000Z', daysIdle: 30, blockedOn: null, isDecision: true },
  { ...base, id: 'D-2', url: 'https://app.clickup.com/t/D-2', title: 'Pause TikTok', status: 'open', statusType: 'open', assignee: null,
    listId: 'L-dec', listName: 'יומן החלטות', listKind: 'decisions', dueDate: null, overdue: false, updatedAt: '2026-09-02T08:00:00.000Z', daysIdle: 29, blockedOn: null, isDecision: true },
];
export const MEMBERS: WorkspaceMember[] = [{ id: 101, name: 'Dana' }, { id: 102, name: 'Noam' }];
export const STATUSES_BY_LIST: Record<string, string[]> = { 'L-tasks': ['to do', 'in progress', 'complete'], 'L-bugs': ['open', 'fixed'], 'L-other': ['open'] };
/** The same lists as ClickUp's folder read returns them (status → ClickUp status type). */
export const FOLDER_LISTS: { id: string; statuses: string[]; statusTypes: Record<string, string> }[] = [
  { id: 'L-tasks', statuses: STATUSES_BY_LIST['L-tasks'], statusTypes: { 'to do': 'open', 'in progress': 'custom', complete: 'closed' } },
  { id: 'L-bugs', statuses: STATUSES_BY_LIST['L-bugs'], statusTypes: { open: 'open', fixed: 'closed' } },
  { id: 'L-other', statuses: STATUSES_BY_LIST['L-other'], statusTypes: { open: 'open' } },
];
export const PLAN: MarketingPlan = {
  schemaVersion: 1, marketingBusiness: 'umino-demo', revision: 2, sourceRevision: 'rev-7', asOf: '2026-09-29T00:00:00Z',
  priorities: [{ id: 'p1', title: 'More weekday covers', evidenceRef: 'brain/goals.yaml', confidence: 'KNOWN', provenance: 'owner_verified' }],
  items: [
    { id: 'i1', title: 'Menu refresh', kind: 'content', priorityId: 'p1', start: '2026-10-01T00:00:00Z', end: '2026-10-07T00:00:00Z', dependsOn: [], sourceRef: 'plan/i1', clickupTaskId: 'T-1' },
    { id: 'i2', title: 'Bug-linked item', kind: 'ops', priorityId: 'p1', start: '2026-10-02T00:00:00Z', end: '2026-10-05T00:00:00Z', dependsOn: ['i1'], sourceRef: 'plan/i2', clickupTaskId: 'B-1' },
    { id: 'i3', title: 'Linked but not in list', kind: 'ads', priorityId: 'p1', start: '2026-10-03T00:00:00Z', end: '2026-10-09T00:00:00Z', dependsOn: [], sourceRef: 'plan/i3', clickupTaskId: 'GONE-9' },
    { id: 'i4', title: 'Not linked yet', kind: 'ads', priorityId: 'p1', start: '2026-10-04T00:00:00Z', end: '2026-10-10T00:00:00Z', dependsOn: [], sourceRef: 'plan/i4' },
  ],
  reviews: [{ id: 'r1', title: 'Weekly review', due: '2026-09-30T00:00:00Z', cadence: 'weekly', sourceRef: 'plan/r1' }],
};
