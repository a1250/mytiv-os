import { expect, test, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { CampaignsView } from '../components/marketing/campaigns';
import { isPublishAction, provenanceLabel, receiptActionFor } from '../lib/marketing/view';
import { validateArtifact } from '../lib/marketing/validate-artifact';
import { BINDING, CARD, validOf } from './marketing-vectors';

// T-7.2 · T-7.3 · T-7.4 · T-7.5 — Campaigns & Content (MKT-F08, F11, F12, F13, F19). Writes are proven in the
// records route / integration tests; this pins what is offered, to whom, and what is never offered.
const H = 'a'.repeat(64);
const item = (over: Record<string, unknown>) => ({ ...CARD, approval_id: 'x', content_hash: H, state: 'pending' as const, ...over });
const campaigns = validateArtifact('C12', { ...validOf('C12'),
  content_calendar: [{ id: 'e1', date: '2026-02-03', channel: 'instagram', status: 'planned' }],
  manual_publish_packs: [{ id: 'mp1', campaign_id: 'c1', instructions: 'Post the carousel at 18:00' }],
  asset_refs: [{ ref: 'assets/hero.png', provenance: 'ai_concept', disclosure: 'Concept render' }, { ref: 'assets/team.jpg', provenance: 'real' }] }, BINDING);
const queue = { id: 'q1', items: [
  item({ approval_id: 'act-1', action_type: 'campaign_activate', title: 'Activate spring' }),
  item({ approval_id: 'msg-ok', action_type: 'message_marketing', state: 'approved', title: 'Send March newsletter' }),
  item({ approval_id: 'msg-no', action_type: 'message_marketing', state: 'rejected', title: 'Rejected blast' }),
  item({ approval_id: 'pub-1', action_type: 'publish_organic_new', state: 'approved', title: 'Publish reel' }),
  item({ approval_id: 'job-1', action_type: 'job_ad_publish', state: 'approved', title: 'Job ad' }),
  item({ approval_id: 'pub-2', action_type: 'publish_organic_recurring', state: 'pending', title: 'Pending weekly post' }),
] };
const task = (over: Record<string, unknown>) => ({ ...(validOf('C7').tasks as object[])[0], ...over }) as never;
const board = { id: 'b1', tasks: [task({ task_id: 't-sched', status: 'scheduled' }), task({ task_id: 't-pub', status: 'published', dod: ['post live', 'link logged'] }), task({ task_id: 't-draft', status: 'in_progress' })] };
const records = { decisions: [], evidence: [{ id: 'ev-1', kind: 'publish_evidence', targetId: 't-old', approvalId: null, createdAt: '2026-01-02T00:00:00.000Z', exportedAt: null, reconciledState: 'awaiting' }] };
const render = (over: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(CampaignsView, {
  businessSlug: 'mytiv', projectId: 'p1', bindingVersion: 2, canWrite: true, campaigns, queue, board, records, ...over } as never));
const block = (h: string, attr: string, id: string) => { const i = h.indexOf(`${attr}="${id}"`); const n = h.indexOf(' data-', i + 10); return h.slice(i, n === -1 ? undefined : n); };

test('campaigns keep their engine build state; activation is RED and decided here like any approval — never activated directly (F11)', () => {
  const h = render();
  expect(block(h, 'data-campaign-id', 'c1')).toContain('מושהה — ממתין להפעלה');
  expect(h).toContain('הפעלת קמפיין היא פעולת RED');
  const act = block(h, 'data-activation', 'act-1');
  expect(act).toContain('Activate spring');
  expect(act).toContain('נימוק (חובה)'); // the governed decision form, not an "activate" button
  expect(h).not.toMatch(/>הפעל</);
});

test('content calendar, Manual Publish Packs and assets with provenance labels; an AI concept is badged, never shown as real (F12, F13)', () => {
  const h = render();
  expect(h).toContain('2026-02-03');
  expect(h).toContain('Post the carousel at 18:00');
  const concept = block(h, 'data-asset', 'assets/hero.png');
  expect(concept).toContain(provenanceLabel('ai_concept'));
  expect(concept).toContain('Concept render');
  expect(concept).toContain('bg-warning/10');
  expect(block(h, 'data-asset', 'assets/team.jpg')).toContain(provenanceLabel('real'));
});

test('publication evidence form: only SCHEDULED tasks; only approved C6-resolvable publish approvals are linkable (F12, F19)', () => {
  const h = render();
  const form = h.slice(h.indexOf('cmp-evidence'), h.indexOf('cmp-receipts'));
  expect(form).toContain('>t-sched<');
  expect(form).not.toContain('>t-pub<');
  expect(form).not.toContain('>t-draft<');
  expect(form).toContain('Publish reel');
  expect(form).not.toContain('Job ad');
  expect(form).not.toContain('Pending weekly post'); // not approved → not linkable
  expect(form).toContain('בדקתי את הראיה הזו');
  expect(block(h, 'data-record-id', 'ev-1')).toContain('/api/mytiv/ops/projects/p1/marketing/evidence/ev-1');
});

test('execution receipts: only APPROVED campaign/message items — a rejected item never gets a form (F19)', () => {
  const h = render();
  expect(h).toContain('data-receipt-for="msg-ok"');
  expect(h).not.toContain('data-receipt-for="msg-no"');
  expect(h).not.toContain('data-receipt-for="act-1"'); // pending
  expect(h).not.toContain('data-receipt-for="pub-1"'); // publish resolves via C6, not a receipt
  const done = render({ records: { decisions: [], evidence: [{ id: 'rc-1', kind: 'execution_receipt', targetId: 'msg-ok', approvalId: 'msg-ok', createdAt: '2026-01-02T00:00:00.000Z', exportedAt: null, reconciledState: null }] } });
  expect(done).not.toContain('data-receipt-for="msg-ok"'); // already recorded
});

test('outcomes: only PUBLISHED tasks, with every DoD criterion to confirm (F08, D10)', () => {
  const h = render();
  const out = block(h, 'data-outcome-for', 't-pub');
  expect(out).toContain('כולם נדרשים');
  expect(out).toContain('post live');
  expect(out).toContain('link logged');
  expect(h).not.toContain('data-outcome-for="t-sched"');
});

test('members see everything read-only: no form, no record download', () => {
  const h = render({ canWrite: false });
  expect(h).not.toContain('<textarea');
  expect(h).not.toContain('<input');
  expect(h).not.toContain('/marketing/evidence/ev-1');
});

test('nothing imported → explicit states', () => {
  const h = render({ campaigns: null, queue: null, board: null, records: { decisions: [], evidence: [] } });
  expect(h).toContain('טרם יובאו תוצרי קמפיינים.');
  expect(h).toContain('טרם יובא לוח עבודה');
});

test('action vocabulary mirrors the engine', () => {
  expect([receiptActionFor('campaign_activate'), receiptActionFor('message_marketing'), receiptActionFor('message_service_optin'), receiptActionFor('publish_organic_new')]).toEqual(['campaign_activation', 'message_batch', 'message_batch', null]);
  expect([isPublishAction('publish_organic_new'), isPublishAction('publish_organic_recurring'), isPublishAction('job_ad_publish'), isPublishAction('campaign_activate')]).toEqual([true, true, false, false]);
});
