import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
vi.mock('../../lib/db', async () => await import('./db-local'));
import { pool } from './db-local';
import { bindMarketing, getMarketingBinding, revokeMarketing } from '../../lib/marketing/binding-store';
import { importPlan, latestPlan, previousBindingPlans } from '../../lib/marketing/service';

const c1 = JSON.parse(readFileSync(path.join(process.cwd(), 'lib/marketing/contracts/C1.vectors.json'), 'utf8')).valid[0];
const ids = { a: randomUUID(), owner: randomUUID(), p: randomUUID() };
const scope = () => ({ businessId: ids.a, userId: ids.owner });
beforeAll(async () => {
  await pool.query(`INSERT INTO businesses(id,name,slug) VALUES ($1::uuid,'A',$1::text)`, [ids.a]);
  await pool.query(`INSERT INTO users(id,email) VALUES ($1::uuid,$1::text||'@x.invalid')`, [ids.owner]);
  await pool.query(`INSERT INTO business_memberships(business_id,user_id,role) VALUES ($1,$2,'owner')`, [ids.a, ids.owner]);
  await pool.query(`INSERT INTO projects(id,business_id,name) VALUES ($1,$2,'P')`, [ids.p, ids.a]);
});
afterAll(async () => { await pool.end(); });

test('import → revoke → rebind → import: revisions restart per binding version; history is labelled (T-2.3)', async () => {
  await bindMarketing(scope(), ids.p, c1.marketingBusiness, randomUUID());
  const v1 = (await getMarketingBinding(ids.a, ids.p))!;
  expect(v1.bindingVersion).toBe(1);
  expect(await importPlan(ids.a, ids.p, ids.owner, { ...c1, revision: 1 }, v1)).toEqual({ ok: true, revision: 1, bindingVersion: 1 });
  expect(await importPlan(ids.a, ids.p, ids.owner, { ...c1, revision: 2 }, v1)).toMatchObject({ revision: 2 });
  expect((await latestPlan(ids.a, ids.p, v1))?.revision).toBe(2);
  await revokeMarketing(scope(), ids.p, randomUUID());
  // a late import confirmed against the revoked v1 is refused by the database, as a conflict (not an outage)
  await expect(importPlan(ids.a, ids.p, ids.owner, { ...c1, revision: 3 }, v1)).rejects.toMatchObject({ message: 'stale_binding_version', status: 409 });
  await bindMarketing(scope(), ids.p, c1.marketingBusiness, randomUUID());
  const v2 = (await getMarketingBinding(ids.a, ids.p))!;
  expect(v2.bindingVersion).toBe(2);
  expect(await latestPlan(ids.a, ids.p, v2)).toBeNull(); // v1 plans are history, not the current plan
  expect(await importPlan(ids.a, ids.p, ids.owner, { ...c1, revision: 1 }, v2)).toEqual({ ok: true, revision: 1, bindingVersion: 2 });
  expect((await latestPlan(ids.a, ids.p, v2))?.revision).toBe(1);
  expect((await previousBindingPlans(ids.a, ids.p, 2)).map(p => `${p.bindingVersion}:${p.revision}`)).toEqual(['1:2', '1:1']);
  await expect(importPlan(ids.a, ids.p, ids.owner, { ...c1, revision: 5 }, v1)).rejects.toMatchObject({ message: 'stale_binding_version', status: 409 });
});
