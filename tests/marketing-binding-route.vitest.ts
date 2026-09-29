import { beforeEach, expect, test, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { OpsPolicyError } from '../lib/ops-policy';

// T-2.2 — owner-only marketing tenant binding editor route (owner decision D2).
const mocks = vi.hoisted(() => ({ guard: vi.fn(), project: vi.fn(), audited: vi.fn(), bind: vi.fn(), revoke: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('../lib/api-guard', () => ({
  guard: mocks.guard,
  ApiGuardError: class extends Error { response: Response; constructor(r: Response) { super('ApiGuardError'); this.response = r; } },
}));
vi.mock('../lib/db/queries/projects', () => ({ getProject: mocks.project }));
vi.mock('../lib/ops-audit', () => ({ auditedAction: mocks.audited }));
vi.mock('../lib/marketing/binding-store', () => ({ bindMarketing: mocks.bind, revokeMarketing: mocks.revoke }));

import { POST } from '../app/api/[businessSlug]/ops/projects/[projectId]/marketing/binding/route';
import { ApiGuardError } from '../lib/api-guard';

const params = { params: Promise.resolve({ businessSlug: 'mytiv', projectId: 'project' }) };
const requestId = '22222222-2222-4222-8222-222222222222';
function post(body: Record<string, unknown>, origin = 'https://ops.example') {
  return new NextRequest('https://ops.example/api/mytiv/ops/projects/project/marketing/binding', {
    method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}
const bind = (over: Record<string, unknown> = {}) => post({ action: 'bind', marketingBusiness: 'umino', confirmed: true, requestId, ...over });
const revoke = (over: Record<string, unknown> = {}) => post({ action: 'revoke', confirmed: true, requestId, ...over });
const as = (role: string) => mocks.guard.mockResolvedValue({ businessId: 'biz', userId: 'user', role });
const noWrites = () => { expect(mocks.audited).not.toHaveBeenCalled(); expect(mocks.bind).not.toHaveBeenCalled(); expect(mocks.revoke).not.toHaveBeenCalled(); };

beforeEach(() => {
  vi.clearAllMocks();
  as('owner');
  mocks.project.mockResolvedValue({ id: 'project', name: 'Fixture' });
  mocks.audited.mockImplementation((_scope, _project, _request, _action, _payload, run: () => unknown) => run());
  mocks.bind.mockResolvedValue({ ok: true, marketingBusiness: 'umino', bindingVersion: 1 });
  mocks.revoke.mockResolvedValue({ ok: true, revoked: true, bindingVersion: 1 });
});

test('anonymous → 401, no writes', async () => {
  mocks.guard.mockRejectedValue(new ApiGuardError(NextResponse.json({ error: 'unauthorized' }, { status: 401 })));
  expect((await POST(bind(), params)).status).toBe(401);
  noWrites();
});

test('admin and member are refused 403 — the binding is owner-only', async () => {
  for (const role of ['admin', 'member']) {
    as(role);
    const res = await POST(bind(), params);
    expect(res.status, role).toBe(403);
    expect((await res.json()).error).toBe('owner_role_required');
    const r2 = await POST(revoke(), params);
    expect(r2.status, `${role} revoke`).toBe(403);
  }
  noWrites();
});

test('a project of another business → 404, no writes', async () => {
  mocks.project.mockResolvedValue(null);
  expect((await POST(bind(), params)).status).toBe(404);
  expect(mocks.project).toHaveBeenCalledWith('biz', 'project');
  noWrites();
});

test('cross-origin, unconfirmed or malformed requests are refused before any write', async () => {
  expect((await POST(bind({}), params)).status).toBe(200); // control
  vi.clearAllMocks(); as('owner'); mocks.project.mockResolvedValue({ id: 'project' });
  expect((await POST(post({ action: 'bind', marketingBusiness: 'umino', confirmed: true, requestId }, 'https://evil.example'), params)).status).toBe(403);
  expect((await POST(bind({ confirmed: false }), params)).status).toBe(400);
  expect((await POST(bind({ requestId: 'not-a-uuid' }), params)).status).toBe(400);
  expect((await POST(bind({ action: 'delete' }), params)).status).toBe(400);
  for (const marketingBusiness of ['Bad Slug', '', 'umino/../x', '-lead', 42]) {
    const res = await POST(bind({ marketingBusiness }), params);
    expect(res.status, String(marketingBusiness)).toBe(400);
    expect((await res.json()).error).toBe('invalid_marketing_business');
  }
  noWrites();
});

test('bind is a governed, audited action that records the new binding version', async () => {
  const res = await POST(bind(), params);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ ok: true, marketingBusiness: 'umino', bindingVersion: 1 });
  expect(mocks.audited).toHaveBeenCalledTimes(1);
  const [scope, project, rid, action, payload, , meta] = mocks.audited.mock.calls[0];
  expect([scope.businessId, project, rid, action, payload, meta]).toEqual(['biz', 'project', requestId, 'marketing_bind', { marketingBusiness: 'umino' }, { target: { kind: 'project', id: 'project' } }]);
  expect(mocks.bind).toHaveBeenCalledWith(expect.objectContaining({ businessId: 'biz', userId: 'user' }), 'project', 'umino', requestId);
});

test('rebind returns the new version; revoke → not connected', async () => {
  mocks.bind.mockResolvedValue({ ok: true, marketingBusiness: 'tala', bindingVersion: 2 });
  expect((await (await POST(bind({ marketingBusiness: 'tala' }), params)).json()).bindingVersion).toBe(2);
  const res = await POST(revoke(), params);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ ok: true, revoked: true, bindingVersion: 1 });
  expect(mocks.audited.mock.calls[1][3]).toBe('marketing_revoke');
  expect(mocks.revoke).toHaveBeenCalledWith(expect.objectContaining({ businessId: 'biz' }), 'project', requestId);
});

test('database refusals and a replayed request surface as their policy status', async () => {
  mocks.bind.mockRejectedValue(new OpsPolicyError('binding_unchanged', 409));
  expect((await POST(bind(), params)).status).toBe(409);
  mocks.bind.mockRejectedValue(new OpsPolicyError('binding_owner_required', 403)); // DB-level owner check (defence in depth)
  expect((await POST(bind(), params)).status).toBe(403);
  mocks.revoke.mockRejectedValue(new OpsPolicyError('binding_not_bound', 409));
  expect((await (await POST(revoke(), params)).json()).error).toBe('binding_not_bound');
  mocks.audited.mockRejectedValue(new OpsPolicyError('request_already_claimed_check_audit_before_retry', 409));
  expect((await POST(bind(), params)).status).toBe(409);
  mocks.audited.mockRejectedValue(new Error('db down'));
  const res = await POST(bind(), params);
  expect(res.status).toBe(503);
  expect((await res.json()).error).toBe('binding_unavailable');
});
