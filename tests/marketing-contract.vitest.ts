import { beforeEach, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

// ── Composed validator against every vendored canonical vector (no mocks needed) ──
import { validateMarketingPlan } from '../lib/marketing/validate';
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
vi.mock('../lib/marketing/service', () => ({ marketingBinding: mocks.binding, importPlan: mocks.importPlan }));
vi.mock('../lib/ops-access', () => ({ requireScopedTask: vi.fn() }));
vi.mock('../lib/ops-config', () => ({ folderFromProject: () => ({ key: 'p', label: 'P', clickupFolderId: 'f' }) }));

import { POST } from '../app/api/[businessSlug]/ops/projects/[projectId]/marketing/route';

const params = { params: Promise.resolve({ businessSlug: 'mytiv', projectId: 'project' }) };
const requestId = '11111111-1111-4111-8111-111111111111';
function post(plan: unknown) {
  return new NextRequest('https://ops.example/api/mytiv/ops/projects/project/marketing', {
    method: 'POST',
    headers: { origin: 'https://ops.example', 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, confirmed: true, requestId }),
  });
}

beforeEach(() => {
  mocks.guard.mockResolvedValue({ businessId: 'biz', userId: 'user', role: 'owner' });
  mocks.project.mockResolvedValue({ id: 'project', name: 'Fixture', clickupFolderId: 'f' });
  mocks.binding.mockReturnValue(BIZ);
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
