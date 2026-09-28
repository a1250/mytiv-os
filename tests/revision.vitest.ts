import { beforeEach, expect, test, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({ guard: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('../lib/api-guard', () => ({
  guard: mocks.guard,
  ApiGuardError: class extends Error {
    response: NextResponse;
    constructor(response: NextResponse) { super('ApiGuardError'); this.response = response; }
  },
}));

import { GET } from '../app/api/[businessSlug]/ops/revision/route';
import { ApiGuardError } from '../lib/api-guard';
import { compareRevision, runVerify } from '../scripts/staging/verify-revision.mjs';

const params = { params: Promise.resolve({ businessSlug: 'mytiv' }) };
const req = () => new NextRequest('https://ops.example/api/mytiv/ops/revision');
const SHA = 'abcdef0123456789abcdef0123456789abcdef01'; // 40 hex

beforeEach(() => { mocks.guard.mockReset(); delete process.env.VERCEL_GIT_COMMIT_SHA; });

// ── Route: owner-only ─────────────────────────────────────────────────────────
test('anonymous is 401 — guard rejects before the handler runs', async () => {
  mocks.guard.mockRejectedValue(new ApiGuardError(NextResponse.json({ error: 'unauthorized' }, { status: 401 })));
  expect((await GET(req(), params)).status).toBe(401);
});

test('a non-member (cross-tenant) is 404 with no revision leaked', async () => {
  mocks.guard.mockRejectedValue(new ApiGuardError(NextResponse.json({ error: 'not found' }, { status: 404 })));
  const res = await GET(req(), params);
  expect(res.status).toBe(404);
  expect(await res.json()).not.toHaveProperty('revision');
});

test('a member (non-owner) of the business is 403', async () => {
  mocks.guard.mockResolvedValue({ businessId: 'biz', userId: 'u', role: 'member' });
  const res = await GET(req(), params);
  expect(res.status).toBe(403);
  expect((await res.json()).error).toBe('owner_required');
});

test('an owner gets the build revision', async () => {
  process.env.VERCEL_GIT_COMMIT_SHA = SHA;
  mocks.guard.mockResolvedValue({ businessId: 'biz', userId: 'u', role: 'owner' });
  const res = await GET(req(), params);
  expect(res.status).toBe(200);
  expect((await res.json()).revision).toBe(SHA);
});

test('owner sees "unknown" when the build sha is absent (local dev)', async () => {
  mocks.guard.mockResolvedValue({ businessId: 'biz', userId: 'u', role: 'owner' });
  expect((await (await GET(req(), params)).json()).revision).toBe('unknown');
});

// ── compareRevision: directional match ─────────────────────────────────────────
test('compareRevision only lets the APPROVED value abbreviate — never the deployed one', () => {
  expect(compareRevision(SHA, SHA).match).toBe(true);            // exact
  expect(compareRevision(SHA, 'abcdef0123').match).toBe(true);   // approved abbreviates deployed
  expect(compareRevision(SHA, 'deadbeef00').match).toBe(false);  // different commit
  expect(compareRevision('abcdef01', SHA).match).toBe(false);    // P1: short deployed is NOT accepted as a prefix
  expect(compareRevision('unknown', SHA).match).toBe(false);     // dev build never matches
  expect(compareRevision('', SHA).match).toBe(false);            // empty never matches
});

// ── runVerify: fail-closed, no network ─────────────────────────────────────────
function stubFetch(handlers: Record<string, (u: URL, init?: RequestInit) => Response>): typeof fetch {
  return (async (url: string, init?: RequestInit) => {
    const u = new URL(url);
    const h = handlers[u.pathname] ?? (() => new Response('not found', { status: 404 }));
    return h(u, init);
  }) as unknown as typeof fetch;
}
const okHandlers = (revision: string): Record<string, () => Response> => ({
  '/api/auth/csrf': () => Response.json({ csrfToken: 'csrf' }),
  '/api/auth/callback/credentials': () => new Response('{}', { status: 200, headers: { 'set-cookie': 'authjs.session-token=s; Path=/' } }),
  '/api/mytiv/ops/revision': () => Response.json({ revision }),
});
const opts = (fetchImpl: typeof fetch, approved = SHA) => ({ base: 'https://stg', email: 'o@x', password: 'p', approved, fetchImpl });

test('runVerify matches when the deployed sha equals the approved commit', async () => {
  const r = await runVerify(opts(stubFetch(okHandlers(SHA))));
  expect(r.match).toBe(true);
});

test('runVerify reports a mismatch without throwing (the CLI decides the exit code)', async () => {
  const r = await runVerify(opts(stubFetch(okHandlers('0000000000000000000000000000000000000000'))));
  expect(r.match).toBe(false);
});

test('runVerify fails closed on a login without a session cookie', async () => {
  const h = okHandlers(SHA); h['/api/auth/callback/credentials'] = () => new Response('{}', { status: 401 });
  await expect(runVerify(opts(stubFetch(h)))).rejects.toThrow(/login failed/);
});

test('runVerify fails closed when the revision endpoint is not 200', async () => {
  const h = okHandlers(SHA); h['/api/mytiv/ops/revision'] = () => new Response('{}', { status: 403 });
  await expect(runVerify(opts(stubFetch(h)))).rejects.toThrow(/returned 403/);
});

test('runVerify requires its config', async () => {
  await expect(runVerify(opts(stubFetch(okHandlers(SHA)), ''))).rejects.toThrow(/required/);
});
