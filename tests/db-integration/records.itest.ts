import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
vi.mock('../../lib/db', async () => await import('./db-local'));
import { pool } from './db-local';
import { bindMarketing, getMarketingBinding, revokeMarketing } from '../../lib/marketing/binding-store';
import { importArtifact, latestArtifact, listLatestArtifacts } from '../../lib/marketing/artifacts';
import { exportRecord, recordDecision, recordEvidence, recordOutcome, recordProposal, recordReceipt } from '../../lib/marketing/records';
import { validateArtifact } from '../../lib/marketing/validate-artifact';
import type { MarketingBinding } from '../../lib/marketing/binding';

// T-3.2 — the real artifact / record services on a real Postgres with migrations 0000–0010.
type Row = Record<string, unknown>;
const vec = (k: string): Row => JSON.parse(readFileSync(path.join(process.cwd(), `lib/marketing/contracts/${k}.vectors.json`), 'utf8')).valid[0];
const H = 'a'.repeat(64), H2 = 'b'.repeat(64);
const ids = { a: randomUUID(), b: randomUUID(), owner: randomUUID(), ownerB: randomUUID(), p: randomUUID(), q: randomUUID() };
const A = () => ({ businessId: ids.a, userId: ids.owner });
let binding: MarketingBinding;
const queue = (items: Row[], asOf = '2026-01-01T00:00:00.000Z') => ({ ...vec('C2a'), asOf, items });
const board = (task: Row, asOf = '2026-01-01T00:00:00.000Z') => { const c7 = vec('C7'); return { ...c7, asOf, tasks: [{ ...(c7.tasks as Row[])[0], ...task }] }; };
const confirmed = (body: Row) => body; // routes add confirmation/requestId; services receive the parsed body
const rid = () => randomUUID();
const policy = (message: string, status: number) => expect.objectContaining({ message, status });

beforeAll(async () => {
  await pool.query(`INSERT INTO businesses(id,name,slug) VALUES ($1::uuid,'A',$1::text),($2::uuid,'B',$2::text)`, [ids.a, ids.b]);
  await pool.query(`INSERT INTO users(id,email) VALUES ($1::uuid,$1::text||'@x.invalid'),($2::uuid,$2::text||'@x.invalid')`, [ids.owner, ids.ownerB]);
  await pool.query(`INSERT INTO business_memberships(business_id,user_id,role) VALUES ($1,$2,'owner'),($3,$4,'owner')`, [ids.a, ids.owner, ids.b, ids.ownerB]);
  await pool.query(`INSERT INTO projects(id,business_id,name) VALUES ($1,$2,'P'),($3,$4,'Q')`, [ids.p, ids.a, ids.q, ids.b]);
  await bindMarketing(A(), ids.p, 'demo-biz', rid());
  await bindMarketing({ businessId: ids.b, userId: ids.ownerB }, ids.q, 'demo-biz', rid());
  binding = (await getMarketingBinding(ids.a, ids.p))!;
});
afterAll(async () => { await pool.end(); });

test('artifact import: only engine kinds, only through the vendored contract, only for the bound tenant', async () => {
  for (const kind of ['C1', 'C2b', 'C3b', 'C6', 'C15', 'C16', 'bogus']) await expect(importArtifact(A(), ids.p, binding, kind, vec('C2a'), rid())).rejects.toEqual(policy('unsupported_artifact_kind', 400));
  await expect(importArtifact(A(), ids.p, binding, 'C2a', { ...vec('C2a'), marketingBusiness: 'other-biz' }, rid())).rejects.toThrow('contract_scope_or_version_mismatch');
  await expect(importArtifact(A(), ids.p, binding, 'C2a', { ...vec('C2a'), token: 'x' }, rid())).rejects.toThrow('contract_structure_invalid');
  const r = await importArtifact(A(), ids.p, binding, 'C2a', queue([{ approval_id: 'a1', content_hash: H, state: 'pending' }, { approval_id: 'a2', content_hash: H, state: 'approved' }]), rid());
  expect(r).toMatchObject({ ok: true, kind: 'C2a', revision: 1, bindingVersion: 1 });
  expect((await latestArtifact(ids.a, ids.p, binding, 'C2a'))?.revision).toBe(1);
  expect((await listLatestArtifacts(ids.a, ids.p, binding)).map((x) => `${x.kind}:${x.revision}`)).toEqual(['C2a:1']);
});

