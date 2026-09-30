import { afterAll, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';
vi.mock('../../lib/db', async () => await import('./db-local'));
const scope = { businessId: randomUUID(), userId: randomUUID(), role: 'owner' as string };
vi.mock('../../lib/api-guard', () => ({
  guard: async () => scope,
  ApiGuardError: class extends Error { response = new Response(null, { status: 401 }); },
}));
import { pool } from './db-local';
import { bindMarketing, getMarketingBinding } from '../../lib/marketing/binding-store';
import { recordDecision } from '../../lib/marketing/records';
import { latestArtifact } from '../../lib/marketing/artifacts';
import { openReconciliationOn } from '../../lib/ops-reconciliation';
import * as artifactsRoute from '../../app/api/[businessSlug]/ops/projects/[projectId]/marketing/artifacts/route';
import * as reconcileRoute from '../../app/api/[businessSlug]/ops/actions/[actionId]/reconcile/route';
import type { MarketingBinding } from '../../lib/marketing/binding';

/**
 * GPT review P1-1 — artifact import + reconciliation converge under failure, on a real PostgreSQL through the
 * real route and the real `auditedAction`. Failures are injected with temporary triggers (no test hooks in the
 * code): (1) reconciliation fails after the insert, (2) the process "dies" after the insert (the terminal audit
 * event cannot be written), (3) the write's outcome is unknown. In every case the exact replay of the request
 * converges to ONE artifact, correct reconciliation and an audit that never says "before_write" for a write
 * that committed; a conflicting reuse of the request id is refused.
 */
type Row = Record<string, unknown>;
const project = randomUUID();
const vec = (k: string): Row => JSON.parse(readFileSync(path.join(process.cwd(), `lib/marketing/contracts/${k}.vectors.json`), 'utf8')).valid[0];
const H = 'a'.repeat(64);
const CARD = { title: 'Activate campaign', why: 'fill capacity', action_type: 'campaign_activate', action_class: 'RED', facts_cited: [], qa_verdict: 'NOT_RUN', rollback_note: 'pause it' };
let clock = Date.parse('2026-01-01T00:00:00.000Z');
const queue = (state: string) => ({ ...vec('C2a'), asOf: new Date(clock += 60_000).toISOString(), items: [{ ...CARD, approval_id: 'a1', content_hash: H, state }] });
const params = { params: Promise.resolve({ businessSlug: 'biz', projectId: project }) };
let binding: MarketingBinding;

function post(body: Row) {
  return artifactsRoute.POST(new NextRequest('https://ops.example/api/biz/ops/projects/x/marketing/artifacts', {
    method: 'POST', headers: { origin: 'https://ops.example', 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }), params);
}
const importBody = (payload: Row, requestId = randomUUID()) => ({ confirmed: true, requestId, bindingVersion: binding.bindingVersion, kind: 'C2a', payload });
const artifactsFor = async (requestId: string) => Number((await pool.query(`SELECT count(*) FROM marketing_artifacts WHERE business_id=$1 AND request_id=$2`, [scope.businessId, requestId])).rows[0].count);
const c2aCount = async () => Number((await pool.query(`SELECT count(*) FROM marketing_artifacts WHERE business_id=$1 AND kind='C2a'`, [scope.businessId])).rows[0].count);
const eventsFor = async (requestId: string) => (await pool.query(
  `SELECT e.event, e.detail FROM ops_audit_events e JOIN ops_actions a ON a.id = e.action_id WHERE a.business_id=$1 AND a.request_id=$2 ORDER BY e.created_at, e.id`,
  [scope.businessId, requestId])).rows as { event: string; detail: Row }[];
const decisionState = async () => (await pool.query(`SELECT reconciled_state FROM marketing_decisions WHERE business_id=$1`, [scope.businessId])).rows[0]?.reconciled_state;
const inject = (sql: string) => pool.query(sql);
const heal = () => pool.query(`DROP TRIGGER IF EXISTS itest_fail_decision_update ON marketing_decisions; DROP TRIGGER IF EXISTS itest_fail_succeeded ON ops_audit_events;
  DROP TRIGGER IF EXISTS itest_fail_artifact_insert ON marketing_artifacts; DROP FUNCTION IF EXISTS itest_fail();`);
const FAIL_FN = `CREATE OR REPLACE FUNCTION itest_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'itest_injected_failure'; END $$;`;

beforeAll(async () => {
  process.env.MARKETING_MODULE_ENABLED = 'true';
  await pool.query(`INSERT INTO businesses(id,name,slug) VALUES ($1::uuid,'P1-1',$1::text)`, [scope.businessId]);
  await pool.query(`INSERT INTO users(id,email) VALUES ($1::uuid,$1::text||'@x.invalid')`, [scope.userId]);
  await pool.query(`INSERT INTO business_memberships(business_id,user_id,role) VALUES ($1,$2,'owner')`, [scope.businessId, scope.userId]);
  await pool.query(`INSERT INTO projects(id,business_id,name) VALUES ($1,$2,'P')`, [project, scope.businessId]);
  await bindMarketing(scope, project, 'demo-biz', randomUUID());
  binding = (await getMarketingBinding(scope.businessId, project))!;
  // a pending C2a item with a recorded decision: the next C2a (item approved) must reconcile it to `applied`
  expect((await post(importBody(queue('pending')))).status).toBe(200);
  const src = (await latestArtifact(scope.businessId, project, binding, 'C2a'))!;
  await recordDecision(scope, project, binding, { sourceArtifactId: src.id, approvalId: 'a1', contentHash: H, decision: 'approved', note: 'ok' }, randomUUID());
});
beforeEach(heal);
afterAll(async () => { await heal(); await pool.end(); delete process.env.MARKETING_MODULE_ENABLED; });

test('(1) reconciliation fails after the insert: the import is committed and audited as succeeded; the exact retry converges', async () => {
  await inject(`${FAIL_FN} CREATE TRIGGER itest_fail_decision_update BEFORE UPDATE ON marketing_decisions FOR EACH ROW EXECUTE FUNCTION itest_fail();`);
  const before = await c2aCount();
  const body = importBody(queue('approved'));
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  let res = await post(body);
  spy.mockRestore();
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({ ok: true, revision: 2, reconciled: null, reconciliationPending: true });
  expect(await artifactsFor(body.requestId)).toBe(1);
  expect(await decisionState()).toBeNull(); // not reconciled: the reconciliation after the insert failed
  expect((await eventsFor(body.requestId)).map((e) => e.event)).toEqual(['confirmed', 'succeeded']); // never failed_or_unknown / before_write
  await heal();
  res = await post(body); // the exact same request
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({ ok: true, revision: 2, replayed: true, reconciliationPending: false });
  expect(await artifactsFor(body.requestId)).toBe(1); // no duplicate
  expect(await c2aCount()).toBe(before + 1);
  expect(await decisionState()).toBe('applied'); // reconciliation converged
  expect((await eventsFor(body.requestId)).map((e) => e.event)).toEqual(['confirmed', 'succeeded']);
});

test('(2) the process dies after the insert (terminal audit event never written): the exact retry records the observed write and converges', async () => {
  await inject(`${FAIL_FN} CREATE TRIGGER itest_fail_succeeded BEFORE INSERT ON ops_audit_events FOR EACH ROW WHEN (NEW.event = 'succeeded') EXECUTE FUNCTION itest_fail();`);
  const body = importBody(queue('pending'));
  let res = await post(body);
  expect(res.status).toBe(503);
  expect(await artifactsFor(body.requestId)).toBe(1); // committed
  const afterCrash = (await eventsFor(body.requestId)).map((e) => e.event);
  expect(afterCrash).toEqual(['confirmed']); // no failed_or_unknown(before_write) claiming nothing was written
  await heal();
  res = await post(body);
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({ ok: true, replayed: true, reconciliationPending: false });
  expect(await artifactsFor(body.requestId)).toBe(1);
  const events = await eventsFor(body.requestId);
  expect(events.map((e) => e.event)).toEqual(['confirmed', 'succeeded']);
  expect(events[1]!.detail).toMatchObject({ observed_by: 'readback', replayed: true });
  expect(await decisionState()).toBe('awaiting'); // reconciled against the new latest C2a, where the item is pending again
});

test('(3) a write whose outcome is unknown is recorded as unknown (not before_write), blocks new writes, and the replay readback resolves it', async () => {
  await inject(`${FAIL_FN} CREATE TRIGGER itest_fail_artifact_insert BEFORE INSERT ON marketing_artifacts FOR EACH ROW EXECUTE FUNCTION itest_fail();`);
  const body = importBody(queue('approved'));
  let res = await post(body);
  expect(res.status).toBe(503);
  expect(await artifactsFor(body.requestId)).toBe(0);
  const events = await eventsFor(body.requestId);
  expect(events.map((e) => [e.event, e.detail.phase ?? null])).toEqual([['confirmed', null], ['failed_or_unknown', 'write_outcome_unknown']]);
  await heal();
  expect(await openReconciliationOn(scope.businessId, { kind: 'project', id: project })).not.toBeNull();
  res = await post(importBody(queue('approved'))); // a NEW request is blocked while the outcome is unknown
  expect([res.status, (await res.json()).error]).toEqual([409, 'reconciliation_pending']);
  res = await post(body); // the exact replay: readback says nothing was written → closes the item, still never re-executes
  expect([res.status, (await res.json()).error]).toEqual([409, 'request_already_claimed_check_audit_before_retry']);
  expect((await eventsFor(body.requestId)).at(-1)).toMatchObject({ event: 'reconciled', detail: { observed_state: { artifact: null, written: false } } });
  expect(await openReconciliationOn(scope.businessId, { kind: 'project', id: project })).toBeNull();
  const fresh = importBody(queue('approved'));
  res = await post(fresh);
  expect(res.status).toBe(200);
  expect(await artifactsFor(fresh.requestId)).toBe(1);
  expect(await decisionState()).toBe('applied');
});

test('(3b) the manual reconcile route resolves an unknown import by the same definitive readback', async () => {
  await inject(`${FAIL_FN} CREATE TRIGGER itest_fail_artifact_insert BEFORE INSERT ON marketing_artifacts FOR EACH ROW EXECUTE FUNCTION itest_fail();`);
  const body = importBody(queue('approved'));
  expect((await post(body)).status).toBe(503);
  await heal();
  const actionId = (await pool.query(`SELECT id FROM ops_actions WHERE business_id=$1 AND request_id=$2`, [scope.businessId, body.requestId])).rows[0].id;
  const res = await reconcileRoute.POST(new NextRequest(`https://ops.example/api/biz/ops/actions/${actionId}/reconcile`, {
    method: 'POST', headers: { origin: 'https://ops.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmed: true, requestId: randomUUID(), projectId: project }),
  }), { params: Promise.resolve({ businessSlug: 'biz', actionId }) });
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({ observed_state: { artifact: null, written: false } });
  expect(await openReconciliationOn(scope.businessId, { kind: 'project', id: project })).toBeNull();
});

test('(4) a conflicting reuse of a request id is refused: no second artifact, no audit event appended', async () => {
  const body = importBody(queue('approved'));
  expect((await post(body)).status).toBe(200);
  const events = (await eventsFor(body.requestId)).length;
  for (const reuse of [{ ...body, payload: queue('rejected') }, { ...body, kind: 'C7' }]) {
    const res = await post(reuse);
    expect([res.status, (await res.json()).error]).toEqual([409, 'request_already_claimed_check_audit_before_retry']);
  }
  expect(await artifactsFor(body.requestId)).toBe(1);
  expect((await eventsFor(body.requestId)).length).toBe(events);
});
