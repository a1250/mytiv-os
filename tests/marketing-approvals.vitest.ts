import { expect, test, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { ApprovalsView } from '../components/marketing/approvals';
import { reconciledLabel, approvalStateLabel } from '../lib/marketing/view';

// T-4.5 — Approvals (MKT-F03, F04). Decision writes are proven in tests/marketing-records-route.vitest.ts and
// tests/db-integration/records.itest.ts; this pins what the screen shows and to whom.
const H = 'a'.repeat(64), H2 = 'b'.repeat(64);
const queue = { id: 'art-1', revision: 3, asOf: '2026-01-02T08:00:00.000Z', items: [
  { approval_id: 'apr-pending', content_hash: H, state: 'pending' as const },
  { approval_id: 'apr-decided', content_hash: H, state: 'pending' as const },
  { approval_id: 'apr-approved', content_hash: H, state: 'approved' as const },
  { approval_id: 'apr-changed', content_hash: H2, state: 'pending' as const },
] };
const decisions = [
  { id: 'd-1', approvalId: 'apr-decided', contentHash: H, decision: 'rejected', note: 'off-brand claim', decidedAt: '2026-01-02T09:00:00.000Z', exportedAt: null, reconciledState: null },
  { id: 'd-2', approvalId: 'apr-changed', contentHash: H, decision: 'approved', note: 'ok', decidedAt: '2026-01-01T09:00:00.000Z', exportedAt: '2026-01-01T10:00:00.000Z', reconciledState: 'stale' },
];
const render = (over: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(ApprovalsView,
  { businessSlug: 'mytiv', projectId: 'p1', bindingVersion: 2, queue, decisions, canWrite: true, ...over }));
const itemHtml = (h: string, id: string) => { const from = h.indexOf(id); return h.slice(from, h.indexOf('</li>', from)); };

test('no imported queue → an explicit empty state', () => {
  expect(render({ queue: null })).toContain('טרם יובא תור אישורים');
});

test('the card-field gap is disclosed: the approver is sent to the engine to review before deciding', () => {
  expect(render()).toContain('אינם כלולים עדיין בחוזה C2a');
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
  expect(['pending', 'approved', 'rejected', 'expired'].map((s) => approvalStateLabel(s as 'pending'))).toEqual(['ממתין להחלטה', 'אושר', 'נדחה', 'פג תוקף']);
  expect(reconciledLabel('applied')).toBe('הוחל במנוע');
  expect(reconciledLabel('stale')).toContain('התוכן השתנה');
  expect(reconciledLabel(null)).toBe('טרם התקבל יצוא מהמנוע');
});