test('decisions: pending items only, exact content, mandatory note, once — exported as canonical C2b', async () => {
  const src = (await latestArtifact(ids.a, ids.p, binding, 'C2a'))!;
  const base = { sourceArtifactId: src.id, approvalId: 'a1', contentHash: H, decision: 'approved', note: 'budget fits the brief' };
  await expect(recordDecision(A(), ids.p, binding, confirmed({ ...base, approvalId: 'a2' }), rid())).rejects.toEqual(policy('approval_not_pending', 409));
  await expect(recordDecision(A(), ids.p, binding, confirmed({ ...base, contentHash: H2 }), rid())).rejects.toEqual(policy('stale_content_hash', 409));
  await expect(recordDecision(A(), ids.p, binding, confirmed({ ...base, approvalId: 'nope' }), rid())).rejects.toEqual(policy('not_found', 404));
  await expect(recordDecision(A(), ids.p, binding, confirmed({ ...base, note: '   ' }), rid())).rejects.toEqual(policy('invalid_note', 400));
  await expect(recordDecision(A(), ids.p, binding, confirmed({ ...base, decision: 'maybe' }), rid())).rejects.toEqual(policy('invalid_decision', 400));
  const request = rid();
  const d = await recordDecision(A(), ids.p, binding, confirmed(base), request);
  expect(d.payload).toMatchObject({ approval_id: 'a1', content_hash: H, decision: 'approved', decided_by: ids.owner, app_request_id: request, binding_version: 1, marketingBusiness: 'demo-biz' });
  await expect(recordDecision(A(), ids.p, binding, confirmed({ ...base, decision: 'rejected' }), rid())).rejects.toEqual(policy('already_recorded', 409));
  const exported = await exportRecord(ids.a, ids.p, 'decision', d.id);
  expect(() => validateArtifact('C2b', exported, binding)).not.toThrow();
  expect(exported).toMatchObject({ approval_id: 'a1', decision: 'approved', note: 'budget fits the brief', binding_version: 1 });
  const first = (await pool.query(`SELECT exported_at FROM marketing_decisions WHERE id=$1`, [d.id])).rows[0].exported_at;
  expect(first).not.toBeNull();
  await exportRecord(ids.a, ids.p, 'decision', d.id);
  expect((await pool.query(`SELECT exported_at FROM marketing_decisions WHERE id=$1`, [d.id])).rows[0].exported_at).toEqual(first);
  await expect(exportRecord(ids.b, ids.q, 'decision', d.id)).rejects.toEqual(policy('not_found', 404)); // another business
});

test('receipts: only an APPROVED item with the exact approved content, with a review attestation', async () => {
  const src = (await latestArtifact(ids.a, ids.p, binding, 'C2a'))!;
  const base = { sourceArtifactId: src.id, approvalId: 'a2', contentHash: H, actionType: 'campaign_activation', executedBy: 'operator',
    executedAt: '2026-01-02T10:00:00Z', evidence: { pack_ref: 'packs/pack-1.json' }, reviewed: true };
  await expect(recordReceipt(A(), ids.p, binding, confirmed({ ...base, reviewed: false }), rid())).rejects.toEqual(policy('review_attestation_required', 400));
  await expect(recordReceipt(A(), ids.p, binding, confirmed({ ...base, approvalId: 'a1' }), rid())).rejects.toThrow(/is pending, not approved/);
  await expect(recordReceipt(A(), ids.p, binding, confirmed({ ...base, contentHash: H2 }), rid())).rejects.toThrow(/stale linkage/);
  await expect(recordReceipt(A(), ids.p, binding, confirmed({ ...base, actionType: 'publish' }), rid())).rejects.toThrow(/contract_structure_invalid/);
  await expect(recordReceipt(A(), ids.p, binding, confirmed({ ...base, evidence: { pack_ref: '../p.json' } }), rid())).rejects.toThrow(/pack_ref unsafe ref/);
  const r = await recordReceipt(A(), ids.p, binding, confirmed(base), rid());
  expect(r.payload).toMatchObject({ approval_id: 'a2', reviewed_by: ids.owner, binding_version: 1 });
  expect(await exportRecord(ids.a, ids.p, 'receipt', r.id)).toEqual(r.payload);
});

