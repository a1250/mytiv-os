import { afterAll, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
const m = vi.hoisted(() => ({ guard: vi.fn() }));
vi.mock('../../lib/db', async () => await import('./db-local'));
vi.mock('../../lib/api-guard', () => ({ guard: m.guard, ApiGuardError: class extends Error { response = NextResponse.json({ error: 'unauthorized' }, { status: 401 }); } }));
import { pool } from './db-local';
import { POST } from '../../app/api/[businessSlug]/tasks/route';
import { PATCH, DELETE } from '../../app/api/[businessSlug]/tasks/[id]/route';

/**
 * Mytiv Work package 1 on a real Postgres: the legacy tasks API against two businesses. Every refusal is
 * checked in the table itself — no row written, moved, linked across tenants or deleted.
 */
const id = { a: randomUUID(), b: randomUUID(), owner: randomUUID(), member: randomUUID(), ownerB: randomUUID(),
  pa: randomUUID(), pb: randomUUID(), la: randomUUID(), lb: randomUUID(), ta: randomUUID(), tb: randomUUID() };
const ORIGIN = 'https://ops.example';
const as = (business: string, userId: string, role: string) => m.guard.mockResolvedValue({ businessId: business, userId, role });
const req = (method: string, path: string, body?: unknown) => new NextRequest(`${ORIGIN}/api/x/tasks${path}`,
  { method, headers: { origin: ORIGIN, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
const list = { params: Promise.resolve({ businessSlug: 'x' }) };
const one = (task: string) => ({ params: Promise.resolve({ businessSlug: 'x', id: task }) });
const row = async (task: string) => (await pool.query(`SELECT business_id, project_id, lead_id, status, done_at, title FROM tasks WHERE id = $1`, [task])).rows[0];
const count = async (business: string) => Number((await pool.query(`SELECT count(*) FROM tasks WHERE business_id = $1`, [business])).rows[0].count);

beforeAll(async () => {
  await pool.query(`INSERT INTO businesses(id,name,slug) VALUES ($1::uuid,'A',$1::text),($2::uuid,'B',$2::text)`, [id.a, id.b]);
  await pool.query(`INSERT INTO users(id,email) VALUES ($1::uuid,$1::text||'@x.invalid'),($2::uuid,$2::text||'@x.invalid'),($3::uuid,$3::text||'@x.invalid')`, [id.owner, id.member, id.ownerB]);
  await pool.query(`INSERT INTO business_memberships(business_id,user_id,role) VALUES ($1,$2,'owner'),($1,$3,'member'),($4,$5,'owner')`, [id.a, id.owner, id.member, id.b, id.ownerB]);
  await pool.query(`INSERT INTO projects(id,business_id,name) VALUES ($1,$2,'A project'),($3,$4,'B project')`, [id.pa, id.a, id.pb, id.b]);
  await pool.query(`INSERT INTO leads(id,business_id,company) VALUES ($1,$2,'A lead'),($3,$4,'B lead')`, [id.la, id.a, id.lb, id.b]);
  await pool.query(`INSERT INTO tasks(id,business_id,title) VALUES ($1,$2,'A task'),($3,$4,'B task')`, [id.ta, id.a, id.tb, id.b]);
});
beforeEach(() => as(id.a, id.owner, 'owner'));
afterAll(async () => { await pool.end(); });

test('create stores projectId and leadId of the own business (the dropped-projectId bug, on real SQL)', async () => {
  const res = await POST(req('POST', '', { title: 'Follow up', projectId: id.pa, leadId: id.la }), list);
  expect(res.status).toBe(200);
  const created = await res.json();
  expect(await row(created.id)).toMatchObject({ business_id: id.a, project_id: id.pa, lead_id: id.la });
});

test("another business's project or lead is refused on create and update; no row written or linked", async () => {
  const before = await count(id.a);
  expect((await POST(req('POST', '', { title: 'x', projectId: id.pb }), list)).status).toBe(404);
  expect((await POST(req('POST', '', { title: 'x', leadId: id.lb }), list)).status).toBe(404);
  expect(await count(id.a)).toBe(before);
  expect((await PATCH(req('PATCH', `/${id.ta}`, { projectId: id.pb }), one(id.ta))).status).toBe(404);
  expect((await PATCH(req('PATCH', `/${id.ta}`, { leadId: id.lb }), one(id.ta))).status).toBe(404);
  expect(await row(id.ta)).toMatchObject({ business_id: id.a, project_id: null, lead_id: null });
});

test('a body cannot move a task to another business or forge doneAt', async () => {
  expect((await PATCH(req('PATCH', `/${id.ta}`, { businessId: id.b, title: 'moved?' }), one(id.ta))).status).toBe(400);
  expect((await PATCH(req('PATCH', `/${id.ta}`, { doneAt: '2020-01-01T00:00:00Z' }), one(id.ta))).status).toBe(400);
  expect(await row(id.ta)).toMatchObject({ business_id: id.a, title: 'A task', done_at: null });
});

test("another business's task is not found for update or delete, and stays untouched", async () => {
  expect((await PATCH(req('PATCH', `/${id.tb}`, { title: 'hijack' }), one(id.tb))).status).toBe(404);
  expect((await DELETE(req('DELETE', `/${id.tb}`), one(id.tb))).status).toBe(404);
  expect(await row(id.tb)).toMatchObject({ business_id: id.b, title: 'B task' });
});

test('done_at follows the status transition and is not reset by a repeated done', async () => {
  await PATCH(req('PATCH', `/${id.ta}`, { status: 'done' }), one(id.ta));
  const first = (await row(id.ta)).done_at;
  expect(first).toBeInstanceOf(Date);
  await new Promise((r) => setTimeout(r, 20));
  await PATCH(req('PATCH', `/${id.ta}`, { status: 'done' }), one(id.ta));
  expect((await row(id.ta)).done_at).toEqual(first);
  await PATCH(req('PATCH', `/${id.ta}`, { status: 'todo' }), one(id.ta));
  expect((await row(id.ta)).done_at).toBeNull();
});

test('members cannot delete; owners can; a deleted task is then 404', async () => {
  as(id.a, id.member, 'member');
  expect((await DELETE(req('DELETE', `/${id.ta}`), one(id.ta))).status).toBe(403);
  expect(await row(id.ta)).toBeDefined();
  as(id.a, id.owner, 'owner');
  expect((await DELETE(req('DELETE', `/${id.ta}`), one(id.ta))).status).toBe(204);
  expect(await row(id.ta)).toBeUndefined();
  expect((await DELETE(req('DELETE', `/${id.ta}`), one(id.ta))).status).toBe(404);
});

// Mytiv Work expand (0012): every legacy write fills the typed columns in the same statement.
test('dual-write: own-business status row + category, due_on, completed_at, source, version, activity', async () => {
  as(id.a, id.owner, 'owner');
  const created = await (await POST(req('POST', '', { title: 'Dual', dueDate: '2026-11-05' }), list)).json();
  const q = async () => (await pool.query(`SELECT t.status_category, t.due_on::text AS due_on, t.completed_at, t.source, t.version, t.last_activity_at,
      s.key AS status_key, s.business_id AS status_business FROM tasks t LEFT JOIN work_statuses s ON s.id = t.status_id WHERE t.id = $1`, [created.id])).rows[0];
  expect(await q()).toMatchObject({ status_key: 'todo', status_category: 'open', status_business: id.a, due_on: '2026-11-05', completed_at: null, source: 'manual', version: 1 });
  expect((await q()).last_activity_at).toBeInstanceOf(Date);
  await PATCH(req('PATCH', `/${created.id}`, { status: 'done', dueDate: '' }), one(created.id));
  const done = await q();
  expect(done).toMatchObject({ status_key: 'done', status_category: 'done', due_on: null, version: 2 });
  expect(done.completed_at).toBeInstanceOf(Date);
  await PATCH(req('PATCH', `/${created.id}`, { status: 'done' }), one(created.id));
  expect((await q()).completed_at).toEqual(done.completed_at); // a repeated 'done' keeps the first completion
  await PATCH(req('PATCH', `/${created.id}`, { status: 'in_progress' }), one(created.id));
  expect(await q()).toMatchObject({ status_key: 'in_progress', status_category: 'active', completed_at: null, version: 4 });
});
