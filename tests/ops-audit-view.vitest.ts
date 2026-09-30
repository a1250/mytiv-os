import { expect, test, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('../components/ui/toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
import { UnifiedAudit, type BusinessAuditRow } from '../components/ops/unified-audit';
import { actionLabel, canRollBack, outcome, refusalReason, resultSummary } from '../lib/ops-audit-view';

// T-11.1 — unified audit (MKT-GOV02..04, GOV07): derivations + what the page shows, to whom.
const at = (s: string) => new Date(`2026-01-0${s}T10:00:00Z`);
const snap = (status: string) => ({ status, assigneeIds: [1], dueDate: null });
const row = (id: string, action: string, events: { event: string; detail: Record<string, unknown> }[]): BusinessAuditRow => ({
  id, requestId: `req-${id}`, actor: 'user-1', action, confirmedAt: at('2'), projectId: 'p1', projectName: 'UMINO',
  events: events.map((e, i) => ({ ...e, at: at(String(2 + i)) })),
});
const task = row('a-task', 'update_task', [{ event: 'confirmed', detail: { rollback_eligibility: 'eligible' } },
  { event: 'succeeded', detail: { result: { ok: true }, pre_state: snap('open'), post_state: snap('in review') } }]);
const decision = row('a-dec', 'marketing_record_decision', [{ event: 'confirmed', detail: { rollback_eligibility: { not: 'not_a_task_update' } } },
  { event: 'succeeded', detail: { result: { ok: true, kind: 'decision', id: 'd0c1s10n-0000', payload: { note: 'x' } } } }]);
const refused = row('a-ref', 'marketing_record_receipt', [{ event: 'confirmed', detail: {} },
  { event: 'failed_or_unknown', detail: { phase: 'before_write', error: 'OpsPolicyError' } }]);
const rolled = row('a-rb', 'update_task', [...task.events.map(({ event, detail }) => ({ event, detail })), { event: 'rolled_back', detail: { by_request_id: 'x' } }]);

test('derivations: outcome, rollback eligibility, refusal reason, marketing result summary', () => {
  expect(outcome(task)).toBe('succeeded');
  expect(outcome(refused)).toBe('failed_or_unknown (before_write)');
  expect(canRollBack(task)).toBe(true);
  expect(canRollBack(decision)).toBe(false); // marketing writes are not task updates
  expect(canRollBack(rolled)).toBe(false); // already reversed
  expect(refusalReason(task)).toBeNull();
  expect(refusalReason(refused)).toBe('OpsPolicyError');
  expect(resultSummary(decision)).toBe('decision · record d0c1s10n');
  expect(actionLabel('marketing_record_decision')).toBe('החלטת אישור');
  expect(actionLabel('something_new')).toBe('something_new');
});

test('the page lists Ops and marketing writes with project, outcome, before→after, reason, actor and request', () => {
  const h = renderToStaticMarkup(createElement(UnifiedAudit, { businessSlug: 'mytiv', rows: [task, decision, refused], canWrite: true }));
  expect(h).toContain('עדכון משימה ב־ClickUp · UMINO');
  expect(h).toContain('before: status open');
  expect(h).toContain('after: status in review');
  expect(h).toContain('decision · record d0c1s10n');
  expect(h).toContain('סיבה: <span dir="ltr">OpsPolicyError</span>');
  expect(h).toContain('request req-a-task · actor user-1');
  expect(h).not.toContain('"note":"x"'); // the result summary never dumps a record payload
});

test('rollback control only for writers and only where eligible; members read the same history', () => {
  const w = renderToStaticMarkup(createElement(UnifiedAudit, { businessSlug: 'mytiv', rows: [task, decision, rolled], canWrite: true }));
  const m = renderToStaticMarkup(createElement(UnifiedAudit, { businessSlug: 'mytiv', rows: [task, decision, rolled], canWrite: false }));
  const block = (h: string, id: string) => { const i = h.indexOf(`data-action-id="${id}"`); return h.slice(i, h.indexOf('</li>', i)); };
  expect(block(w, 'a-task')).toContain('<button');
  expect(block(w, 'a-dec')).not.toContain('<button');
  expect(block(w, 'a-rb')).not.toContain('<button');
  expect(m).not.toContain('<button');
  expect(m).toContain('UMINO');
  expect(renderToStaticMarkup(createElement(UnifiedAudit, { businessSlug: 'mytiv', rows: [], canWrite: false }))).toContain('טרם נרשמו פעולות מבוקרות');
});

test('open reconciliation items are listed first; only writers get the readback control (T-11.3)', () => {
  const unknown = row('a-unk', 'update_task', [{ event: 'confirmed', detail: { target: { kind: 'task', id: 't1' } } }, { event: 'failed_or_unknown', detail: { phase: 'after_write_unverified' } }]);
  const resolved = row('a-res', 'update_task', [...unknown.events.map(({ event, detail }) => ({ event, detail })), { event: 'reconciled', detail: { observed_state: {} } }]);
  const w = renderToStaticMarkup(createElement(UnifiedAudit, { businessSlug: 'mytiv', rows: [task, unknown, resolved], canWrite: true }));
  expect(w).toContain('פריטי יישוב פתוחים (1)');
  expect(w).toContain('data-open-item="a-unk"');
  expect(w).not.toContain('data-open-item="a-res"');
  expect(w).toContain('יישוב (קריאה חוזרת)');
  const m = renderToStaticMarkup(createElement(UnifiedAudit, { businessSlug: 'mytiv', rows: [unknown], canWrite: false }));
  expect(m).toContain('data-open-item="a-unk"');
  expect(m).not.toContain('יישוב (קריאה חוזרת)');
  expect(renderToStaticMarkup(createElement(UnifiedAudit, { businessSlug: 'mytiv', rows: [task], canWrite: true }))).not.toContain('פריטי יישוב פתוחים');
});

