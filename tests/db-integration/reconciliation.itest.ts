import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
vi.mock('../../lib/db', async () => await import('./db-local'));
import { pool } from './db-local';
import { openReconciliationOn } from '../../lib/ops-reconciliation';

// T-11.3 — the open-item lookup on a real Postgres (JSONB target match, tenant scope, `reconciled` closes it).
const ids = { a: randomUUID(), b: randomUUID(), u: randomUUID(), v: randomUUID(), p: randomUUID(), q: randomUUID() };
async function action(business: string, user: string, project: string, events: [string, Record<string, unknown>][]) {
  const { rows } = await pool.query(`INSERT INTO ops_actions(business_id,user_id,project_id,request_id,action,payload_hash) VALUES ($1,$2,$3,$4,'update_task','h') RETURNING id`, [business, user, project, randomUUID()]);
  for (const [i, [event, detail]] of events.entries()) {
    await pool.query(`INSERT INTO ops_audit_events(business_id,action_id,event,detail,created_at) VALUES ($1,$2,$3,$4,now() + ($5 || ' seconds')::interval)`, [business, rows[0].id, event, JSON.stringify(detail), String(i)]);
  }
  return rows[0].id as string;
}
beforeAll(async () => {
  await pool.query(`INSERT INTO businesses(id,name,slug) VALUES ($1::uuid,'A',$1::text),($2::uuid,'B',$2::text)`, [ids.a, ids.b]);
  await pool.query(`INSERT INTO users(id,email) VALUES ($1::uuid,$1::text||'@x.invalid'),($2::uuid,$2::text||'@x.invalid')`, [ids.u, ids.v]);
  await pool.query(`INSERT INTO business_memberships(business_id,user_id,role) VALUES ($1,$2,'owner'),($3,$4,'owner')`, [ids.a, ids.u, ids.b, ids.v]);
  await pool.query(`INSERT INTO projects(id,business_id,name) VALUES ($1,$2,'P'),($3,$4,'Q')`, [ids.p, ids.a, ids.q, ids.b]);
});
afterAll(async () => { await pool.end(); });

test('openReconciliationOn: unknown outcome on the exact target, same business, until reconciled', async () => {
  const t1 = { kind: 'task', id: 'task-1' };
  await action(ids.a, ids.u, ids.p, [['confirmed', { target: t1 }], ['succeeded', { result: { ok: true } }]]);
  await action(ids.a, ids.u, ids.p, [['confirmed', { target: t1 }], ['failed_or_unknown', { phase: 'before_write' }]]); // known: nothing sent
  expect(await openReconciliationOn(ids.a, t1)).toBeNull();
  const unknown = await action(ids.a, ids.u, ids.p, [['confirmed', { target: t1 }], ['failed_or_unknown', { phase: 'write_outcome_unknown' }]]);
  expect(await openReconciliationOn(ids.a, t1)).toEqual({ actionId: unknown });
  expect(await openReconciliationOn(ids.a, { kind: 'task', id: 'task-2' })).toBeNull(); // another target
  expect(await openReconciliationOn(ids.a, { kind: 'action', id: 'task-1' })).toBeNull(); // same id, another kind
  expect(await openReconciliationOn(ids.b, t1)).toBeNull(); // another business
  await pool.query(`INSERT INTO ops_audit_events(business_id,action_id,event,detail,created_at) VALUES ($1,$2,'reconciled','{"observed_state":{}}',now() + interval '10 seconds')`, [ids.a, unknown]);
  expect(await openReconciliationOn(ids.a, t1)).toBeNull();
});
