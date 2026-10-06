import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
vi.mock('../../lib/db', async () => await import('./db-local'));
import { pool } from './db-local';
import { addWorkComment, createWorkTask, logWorkTime, updateWorkTask, WorkRefusal } from '../../lib/work/commands';
import { readWorkTasks } from '../../lib/work/read';
import { taskFromRow } from '../../lib/focus/adapters/work';

// Comments and logged time (0015) on a real PostgreSQL: authorized in the DB, ledgered, append-only, tenant-scoped,
// and never a version conflict for someone editing the task at the same time.
const id = () => randomUUID();
const A = id(), B = id(), owner = id(), member = id(), gone = id(), stranger = id();
const sO = { businessId: A, userId: owner }, sM = { businessId: A, userId: member };
const code = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return e instanceof WorkRefusal ? e.code : String(e); } };
const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();
let T: string;

beforeAll(async () => {
  await pool.query(`INSERT INTO businesses(id,name,slug) VALUES ($1::uuid,'A',$1::text),($2::uuid,'B',$2::text)`, [A, B]);
  await pool.query(`INSERT INTO users(id,email,name) VALUES ($1::uuid,$1::text||'@x.invalid','Owner'),($2::uuid,$2::text||'@x.invalid','Member'),($3::uuid,$3::text||'@x.invalid','Gone'),($4::uuid,$4::text||'@x.invalid','Stranger')`, [owner, member, gone, stranger]);
  await pool.query(`INSERT INTO business_memberships(business_id,user_id,role,deactivated_at) VALUES ($1,$2,'owner',null),($1,$3,'member',null),($1,$4,'member',now()),($5,$6,'owner',null)`, [A, owner, member, gone, B, stranger]);
  const r = await createWorkTask(sO, id(), { title: 'Task' });
  if (!r.ok) throw new Error('create'); T = r.taskId;
});
afterAll(async () => { await pool.end(); });

describe('comments', () => {
  test('a member comments; the read model and Focus show it; the task version is unchanged', async () => {
    const r = await addWorkComment(sM, id(), T, 'נראה טוב');
    expect(r).toMatchObject({ ok: true, version: 1 });
    const task = taskFromRow((await readWorkTasks(A, T)).tasks[0]);
    expect(task.version).toBe('1');
    expect(task.comments).toEqual([expect.objectContaining({ authorId: member, text: 'נראה טוב' })]);
    expect(task.activity[0].text).toBe('הוסיף/ה תגובה');
  });
  test('a comment never turns a concurrent edit into a conflict', async () => {
    await addWorkComment(sM, id(), T, 'עוד אחת');
    expect(await updateWorkTask(sO, id(), T, 1, { title: 'Task 2' })).toMatchObject({ ok: true, version: 2 });
  });
  test('a replay returns the same comment; another body under the id is refused; empty / too long are refused', async () => {
    const req = id();
    const a = await addWorkComment(sM, req, T, 'פעם אחת');
    const b = await addWorkComment(sM, req, T, 'פעם אחת');
    expect(b).toMatchObject({ ok: true, replayed: true });
    expect((await pool.query(`select count(*)::int n from task_comments where request_id=$1`, [req])).rows[0].n).toBe(1);
    expect(a.ok).toBe(true);
    expect(await code(addWorkComment(sM, req, T, 'אחרת'))).toBe('request_conflict');
    expect(await code(addWorkComment(sM, id(), T, '   '))).toBe('invalid_comment');
    expect(await code(addWorkComment(sM, id(), T, 'x'.repeat(5001)))).toBe('invalid_comment');
  });
  test('a non-member, a deactivated member and another business are refused; comments are append-only', async () => {
    expect(await code(addWorkComment({ businessId: A, userId: stranger }, id(), T, 'x'))).toBe('not_member');
    expect(await code(addWorkComment({ businessId: A, userId: gone }, id(), T, 'x'))).toBe('not_member');
    expect(await code(addWorkComment({ businessId: B, userId: stranger }, id(), T, 'x'))).toBe('not_found');
    expect(await code(pool.query(`update task_comments set body='edited' where task_id=$1`, [T]))).toMatch(/append-only|history/);
  });
});

describe('logged time', () => {
  test('a member logs their own time; the total is known to Focus; the version is unchanged', async () => {
    const v = Number((await pool.query('select version from tasks where id=$1', [T])).rows[0].version);
    await logWorkTime(sM, id(), T, 25, ago(30), 'timer');
    await logWorkTime(sO, id(), T, 15, ago(20), 'manual');
    const task = taskFromRow((await readWorkTasks(A, T)).tasks[0]);
    expect(task.spentMinutes).toBe(40);
    expect(Number(task.version)).toBe(v);
    expect((await pool.query(`select user_id, source from task_time_entries where task_id=$1 order by minutes`, [T])).rows).toEqual([{ user_id: owner, source: 'manual' }, { user_id: member, source: 'timer' }]);
  });
  test('bounds: 1..1440 minutes, not in the future, a known source', async () => {
    expect(await code(logWorkTime(sM, id(), T, 0, ago(1), 'manual'))).toBe('invalid_minutes');
    expect(await code(logWorkTime(sM, id(), T, 1441, ago(1), 'manual'))).toBe('invalid_minutes');
    expect(await code(logWorkTime(sM, id(), T, 10, new Date(Date.now() + 3600000).toISOString(), 'manual'))).toBe('invalid_started_at');
    expect(await code(logWorkTime(sM, id(), T, 10, ago(1), 'guess' as never))).toBe('invalid_source');
  });
  test('a retry with the same request id never logs twice; another business cannot log on this task', async () => {
    const req = id(), at = ago(5); // a retry re-sends the identical payload
    await logWorkTime(sM, req, T, 5, at, 'timer');
    expect(await logWorkTime(sM, req, T, 5, at, 'timer')).toMatchObject({ ok: true, replayed: true });
    expect(await code(logWorkTime(sM, req, T, 6, at, 'timer'))).toBe('request_conflict');
    expect((await pool.query(`select count(*)::int n from task_time_entries where request_id=$1`, [req])).rows[0].n).toBe(1);
    expect(await code(logWorkTime({ businessId: B, userId: stranger }, id(), T, 5, ago(5), 'manual'))).toBe('not_found');
  });
  test('a task without logged time reads as 0 minutes (known), not unknown', async () => {
    const r = await createWorkTask(sO, id(), { title: 'Fresh' });
    if (!r.ok) throw new Error('create');
    expect(taskFromRow((await readWorkTasks(A, r.taskId)).tasks[0]).spentMinutes).toBe(0);
  });
});
