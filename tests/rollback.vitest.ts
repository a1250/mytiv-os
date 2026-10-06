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
// The reconciliation lookup (MKT-GOV06) over the same in-memory events, with the real open-item rule and the
// same scoping the SQL applies (tenant + the claim's target).
vi.mock('../lib/ops-reconciliation', async () => {
  const { isOpenReconciliation } = await import('../lib/ops-audit-view');
  return { openReconciliationOn: async (businessId: string, target: { kind: string; id: string }) => {
    const claims = mocks.events.filter((e) => e.businessId === businessId && e.event === 'confirmed'
      && (e.detail.target as { kind?: string; id?: string } | null)?.kind === target.kind && (e.detail.target as { id?: string } | null)?.id === target.id);
    for (const c of claims) if (isOpenReconciliation(mocks.events.filter((e) => e.businessId === businessId && e.actionId === c.actionId))) return { actionId: c.actionId };
    return null;
  } };
});
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
import { POST as RECONCILE } from '../app/api/[businessSlug]/ops/actions/[actionId]/reconcile/route';

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

// ── T-11.3 · reconciliation workflow (MKT-GOV06) ──
const reconcileReq = (actionId: string, body: Record<string, unknown> = {}) => RECONCILE(req(`/api/mytiv/ops/actions/${actionId}/reconcile`, 'POST', { projectId: 'proj-a', confirmed: true, requestId: rid(77), ...body }), { params: Promise.resolve({ businessSlug: 'mytiv', actionId }) });
async function unknownOutcome() {
  verifyBreaks = true;
  const { res, action } = await governedUpdate(1);
  expect(res.status).toBe(502);
  expect(eventsOf(action.id).map((e) => e.event)).toEqual(['confirmed', 'failed_or_unknown']);
  expect(eventsOf(action.id)[1].detail.phase).toBe('after_write_unverified');
  verifyBreaks = false;
  return action;
}

test('an unknown outcome opens a reconciliation item: a retry on the same task is refused before any claim or write', async () => {
  await unknownOutcome();
  delete task.deleted;
  const before = { writes: writes.length, actions: mocks.actions.length };
  const retry = await patchReq({ requestId: rid(2), status: 'working' });
  expect(retry.status).toBe(409);
  expect((await retry.json()).error).toBe('reconciliation_pending');
  expect(writes).toHaveLength(before.writes); // nothing sent to ClickUp
  expect(mocks.actions).toHaveLength(before.actions); // no claim recorded for the refused retry
});

test('a rollback that would write to a task with an open item is refused (and leaves a refusal receipt)', async () => {
  const { action: earlier } = await governedUpdate(1); // eligible write
  verifyBreaks = true;
  await patchReq({ requestId: rid(2), status: 'working', expectedUpdatedAt: new Date(task.updated).toISOString() }); // unknown outcome on the same task
  verifyBreaks = false; delete task.deleted;
  const writesBefore = writes.length;
  const rb = await rollbackReq(earlier.id);
  expect(rb.status).toBe(409);
  expect((await rb.json()).error).toBe('reconciliation_pending');
  expect(writes).toHaveLength(writesBefore);
});

test('reconcile: writer-only, tenant-scoped, and only for an open item', async () => {
  const action = await unknownOutcome();
  mocks.guard.mockResolvedValueOnce({ ...owner, role: 'member' });
  expect((await reconcileReq(action.id)).status).toBe(403);
  mocks.guard.mockResolvedValueOnce({ ...owner, businessId: 'biz-b' }); // another business: its project lookup finds nothing
  mocks.project.mockResolvedValueOnce(null);
  expect((await reconcileReq(action.id)).status).toBe(404);
  mocks.guard.mockResolvedValueOnce({ ...owner, businessId: 'biz-b' }); // …and even with a project, the action is not theirs
  expect((await reconcileReq(action.id)).status).toBe(404);
  delete task.deleted;
  expect((await reconcileReq(action.id, { requestId: rid(78) })).status).toBe(200); // the owner of biz-a resolves it
  expect((await reconcileReq(action.id, { requestId: rid(79) })).status).toBe(409); // nothing open any more
});