test('reconciliation on the next C2a: decision applied / stale, receipt still linked (C2a cannot say applied)', async () => {
  await importArtifact(A(), ids.p, binding, 'C2a', queue([{ approval_id: 'a1', content_hash: H, state: 'approved' }, { approval_id: 'a2', content_hash: H, state: 'approved' }], '2026-01-03T00:00:00.000Z'), rid());
  const states = async () => ({
    decision: (await pool.query(`SELECT reconciled_state FROM marketing_decisions WHERE business_id=$1 AND approval_id='a1'`, [ids.a])).rows[0].reconciled_state,
    receipt: (await pool.query(`SELECT reconciled_state FROM marketing_evidence WHERE business_id=$1 AND kind='execution_receipt'`, [ids.a])).rows[0].reconciled_state,
  });
  expect(await states()).toEqual({ decision: 'applied', receipt: 'awaiting' });
  await importArtifact(A(), ids.p, binding, 'C2a', queue([{ approval_id: 'a1', content_hash: H2, state: 'pending' }], '2026-01-04T00:00:00.000Z'), rid());
  expect(await states()).toEqual({ decision: 'stale', receipt: 'missing' });
});

test('brain proposals: against the value the human saw; reconciled from the next C3a', async () => {
  await importArtifact(A(), ids.p, binding, 'C3a', vec('C3a'), rid());
  const src = (await latestArtifact(ids.a, ids.p, binding, 'C3a'))!;
  const base = { sourceArtifactId: src.id, file: 'hours.yaml', path: 'weekly.sun', valueHash: H, old: '10-22', new: '10-23', reason: 'owner update', verify: true };
  await expect(recordProposal(A(), ids.p, binding, confirmed({ ...base, valueHash: H2 }), rid())).rejects.toEqual(policy('stale_value_hash', 409));
  await expect(recordProposal(A(), ids.p, binding, confirmed({ ...base, path: 'weekly.mon' }), rid())).rejects.toEqual(policy('not_found', 404));
  const { old: _o, ...noOld } = base; void _o;
  await expect(recordProposal(A(), ids.p, binding, confirmed(noOld), rid())).rejects.toEqual(policy('invalid_proposal', 400));
  const pr = await recordProposal(A(), ids.p, binding, confirmed(base), rid());
  expect(() => validateArtifact('C3b', pr.payload, binding)).not.toThrow();
  const state = async () => (await pool.query(`SELECT reconciled_state FROM marketing_evidence WHERE id=$1`, [pr.id])).rows[0].reconciled_state;
  await importArtifact(A(), ids.p, binding, 'C3a', { ...vec('C3a'), open_proposals: [pr.payload] }, rid());
  expect(await state()).toBe('awaiting');
  // still open in the engine even though the value already moved (e.g. another change) → still awaiting
  await importArtifact(A(), ids.p, binding, 'C3a', { ...vec('C3a'), values: { 'hours.yaml': { 'weekly.sun': H2 } }, open_proposals: [pr.payload] }, rid());
  expect(await state()).toBe('awaiting');
  await importArtifact(A(), ids.p, binding, 'C3a', { ...vec('C3a'), values: { 'hours.yaml': { 'weekly.sun': H2 } } }, rid());
  expect(await state()).toBe('resolved');
});

