import { beforeEach, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

// ── Composed validator against every vendored canonical vector (no mocks needed) ──
import { validateMarketingPlan } from '../lib/marketing/validate';
import { timelineBars, dayIndex } from '../lib/marketing/timeline';
import vectors from '../lib/marketing/contracts/C1.vectors.json';

const BIZ = 'demo-biz'; // the marketingBusiness used by the vendored vectors

test('composed validator accepts every valid canonical C1 vector', () => {
  for (const v of vectors.valid) expect(() => validateMarketingPlan(v, BIZ)).not.toThrow();
});

test('composed validator rejects every invalid canonical C1 vector', () => {
  vectors.invalid.forEach((v, i) => expect(() => validateMarketingPlan(v, BIZ), `invalid[${i}]`).toThrow());
});

test('vendored artifacts match the recorded canonical hashes (no drift from source)', () => {
  const dir = path.join(process.cwd(), 'lib/marketing/contracts');
  const sha = (f: string) => createHash('sha256').update(readFileSync(path.join(dir, f))).digest('hex');
  const hashes = readFileSync(path.join(dir, 'HASHES.md'), 'utf8');
  for (const f of ['C1.schema.json', 'C1.vectors.json']) {
    const m = new RegExp(`\\| ${f.replace('.', '\\.')} \\| ([0-9a-f]{64}) \\|`).exec(hashes);
    expect(m, `${f} recorded in HASHES.md`).toBeTruthy();
    expect(sha(f), `${f} on disk matches HASHES.md`).toBe(m![1]);
  }
});

// ── Route: a structurally-invalid payload is rejected before the audit claim + storage ──
const mocks = vi.hoisted(() => ({ guard: vi.fn(), project: vi.fn(), audited: vi.fn(), importPlan: vi.fn(), binding: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('../lib/api-guard', () => ({
  guard: mocks.guard,
  ApiGuardError: class extends Error { response: Response; constructor(r: Response) { super('ApiGuardError'); this.response = r; } },
}));
vi.mock('../lib/db/queries/projects', () => ({ getProject: mocks.project }));
vi.mock('../lib/ops-audit', () => ({ auditedAction: mocks.audited }));
vi.mock('../lib/marketing/service', () => ({ getMarketingBinding: mocks.binding, importPlan: mocks.importPlan }));
vi.mock('../lib/ops-access', () => ({ requireScopedTask: vi.fn() }));
vi.mock('../lib/ops-config', () => ({ folderFromProject: () => ({ key: 'p', label: 'P', clickupFolderId: 'f' }) }));

import { POST } from '../app/api/[businessSlug]/ops/projects/[projectId]/marketing/route';

const params = { params: Promise.resolve({ businessSlug: 'mytiv', projectId: 'project' }) };
const requestId = '11111111-1111-4111-8111-111111111111';
function post(plan: unknown, extra: Record<string, unknown> = {}) {
  return new NextRequest('https://ops.example/api/mytiv/ops/projects/project/marketing', {
    method: 'POST',
    headers: { origin: 'https://ops.example', 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, confirmed: true, requestId, bindingVersion: 1, ...extra }),
  });
}

beforeEach(() => {
  mocks.guard.mockResolvedValue({ businessId: 'biz', userId: 'user', role: 'owner' });
  mocks.project.mockResolvedValue({ id: 'project', name: 'Fixture', clickupFolderId: 'f' });
  mocks.binding.mockResolvedValue({ marketingBusiness: BIZ, bindingVersion: 1 });
  mocks.audited.mockReset().mockResolvedValue({ ok: true, revision: 1 });
  mocks.importPlan.mockReset();
});

test('a structurally invalid plan is rejected before any audit claim or storage', async () => {
  const bad = vectors.invalid[0]; // revision:0 — fails the AJV structural gate
  const res = await POST(post(bad), params);
  expect(res.status).toBe(400);
  expect((await res.json()).error).toMatch(/contract_structure_invalid|invalid_revision/);
  expect(mocks.audited).not.toHaveBeenCalled(); // no audit "confirmed" record
  expect(mocks.importPlan).not.toHaveBeenCalled(); // no storage
});

test('a valid canonical plan passes validation and reaches the governed audit claim', async () => {
  const res = await POST(post(vectors.valid[0]), params);
  expect(res.status).toBe(200);
  expect(mocks.audited).toHaveBeenCalledTimes(1);
  expect(mocks.audited.mock.calls[0][3]).toBe('marketing_import'); // action
});

test('an import confirmed against a binding version that is no longer current is refused before any audit (T-2.3)', async () => {
  mocks.binding.mockResolvedValue({ marketingBusiness: BIZ, bindingVersion: 2 }); // rebound since the page was loaded
  for (const extra of [{ bindingVersion: 1 }, { bindingVersion: undefined }, { bindingVersion: '2' }]) {
    const res = await POST(post(vectors.valid[0], extra), params);
    expect(res.status, JSON.stringify(extra)).toBe(409);
    expect((await res.json()).error).toBe('stale_binding_version');
  }
  expect(mocks.audited).not.toHaveBeenCalled();
  const ok = await POST(post(vectors.valid[0], { bindingVersion: 2 }), params);
  expect(ok.status).toBe(200);
});

test('a project with no active DB binding is not connected, even when OPS_MARKETING_BINDINGS names it (D2)', async () => {
  const prev = process.env.OPS_MARKETING_BINDINGS;
  process.env.OPS_MARKETING_BINDINGS = JSON.stringify({ 'mytiv:project': BIZ });
  mocks.binding.mockResolvedValue(null);
  try {
    const res = await POST(post(vectors.valid[0]), params);
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('marketing_not_connected');
    expect(mocks.binding).toHaveBeenCalledWith('biz', 'project'); // keyed by the resolved business id, never the slug/env
    expect(mocks.audited).not.toHaveBeenCalled();
  } finally { process.env.OPS_MARKETING_BINDINGS = prev; }
});

// ── timeline geometry is finite for canonical ISO date-time items ──
test('timeline bar positions are finite for canonical ISO date-time items', () => {
  const items = [
    { start: '2026-01-01T00:00:00.000Z', end: '2026-01-10T00:00:00.000Z' },
    { start: '2026-01-05T12:30:00.000Z', end: '2026-02-01T00:00:00.000Z' },
  ];
  const t = timelineBars(items);
  expect(Number.isFinite(t.from) && Number.isFinite(t.span)).toBe(true);
  for (const i of items) {
    const b = t.bar(i);
    expect(Number.isFinite(b.left)).toBe(true);
    expect(Number.isFinite(b.width) && b.width > 0).toBe(true);
  }
  expect(Number.isFinite(dayIndex('2026-01-01T00:00:00.000Z'))).toBe(true);
});

// ── calendar-strict, UTC-only date-times (parity with the canonical zod .datetime()) ──
test('composed validator rejects calendar-invalid / offset / bare date-times, accepts a real leap day', () => {
  const good = vectors.valid[0] as Record<string, unknown>;
  const item0 = (good.items as Record<string, unknown>[])[0];
  const withStart = (start: string) => ({ ...good, items: [{ ...item0, start }] });
  for (const bad of ['2026-02-30T00:00:00.000Z', '2025-02-29T00:00:00.000Z', '2026-13-01T00:00:00.000Z', '2026-01-01T00:00:00+05:00', '2026-01-01T00:00:00', ' 2026-01-05T00:00:00.000Z', '2026-01-05T00:00:00.000Z ']) {
    expect(() => validateMarketingPlan(withStart(bad), BIZ), bad).toThrow();
  }
  expect(() => validateMarketingPlan(withStart('2024-02-29T00:00:00.000Z'), BIZ)).not.toThrow(); // real leap day
  expect(() => validateMarketingPlan(withStart('2026-01-05T00:00:00.123456789Z'), BIZ)).not.toThrow(); // arbitrary fractional precision, no length cap
});

test('timeline bars never extend past the track (left + width <= 100)', () => {
  const items = [
    { start: '2026-01-01T00:00:00.000Z', end: '2026-01-10T00:00:00.000Z' },
    { start: '2026-01-10T00:00:00.000Z', end: '2026-01-10T00:00:00.000Z' }, // zero-duration at the max endpoint
  ];
  const t = timelineBars(items);
  for (const i of items) {
    const b = t.bar(i);
    expect(b.width).toBeGreaterThanOrEqual(0);
    expect(b.left + b.width).toBeLessThanOrEqual(100 + 1e-9);
  }
});
