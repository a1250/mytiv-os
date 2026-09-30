import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
vi.mock('../../lib/db', async () => await import('./db-local'));
import { pool } from './db-local';
import { listBusinessAudit } from '../../lib/db/queries/ops-audit';

// T-11.1 — the business-wide audit query on a real Postgres: tenant-scoped, project-joined, newest first.
const ids = { a: randomUUID(), b: randomUUID(), u: randomUUID(), v: randomUUID(), p: randomUUID(), p2: randomUUID(), q: randomUUID() };
const claim = async (business: string, user: string, project: string, action: string, at: string) => {
  const { rows } = await pool.query(`INSERT INTO ops_actions(business_id,user_id,project_id,request_id,action,payload_hash,created_at) VALUES ($1,$2,$3,$4,$5,'h',$6) RETURNING id`,
    [business, user, project, randomUUID(), action, at]);
  await pool.query(`INSERT INTO ops_audit_events(business_id,action_id,event,detail,created_at) VALUES ($1,$2,'confirmed','{}',$3),($1,$2,'succeeded','{"result":{"ok":true}}',$3::timestamptz + interval '1 second')`, [business, rows[0].id, at]);
  return rows[0].id as string;
};
beforeAll(async () => {
  await pool.query(`INSERT INTO businesses(id,name,slug) VALUES ($1::uuid,'A',$1::text),($2::uuid,'B',$2::text)`, [ids.a, ids.b]);
  await pool.query(`INSERT INTO users(id,email) VALUES ($1::uuid,$1::text||'@x.invalid'),($2::uuid,$2::text||'@x.invalid')`, [ids.u, ids.v]);
  await pool.query(`INSERT INTO business_memberships(business_id,user_id,role) VALUES ($1,$2,'owner'),($3,$4,'owner')`, [ids.a, ids.u, ids.b, ids.v]);
  await pool.query(`INSERT INTO projects(id,business_id,name) VALUES ($1,$2,'UMINO'),($3,$2,'TALA'),($4,$5,'Other')`, [ids.p, ids.a, ids.p2, ids.q, ids.b]);
});
afterAll(async () => { await pool.end(); });

test('listBusinessAudit: only this business, every project, newest first, with project names and events', async () => {
  const older = await claim(ids.a, ids.u, ids.p, 'update_task', '2026-01-01T10:00:00Z');
  const newer = await claim(ids.a, ids.u, ids.p2, 'marketing_record_decision', '2026-01-02T10:00:00Z');
  await claim(ids.b, ids.v, ids.q, 'update_task', '2026-01-03T10:00:00Z'); // another business
  const rows = await listBusinessAudit(ids.a);
  expect(rows.map((r) => r.id)).toEqual([newer, older]);
  expect(rows.map((r) => r.projectName)).toEqual(['TALA', 'UMINO']);
  expect(rows[0].events.map((e) => e.event)).toEqual(['confirmed', 'succeeded']);
  expect(await listBusinessAudit(ids.b)).toHaveLength(1);
  expect((await listBusinessAudit(ids.a, 1)).map((r) => r.id)).toEqual([newer]);
});