test('publish evidence + outcomes: attested, safe refs, published-only outcomes, DoD criteria from the task; reconciled from C7', async () => {
  await importArtifact(A(), ids.p, binding, 'C7', board({}), rid()); // t-1 scheduled, dod ['shipped']
  const c7 = (await latestArtifact(ids.a, ids.p, binding, 'C7'))!;
  const ev = { sourceArtifactId: c7.id, taskId: 't-1', channel: 'instagram', evidence: { url: 'https://example.com/post/9' }, publishedAt: '2026-01-02T09:00:00Z', by: 'operator', reviewed: true };
  await expect(recordEvidence(A(), ids.p, binding, confirmed({ ...ev, reviewed: undefined }), rid())).rejects.toEqual(policy('review_attestation_required', 400));
  await expect(recordEvidence(A(), ids.p, binding, confirmed({ ...ev, evidence: { url: 'http://example.com/p' } }), rid())).rejects.toThrow(/unsafe ref/);
  await expect(recordEvidence(A(), ids.p, binding, confirmed({ ...ev, taskId: 't-404' }), rid())).rejects.toEqual(policy('not_found', 404));
  const e = await recordEvidence(A(), ids.p, binding, confirmed(ev), rid());
  expect(e.payload).toMatchObject({ task_id: 't-1', reviewed_by: ids.owner });
  const out = { sourceArtifactId: c7.id, taskId: 't-1', dodCriteriaMet: ['shipped'], measurement: { kpi_snapshot_ref: 'exports/kpi.v1.json' }, reviewed: true };
  await expect(recordOutcome(A(), ids.p, binding, confirmed(out), rid())).rejects.toEqual(policy('task_not_published', 409));
  // the engine applied the evidence: task published, evidence reviewed + applied
  await importArtifact(A(), ids.p, binding, 'C7', board({ status: 'published', completion_evidence: true, completion: 'evidence_reviewed', evidence_state: 'applied' }, '2026-01-02T00:00:00.000Z'), rid());
  expect((await pool.query(`SELECT reconciled_state FROM marketing_evidence WHERE id=$1`, [e.id])).rows[0].reconciled_state).toBe('applied');
  const published = (await latestArtifact(ids.a, ids.p, binding, 'C7'))!;
  await expect(recordOutcome(A(), ids.p, binding, confirmed({ ...out, sourceArtifactId: published.id, dodCriteriaMet: ['bogus'] }), rid())).rejects.toEqual(policy('invalid_dod_criteria', 400));
  const o = await recordOutcome(A(), ids.p, binding, confirmed({ ...out, sourceArtifactId: published.id }), rid());
  expect(() => validateArtifact('C15', o.payload, binding)).not.toThrow();
  await importArtifact(A(), ids.p, binding, 'C7', board({ status: 'measured', completion_evidence: true, completion: 'outcome_verified', evidence_state: 'applied' }, '2026-01-03T00:00:00.000Z'), rid());
  expect((await pool.query(`SELECT reconciled_state FROM marketing_evidence WHERE id=$1`, [o.id])).rows[0].reconciled_state).toBe('applied');
});

test('another business can never use this business\'s artifacts', async () => {
  const src = (await latestArtifact(ids.a, ids.p, binding, 'C2a'))!;
  const bBinding = (await getMarketingBinding(ids.b, ids.q))!;
  await expect(recordDecision({ businessId: ids.b, userId: ids.ownerB }, ids.q, bBinding,
    { sourceArtifactId: src.id, approvalId: 'a1', contentHash: H2, decision: 'rejected', note: 'x' }, rid())).rejects.toEqual(policy('not_found', 404));
});

test('revoke → rebind: the old projection is history — no decision on it; imports restart at revision 1', async () => {
  const old = (await latestArtifact(ids.a, ids.p, binding, 'C2a'))!;
  await revokeMarketing(A(), ids.p, rid());
  await bindMarketing(A(), ids.p, 'demo-biz', rid());
  const v2 = (await getMarketingBinding(ids.a, ids.p))!;
  expect(v2.bindingVersion).toBe(2);
  await expect(recordDecision(A(), ids.p, v2, { sourceArtifactId: old.id, approvalId: 'a1', contentHash: H2, decision: 'approved', note: 'x' }, rid()))
    .rejects.toEqual(policy('stale_binding_version', 409));
  expect(await latestArtifact(ids.a, ids.p, v2, 'C2a')).toBeNull();
  expect((await importArtifact(A(), ids.p, v2, 'C2a', queue([{ approval_id: 'a1', content_hash: H2, state: 'pending' }], '2026-01-05T00:00:00.000Z'), rid())).revision).toBe(1);
  await expect(importArtifact(A(), ids.p, binding, 'C2a', vec('C2a'), rid())).rejects.toEqual(policy('stale_binding_version', 409)); // v1 caller
});
