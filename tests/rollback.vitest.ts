/**
 * Governed write → audit record → controlled rollback, end to end through the HTTP routes.
 * ClickUp is an in-memory task behind a mocked fetch; the audit tables are in-memory arrays with
 * the same tenant scoping the SQL applies. No network, no database.
 */
import { beforeEach, expect, test, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { getTableName } from 'drizzle-orm';

type Task = { id: string; list: string; status: string; assignees: number[]; due: number | null; updated: number; deleted?: boolean };
type Action = { id: string; businessId: string; projectId: string; userId: string; requestId: string; action: string; createdAt: Date };
type Event = { businessId: string; actionId: string; event: string; detail: Record<string, unknown>; createdAt: Date };

const mocks = vi.hoisted(() => ({
  guard: vi.fn(), project: vi.fn(),
  actions: [] as Action[], events: [] as Event[], seq: 0,
}));
vi.mock('server-only', () => ({}));
vi.mock('../lib/api-guard', () => ({ guard: mocks.guard, ApiGuardError: class extends Error { response = NextResponse.json({ error: 'unauthorized' }, { status: 401 }); } }));
vi.mock('../lib/db/queries/projects', () => ({ getProject: mocks.project }));
vi.mock('../lib/db', () => ({ db: {
  insert: (table: unknown) => ({ values: (v: Record<string, unknown>) => {
    const name = getTableName(table as Parameters<typeof getTableName>[0]);
    if (name === 'ops_actions') return { onConflictDoNothing: () => ({ returning: async () => {
      if (mocks.actions.some((a) => a.businessId === v.businessId && a.requestId === v.requestId)) return [];
      const row: Action = { id: `a0000000-0000-4000-8000-${String(++mocks.seq).padStart(12, '0')}`, businessId: String(v.businessId), projectId: String(v.projectId), userId: String(v.userId), requestId: String(v.requestId), action: String(v.action), createdAt: new Date() };
      mocks.actions.push(row); return [{ id: row.id }];
    } }) };
    mocks.events.push({ businessId: String(v.businessId), actionId: String(v.actionId), event: String(v.event), detail: v.detail as Record<string, unknown>, createdAt: new Date() });
    return Promise.resolve();
  } }),
} }));
// The two reads used by rollback, with exactly the scoping the SQL applies.
vi.mock('../lib/ops-audit', async (importActual) => {
  const actual = await importActual<typeof import('../lib/ops-audit')>();
  return { ...actual,
    getOpsAction: async (businessId: string, projectId: string, actionId: string) => mocks.actions.find((a) => a.businessId === businessId && a.projectId === projectId && a.id === actionId) ?? null,
    listActionEvents: async (businessId: string, actionId: string) => mocks.events.filter((e) => e.businessId === businessId && e.actionId === actionId),
  };
});

import { PATCH } from '../app/api/[businessSlug]/ops/tasks/[taskId]/route';
import { POST as ROLLBACK } from '../app/api/[businessSlug]/ops/actions/[actionId]/rollback/route';
import { POST as CONFIRM } from '../app/api/[businessSlug]/ops/chat/confirm/route';

const owner = { businessId: 'biz-a', userId: 'user-a', role: 'owner' };
const project = { id: 'proj-a', name: 'Fixture', clickupFolderId: 'folder-a', folderState: 'linked' };
let task: Task, writes: string[], verifyBreaks: boolean;
const rid = (n: number) => `${String(n).padStart(8, '0')}-1111-4111-8111-111111111111`;
const req = (path: string, method: string, body: unknown) => new NextRequest(`https://ops.example${path}`, { method, headers: { origin: 'https://ops.example', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const patchReq = (body: Record<string, unknown>) => PATCH(req('/api/mytiv/ops/tasks/task-1', 'PATCH', { projectId: 'proj-a', confirmed: true, ...body }), { params: Promise.resolve({ businessSlug: 'mytiv', taskId: 'task-1' }) });
const rollbackReq = (actionId: string, body: Record<string, unknown> = {}) => ROLLBACK(req(`/api/mytiv/ops/actions/${actionId}/rollback`, 'POST', { projectId: 'proj-a', confirmed: true, requestId: rid(99), ...body }), { params: Promise.resolve({ businessSlug: 'mytiv', actionId }) });
const rawTask = () => ({ id: task.id, name: 'Fixture', url: 'https://app.clickup.com/t/task-1', list: { id: task.list }, status: { status: task.status, type: task.status === 'finished' ? 'closed' : 'custom' }, assignees: task.assignees.map((id) => ({ id, username: `person-${id}`, email: `p${id}@x.invalid` })), due_date: task.due === null ? null : String(task.due), date_updated: String(task.updated), attachments: [] });
const eventsOf = (actionId: string) => mocks.events.filter((e) => e.actionId === actionId);
const lastAction = () => mocks.actions[mocks.actions.length - 1];

beforeEach(() => {
  task = { id: 'task-1', list: 'list-a', status: 'working', assignees: [1], due: null, updated: 1000 };
  writes = []; verifyBreaks = false; mocks.actions = []; mocks.events = []; mocks.seq = 0;
  mocks.guard.mockResolvedValue(owner); mocks.project.mockResolvedValue(project);
  process.env.CLICKUP_API_TOKEN = 'fixture'; process.env.CLICKUP_WORKSPACE_ID = 'fixture';
  vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
    const u = String(url);
    if (options?.method === 'PUT') {
      const body = JSON.parse(String(options.body)); writes.push(JSON.stringify(body));
      if (body.status) task.status = body.status;
      if (body.assignees?.add) task.assignees = [...new Set([...task.assignees, ...body.assignees.add])];
      if (body.assignees?.rem) task.assignees = task.assignees.filter((id) => !body.assignees.rem.includes(id));
      if ('due_date' in body) task.due = body.due_date;
      task.updated += 1;
      if (verifyBreaks) task.deleted = true; // the write landed, then the read-back cannot see it
      return Response.json(rawTask());
    }
    if (u.includes('/folder/')) return Response.json({ lists: [{ id: 'list-a', name: 'Tasks', statuses: [{ status: 'working', type: 'custom' }, { status: 'review', type: 'custom' }, { status: 'finished', type: 'closed' }] }] });
    if (u.endsWith('/team')) return Response.json({ teams: [{ id: 'fixture', members: [{ user: { id: 1, username: 'A' } }, { user: { id: 2, username: 'B' } }] }] });
    if (u.endsWith('/comment')) return Response.json({ comments: [] });
    if (task.deleted) return new Response('{"err":"Task not found"}', { status: 404 });
    return Response.json(rawTask());
  }));
});

async function governedUpdate(n = 1, body: Record<string, unknown> = { status: 'review', assignee: { add: [2] }, expectedUpdatedAt: new Date(task.updated).toISOString() }) {
  const res = await patchReq({ requestId: rid(n), ...body });
  return { res, action: lastAction() };
}

test('a governed write records actor, approval, target, eligibility, pre_state, post_state and the ClickUp reference', async () => {
  const { res, action } = await governedUpdate();
  expect(res.status).toBe(200);
  const [confirmed, succeeded] = eventsOf(action.id);
  expect(action).toMatchObject({ userId: 'user-a', action: 'update_task', requestId: rid(1) });
  expect(confirmed.event).toBe('confirmed');
  expect(confirmed.detail).toMatchObject({ actor: 'user-a', action: 'update_task', target: { kind: 'task', id: 'task-1' }, rollback_eligibility: 'eligible', approval: { requestId: rid(1), evidence_reviewed: false } });
  expect(succeeded.event).toBe('succeeded');
  expect(succeeded.detail.pre_state).toEqual({ taskId: 'task-1', listId: 'list-a', status: 'working', assigneeIds: [1], dueDate: null, dateUpdated: '1000' });
  expect(succeeded.detail.post_state).toEqual({ taskId: 'task-1', listId: 'list-a', status: 'review', assigneeIds: [1, 2], dueDate: null, dateUpdated: '1001' });
  expect(succeeded.detail.external_ref).toEqual({ taskId: 'task-1', url: 'https://app.clickup.com/t/task-1', date_updated: '1001' });
  expect(JSON.stringify(succeeded.detail)).not.toMatch(/person-|@x\.invalid/);
});

test('a write is refused before anything is sent when the task changed since the row was rendered', async () => {
  task.updated = 2000; // somebody edited it after the page loaded (row says 1000)
  const res = await patchReq({ requestId: rid(1), status: 'review', expectedUpdatedAt: new Date(1000).toISOString() });
  expect(res.status).toBe(409); expect((await res.json()).error).toBe('task_changed_since_read');
  expect(writes).toHaveLength(0); expect(task.status).toBe('working');
  expect(eventsOf(lastAction().id).map((e) => e.event)).toEqual(['confirmed', 'failed_or_unknown']);
  expect(eventsOf(lastAction().id)[1].detail).toMatchObject({ phase: 'before_write', pre_state: { status: 'working' } });
});

test('creations are recorded as not reversible: no delete capability', async () => {
  const ctxProject = { ...project, brief: '' };
  mocks.project.mockResolvedValue(ctxProject);
  const res = await CONFIRM(req('/api/mytiv/ops/chat/confirm', 'POST', { projectId: 'proj-a', confirmed: true, requestId: rid(5), tool: 'add_comment', input: { task_id: 'task-1', text: 'note' } }), { params: Promise.resolve({ businessSlug: 'mytiv' }) });
  expect(res.status).toBe(200);
  expect(eventsOf(lastAction().id)[0].detail.rollback_eligibility).toEqual({ not: 'no_delete_capability' });
  const rb = await rollbackReq(lastAction().id);
  expect(rb.status).toBe(400); expect((await rb.json()).error).toBe('rollback_unsupported_for_action');
});

// 1 ─ normal update + rollback
test('rollback restores the stored pre_state with exactly one reverse write and audits both sides', async () => {
  const { action } = await governedUpdate();
  expect(task).toMatchObject({ status: 'review', assignees: [1, 2] });
  const res = await rollbackReq(action.id);
  expect(res.status).toBe(200);
  expect(writes).toHaveLength(2);
  expect(JSON.parse(writes[1])).toEqual({ status: 'working', assignees: { rem: [2] } });
  expect(task).toMatchObject({ status: 'working', assignees: [1] });
  const body = await res.json();
  expect(body).toMatchObject({ ok: true, rolled_back: action.id, restored_to: { status: 'working', assigneeIds: [1] }, restored_state: { status: 'working', assigneeIds: [1], dateUpdated: '1002' } });
  // the rollback is its own claimed action with its own pre/post
  const rb = lastAction();
  expect(rb.action).toBe('rollback_task');
  expect(eventsOf(rb.id).map((e) => e.event)).toEqual(['confirmed', 'succeeded']);
  expect(eventsOf(rb.id)[0].detail).toMatchObject({ target: { kind: 'action', id: action.id }, rollback_eligibility: { not: 'not_a_task_update' } });
  expect(eventsOf(rb.id)[1].detail).toMatchObject({ pre_state: { status: 'review', assigneeIds: [1, 2] }, post_state: { status: 'working', assigneeIds: [1] } });
  // and the original now carries the rolled_back receipt
  const original = eventsOf(action.id);
  expect(original.map((e) => e.event)).toEqual(['confirmed', 'succeeded', 'rolled_back']);
  expect(original[2].detail).toMatchObject({ by_request_id: rid(99), restored_to: { status: 'working' } });
});

test('rollback restores a cleared due date and never re-closes a task', async () => {
  task.due = 1_700_000_000_000;
  // give the task a status the reverse of which would close it
  task.status = 'finished';
  await governedUpdate(1, { status: 'review', expectedUpdatedAt: new Date(task.updated).toISOString() });
  const closing = await rollbackReq(lastAction().id);
  expect(closing.status).toBe(409); expect((await closing.json()).error).toBe('rollback_would_close_task_use_normal_flow');
  expect(writes).toHaveLength(1);
});

// 2 ─ partial external failure
test('a write whose read-back fails is recorded as after_write_unverified with pre_state, and is not auto-reversible', async () => {
  verifyBreaks = true;
  const res = await patchReq({ requestId: rid(1), status: 'review' });
  expect(res.status).toBe(502); expect((await res.json()).error).toBe('write_unverified_check_audit_before_retry');
  const ev = eventsOf(lastAction().id);
  expect(ev.map((e) => e.event)).toEqual(['confirmed', 'failed_or_unknown']);
  expect(ev[1].detail).toMatchObject({ phase: 'after_write_unverified', pre_state: { status: 'working', dateUpdated: '1000' } });
  task.deleted = false;
  const rb = await rollbackReq(lastAction().id);
  expect(rb.status).toBe(409); expect((await rb.json()).error).toBe('outcome_unknown');
  expect(writes).toHaveLength(1);
});

// 3 ─ target deleted externally
test('rollback refuses when the task no longer exists, writes nothing, and leaves a refusal receipt', async () => {
  const { action } = await governedUpdate();
  task.deleted = true;
  const res = await rollbackReq(action.id);
  expect(res.status).toBe(409); expect((await res.json()).error).toBe('target_missing');
  expect(writes).toHaveLength(1);
  expect(eventsOf(lastAction().id).map((e) => e.event)).toEqual(['confirmed', 'refused_before_write']);
  expect(eventsOf(action.id).some((e) => e.event === 'rolled_back')).toBe(false);
});

// 4 ─ state changed after the original write
test('rollback refuses when the task moved on after the original write — newer work is never overwritten', async () => {
  const { action } = await governedUpdate();
  task.status = 'finished'; task.updated += 1; // edited in ClickUp by someone else
  const res = await rollbackReq(action.id);
  expect(res.status).toBe(409); expect((await res.json()).error).toBe('task_changed_since_action');
  expect(writes).toHaveLength(1); expect(task.status).toBe('finished');
});

test('a later governed write also blocks rollback of the earlier one', async () => {
  const { action: first } = await governedUpdate(1);
  await governedUpdate(2, { status: 'working', expectedUpdatedAt: new Date(task.updated).toISOString() });
  const res = await rollbackReq(first.id);
  expect(res.status).toBe(409); expect((await res.json()).error).toBe('task_changed_since_action');
  expect(writes).toHaveLength(2);
});

// 5 ─ duplicate rollback request
test('the same rollback request is claimed once; a new request on a rolled-back action is refused', async () => {
  const { action } = await governedUpdate();
  expect((await rollbackReq(action.id)).status).toBe(200);
  const replay = await rollbackReq(action.id); // same requestId
  expect(replay.status).toBe(409); expect((await replay.json()).error).toBe('request_already_claimed_check_audit_before_retry');
  const again = await rollbackReq(action.id, { requestId: rid(98) });
  expect(again.status).toBe(409); expect((await again.json()).error).toBe('already_rolled_back');
  expect(writes).toHaveLength(2);
  expect(eventsOf(action.id).filter((e) => e.event === 'rolled_back')).toHaveLength(1);
});

// 6 ─ unauthorized rollback
test('members, unconfirmed and cross-origin requests cannot roll back, and the copilot cannot propose it', async () => {
  const { action } = await governedUpdate();
  mocks.guard.mockResolvedValue({ ...owner, role: 'member' });
  expect((await rollbackReq(action.id)).status).toBe(403);
  mocks.guard.mockResolvedValue(owner);
  expect((await rollbackReq(action.id, { confirmed: false })).status).toBe(400);
  const foreign = ROLLBACK(new NextRequest(`https://ops.example/api/mytiv/ops/actions/${action.id}/rollback`, { method: 'POST', headers: { origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: 'proj-a', confirmed: true, requestId: rid(97) }) }), { params: Promise.resolve({ businessSlug: 'mytiv', actionId: action.id }) });
  expect((await foreign).status).toBe(403);
  const viaCopilot = await CONFIRM(req('/api/mytiv/ops/chat/confirm', 'POST', { projectId: 'proj-a', confirmed: true, requestId: rid(96), tool: 'rollback_task', input: { of: action.id } }), { params: Promise.resolve({ businessSlug: 'mytiv' }) });
  expect(viaCopilot.status).toBe(400); expect((await viaCopilot.json()).error).toBe('invalid_action');
  expect(writes).toHaveLength(1); expect(mocks.actions).toHaveLength(1);
});

