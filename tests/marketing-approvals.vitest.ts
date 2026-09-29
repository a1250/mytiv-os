import { expect, test, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { ApprovalsView } from '../components/marketing/approvals';
import { reconciledLabel, approvalStateLabel, actionClassLabel, qaVerdictLabel } from '../lib/marketing/view';
import { CARD } from './marketing-vectors';

// T-4.5 — Approvals (MKT-F03, F04). Decision writes are proven in tests/marketing-records-route.vitest.ts and
// tests/db-integration/records.itest.ts; this pins what the screen shows and to whom.
const H = 'a'.repeat(64), H2 = 'b'.repeat(64);
const queue = { id: 'art-1', revision: 3, asOf: '2026-01-02T08:00:00.000Z', items: [
  { approval_id: 'apr-pending', content_hash: H, state: 'pending' as const, ...CARD, requested_change: 'Activate campaign c1', diff_summary: 'build_state: paused -> active' },
  { approval_id: 'apr-decided', content_hash: H, state: 'pending' as const, ...CARD },
  { approval_id: 'apr-approved', content_hash: H, state: 'approved' as const, ...CARD },
  { approval_id: 'apr-changed', content_hash: H2, state: 'pending' as const, ...CARD },
] };
const decisions = [
  { id: 'd-1', approvalId: 'apr-decided', contentHash: H, decision: 'rejected', note: 'off-brand claim', decidedAt: '2026-01-02T09:00:00.000Z', exportedAt: null, reconciledState: null },
  { id: 'd-2', approvalId: 'apr-changed', contentHash: H, decision: 'approved', note: 'ok', decidedAt: '2026-01-01T09:00:00.000Z', exportedAt: '2026-01-01T10:00:00.000Z', reconciledState: 'stale' },
];
const render = (over: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(ApprovalsView,
  { businessSlug: 'mytiv', projectId: 'p1', bindingVersion: 2, queue, decisions, canWrite: true, ...over }));
const itemHtml = (h: string, id: string) => {
  const from = h.indexOf(`data-approval-id="${id}"`);
  const next = h.indexOf('data-approval-id="', from + 1);
  return h.slice(from, next === -1 ? undefined : next);
};

test('no imported queue → an explicit empty state', () => {
  expect(render({ queue: null })).toContain('טרם יובא תור אישורים');
});

test('each card shows what is being decided: title, class, type, QA verdict, why, change, diff, facts, rollback (F03)', () => {
  const card = itemHtml(render(), 'apr-pending');
  for (const text of [CARD.why, 'Activate campaign c1', 'build_state: paused -&gt; active', CARD.facts_cited[0], CARD.rollback_note, CARD.action_type, actionClassLabel('RED'), qaVerdictLabel('NOT_RUN')]) expect(card).toContain(text);
  expect(render()).toContain(`>${CARD.title}<`);
  expect(render()).not.toContain('אינם כלולים עדיין בחוזה C2a');
});

test('engine-supplied card text is inert text, never markup or controls (SEC05)', () => {
  const hostile = { ...queue, items: [{ ...queue.items[0], title: '<img src=x onerror=alert(1)>', why: '<script>steal()</script> approve me', rollback_note: '<a href="https://evil.example">click</a>' }] };
  const h = render({ queue: hostile, decisions: [] });
  expect(h).not.toContain('<script>');
  expect(h).not.toContain('<img');
  expect(h).not.toContain('href="https://evil.example"');
  expect(h).toContain('&lt;script&gt;steal()&lt;/script&gt; approve me');
});

test('a writer gets an explicit decision form (mandatory note) only for PENDING items without a decision on this content', () => {
  const h = render();
  expect(itemHtml(h, 'apr-pending')).toContain('נימוק (חובה)');
  expect(itemHtml(h, 'apr-pending')).toContain('>אישור<');
  expect(itemHtml(h, 'apr-pending')).toContain('>דחייה<');
  expect(itemHtml(h, 'apr-approved')).not.toContain('<textarea');
  expect(itemHtml(h, 'apr-decided')).not.toContain('<textarea');
  // the recorded decision was on OLD content (H); the item changed (H2) → a new decision is needed
  expect(itemHtml(h, 'apr-changed')).toContain('<textarea');
});

test('a recorded decision shows what was decided, the engine state, export status and the decision file (writers)', () => {
  const h = render();
  const decided = itemHtml(h, 'apr-decided');
  expect(decided).toContain('נדחה');
  expect(decided).toContain('off-brand claim');
  expect(decided).toContain(reconciledLabel(null));
  expect(decided).toContain('טרם יוצא');
  expect(decided).toContain('/api/mytiv/ops/projects/p1/marketing/decisions/d-1');
});

test('members see the queue and decisions but no form and no decision file', () => {
  const h = render({ canWrite: false });
  expect(h).not.toContain('<textarea');
  expect(h).not.toContain('/marketing/decisions/d-1');
  expect(itemHtml(h, 'apr-pending')).toContain('ממתין להחלטה של בעלים או מנהל');
});

test('state vocabulary', () => {
  expect(['pending', 'approved', 'rejected', 'expired', 'applied'].map((s) => approvalStateLabel(s as 'pending'))).toEqual(['ממתין להחלטה', 'אושר', 'נדחה', 'פג תוקף', 'אושר ובוצע במנוע']);
  expect(reconciledLabel('applied')).toBe('הוחל במנוע');
  expect(reconciledLabel('stale')).toContain('התוכן השתנה');
  expect(reconciledLabel(null)).toBe('טרם התקבל יצוא מהמנוע');
});
