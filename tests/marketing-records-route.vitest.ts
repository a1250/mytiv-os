import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { OpsPolicyError } from '../lib/ops-policy';

// T-3.2 — marketing artifact / record routes (services mocked; the real services run in tests/db-integration).
const mocks = vi.hoisted(() => ({
  guard: vi.fn(), project: vi.fn(), binding: vi.fn(), audited: vi.fn(), importArtifact: vi.fn(), list: vi.fn(), exportRecord: vi.fn(),
  decision: vi.fn(), proposal: vi.fn(), evidence: vi.fn(), outcome: vi.fn(), receipt: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('../lib/api-guard', () => ({
  guard: mocks.guard,
  ApiGuardError: class extends Error { response: Response; constructor(r: Response) { super('ApiGuardError'); this.response = r; } },
}));
vi.mock('../lib/db/queries/projects', () => ({ getProject: mocks.project }));
vi.mock('../lib/ops-audit', () => ({ auditedAction: mocks.audited }));
vi.mock('../lib/marketing/binding-store', () => ({ getMarketingBinding: mocks.binding }));
vi.mock('../lib/marketing/artifacts', () => ({ importArtifact: mocks.importArtifact, listLatestArtifacts: mocks.list }));
vi.mock('../lib/marketing/records', () => ({
  exportRecord: mocks.exportRecord, recordDecision: mocks.decision, recordProposal: mocks.proposal,
  recordEvidence: mocks.evidence, recordOutcome: mocks.outcome, recordReceipt: mocks.receipt,
}));

import * as artifacts from '../app/api/[businessSlug]/ops/projects/[projectId]/marketing/artifacts/route';
import * as decisions from '../app/api/[businessSlug]/ops/projects/[projectId]/marketing/decisions/route';
import * as proposals from '../app/api/[businessSlug]/ops/projects/[projectId]/marketing/proposals/route';
import * as evidence from '../app/api/[businessSlug]/ops/projects/[projectId]/marketing/evidence/route';
import * as outcomes from '../app/api/[businessSlug]/ops/projects/[projectId]/marketing/outcomes/route';
import * as receipts from '../app/api/[businessSlug]/ops/projects/[projectId]/marketing/receipts/route';
import * as decisionExport from '../app/api/[businessSlug]/ops/projects/[projectId]/marketing/decisions/[id]/route';
import * as receiptExport from '../app/api/[businessSlug]/ops/projects/[projectId]/marketing/receipts/[id]/route';
import { ApiGuardError } from '../lib/api-guard';

const params = { params: Promise.resolve({ businessSlug: 'mytiv', projectId: 'project' }) };
const idParams = { params: Promise.resolve({ businessSlug: 'mytiv', projectId: 'project', id: '33333333-3333-4333-8333-333333333333' }) };
const requestId = '44444444-4444-4444-8444-444444444444';
const BINDING = { marketingBusiness: 'demo-biz', bindingVersion: 3 };
function req(body: Record<string, unknown> | string, origin = 'https://ops.example', method = 'POST') {
  return new NextRequest('https://ops.example/api/mytiv/ops/projects/project/marketing/x', {
    method, headers: { origin, 'Content-Type': 'application/json' }, ...(method === 'POST' ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  });
}
const valid = (over: Record<string, unknown> = {}) => req({ confirmed: true, requestId, bindingVersion: 3, kind: 'C2a', payload: {}, ...over });
const as = (role: string) => mocks.guard.mockResolvedValue({ businessId: 'biz', userId: 'user', role });
const WRITERS = [
  ['artifact import', artifacts.POST, mocks.importArtifact, 'marketing_artifact_import'],
  ['decision', decisions.POST, mocks.decision, 'marketing_record_decision'],
  ['proposal', proposals.POST, mocks.proposal, 'marketing_record_proposal'],
  ['evidence', evidence.POST, mocks.evidence, 'marketing_record_evidence'],
  ['outcome', outcomes.POST, mocks.outcome, 'marketing_record_outcome'],
  ['receipt', receipts.POST, mocks.receipt, 'marketing_record_receipt'],
] as const;
const serviceMocks = [mocks.importArtifact, mocks.decision, mocks.proposal, mocks.evidence, mocks.outcome, mocks.receipt, mocks.exportRecord];
const noWrites = () => { expect(mocks.audited).not.toHaveBeenCalled(); for (const m of serviceMocks) expect(m).not.toHaveBeenCalled(); };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.MARKETING_MODULE_ENABLED = 'true';
  as('owner');
  mocks.project.mockResolvedValue({ id: 'project' });
  mocks.binding.mockResolvedValue(BINDING);
  mocks.audited.mockImplementation((_s, _p, _r, _a, _payload, run: () => unknown) => run());
  for (const m of serviceMocks) m.mockResolvedValue({ ok: true });
  mocks.list.mockResolvedValue([{ kind: 'C2a', revision: 1 }]);
});
afterEach(() => { delete process.env.MARKETING_MODULE_ENABLED; });

test('the module is off by default: every route answers 404 and writes nothing', async () => {
  delete process.env.MARKETING_MODULE_ENABLED;
  for (const [name, POST] of WRITERS) expect((await POST(valid(), params)).status, name).toBe(404);
  expect((await artifacts.GET(req({}, undefined, 'GET'), params)).status).toBe(404);
  expect((await decisionExport.GET(req({}, undefined, 'GET'), idParams)).status).toBe(404);
  process.env.MARKETING_MODULE_ENABLED = 'false';
  expect((await decisions.POST(valid(), params)).status).toBe(404);
  noWrites();
});

test('each write is a governed, audited action routed to its own service with the active binding', async () => {
  for (const [name, POST, service, action] of WRITERS) {
    vi.clearAllMocks(); as('owner'); mocks.project.mockResolvedValue({ id: 'project' }); mocks.binding.mockResolvedValue(BINDING);
    mocks.audited.mockImplementation((_s, _p, _r, _a, _payload, run: () => unknown) => run());
    service.mockResolvedValue({ ok: true, kind: name });
    const res = await POST(valid(), params);
    expect(res.status, name).toBe(200);
    expect(mocks.audited, name).toHaveBeenCalledTimes(1);
    const [scope, project, rid, auditedActionName, , , meta] = mocks.audited.mock.calls[0];
    expect([scope.businessId, project, rid, auditedActionName, meta], name).toEqual(['biz', 'project', requestId, action, { target: { kind: 'project', id: 'project' } }]);
    expect(service, name).toHaveBeenCalledTimes(1);
    expect(service.mock.calls[0][2], name).toEqual(BINDING);
  }
});

test('anonymous → 401; members cannot write or export (403) but can read the artifact list', async () => {
  mocks.guard.mockRejectedValue(new ApiGuardError(NextResponse.json({ error: 'unauthorized' }, { status: 401 })));
  expect((await decisions.POST(valid(), params)).status).toBe(401);
  as('member');
  for (const [name, POST] of WRITERS) expect((await POST(valid(), params)).status, name).toBe(403);
  expect((await decisionExport.GET(req({}, undefined, 'GET'), idParams)).status).toBe(403);
  noWrites();
  const list = await artifacts.GET(req({}, undefined, 'GET'), params);
  expect(list.status).toBe(200);
  expect(await list.json()).toEqual({ connected: true, bindingVersion: 3, artifacts: [{ kind: 'C2a', revision: 1 }] });
});

test('a project of another business → 404; a project without an active binding → 409 not connected', async () => {
  mocks.project.mockResolvedValue(null);
  for (const [name, POST] of WRITERS) expect((await POST(valid(), params)).status, name).toBe(404);
  expect((await artifacts.GET(req({}, undefined, 'GET'), params)).status).toBe(404);
  mocks.project.mockResolvedValue({ id: 'project' });
  mocks.binding.mockResolvedValue(null);
  for (const [name, POST] of WRITERS) {
    const res = await POST(valid(), params);
    expect(res.status, name).toBe(409);
    expect((await res.json()).error).toBe('marketing_not_connected');
  }
  expect(await (await artifacts.GET(req({}, undefined, 'GET'), params)).json()).toEqual({ connected: false, artifacts: [] });
  noWrites();
});

test('a write confirmed against a binding version that is no longer current is refused before any audit', async () => {
  for (const bindingVersion of [2, 4, undefined, '3']) {
    const res = await decisions.POST(valid({ bindingVersion }), params);
    expect(res.status, String(bindingVersion)).toBe(409);
    expect((await res.json()).error).toBe('stale_binding_version');
  }
  noWrites();
});

test('cross-origin, unconfirmed, malformed and oversized requests are refused with zero writes', async () => {
  expect((await receipts.POST(req({ confirmed: true, requestId, bindingVersion: 3 }, 'https://evil.example'), params)).status).toBe(403);
  expect((await receipts.POST(valid({ confirmed: false }), params)).status).toBe(400);
  expect((await receipts.POST(valid({ requestId: 'nope' }), params)).status).toBe(400);
  expect((await receipts.POST(req('{not json'), params)).status).toBe(400);
  expect((await receipts.POST(req({ confirmed: true, requestId, bindingVersion: 3, pad: 'x'.repeat(260000) }), params)).status).toBe(413);
  noWrites();
});

test('a replayed request id (409) and an audit that cannot be written (503) both block the write', async () => {
  mocks.audited.mockRejectedValue(new OpsPolicyError('request_already_claimed_check_audit_before_retry', 409));
  expect((await outcomes.POST(valid(), params)).status).toBe(409);
  mocks.audited.mockRejectedValue(new Error('audit insert failed'));
  const res = await outcomes.POST(valid(), params);
  expect(res.status).toBe(503);
  expect((await res.json()).error).toBe('marketing_unavailable');
  expect(mocks.outcome).not.toHaveBeenCalled();
});

test('service refusals surface with their policy status (historical projection, unsupported kind, linkage)', async () => {
  mocks.decision.mockRejectedValue(new OpsPolicyError('stale_binding_version', 409));
  expect((await decisions.POST(valid(), params)).status).toBe(409);
  mocks.importArtifact.mockRejectedValue(new OpsPolicyError('unsupported_artifact_kind'));
  const res = await artifacts.POST(valid({ kind: 'C2b' }), params);
  expect(res.status).toBe(400);
  expect((await res.json()).error).toBe('unsupported_artifact_kind');
  mocks.receipt.mockRejectedValue(new OpsPolicyError('approval_linkage_invalid', 409));
  expect((await receipts.POST(valid(), params)).status).toBe(409);
});

test('export returns the record as a downloadable JSON attachment (writer only)', async () => {
  mocks.exportRecord.mockResolvedValue({ approval_id: 'a1' });
  const res = await decisionExport.GET(req({}, undefined, 'GET'), idParams);
  expect(res.status).toBe(200);
  expect(res.headers.get('content-disposition')).toBe('attachment; filename="marketing-decision-33333333-3333-4333-8333-333333333333.json"');
  expect(res.headers.get('cache-control')).toBe('no-store');
  expect(JSON.parse(await res.text())).toEqual({ approval_id: 'a1' });
  expect(mocks.exportRecord).toHaveBeenCalledWith('biz', 'project', 'decision', '33333333-3333-4333-8333-333333333333');
  mocks.exportRecord.mockRejectedValue(new OpsPolicyError('not_found', 404));
  expect((await receiptExport.GET(req({}, undefined, 'GET'), idParams)).status).toBe(404);
});
