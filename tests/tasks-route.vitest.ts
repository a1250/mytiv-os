import { beforeEach, expect, test, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mytiv Work package 1 — the legacy internal tasks API: field allowlist, tenant checks on linked ids,
// same-origin writes, owner/admin-only delete and real 404s. DB helpers are mocked; the same rules
// run against real Postgres in tests/db-integration/tasks-isolation.itest.ts.
const m = vi.hoisted(() => ({ guard: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), removeTask: vi.fn(), listTasks: vi.fn(), getProject: vi.fn(), getLead: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('../lib/api-guard', () => ({ guard: m.guard, ApiGuardError: class extends Error { response = NextResponse.json({ error: 'unauthorized' }, { status: 401 }); } }));
vi.mock('../lib/db/queries/tasks', () => ({ createTask: m.createTask, updateTask: m.updateTask, removeTask: m.removeTask, listTasks: m.listTasks }));
vi.mock('../lib/db/queries/projects', () => ({ getProject: m.getProject }));
vi.mock('../lib/db/queries/leads', () => ({ getLead: m.getLead }));
import { POST, GET } from '../app/api/[businessSlug]/tasks/route';
import { PATCH, DELETE } from '../app/api/[businessSlug]/tasks/[id]/route';
import { ApiGuardError } from '../lib/api-guard';
import { parseTaskInput } from '../lib/tasks-policy';

const ORIGIN = 'https://ops.example';
const TASK = '22222222-2222-4222-8222-222222222222';
const OWN_PROJECT = '33333333-3333-4333-8333-333333333333', FOREIGN_PROJECT = '44444444-4444-4444-8444-444444444444';
const OWN_LEAD = '55555555-5555-4555-8555-555555555555', FOREIGN_LEAD = '66666666-6666-4666-8666-666666666666';
const scope = (role: string) => ({ businessId: 'biz-a', userId: 'user', role });
const req = (method: string, body?: unknown, origin: string | null = ORIGIN, path = `/api/mytiv/tasks${method === 'POST' ? '' : `/${TASK}`}`) =>
  new NextRequest(`${ORIGIN}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(origin ? { origin } : {}) }, ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }) });
const list = { params: Promise.resolve({ businessSlug: 'mytiv' }) };
const one = (id = TASK) => ({ params: Promise.resolve({ businessSlug: 'mytiv', id }) });
const json = async (r: Response) => ({ status: r.status, body: r.status === 204 ? null : await r.json() });

beforeEach(() => {
  vi.clearAllMocks();
  m.guard.mockResolvedValue(scope('member'));
  m.createTask.mockImplementation(async (_b: string, d: object) => ({ id: TASK, ...d }));
  m.updateTask.mockImplementation(async (_b: string, id: string, d: object) => ({ id, ...d }));
  m.removeTask.mockResolvedValue(true);
  m.getProject.mockImplementation(async (b: string, id: string) => (b === 'biz-a' && id === OWN_PROJECT ? { id } : null));
  m.getLead.mockImplementation(async (b: string, id: string) => (b === 'biz-a' && id === OWN_LEAD ? { id } : null));
});

test('create persists projectId (the bug) and leadId once both are verified in the caller business', async () => {
  const r = await json(await POST(req('POST', { title: '  Follow up  ', projectId: OWN_PROJECT, leadId: OWN_LEAD, dueDate: '2026-10-08', priority: 'high' }), list));
  expect(r.status).toBe(200);
  expect(m.createTask).toHaveBeenCalledWith('biz-a', { title: 'Follow up', projectId: OWN_PROJECT, leadId: OWN_LEAD, dueDate: '2026-10-08', priority: 'high' });
  expect(m.getProject).toHaveBeenCalledWith('biz-a', OWN_PROJECT);
});

test('a project or lead of another business is refused as not found, and nothing is written', async () => {
  for (const [body, error] of [[{ title: 'x', projectId: FOREIGN_PROJECT }, 'project_not_found'], [{ title: 'x', leadId: FOREIGN_LEAD }, 'lead_not_found']] as const) {
    expect(await json(await POST(req('POST', body), list))).toEqual({ status: 404, body: { error } });
    expect(await json(await PATCH(req('PATCH', { ...body, title: undefined }), one()))).toEqual({ status: 404, body: { error } });
  }
  expect(m.createTask).not.toHaveBeenCalled();
  expect(m.updateTask).not.toHaveBeenCalled();
});

test('only allowlisted fields are writable — identity, tenant and doneAt are refused, not silently dropped', async () => {
  for (const extra of [{ businessId: 'biz-b' }, { id: TASK }, { doneAt: '2020-01-01' }, { createdAt: 'x' }, { updatedAt: 'x' }, { assignee: 'x' }]) {
    expect(await json(await POST(req('POST', { title: 't', ...extra }), list))).toEqual({ status: 400, body: { error: 'field_not_allowed' } });
    expect(await json(await PATCH(req('PATCH', { status: 'todo', ...extra }), one()))).toEqual({ status: 400, body: { error: 'field_not_allowed' } });
  }
  expect(m.createTask).not.toHaveBeenCalled();
  expect(m.updateTask).not.toHaveBeenCalled();
});

test('values are validated: title, status, priority, real calendar date, uuid ids, sizes', async () => {
  const bad: [object, string][] = [
    [{}, 'invalid_title'], [{ title: '   ' }, 'invalid_title'], [{ title: 'x'.repeat(501) }, 'invalid_title'],
    [{ title: 't', status: 'closed' }, 'invalid_status'], [{ title: 't', priority: 'p0' }, 'invalid_priority'],
    [{ title: 't', dueDate: '2026-02-30' }, 'invalid_due_date'], [{ title: 't', dueDate: '01/10/2026' }, 'invalid_due_date'],
    [{ title: 't', projectId: 'not-a-uuid' }, 'invalid_project_id'], [{ title: 't', leadId: 7 }, 'invalid_lead_id'],
    [{ title: 't', notes: 'x'.repeat(20001) }, 'invalid_notes'], [{ title: 't', category: 'x'.repeat(101) }, 'invalid_category'],
  ];
  for (const [body, error] of bad) expect(await json(await POST(req('POST', body), list))).toEqual({ status: 400, body: { error } });
  expect(await json(await POST(req('POST', '{not json'), list))).toEqual({ status: 400, body: { error: 'invalid_json' } });
  expect(await json(await POST(req('POST', [1]), list))).toEqual({ status: 400, body: { error: 'invalid_input' } });
  expect(await json(await PATCH(req('PATCH', {}), one()))).toEqual({ status: 400, body: { error: 'nothing_to_update' } });
  expect(m.createTask).not.toHaveBeenCalled();
});

test('clearing values: empty date and null links clear them; leap day is a real date', () => {
  expect(parseTaskInput({ dueDate: '', projectId: null, leadId: '' }, 'update')).toEqual({ dueDate: null, projectId: null, leadId: null });
  expect(parseTaskInput({ title: 't', dueDate: '2028-02-29' }, 'create')).toEqual({ title: 't', dueDate: '2028-02-29' });
});

test('every write must come from this origin; reads need none', async () => {
  for (const origin of ['https://evil.example', null]) {
    expect((await POST(req('POST', { title: 't' }, origin), list)).status).toBe(403);
    expect((await PATCH(req('PATCH', { status: 'done' }, origin), one())).status).toBe(403);
    m.guard.mockResolvedValue(scope('owner'));
    expect((await DELETE(req('DELETE', undefined, origin), one())).status).toBe(403);
  }
  expect(m.createTask).not.toHaveBeenCalled(); expect(m.updateTask).not.toHaveBeenCalled(); expect(m.removeTask).not.toHaveBeenCalled();
  m.listTasks.mockResolvedValue([]);
  expect((await GET(req('GET', undefined, null, '/api/mytiv/tasks'), list)).status).toBe(200);
});

test('delete is owners and admins only; members get 403 and nothing is deleted', async () => {
  expect(await json(await DELETE(req('DELETE'), one()))).toEqual({ status: 403, body: { error: 'approval_role_required' } });
  expect(m.removeTask).not.toHaveBeenCalled();
  for (const role of ['owner', 'admin']) {
    m.guard.mockResolvedValue(scope(role));
    expect((await DELETE(req('DELETE'), one())).status).toBe(204);
  }
  expect(m.removeTask).toHaveBeenCalledWith('biz-a', TASK);
});

test('a task that does not exist in this business is 404 — never 200 with an empty body or a silent 204', async () => {
  m.updateTask.mockResolvedValue(null); m.removeTask.mockResolvedValue(false); m.guard.mockResolvedValue(scope('owner'));
  expect(await json(await PATCH(req('PATCH', { status: 'done' }), one()))).toEqual({ status: 404, body: { error: 'not_found' } });
  expect(await json(await DELETE(req('DELETE'), one()))).toEqual({ status: 404, body: { error: 'not_found' } });
  m.updateTask.mockClear(); m.removeTask.mockClear();
  expect((await PATCH(req('PATCH', { status: 'done' }), one('not-a-uuid'))).status).toBe(404);
  expect((await DELETE(req('DELETE'), one('../x'))).status).toBe(404);
  expect(m.updateTask).not.toHaveBeenCalled(); expect(m.removeTask).not.toHaveBeenCalled();
});

test('signed out is 401 before anything else', async () => {
  m.guard.mockRejectedValue(new ApiGuardError(NextResponse.json({ error: 'unauthorized' }, { status: 401 })));
  expect((await POST(req('POST', { title: 't' }), list)).status).toBe(401);
  expect((await DELETE(req('DELETE'), one())).status).toBe(401);
});