// 7 ─ cross-tenant rollback attempt
test('an owner of another business cannot see or roll back this action', async () => {
  const { action } = await governedUpdate();
  mocks.guard.mockResolvedValue({ businessId: 'biz-b', userId: 'user-b', role: 'owner' });
  mocks.project.mockResolvedValue({ id: 'proj-a', name: 'Other', clickupFolderId: 'folder-b', folderState: 'linked' });
  const fetchCalls = (fetch as unknown as { mock: { calls: unknown[] } }).mock.calls.length;
  const res = await rollbackReq(action.id);
  expect(res.status).toBe(404);
  expect((fetch as unknown as { mock: { calls: unknown[] } }).mock.calls.length).toBe(fetchCalls); // no ClickUp read at all
  expect(writes).toHaveLength(1);
  // and a mismatched project inside the same business is equally invisible
  mocks.guard.mockResolvedValue(owner); mocks.project.mockResolvedValue({ ...project, id: 'proj-x' });
  const other = await ROLLBACK(req(`/api/mytiv/ops/actions/${action.id}/rollback`, 'POST', { projectId: 'proj-x', confirmed: true, requestId: rid(95) }), { params: Promise.resolve({ businessSlug: 'mytiv', actionId: action.id }) });
  expect(other.status).toBe(404);
  expect(eventsOf(action.id).some((e) => e.event === 'rolled_back')).toBe(false);
});
