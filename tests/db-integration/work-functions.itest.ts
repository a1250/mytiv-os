import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
vi.mock('../../lib/db', async () => await import('./db-local'));
import { pool } from './db-local';
import { createWorkTask, updateWorkTask, WorkRefusal } from '../../lib/work/commands';
import { readWorkTasks } from '../../lib/work/read';
import { taskFromRow } from '../../lib/focus/adapters/work';

// Mytiv Work functions (0013) on a real PostgreSQL: authorization in the DB, the request ledger, optimistic
// versions, and every Work rule the Focus UI shows — refused by the DB, not only by the client.
const id = () => randomUUID();
const A = id(), B = id(), owner = id(), member = id(), gone = id(), stranger = id(), P1 = id(), P2 = id(), PB = id();
const sA = { businessId: A, userId: owner }, sM = { businessId: A, userId: member };
const refused = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return e instanceof WorkRefusal ? e.code : String(e); } };
const create = async (fields: Record<string, unknown>, scope = sA) => { const r = await createWorkTask(scope, id(), { title: 'T', ...fields } as never); if (!r.ok) throw new Error('create'); return r; };
const version = async (task: string) => Number((await pool.query('select version from tasks where id=$1', [task])).rows[0].version);
const patch = async (task: string, p: Record<string, unknown>, scope = sA) => updateWorkTask(scope, id(), task, await version(task), p as never);

beforeAll(async () => {
  await pool.query(`INSERT INTO businesses(id,name,slug) VALUES ($1::uuid,'A',$1::text),($2::uuid,'B',$2::text)`, [A, B]);
  await pool.query(`INSERT INTO users(id,email,name) VALUES ($1::uuid,$1::text||'@x.invalid','Owner'),($2::uuid,$2::text||'@x.invalid','Member'),($3::uuid,$3::text||'@x.invalid','Gone'),($4::uuid,$4::text||'@x.invalid','Stranger')`, [owner, member, gone, stranger]);
  await pool.query(`INSERT INTO business_memberships(business_id,user_id,role,deactivated_at) VALUES ($1,$2,'owner',null),($1,$3,'member',null),($1,$4,'member',now()),($5,$6,'owner',null)`, [A, owner, member, gone, B, stranger]);
  await pool.query(`INSERT INTO projects(id,business_id,name,client) VALUES ($1,$3,'P1','Client 1'),($2,$3,'P2',null),($4,$5,'PB',null)`, [P1, P2, A, PB, B]);
});
afterAll(async () => { await pool.end(); });

describe('authorization is re-checked inside the DB', () => {
  test('a non-member, a deactivated member and a member of another business are refused', async () => {
    expect(await refused(createWorkTask({ businessId: A, userId: stranger }, id(), { title: 'x' }))).toBe('not_member');
    expect(await refused(createWorkTask({ businessId: A, userId: gone }, id(), { title: 'x' }))).toBe('not_member');
    const t = await create({});
    expect(await refused(updateWorkTask({ businessId: B, userId: stranger }, id(), t.taskId, 1, { title: 'y' }))).toBe('not_found');
  });
  test('an assignee must be an active member of this business', async () => {
    expect(await refused(create({ ownerUserId: stranger }))).toBe('assignee_not_member');
    expect(await refused(create({ ownerUserId: gone }))).toBe('assignee_not_member');
    expect(await refused(create({ projectId: PB }))).toBe('project_not_found');
  });
});

describe('the request ledger', () => {
  test('an exact replay returns the recorded result; a different payload or actor reusing the id is refused', async () => {
    const req = id();
    const first = await createWorkTask(sA, req, { title: 'Ledger' });
    const again = await createWorkTask(sA, req, { title: 'Ledger' });
    expect(again).toEqual({ ...first, replayed: true });
    expect(await refused(createWorkTask(sA, req, { title: 'Other' }))).toBe('request_conflict');
    expect(await refused(createWorkTask(sM, req, { title: 'Ledger' }))).toBe('request_conflict');
    expect((await pool.query(`select count(*)::int n from tasks where business_id=$1 and title='Ledger'`, [A])).rows[0].n).toBe(1);
  });
  test('the ledger and the activity are append-only', async () => {
    expect(await refused(pool.query(`update work_requests set operation='x'`))).toMatch(/append-only|immutable|history/i);
    expect(await refused(pool.query(`update work_events set event='x'`))).toMatch(/append-only|immutable|history/i);
  });
});

describe('optimistic versions', () => {
  test('a write with an old version changes nothing and reports the current version', async () => {
    const t = await create({ title: 'V' });
    const ok = await updateWorkTask(sA, id(), t.taskId, 1, { title: 'V2' });
    expect(ok).toMatchObject({ ok: true, version: 2 });
    const stale = await updateWorkTask(sM, id(), t.taskId, 1, { title: 'mine' });
    expect(stale).toEqual({ ok: false, conflict: true, version: 2 });
    expect((await pool.query('select title from tasks where id=$1', [t.taskId])).rows[0].title).toBe('V2');
  });
});

