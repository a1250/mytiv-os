import { afterAll, beforeAll, expect, test } from 'vitest';
import { randomUUID } from 'node:crypto';
import { pool } from './db-local';
import { backfillRemaining, runBackfill } from '../../lib/work/backfill';

/**
 * Mytiv Work PR 4 on real Postgres. Legacy rows are inserted the way pre-0012 rows look (typed columns NULL).
 * Unknown-status rows sort FIRST and outnumber the batch size: the run must still reach the mappable rows.
 */
const biz = randomUUID();
const tid = (n: number) => `${String(n).padStart(8, '0')}-0000-4000-8000-${biz.slice(-12)}`; // ordered ids
const run = async (text: string, params: unknown[]) => ({ rowCount: (await pool.query(text, params)).rowCount ?? 0 });
const read = async (text: string): Promise<Record<string, unknown>[]> => (await pool.query(text)).rows;
const row = async (n: number) => (await pool.query(`SELECT t.status, t.status_category, s.key AS status_key, t.due_date, t.due_on::text AS due_on, t.done_at, t.completed_at,
  t.last_activity_at, t.updated_at, t.version FROM tasks t LEFT JOIN work_statuses s ON s.id = t.status_id WHERE t.id = $1`, [tid(n)])).rows[0];
const fingerprint = async () => (await pool.query(`SELECT md5(string_agg(concat_ws('|',id,status,priority,due_date,done_at,updated_at,title),'#' ORDER BY id)) AS f FROM tasks WHERE business_id = $1`, [biz])).rows[0].f;

beforeAll(async () => {
  await pool.query(`INSERT INTO businesses(id,name,slug) VALUES ($1::uuid,'Backfill',$1::text)`, [biz]); // statuses copied by the 0012 trigger
  const legacy = (n: number, status: string, due: string | null, doneAt: string | null) =>
    pool.query(`INSERT INTO tasks(id,business_id,title,status,due_date,done_at,updated_at) VALUES ($1,$2,'legacy',$3,$4,$5,'2026-01-0${(n % 9) + 1}T10:00:00Z')`, [tid(n), biz, status, due, doneAt]);
  for (const n of [1, 2, 3]) await legacy(n, `Weird ${n}`, null, null);          // unknown statuses, first in id order
  await legacy(10, 'todo', '2026-10-08', null);
  await legacy(11, 'done', '2026-02-30', '2026-03-01T09:00:00Z');                 // impossible date; done with done_at
  await legacy(12, 'done', null, null);                                           // done without done_at
  await legacy(13, 'in_progress', '08/10/2026', null);                            // wrong format
  await legacy(14, 'waiting', '', null);
  await legacy(16, 'todo', '2026-06-06', null);                                   // valid date sorted AFTER the invalid ones
  // Already dual-written by the app (status row 'review' although legacy says todo; due_on set): must not be overwritten.
  await legacy(15, 'todo', '2026-12-01', null);
  await pool.query(`UPDATE tasks SET status_id = (SELECT id FROM work_statuses WHERE business_id = $2 AND key = 'review'), status_category = 'review', due_on = '2027-12-31' WHERE id = $1`, [tid(15), biz]);
});
afterAll(async () => { await pool.end(); });

test('fills only NULLs, reaches mappable rows behind a full batch of unmappable ones, never touches legacy values or version', async () => {
  const before = await fingerprint();
  await runBackfill(run, 2);
  expect(await fingerprint()).toBe(before);
  expect(await row(10)).toMatchObject({ status_key: 'todo', status_category: 'open', due_on: '2026-10-08', completed_at: null, version: 1 });
  expect(await row(11)).toMatchObject({ status_key: 'done', status_category: 'done', due_on: null, version: 1 });
  expect((await row(11)).completed_at).toEqual((await row(11)).done_at);
  expect(await row(12)).toMatchObject({ status_key: 'done', completed_at: null });
  expect(await row(13)).toMatchObject({ status_key: 'in_progress', status_category: 'active', due_on: null });
  expect(await row(14)).toMatchObject({ status_key: 'waiting', due_on: null });
  expect(await row(15)).toMatchObject({ status_key: 'review', status_category: 'review', due_on: '2027-12-31' }); // dual-write kept
  expect(await row(16)).toMatchObject({ due_on: '2026-06-06' }); // a batch of invalid dates must not end the due_on step
  for (const n of [1, 2, 3]) expect(await row(n)).toMatchObject({ status_key: null, status_category: null });
  expect((await row(10)).last_activity_at).toEqual((await row(10)).updated_at);
});

test('reports what is left by task id only, and a second run changes nothing', async () => {
  expect(await runBackfill(run, 2)).toEqual({ status: 0, dueOn: 0, completedAt: 0, lastActivity: 0 });
  const left = await backfillRemaining(read);
  for (const n of [1, 2, 3]) expect(left.taskIds.unknownStatus).toContain(tid(n));
  expect(left.taskIds.invalidDueDate).toEqual(expect.arrayContaining([tid(11), tid(13)]));
  expect(left.taskIds.invalidDueDate).not.toContain(tid(14)); // '' is "no date", not invalid
  expect(left.taskIds.doneWithoutDoneAt).toContain(tid(12));
  expect(JSON.stringify(left)).not.toMatch(/Weird|08\/10\/2026|2026-02-30/); // ids and counts only
});

test('a row being edited by the app is waited for, then not overwritten with the stale legacy value', async () => {
  await pool.query(`UPDATE tasks SET due_on = NULL, due_date = '2026-05-05' WHERE id = $1`, [tid(10)]); // pretend not yet backfilled
  const app = await pool.connect();
  try {
    await app.query('BEGIN');
    await app.query(`UPDATE tasks SET due_date = '2027-01-01', due_on = '2027-01-01' WHERE id = $1`, [tid(10)]); // dual-write, still open
    const backfill = runBackfill(run, 2);
    await new Promise((r) => setTimeout(r, 200));
    await app.query('COMMIT');
    await backfill;
  } finally { app.release(); }
  expect(await row(10)).toMatchObject({ due_date: '2027-01-01', due_on: '2027-01-01' });
});

test('batch size is bounded', async () => {
  await expect(runBackfill(run, 0)).rejects.toThrow('invalid batch size');
  await expect(runBackfill(run, 100_000)).rejects.toThrow('invalid batch size');
});
