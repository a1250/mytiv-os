import { describe, expect, test } from 'vitest';
import { sendRefusalText, sendStatus, type MailAttempt } from '../lib/focus/adapters/mail';

// Business mail: the thread's persisted attempts (newest first) decide what the person is told — "sent" only on a
// Gmail-confirmed attempt, and UNKNOWN carries the attempt id the target check must name.
const a = (state: MailAttempt['state'], id = state): MailAttempt => ({ id, state, error: null, providerRef: null, createdAt: '2026-10-06T10:00:00.000Z', settledAt: state === 'in_flight' ? null : '2026-10-06T10:00:02.000Z' });

describe('sendStatus', () => {
  test('nothing sent yet', () => expect(sendStatus([])).toEqual({ kind: 'none' }));
  test('"sent" only when Gmail confirmed the newest attempt', () => {
    expect(sendStatus([a('confirmed')]).kind).toBe('sent');
    expect(sendStatus([a('in_flight'), a('confirmed', 'c0')]).kind).toBe('in_flight');
    expect(sendStatus([a('failed'), a('confirmed', 'c0')]).kind).toBe('failed');
  });
  test('UNKNOWN names the attempt the target check must refer to — the newest, not an older one', () => {
    expect(sendStatus([a('unknown', 'u2'), a('unknown', 'u1')])).toMatchObject({ kind: 'unknown', unknownAttemptId: 'u2' });
  });
  test('every gate refusal is explained; unknown codes fall back without claiming success', () => {
    for (const code of ['in_flight', 'already_done', 'needs_target_check']) expect(sendRefusalText(code)).not.toBe('השליחה לא התבצעה.');
    expect(sendRefusalText('whatever')).toBe('השליחה לא התבצעה.');
  });
});
