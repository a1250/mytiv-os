import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
vi.mock('../../lib/db', async () => await import('./db-local'));
import { pool } from './db-local';
import { bindMarketing, getMarketingBinding } from '../../lib/marketing/binding-store';
import { importArtifact, latestArtifact, type EngineArtifactKind } from '../../lib/marketing/artifacts';
import { exportRecord, listRecords, recordDecision, recordEvidence, recordOutcome, recordProposal, recordReceipt, type RecordKind } from '../../lib/marketing/records';
import { importPlan } from '../../lib/marketing/service';
import { validateMarketingPlan } from '../../lib/marketing/validate';
import { brainVerification } from '../../lib/marketing/view';
import type { MarketingBinding } from '../../lib/marketing/binding';

/**
 * Engine ↔ app round trip (local analog of T-12.4a/b): a REAL marketing-os checkout (RT_ENGINE_DIR) exports
 * a throwaway tenant; the app imports every artifact through the vendored contracts into the local
 * Postgres, records C2b / C6 / C16 / C15 / C3b through its real services, and the exported records are
 * applied by the engine's own CLIs. The next engine export must reconcile every record in the app.
 * Skipped unless RT_ENGINE_DIR is set. The engine tenant is created from the fictional fixture brain and
 * dropped afterwards; no real business data, no network.
 */
const ENGINE = process.env.RT_ENGINE_DIR;
const HELPER = path.join(process.cwd(), 'tests/db-integration/roundtrip-engine.ts');
const KIND: Record<string, EngineArtifactKind> = {
  approvals: 'C2a', brain: 'C3a', workboard: 'C7', 'weekly-priorities': 'C8', 'ingest-manifest': 'C9', campaigns: 'C12', 'monthly-plan': 'C14',
};
type Row = Record<string, unknown>;
type Seed = { tenant: string; slug: string; taskId: string; dod: string[]; publish: string; campaign: string; rejectMe: string; staleMe: string; rejectCamp: string };

function engine(script: string, args: string[]) {
  const r = spawnSync('npx', ['tsx', script, ...args], { cwd: ENGINE, encoding: 'utf8', env: { ...process.env, NODE_NO_WARNINGS: '1' } });
  return { code: r.status, out: r.stdout, err: r.stderr };
}
function helper<T>(...args: string[]): T {
  const r = engine(HELPER, args);
  if (r.code !== 0) throw new Error(`engine helper ${args[0]} failed: ${r.err}`);
  return JSON.parse(r.out) as T;
}

