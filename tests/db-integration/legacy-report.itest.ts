import { afterAll, beforeAll, expect, test } from 'vitest';
import { randomUUID } from 'node:crypto';
import { pool } from './db-local';
import { LEGACY_REPORT_QUERIES, summarizeLegacyReport, type LegacyReportQuery, type LegacyReportRows } from '../../lib/work/legacy-report';

/**
 * Mytiv Work PR 2 on a real Postgres: the legacy report counts every kind of bad row the plan worries about,
 * runs inside a READ ONLY transaction (a write in it is refused by Postgres), and never prints a free-text value.
 * Runs in its own database schema state: it reads the whole table, so it compares deltas against a baseline.
 */
const id = { a: randomUUID(), b: randomUUID(), u: randomUUID(), pa: randomUUID(), pb: randomUUID(), la: randomUUID(), lb: randomUUID() };
const SECRET = 'Client Secret Pty Ltd — private';
async function report() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const names = Object.keys(LEGACY_REPORT_QUERIES) as LegacyReportQuery[];
    const rows = {} as LegacyReportRows;
    for (const n of names) rows[n] = (await client.query(LEGACY_REPORT_QUERIES[n])).rows;
    await client.query('COMMIT');
    return summarizeLegacyReport(rows);
  } finally { client.release(); }
}
let base: Awaited<ReturnType<typeof report>>;
beforeAll(async () => {
  base = await report();
  await pool.query(`INSERT INTO businesses(id,name,slug) VALUES ($1::uuid,'A',$1::text),($2::uuid,'B',$2::text)`, [id.a, id.b]);
  await pool.query(`INSERT INTO users(id,email) VALUES ($1::uuid,$1::text||'@x.invalid')`, [id.u]);
  await pool.query(`INSERT INTO business_memberships(business_id,user_id,role) VALUES ($1,$2,'superuser')`, [id.a, id.u]);
  await pool.query(`INSERT INTO projects(id,business_id,name) VALUES ($1,$2,'A'),($3,$4,'B')`, [id.pa, id.a, id.pb, id.b]);
  await pool.query(`INSERT INTO leads(id,business_id,company) VALUES ($1,$2,'A'),($3,$4,'B')`, [id.la, id.a, id.lb, id.b]);
  // Legacy rows exactly as the old unvalidated API could have stored them.
  await pool.query(`INSERT INTO tasks(business_id,title,status,priority,due_date,project_id,lead_id,done_at,category) VALUES
    ($1,'ok','todo','medium','2026-10-08',$2,$4,null,''),
    ($1,'cross project','todo','medium',null,$3,null,null,''),
    ($1,'cross lead','todo','medium',null,null,$5,null,''),
    ($1,'missing project','todo','medium',null,$6,null,null,''),
    ($1,'bad date','todo','medium','2026-02-30',null,null,null,''),
    ($1,'bad date 2','todo','medium','08/10/2026',null,null,null,''),
    ($1,'secret status',$7,'p0',null,null,null,null,$7),
    ($1,'done no done_at','done','low',null,null,null,null,'')`, [id.a, id.pa, id.pb, id.la, id.lb, randomUUID(), SECRET]);
});
afterAll(async () => { await pool.end(); });

test('counts every class of legacy defect the validate step must not trip over', async () => {
  const r = await report();
  const d = (path: (x: typeof r) => number) => path(r) - path(base);
  expect(d((x) => x.totals.tasks)).toBe(8);
  expect(d((x) => x.projectLinks.same_business)).toBe(1);
  expect(d((x) => x.projectLinks.other_business)).toBe(1);
  expect(d((x) => x.projectLinks.missing)).toBe(1);
  expect(d((x) => x.leadLinks.same_business)).toBe(1);
  expect(d((x) => x.leadLinks.other_business)).toBe(1);
  expect(d((x) => x.dueDate.invalid)).toBe(2);
  expect(d((x) => x.dueDate.valid)).toBe(1);
  expect(d((x) => x.status.unknownTotal)).toBe(1);
  expect(d((x) => x.priority.unknownTotal)).toBe(1);
  expect(d((x) => x.doneAt.done_without_done_at)).toBe(1);
  expect(d((x) => x.memberships.unknownTotal)).toBe(1);
  expect(r.findings.readyForValidate).toBe(false);
  expect(r.findings.blocking.join('\n')).toMatch(/ANOTHER business's project/);
  expect(r.findings.blocking.join('\n')).toMatch(/not a real YYYY-MM-DD/);
});

test('no free-text value leaves the database: unknown values are hashes with a length', async () => {
  const text = JSON.stringify(await report());
  expect(text).not.toContain('Client Secret');
  expect(text).not.toContain('superuser');
  expect(text).not.toContain('p0"');
  expect(text).toMatch(/sha256:[0-9a-f]{12} \(length 31\)/);
});

test('the report transaction is READ ONLY: Postgres refuses a write inside it', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    await expect(client.query(`DELETE FROM tasks WHERE business_id = $1`, [id.a])).rejects.toThrow(/read-only transaction/);
    await client.query('ROLLBACK');
  } finally { client.release(); }
  expect(Number((await pool.query(`SELECT count(*) FROM tasks WHERE business_id = $1`, [id.a])).rows[0].count)).toBe(8);
});