describe('Work rules enforced by the DB', () => {
  test('a manual block needs a written reason; leaving waiting drops it; the DB refuses a reason off waiting', async () => {
    const t = await create({});
    expect(await refused(patch(t.taskId, { block: { reason: '  ' } }))).toBe('block_reason_required');
    await patch(t.taskId, { block: { reason: 'Waiting for the photographer' } });
    let row = (await pool.query('select status_category, blocked_reason from tasks where id=$1', [t.taskId])).rows[0];
    expect(row).toEqual({ status_category: 'waiting', blocked_reason: 'Waiting for the photographer' });
    await patch(t.taskId, { statusKey: 'in_progress' });
    row = (await pool.query('select status_category, blocked_reason from tasks where id=$1', [t.taskId])).rows[0];
    expect(row).toEqual({ status_category: 'active', blocked_reason: null });
    expect(await refused(pool.query(`update tasks set blocked_reason='x' where id=$1`, [t.taskId]))).toMatch(/tasks_blocked_reason_ck/);
  });
  test('done is refused while a prerequisite or a sub-task is open; reopening under a done parent is refused', async () => {
    const pre = await create({ projectId: P1, title: 'Prerequisite' });
    const t = await create({ projectId: P1 });
    await patch(t.taskId, { addDependency: pre.taskId });
    expect(await refused(patch(t.taskId, { statusKey: 'done' }))).toBe('blocked_by_dependency');
    await patch(pre.taskId, { statusKey: 'done' });
    const parent = await create({ projectId: P1, title: 'Parent' });
    const child = await create({ projectId: P1, parentId: parent.taskId, title: 'Child' });
    expect(await refused(patch(parent.taskId, { statusKey: 'done' }))).toBe('open_children');
    await patch(child.taskId, { statusKey: 'done' });
    await patch(parent.taskId, { statusKey: 'done' });
    expect(await refused(patch(child.taskId, { statusKey: 'todo' }))).toBe('parent_done');
    expect(await patch(t.taskId, { statusKey: 'done' })).toMatchObject({ ok: true });
  });
  test('dependencies: same project only, no cycle, not self', async () => {
    const a = await create({ projectId: P1 }), b = await create({ projectId: P1 }), c = await create({ projectId: P2 });
    expect(await refused(patch(a.taskId, { addDependency: c.taskId }))).toBe('cross_project_dependency_not_supported');
    expect(await refused(patch(a.taskId, { addDependency: a.taskId }))).toBe('dependency_self');
    await patch(a.taskId, { addDependency: b.taskId });
    expect(await refused(patch(b.taskId, { addDependency: a.taskId }))).toBe('dependency_cycle');
  });
  test('dates: start after due is refused; an unknown field is refused; a sub-task of another project is refused', async () => {
    const t = await create({});
    expect(await refused(patch(t.taskId, { startOn: '2026-10-10', dueOn: '2026-10-01' }))).toBe('start_after_due');
    expect(await refused(patch(t.taskId, { status: 'done' }))).toBe('field_not_allowed');
    const p = await create({ projectId: P1 });
    expect(await refused(create({ projectId: P2, parentId: p.taskId }))).toBe('cross_project_parent_not_supported');
  });
});

describe('read model → the Focus contract', () => {
  test('tenant-scoped; maps status, block, dependencies, sub-tasks, participants, writer and activity', async () => {
    const pre = await create({ projectId: P1, title: 'Shoot' });
    const t = await create({ projectId: P1, title: 'Post', ownerUserId: member, dueOn: '2026-10-08' });
    await patch(t.taskId, { addDependency: pre.taskId });
    await patch(t.taskId, { addParticipant: owner }, sM);
    await patch(t.taskId, { block: { reason: 'Client feedback' } }, sM);
    const sub = await create({ projectId: P1, parentId: t.taskId, title: 'Caption' });
    const { tasks } = await readWorkTasks(A);
    const row = tasks.find((x) => x.id === t.taskId)!;
    const task = taskFromRow(row);
    expect(task).toMatchObject({ status: 'waiting', blockedReason: 'Client feedback', assigneeId: member, participantIds: [owner],
      dueDate: '2026-10-08', dependsOn: [{ id: pre.taskId, title: 'Shoot' }], subtasks: [{ id: sub.taskId, title: 'Caption', done: false }],
      context: { client: 'Client 1', project: 'P1' }, source: 'mytiv', state: 'live', spentMinutes: null, updatedBy: member, version: '4' });
    expect(task.activity[0].text).toMatch(/חסימה/);
    expect((await readWorkTasks(B)).tasks.some((x) => x.id === t.taskId)).toBe(false);
  });
});