describe.skipIf(!ENGINE)('engine ↔ app round trip', () => {
  const ids = { a: randomUUID(), owner: randomUUID(), p: randomUUID() };
  const A = () => ({ businessId: ids.a, userId: ids.owner });
  const rid = () => randomUUID();
  let seed: Seed, binding: MarketingBinding, dir: string;
  const pendingHash = new Map<string, string>(); // D13.1: the C2a content_hash each approval had while pending

  /** Write an app-exported record where the engine CLI can read it, and apply it. */
  function apply(script: string, payload: unknown, extra: string[] = []) {
    const file = path.join(dir, `${randomUUID()}.json`);
    writeFileSync(file, JSON.stringify(payload));
    return engine(`scripts/${script}.ts`, ['--tenant', seed.tenant, '--file', file, '--by', 'rt-owner', ...extra]);
  }
  async function exported(kind: RecordKind, id: string) { return exportRecord(ids.a, ids.p, kind, id) as Promise<Row>; }
  /** Engine export (revision `rev`) → app import of every artifact; returns the raw export. */
  async function sync(rev: string): Promise<Record<string, Row>> {
    const r = engine('scripts/export-artifacts.ts', ['--tenant', seed.tenant, '--rev', rev, '--stdout']);
    expect(r.code, r.err).toBe(0);
    const all = JSON.parse(r.out) as Record<string, Row>;
    for (const [key, payload] of Object.entries(all)) {
      if (key === 'plan') continue; // C1 goes through the plan-snapshot import (first sync only)
      const kind = KIND[key];
      expect(kind, `engine export "${key}" has no app artifact kind`).toBeDefined();
      await importArtifact(A(), ids.p, binding, kind, payload, rid());
    }
    return all;
  }
  const state = async () => {
    const r = await listRecords(ids.a, ids.p, binding);
    return {
      decision: (approvalId: string) => r.decisions.find((d) => d.approvalId === approvalId)?.reconciledState,
      evidence: (kind: string, targetId: string) => r.evidence.find((e) => e.kind === kind && e.targetId === targetId)?.reconciledState,
    };
  };
  const queueItem = async (approvalId: string) => (await latestArtifact(ids.a, ids.p, binding, 'C2a'))!.payload.items.find((i) => i.approval_id === approvalId)!;
  const boardTask = async () => (await latestArtifact(ids.a, ids.p, binding, 'C7'))!.payload.tasks.find((t) => t.task_id === seed.taskId)!;
  async function decide(approvalId: string, decision: 'approved' | 'rejected') {
    const src = (await latestArtifact(ids.a, ids.p, binding, 'C2a'))!;
    const item = src.payload.items.find((i) => i.approval_id === approvalId)!;
    return recordDecision(A(), ids.p, binding, { sourceArtifactId: src.id, approvalId, contentHash: item.content_hash, decision, note: `round trip: ${decision}` }, rid());
  }

  beforeAll(async () => {
    dir = mkdtempSync(path.join(tmpdir(), 'mytiv-rt-'));
    seed = helper<Seed>('seed');
    await pool.query(`INSERT INTO businesses(id,name,slug) VALUES ($1::uuid,'RT',$1::text)`, [ids.a]);
    await pool.query(`INSERT INTO users(id,email) VALUES ($1::uuid,$1::text||'@x.invalid')`, [ids.owner]);
    await pool.query(`INSERT INTO business_memberships(business_id,user_id,role) VALUES ($1,$2,'owner')`, [ids.a, ids.owner]);
    await pool.query(`INSERT INTO projects(id,business_id,name) VALUES ($1,$2,'RT')`, [ids.p, ids.a]);
    await bindMarketing(A(), ids.p, seed.slug, rid());
    binding = (await getMarketingBinding(ids.a, ids.p))!;
  }, 60000);
  afterAll(async () => {
    if (seed) helper('drop', seed.tenant);
    if (dir) rmSync(dir, { recursive: true, force: true });
    await pool.end();
  });

  test('r1: every engine artifact imports through the vendored contracts; Brain reads the engine field keys', async () => {
    const all = await sync('r1');
    const plan = validateMarketingPlan(all.plan, binding.marketingBusiness);
    await importPlan(ids.a, ids.p, ids.owner, plan, binding);
    const queue = (await latestArtifact(ids.a, ids.p, binding, 'C2a'))!.payload;
    expect(queue.items.map((i) => i.state)).toEqual(['pending', 'pending', 'pending', 'pending', 'pending']);
    for (const i of queue.items) pendingHash.set(i.approval_id, i.content_hash);
    const brain = (await latestArtifact(ids.a, ids.p, binding, 'C3a'))!.payload;
    expect(Object.keys(brain.field_verification)).toContain('hours.yaml:kitchen_last_order_minutes_before_close'); // engine separator
    expect(brain.files['hours.yaml']).toBe('ok'); // D13.2: health only — partial verification never makes it 'invalid'
    expect(brainVerification('hours.yaml', brain.field_verification)).toEqual({ level: 'PARTIAL', tracked: 2, verified: 1 });
    expect((await boardTask()).status).toBe('approval_pending');
  }, 120000);

  test('C2b: app decisions are applied by the engine; replay, conflict, tenant mismatch and stale are refused', async () => {
    const pub = await decide(seed.publish, 'approved');
    const camp = await decide(seed.campaign, 'approved');
    const rej = await decide(seed.rejectMe, 'rejected');
    const stale = await decide(seed.staleMe, 'approved');
    const rejCamp = await decide(seed.rejectCamp, 'rejected');
    const c2b = await exported('decision', pub.id);
    let r = apply('apply-decisions', c2b);
    expect(r.code, r.err).toBe(0);
    expect(r.out).toMatch(/^decided approved/);
    expect(r.out).toContain(`task ${seed.taskId}: approved`); // linked task approval_pending → approved
    r = apply('apply-decisions', c2b); // idempotent replay
    expect([r.code, r.out.split(' ')[0]]).toEqual([0, 'replayed']);
    r = apply('apply-decisions', { ...c2b, decision: 'rejected', app_request_id: randomUUID() });
    expect([r.code, r.err]).toEqual([1, expect.stringContaining('approval.decision_conflict')]); // the first decision stands
    r = apply('apply-decisions', { ...(await exported('decision', camp.id)), marketingBusiness: 'other-biz' });
    expect([r.code, r.err]).toEqual([1, expect.stringContaining('approval.decision_tenant_mismatch')]);
    for (const d of [camp, rej, rejCamp]) { r = apply('apply-decisions', await exported('decision', d.id)); expect(r.code, r.err).toBe(0); }
    helper('note', seed.tenant, seed.staleMe); // the engine edits the item after the app's export
    r = apply('apply-decisions', await exported('decision', stale.id));
    expect([r.code, r.err]).toEqual([1, expect.stringContaining('approval.decision_stale')]);
    for (const id of [seed.publish, seed.campaign]) { r = engine('scripts/apply-decisions.ts', ['--tenant', seed.tenant, id, '--by', 'rt-owner']); expect(r.code, r.err).toBe(0); } // manual packs
    expect(helper<{ status: string }>('transition', seed.tenant, seed.taskId, 'scheduled').status).toBe('scheduled');

    await sync('r2');
    const s = await state();
    expect([s.decision(seed.publish), s.decision(seed.campaign), s.decision(seed.rejectMe), s.decision(seed.staleMe)]).toEqual(['applied', 'applied', 'applied', 'stale']);
    expect((await queueItem(seed.rejectMe)).state).toBe('rejected');
    expect((await queueItem(seed.staleMe)).state).toBe('pending'); // never decided on the engine
    // D13.1 pending hash == decided hash (approved and rejected) when the content is unchanged; the edited one moved
    for (const id of [seed.publish, seed.campaign, seed.rejectMe]) expect((await queueItem(id)).content_hash, id).toBe(pendingHash.get(id));
    expect((await queueItem(seed.staleMe)).content_hash).not.toBe(pendingHash.get(seed.staleMe));
  }, 180000);

  test('C6 + C16: reviewed publication evidence and an execution receipt resolve their approvals', async () => {
    const board = (await latestArtifact(ids.a, ids.p, binding, 'C7'))!;
    const ev = await recordEvidence(A(), ids.p, binding, { reviewed: true, sourceArtifactId: board.id, taskId: seed.taskId, approvalId: seed.publish, channel: 'instagram',
      evidence: { url: 'https://example.com/p/rt-1' }, publishedAt: new Date(Date.now() - 60000).toISOString(), by: 'creative-director' }, rid());
    let r = apply('apply-evidence', await exported('evidence', ev.id));
    expect(r.code, r.err).toBe(0);
    const queue = (await latestArtifact(ids.a, ids.p, binding, 'C2a'))!;
    const item = queue.payload.items.find((i) => i.approval_id === seed.campaign)!;
    const rc = await recordReceipt(A(), ids.p, binding, { reviewed: true, sourceArtifactId: queue.id, approvalId: seed.campaign, contentHash: item.content_hash, actionType: 'campaign_activation',
      executedBy: 'rt-owner', executedAt: new Date(Date.now() - 60000).toISOString(), evidence: { pack_ref: `packs/${seed.campaign}.md`, external_ref: 'ads-manager-campaign-1' } }, rid());
    const c16 = await exported('receipt', rc.id);
    // T-12.4b refusals on forged payloads (records the app would never export) — each refused, nothing applied.
    const refusedWith = (payload: Row, code: string) => { const x = apply('apply-receipts', payload); expect([x.code, x.err]).toEqual([1, expect.stringContaining(code)]); };
    refusedWith({ ...c16, content_hash: 'f'.repeat(64), app_request_id: randomUUID() }, 'receipt.stale'); // stale linkage
    refusedWith({ ...c16, marketingBusiness: 'other-biz', app_request_id: randomUUID() }, 'receipt.tenant_mismatch');
    r = apply('apply-receipts', c16);
    expect(r.code, r.err).toBe(0);
    r = apply('apply-receipts', c16); // replay
    expect(r.code, r.err).toBe(0);
    // T-12.4b refusals. App side: a REJECTED approval has no receipt (the C16 linkage fails closed).
    const rejected = queue.payload.items.find((i) => i.approval_id === seed.rejectCamp)!;
    expect(rejected.state).toBe('rejected');
    await expect(recordReceipt(A(), ids.p, binding, { reviewed: true, sourceArtifactId: queue.id, approvalId: seed.rejectCamp, contentHash: rejected.content_hash, actionType: 'campaign_activation',
      executedBy: 'rt-owner', executedAt: new Date(Date.now() - 60000).toISOString(), evidence: { pack_ref: `packs/${seed.rejectCamp}.md` } }, rid())).rejects.toThrow('is rejected, not approved');
    refusedWith({ ...c16, approval_id: seed.rejectCamp, content_hash: rejected.content_hash, app_request_id: randomUUID() }, 'receipt.rejected'); // no pack was ever dispatched
    refusedWith({ ...c16, app_request_id: randomUUID() }, 'receipt.conflict'); // already applied by a different receipt

    await sync('r3');
    const s = await state();
    expect([s.evidence('publish_evidence', seed.taskId), s.evidence('execution_receipt', seed.campaign)]).toEqual(['applied', 'applied']);
    expect([(await queueItem(seed.publish)).state, (await queueItem(seed.campaign)).state]).toEqual(['applied', 'applied']);
    for (const id of [seed.publish, seed.campaign]) expect((await queueItem(id)).content_hash, id).toBe(pendingHash.get(id)); // == applied hash
    expect([s.decision(seed.publish), s.decision(seed.campaign)]).toEqual(['applied', 'applied']); // approved → applied still reconciles
    expect(await boardTask()).toMatchObject({ status: 'published', completion: 'evidence_reviewed', evidence_state: 'applied' });
  }, 180000);

  test('C15 (D10): the outcome lists every DoD criterion; the engine marks the task measured / outcome_verified', async () => {
    const board = (await latestArtifact(ids.a, ids.p, binding, 'C7'))!;
    await expect(recordOutcome(A(), ids.p, binding, { reviewed: true, sourceArtifactId: board.id, taskId: seed.taskId, dodCriteriaMet: seed.dod.slice(0, 1),
      measurement: { measured_values: [{ metric: 'reservations', value: 12, confidence: 'KNOWN' }] } }, rid())).rejects.toThrow('invalid_dod_criteria');
    const out = await recordOutcome(A(), ids.p, binding, { reviewed: true, sourceArtifactId: board.id, taskId: seed.taskId, dodCriteriaMet: seed.dod,
      measurement: { measured_values: [{ metric: 'reservations', value: 12, confidence: 'KNOWN' }] } }, rid());
    // T-12.4b: publication evidence (C6) submitted as an outcome is refused; nothing changes
    const c6 = (await listRecords(ids.a, ids.p, binding)).evidence.find((e) => e.kind === 'publish_evidence')!;
    let r = apply('apply-outcomes', await exported('evidence', c6.id));
    expect(r.code).toBe(1);
    expect((await boardTask()).status).toBe('published');
    r = apply('apply-outcomes', await exported('outcome', out.id));
    expect(r.code, r.err).toBe(0);
    await sync('r4');
    expect((await state()).evidence('outcome_evidence', seed.taskId)).toBe('applied');
    expect(await boardTask()).toMatchObject({ status: 'measured', completion: 'outcome_verified' });
  }, 180000);

  test('C3b: a brain proposal becomes an engine approval; its C2b decision changes the brain; C3a resolves it', async () => {
    const FIELD = 'kitchen_last_order_minutes_before_close';
    const status = (await latestArtifact(ids.a, ids.p, binding, 'C3a'))!;
    const valueHash = status.payload.values['hours.yaml'][FIELD];
    const pr = await recordProposal(A(), ids.p, binding, { sourceArtifactId: status.id, file: 'hours.yaml', path: FIELD, valueHash, old: null, new: 45, reason: 'Kitchen closes orders 45 minutes before close since October', verify: false }, rid());
    let r = apply('apply-proposals', await exported('proposal', pr.id));
    expect(r.code, r.err).toBe(0);
    await sync('r5');
    expect((await state()).evidence('brain_proposal', `hours.yaml#${FIELD}`)).toBe('open'); // the engine took it in as a pending brain_update
    const brainApproval = (await latestArtifact(ids.a, ids.p, binding, 'C2a'))!.payload.items.find((i) => i.action_type === 'brain_update' && i.state === 'pending')!;
    expect(brainApproval).toBeDefined();
    const d = await decide(brainApproval.approval_id, 'approved');
    pendingHash.set(brainApproval.approval_id, brainApproval.content_hash);
    r = apply('apply-decisions', await exported('decision', d.id));
    expect(r.code, r.err).toBe(0);
    r = engine('scripts/apply-decisions.ts', ['--tenant', seed.tenant, brainApproval.approval_id, '--by', 'rt-owner']); // dispatch = brain change
    expect(r.code, r.err).toBe(0);
    await sync('r6');
    const s = await state();
    expect(s.evidence('brain_proposal', `hours.yaml#${FIELD}`)).toBe('resolved');
    expect(s.decision(brainApproval.approval_id)).toBe('applied');
    expect((await queueItem(brainApproval.approval_id))).toMatchObject({ state: 'applied', content_hash: pendingHash.get(brainApproval.approval_id) });
    const brain = (await latestArtifact(ids.a, ids.p, binding, 'C3a'))!.payload;
    expect(brain.values['hours.yaml'][FIELD]).not.toBe(valueHash);
    const hours = () => readFileSync(path.join(ENGINE!, 'businesses', seed.tenant, 'brain', 'hours.yaml'), 'utf8');
    expect(hours()).toMatch(new RegExp(`^${FIELD}: 45$`, 'm'));

    // T-12.4a: the applied brain_update is rolled back on the engine (governed, audited); the next C3a export
    // carries the original value hash again and the app shows the proposal as closed by the engine.
    const { auditId } = helper<{ auditId: string }>('brain-audit', seed.tenant, brainApproval.approval_id);
    r = engine('scripts/rollback.ts', ['--tenant', seed.tenant, auditId]);
    expect(r.code, r.err).toBe(0);
    expect(hours()).toMatch(new RegExp(`^${FIELD}: 30$`, 'm'));
    await sync('r7');
    expect((await latestArtifact(ids.a, ids.p, binding, 'C3a'))!.payload.values['hours.yaml'][FIELD]).toBe(valueHash);
    expect((await state()).evidence('brain_proposal', `hours.yaml#${FIELD}`)).toBe('resolved'); // closed by the engine — never "awaiting" again

    // T-12.4a tenant isolation (SEC01): the engine's own audit over the round-trip tenant's published exports
    r = engine('scripts/audit-tenant-isolation.ts', ['--tenant', seed.tenant]);
    expect(r.code, r.out).toBe(0);
    expect(JSON.parse(r.out)).toMatchObject({ slug: seed.slug, finding_count: 0 });
  }, 180000);
});
