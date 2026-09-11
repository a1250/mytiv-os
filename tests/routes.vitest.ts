import { beforeEach, expect, test, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const mocks = vi.hoisted(() => ({ guard: vi.fn(), project: vi.fn(), insert: vi.fn(), seen: new Set<string>(), events: [] as unknown[], failAudit: false }));
vi.mock('server-only', () => ({}));
vi.mock('../lib/api-guard', () => ({ guard: mocks.guard, ApiGuardError: class extends Error { response = NextResponse.json({ error: 'unauthorized' }, { status: 401 }); } }));
vi.mock('../lib/db/queries/projects', () => ({ getProject: mocks.project }));
vi.mock('../lib/db', () => ({ db: { insert: mocks.insert } }));
import { PATCH } from '../app/api/[businessSlug]/ops/tasks/[taskId]/route';
import { POST } from '../app/api/[businessSlug]/ops/chat/confirm/route';
import { auditedAction } from '../lib/ops-audit';
import { executeProposal, runOpsTool } from '../lib/ai/ops-copilot';
import type { OpsContext } from '../lib/ai/ops-copilot';
let writes = 0, listId = 'allowed', recording = false, currentStatus = 'working';
const scope = { businessId: 'biz', userId: 'user', role: 'owner' };
const project = { id: 'project', name: 'Fixture', clickupFolderId: 'folder' };
const folder = { key: 'project', label: 'Fixture', clickupFolderId: 'folder' };
const ctx = { project, folder, tasks: [], bugs: [], decisions: [], thresholdDays: 3, dataState: 'available' } as unknown as OpsContext;
const requestId = '11111111-1111-4111-8111-111111111111';
function request(body: unknown) { return new NextRequest('https://ops.example/api/mytiv/ops/tasks/task', { method: 'PATCH', headers: { origin: 'https://ops.example', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
beforeEach(() => {
  writes = 0; currentStatus = 'working'; listId = 'allowed'; recording = false; mocks.seen.clear(); mocks.events = []; mocks.failAudit = false;
  mocks.guard.mockResolvedValue(scope); mocks.project.mockResolvedValue(project);
  mocks.insert.mockImplementation(() => ({ values: (value: Record<string, unknown>) => {
    if ('requestId' in value) return { onConflictDoNothing: () => ({ returning: async () => { const key = String(value.requestId); if (mocks.seen.has(key)) return []; mocks.seen.add(key); return [{ id: 'claim' }]; } }) };
    if (mocks.failAudit) return Promise.reject(new Error('audit offline'));
    mocks.events.push(value); return Promise.resolve();
  } }));
  process.env.CLICKUP_API_TOKEN = 'fixture'; process.env.CLICKUP_WORKSPACE_ID = 'fixture';
  vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
    if (options?.method && options.method !== 'GET') { writes++; currentStatus = JSON.parse(String(options.body)).status || currentStatus; return Response.json({ id: 'task', url: 'https://app.clickup.com/t/task' }); }
    if (String(url).includes('/folder/')) return Response.json({ lists: [{ id: 'allowed', name: 'Tasks', statuses: [{ status: 'working', type: 'custom' }, { status: 'custom-finished', type: 'closed' }] }] });
    if (String(url).endsWith('/team')) return Response.json({ teams: [{ id: 'fixture', members: [{ user: { id: 1, username: 'Owner' } }] }] });
    if (String(url).endsWith('/comment')) return Response.json({ comments: [] });
    return Response.json({ id: 'task', name: 'Fixture', list: { id: listId }, status: { status: currentStatus }, attachments: recording ? [{ url: 'https://proof.example/proof.mp4', mimetype: 'video/mp4' }] : [] });
  }));
});
const params = { params: Promise.resolve({ businessSlug: 'mytiv', taskId: 'task' }) };
test('route rejects member before any external write', async () => { mocks.guard.mockResolvedValue({ ...scope, role: 'member' }); expect((await PATCH(request({}), params)).status).toBe(403); expect(writes).toBe(0); });
test('route rejects project outside guarded business', async () => { mocks.project.mockResolvedValue(null); expect((await PATCH(request({ projectId: 'other', confirmed: true, requestId, status: 'working' }), params)).status).toBe(404); expect(writes).toBe(0); });
test('route rejects task outside allowed project lists', async () => { listId = 'foreign'; expect((await PATCH(request({ projectId: 'project', confirmed: true, requestId, status: 'working' }), params)).status).toBe(404); expect(writes).toBe(0); });
test('route blocks evidence bypass including custom closed status', async () => { expect((await PATCH(request({ projectId: 'project', confirmed: true, requestId, status: 'custom-finished' }), params)).status).toBe(409); expect(writes).toBe(0); });
test('confirmed evidenced closure executes once with durable receipts', async () => {
  recording = true;
  const body = { projectId: 'project', confirmed: true, requestId, status: 'custom-finished', evidence_url: 'https://proof.example/proof.mp4', evidence_reviewed: true };
  expect((await PATCH(request(body), params)).status).toBe(200);
  expect((await PATCH(request(body), params)).status).toBe(409);
  expect(writes).toBe(1); expect(mocks.events).toHaveLength(2);
});
test('audit failure prevents external mutation', async () => { mocks.failAudit = true; expect((await PATCH(request({ projectId: 'project', confirmed: true, requestId, status: 'working' }), params)).status).toBe(503); expect(writes).toBe(0); });
test('simultaneous duplicate claims execute only once', async () => {
  const run = vi.fn(async () => ({ ok: true }));
  await Promise.allSettled([1,2].map(() => auditedAction(scope, 'project', requestId, 'test', {}, run)));
  expect(run).toHaveBeenCalledTimes(1);
});
test('failed external operation retains claim and uncertainty event', async () => {
  const run = vi.fn(async () => { throw new Error('timeout'); });
  await expect(auditedAction(scope, 'project', requestId, 'test', {}, run)).rejects.toThrow('timeout');
  await expect(auditedAction(scope, 'project', requestId, 'test', {}, run)).rejects.toThrow('already_claimed');
  expect(run).toHaveBeenCalledTimes(1); expect(mocks.events).toHaveLength(2);
});
test('copilot evidence read rejects another project task', async () => { listId = 'foreign'; await expect(runOpsTool('verify_completion', { task_id: 'task' }, ctx)).rejects.toThrow('not_found'); });
test('copilot write rejects another project task', async () => { listId = 'foreign'; expect((await executeProposal(ctx, 'add_comment', { task_id: 'task', text: 'Fixture' })).ok).toBe(false); expect(writes).toBe(0); });
test('copilot cannot create a task missing owner/date/definition', async () => { expect((await executeProposal(ctx, 'create_task', { title: 'Fixture' })).ok).toBe(false); expect(writes).toBe(0); });
test('copilot confirm endpoint rejects missing explicit confirmation', async () => { expect((await POST(request({ projectId: 'project', tool: 'update_task', input: { task_id: 'task' } }), { params: Promise.resolve({ businessSlug: 'mytiv' }) })).status).toBe(400); expect(writes).toBe(0); });
