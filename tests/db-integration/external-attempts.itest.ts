import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
vi.mock('../../lib/db', async () => await import('./db-local'));
import { pool } from './db-local';
import { admitAttempt, settleAttempt } from '../../lib/external/attempts';
import { WorkRefusal } from '../../lib/work/commands';

// Backend-owned external attempts (0014) on a real PostgreSQL: the UNKNOWN-outcome gate for Gmail / Meta lives in
// the DB, under a per-target lock — not in the browser.
const id = () => randomUUID();
const A = id(), owner = id(), member = id(), stranger = id();
const sO = { businessId: A, userId: owner }, sM = { businessId: A, userId: member };
const code = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return e instanceof WorkRefusal ? e.code : String(e); } };
const detail = async (p: Promise<unknown>) => { try { await p; return null; } catch (e) { return e instanceof WorkRefusal ? e.detail : null; } };
const thread = () => `gmail:thread:${id().slice(0, 8)}`;
const admit = (target: string, unit: string, attested?: string, scope = sM) => admitAttempt(scope, id(), 'gmail_send', target, { unit, draftId: unit }, attested ?? null);

beforeAll(async () => {
  await pool.query(`INSERT INTO businesses(id,name,slug) VALUES ($1::uuid,'A',$1::text)`, [A]);
  await pool.query(`INSERT INTO users(id,email) VALUES ($1::uuid,$1::text||'@x.invalid'),($2::uuid,$2::text||'@x.invalid'),($3::uuid,$3::text||'@x.invalid')`, [owner, member, stranger]);
  await pool.query(`INSERT INTO business_memberships(business_id,user_id,role) VALUES ($1,$2,'owner'),($1,$3,'member')`, [A, owner, member]);
});
afterAll(async () => { await pool.end(); });

describe('the gate', () => {
  test('in flight blocks a new attempt on the target; a confirmed draft is never sent again; a new draft in the thread may go', async () => {
    const t = thread();
    const a = await admit(t, 'd1');
    expect(a).toMatchObject({ admitted: true, attempt: { state: 'in_flight' } });
    expect(await code(admit(t, 'd1'))).toBe('in_flight');
    expect(await code(admit(t, 'd2'))).toBe('in_flight'); // a new draft cannot route around it
    await settleAttempt(A, a.attempt.id, 'confirmed', 'msg-1', null);
    expect(await code(admit(t, 'd1'))).toBe('already_done');
    expect(await code(admit(t, 'd1', a.attempt.id))).toBe('already_done'); // no statement re-sends a confirmed draft
    expect(await admit(t, 'd2')).toMatchObject({ admitted: true });
  });
  test('after UNKNOWN: refused without the target check; a check for another attempt does not count; the check unlocks one attempt and is spent', async () => {
    const t = thread();
    const a = await admit(t, 'd1');
    await settleAttempt(A, a.attempt.id, 'unknown', null, 'provider_timeout');
    expect(await code(admit(t, 'd1'))).toBe('needs_target_check');
    expect(await detail(admit(t, 'd2'))).toEqual({ unknownAttemptId: a.attempt.id }); // a new draft is gated too
    expect(await code(admit(t, 'd1', id()))).toBe('needs_target_check');
    const b = await admit(t, 'd1', a.attempt.id);
    expect(b).toMatchObject({ admitted: true, attempt: { attestedUnknownAttemptId: a.attempt.id, state: 'in_flight' } });
    await settleAttempt(A, b.attempt.id, 'unknown', null, 'network');
    expect(await code(admit(t, 'd1', a.attempt.id))).toBe('needs_target_check'); // the old check is spent
    const c = await admit(t, 'd1', b.attempt.id);
    await settleAttempt(A, c.attempt.id, 'failed', null, 'gmail_refused_400'); // a known failure
    expect(await admit(t, 'd1')).toMatchObject({ admitted: true }); // ordinary retry
  });
  test('an attempt never settled (the server died mid-call) becomes UNKNOWN', async () => {
    const t = thread();
    await pool.query(`INSERT INTO external_attempts(business_id,kind,target,request_id,actor_id,payload_hash,payload,state,created_at) VALUES ($1,'gmail_send',$2,$3,$4,'h','{"unit":"d1"}','in_flight',now() - interval '10 minutes')`, [A, t, id(), member]);
    expect(await code(admit(t, 'd1'))).toBe('needs_target_check');
    expect((await pool.query(`select state, error from external_attempts where target=$1`, [t])).rows[0]).toEqual({ state: 'unknown', error: 'interrupted_before_answer' });
  });
  test('two attempts racing on one target: exactly one is admitted', async () => {
    const t = thread();
    const results = await Promise.all([1, 2, 3].map(() => code(admit(t, 'd1'))));
    expect(results.filter((r) => r === 'ok')).toHaveLength(1);
    expect(results.filter((r) => r === 'in_flight')).toHaveLength(2);
  });
});

describe('the ledger, the rows, the roles', () => {
  test('a replay of the request id returns the same attempt; another payload under the id is refused', async () => {
    const t = thread(), req = id();
    const first = await admitAttempt(sM, req, 'gmail_send', t, { unit: 'd1', draftId: 'd1' }, null);
    const again = await admitAttempt(sM, req, 'gmail_send', t, { unit: 'd1', draftId: 'd1' }, null);
    expect(again).toMatchObject({ admitted: false, replayed: true, attempt: { id: first.attempt.id } });
    expect(await code(admitAttempt(sM, req, 'gmail_send', t, { unit: 'd9', draftId: 'd9' }, null))).toBe('request_conflict');
  });
  test('rows only move forward and never change identity', async () => {
    const t = thread();
    const a = await admit(t, 'd1');
    await settleAttempt(A, a.attempt.id, 'confirmed', 'm', null);
    expect(await code(pool.query(`update external_attempts set state='in_flight' where id=$1`, [a.attempt.id]))).toMatch(/cannot go from confirmed to in_flight/);
    expect(await code(pool.query(`update external_attempts set target='x' where id=$1`, [a.attempt.id]))).toMatch(/append-only/);
    expect((await settleAttempt(A, a.attempt.id, 'failed', null, 'late')).state).toBe('confirmed'); // a late settle changes nothing
  });
  test('a member may send mail; only owners/admins schedule at Meta; a non-member nothing', async () => {
    expect(await code(admitAttempt(sM, id(), 'meta_schedule', 'meta:approval:x', {}, null))).toBe('forbidden');
    expect((await admitAttempt(sO, id(), 'meta_schedule', 'meta:approval:y', {}, null)).admitted).toBe(true);
    expect(await code(admitAttempt({ businessId: A, userId: stranger }, id(), 'gmail_send', thread(), { unit: 'd' }, null))).toBe('not_member');
  });
});
