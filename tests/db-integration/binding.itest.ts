import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
vi.mock('../../lib/db', async () => await import('./db-local'));
import { pool } from './db-local';
import { bindMarketing, getMarketingBinding, revokeMarketing } from '../../lib/marketing/binding-store';

const ids = { a: randomUUID(), b: randomUUID(), owner: randomUUID(), admin: randomUUID(), p: randomUUID(), q: randomUUID() };
beforeAll(async () => {
  await pool.query(`INSERT INTO businesses(id,name,slug) VALUES ($1::uuid,'A',$1::text),($2::uuid,'B',$2::text)`, [ids.a, ids.b]);
  await pool.query(`INSERT INTO users(id,email) VALUES ($1::uuid,$1::text||'@x.invalid'),($2::uuid,$2::text||'@x.invalid')`, [ids.owner, ids.admin]);
  await pool.query(`INSERT INTO business_memberships(business_id,user_id,role) VALUES ($1,$2,'owner'),($1,$3,'admin')`, [ids.a, ids.owner, ids.admin]);
  await pool.query(`INSERT INTO projects(id,business_id,name) VALUES ($1,$2,'P'),($3,$4,'Q')`, [ids.p, ids.a, ids.q, ids.b]);
});
afterAll(async () => { await pool.end(); });
const owner = () => ({ businessId: ids.a, userId: ids.owner });
const expectPolicy = async (p: Promise<unknown>, message: string, status: number) => {
  await expect(p).rejects.toMatchObject({ message, status });
};

test('binding-store against a real Postgres with migration 0008 (owner decision D2)', async () => {
  expect(await getMarketingBinding(ids.a, ids.p)).toBeNull();
  expect(await bindMarketing(owner(), ids.p, 'umino', randomUUID())).toEqual({ ok: true, marketingBusiness: 'umino', bindingVersion: 1 });
  expect(await getMarketingBinding(ids.a, ids.p)).toEqual({ marketingBusiness: 'umino', bindingVersion: 1 });
  await expectPolicy(bindMarketing({ businessId: ids.a, userId: ids.admin }, ids.p, 'tala', randomUUID()), 'binding_owner_required', 403);
  await expectPolicy(bindMarketing(owner(), ids.p, 'umino', randomUUID()), 'binding_unchanged', 409);
  await expectPolicy(bindMarketing(owner(), ids.q, 'umino', randomUUID()), 'not_found', 404); // project of business B
  await expectPolicy(bindMarketing(owner(), ids.p, 'Bad Slug', randomUUID()), 'invalid_marketing_business', 400);
  const rid = randomUUID();
  expect(await revokeMarketing(owner(), ids.p, rid)).toEqual({ ok: true, revoked: true, bindingVersion: 1 });
  expect(await getMarketingBinding(ids.a, ids.p)).toBeNull(); // revoked → not connected
  await expectPolicy(revokeMarketing(owner(), ids.p, randomUUID()), 'binding_not_bound', 409);
  await expectPolicy(bindMarketing(owner(), ids.p, 'tala', rid), 'request_already_claimed_check_audit_before_retry', 409); // replayed request id
  expect(await getMarketingBinding(ids.a, ids.p)).toBeNull(); // failed replay changed nothing
  expect((await bindMarketing(owner(), ids.p, 'tala', randomUUID())).bindingVersion).toBe(2);
  expect(await getMarketingBinding(ids.a, ids.p)).toEqual({ marketingBusiness: 'tala', bindingVersion: 2 });
  expect(await getMarketingBinding(ids.b, ids.p)).toBeNull(); // another business never sees it
  const events = await pool.query(`SELECT event, binding_version, marketing_business FROM marketing_binding_events WHERE business_id=$1 ORDER BY created_at, binding_version`, [ids.a]);
  expect(events.rows.map((r: { event: string; binding_version: number; marketing_business: string }) => `${r.event}${r.binding_version}:${r.marketing_business}`)).toEqual(['bind1:umino', 'revoke1:umino', 'bind2:tala']);
});

test('a database failure reads as "not connected" (fail closed)', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  await pool.query(`ALTER TABLE marketing_bindings RENAME TO marketing_bindings_gone`);
  try { expect(await getMarketingBinding(ids.a, ids.p)).toBeNull(); }
  finally { await pool.query(`ALTER TABLE marketing_bindings_gone RENAME TO marketing_bindings`); spy.mockRestore(); }
});
