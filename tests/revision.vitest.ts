import { beforeEach, expect, test, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({ guard: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('../lib/api-guard', () => ({
  guard: mocks.guard,
  ApiGuardError: class extends Error { response = NextResponse.json({ error: 'unauthorized' }, { status: 401 }); },
}));

import { GET } from '../app/api/[businessSlug]/ops/revision/route';
import { ApiGuardError } from '../lib/api-guard';
import { compareRevision } from '../scripts/staging/verify-revision.mjs';

const params = { params: Promise.resolve({ businessSlug: 'mytiv' }) };
const req = () => new NextRequest('https://ops.example/api/mytiv/ops/revision');

beforeEach(() => { mocks.guard.mockReset(); delete process.env.VERCEL_GIT_COMMIT_SHA; });

test('anonymous is 401 — guard rejects before the handler runs', async () => {
  mocks.guard.mockRejectedValue(new ApiGuardError(NextResponse.json({ error: 'unauthorized' }, { status: 401 })));
  expect((await GET(req(), params)).status).toBe(401);
});

test('a member (non-owner) of the business is 403', async () => {
  mocks.guard.mockResolvedValue({ businessId: 'biz', userId: 'u', role: 'member' });
  const res = await GET(req(), params);
  expect(res.status).toBe(403);
  expect((await res.json()).error).toBe('owner_required');
});

test('an owner gets the build revision', async () => {
  process.env.VERCEL_GIT_COMMIT_SHA = 'abc1234def5678';
  mocks.guard.mockResolvedValue({ businessId: 'biz', userId: 'u', role: 'owner' });
  const res = await GET(req(), params);
  expect(res.status).toBe(200);
  expect((await res.json()).revision).toBe('abc1234def5678');
});

test('owner sees "unknown" when the build sha is absent (local dev)', async () => {
  mocks.guard.mockResolvedValue({ businessId: 'biz', userId: 'u', role: 'owner' });
  expect((await (await GET(req(), params)).json()).revision).toBe('unknown');
});

test('compareRevision matches exact and abbreviated, reports a mismatch', () => {
  expect(compareRevision('abc1234def5678', 'abc1234').match).toBe(true); // abbreviated approved
  expect(compareRevision('abc1234def', 'abc1234def').match).toBe(true); // exact
  expect(compareRevision('abc1234def', 'deadbeef99').match).toBe(false); // different commit
  expect(compareRevision('unknown', 'abc1234def').match).toBe(false); // dev build never matches
  expect(compareRevision('', 'abc1234def').match).toBe(false); // empty never matches
});
