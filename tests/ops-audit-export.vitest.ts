import { expect, test } from 'vitest';
import { buildAuditExport, redact, scanForSecrets, toExportLines } from '../lib/ops-audit-export';

// T-11.2 — owner-only PII-free audit export (MKT-GOV02, GOV07): redaction + fail-closed secret scan.
const at = new Date('2026-01-02T10:00:00.000Z');
const ids = { action: 'a0000000-0000-4000-8000-000000000001', req: '11111111-1111-4111-8111-111111111111', user: '22222222-2222-4222-8222-222222222222' };
const row = (detail: Record<string, unknown>) => ({ id: ids.action, requestId: ids.req, actor: ids.user, action: 'update_task', confirmedAt: at, projectId: 'p1',
  events: [{ event: 'confirmed', detail, at }, { event: 'succeeded', detail: { result: { ok: true }, pre_state: { taskId: '86c1x', dateUpdated: '1789071979105', dueDate: 1789071979105, assigneeIds: [101, 202] } }, at }] });

test('PII is redacted: emails and phone numbers, anywhere in the detail', () => {
  expect(redact({ note: 'call Dana at dana.levi@example.com or +972 50-123-4567, or 050-1234567', nested: [{ who: 'x@y.co' }] })).toEqual({
    note: 'call Dana at [redacted-email] or [redacted-phone], or [redacted-phone]', nested: [{ who: '[redacted-email]' }] });
});

test('secrets are redacted by key name and by token shape', () => {
  expect(redact({ api_key: 'anything', Authorization: 'x', clickupToken: 'y', password: 'p', nested: { session_cookie: 'c' } }))
    .toEqual({ api_key: '[redacted]', Authorization: '[redacted]', clickupToken: '[redacted]', password: '[redacted]', nested: { session_cookie: '[redacted]' } });
  const s = redact({ error: 'failed with Bearer abcdefghijklmnop and sk-live_ABCDEFGHIJKLMNOPQRST and postgresql://u:p@host/db and pk_1234_ABCDEFGHIJKLMNOPQRSTU' }) as { error: string };
  expect(s.error).toBe('failed with [redacted-secret] and [redacted-secret] and [redacted-secret] and [redacted-secret]');
});

test('ids, dates, ClickUp millis and numbers survive intact (no false phone/secret redaction)', () => {
  const [line] = toExportLines([row({ target: { kind: 'task', id: '86c1x' }, approval: { requestId: ids.req, evidence_url: 'https://app.clickup.com/t/86c1x' } })]);
  const parsed = JSON.parse(line);
  expect(parsed).toMatchObject({ action_id: ids.action, request_id: ids.req, actor_id: ids.user, confirmed_at: '2026-01-02T10:00:00.000Z', project_id: 'p1' });
  expect(parsed.events[1].detail.pre_state).toEqual({ taskId: '86c1x', dateUpdated: '1789071979105', dueDate: 1789071979105, assigneeIds: [101, 202] });
  expect(parsed.events[0].detail.approval.evidence_url).toBe('https://app.clickup.com/t/86c1x');
  expect(line).not.toMatch(/\[redacted/);
});

test('the export fails closed: anything secret-shaped that survives redaction means nothing is written', () => {
  expect(scanForSecrets('clean line')).toEqual([]);
  expect(scanForSecrets('{"x":"ghp_ABCDEFGHIJKLMNOPQRSTUVWX"}')).toContain('github token');
  expect(scanForSecrets('{"x":"someone@example.com"}')).toContain('email');
  const ok = buildAuditExport([row({ note: 'token Bearer abcdefghijklmnop, owner dana@example.com' })]);
  expect(ok.ok).toBe(true); // redacted before the scan
  if (ok.ok) { expect(ok.lines).toBe(1); expect(ok.jsonl).not.toMatch(/dana@|Bearer abc/); expect(ok.jsonl.endsWith('\n')).toBe(true); }
  expect(buildAuditExport([])).toEqual({ ok: true, jsonl: '', lines: 0 });
  // redaction rewrites VALUES; a secret or email used as a KEY survives it — the scan catches it and the export is refused
  expect(buildAuditExport([row({ 'dana@example.com': true })])).toEqual({ ok: false, findings: ['email'] });
  expect(buildAuditExport([row({ ['sk-live_' + 'A'.repeat(20)]: 1 })])).toEqual({ ok: false, findings: ['openai/anthropic key'] });
});