test('reconcile records the FRESH readback, then writes to the target are allowed again', async () => {
  const action = await unknownOutcome();
  delete task.deleted; // the write had landed: ClickUp shows the new status
  const res = await reconcileReq(action.id);
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.observed_state).toMatchObject({ taskId: 'task-1', status: 'review', assigneeIds: [1, 2] });
  const reconciled = eventsOf(action.id).at(-1)!;
  expect(reconciled.event).toBe('reconciled');
  expect(reconciled.detail).toMatchObject({ observed_state: { status: 'review' }, by: 'user-a', request_id: rid(77) });
  expect(writes.length).toBe(1); // the readback never writes
  const next = await patchReq({ requestId: rid(3), status: 'working', expectedUpdatedAt: new Date(task.updated).toISOString() });
  expect(next.status).toBe(200);
});

test('reconcile of a task that no longer exists records it as observed missing; a known outcome has nothing to reconcile', async () => {
  const action = await unknownOutcome(); // task.deleted stays true
  const res = await reconcileReq(action.id);
  expect(res.status).toBe(200);
  expect((await res.json()).observed_state).toEqual({ taskId: 'task-1', missing: true });
  delete task.deleted;
  const { action: fine } = await governedUpdate(4, { status: 'working', expectedUpdatedAt: new Date(task.updated).toISOString() });
  const nothing = await reconcileReq(fine.id, { requestId: rid(80) });
  expect(nothing.status).toBe(409);
  expect((await nothing.json()).error).toBe('no_open_reconciliation');
});


test('a KNOWN failure (refused before anything was sent) opens no item: the corrected retry goes through', async () => {
  task.updated = 2000; // stale row → refused before_write, nothing sent
  const first = await patchReq({ requestId: rid(1), status: 'review', expectedUpdatedAt: new Date(1000).toISOString() });
  expect(first.status).toBe(409);
  expect(eventsOf(lastAction().id)[1].detail.phase).toBe('before_write');
  const retry = await patchReq({ requestId: rid(2), status: 'review', expectedUpdatedAt: new Date(2000).toISOString() });
  expect(retry.status).toBe(200);
});

test('a readback that FAILS (ClickUp unavailable) records nothing — it is never taken as "task missing"', async () => {
  const action = await unknownOutcome();
  delete task.deleted;
  const realFetch = globalThis.fetch;
  vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => (options?.method && options.method !== 'GET') || String(url).includes('/folder/') || String(url).endsWith('/team')
    ? realFetch(url, options) : new Response('{"err":"upstream"}', { status: 500 })));
  const res = await reconcileReq(action.id);
  expect(res.status).toBe(503);
  expect(eventsOf(action.id).some((e) => e.event === 'reconciled')).toBe(false); // still open
  vi.stubGlobal('fetch', realFetch);
});

// Mytiv Work package 1: the task table now sends neutral person refs; the audited patch stays ClickUp's own ids.
test('neutral person refs are translated by the adapter: same audit payload, a foreign-provider ref is refused before any claim', async () => {
  const { res, action } = await governedUpdate(40, { assignee: { add: [{ provider: 'clickup', id: '2' }], rem: [{ provider: 'clickup', id: '1' }] }, expectedUpdatedAt: new Date(task.updated).toISOString() });
  expect(res.status).toBe(200);
  expect(JSON.parse(writes[0])).toEqual({ assignees: { add: [2], rem: [1] } });
  expect(eventsOf(action.id)[1].detail.post_state).toMatchObject({ assigneeIds: [2] });
  const claims = mocks.actions.length;
  const refused = await patchReq({ requestId: rid(41), assignee: { add: [{ provider: 'mytiv', id: '2' }] } });
  expect(refused.status).toBe(400);
  expect(await refused.json()).toEqual({ error: 'invalid_assignee' });
  expect(mocks.actions.length).toBe(claims);
  expect(writes).toHaveLength(1);
});

test('a malformed concurrency marker is a 400 before anything is claimed', async () => {
  const res = await patchReq({ requestId: rid(42), status: 'review', expectedUpdatedAt: 'not-a-date' });
  expect(res.status).toBe(400);
  expect(mocks.actions).toHaveLength(0);
  expect(writes).toHaveLength(0);
});
