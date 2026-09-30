import { expect, test, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { BrainView } from '../components/marketing/brain';
import { brainHealthLabel, brainVerification, brainVerificationLabel } from '../lib/marketing/view';
import type { BrainStatusExport } from '../lib/marketing/contract-rules/c2-c3';

// T-4.7 — Brain viewer (MKT-F09, F10). Proposal writes are proven in the records route/integration tests.
const H = 'a'.repeat(64);
const status: BrainStatusExport = {
  schemaVersion: 1, sourceRevision: 'rev-9', asOf: '2026-01-02T00:00:00.000Z', marketingBusiness: 'demo-biz',
  files: { 'hours.yaml': 'ok', 'menu.yaml': 'ok', 'tracking.yaml': 'ok', 'offers.yaml': 'stale', 'claims.yaml': 'missing' },
  field_verification: {
    'hours.yaml#weekly.sun': { owner_verified: true }, 'hours.yaml#weekly.mon': { owner_verified: false, source_verified: true, source: 'google-business' },
    'menu.yaml#items[0].price': { owner_verified: true }, 'menu.yaml#items[1].price': { owner_verified: false, note: 'price list pending' },
  },
  values: { 'hours.yaml': { 'weekly.sun': H }, 'menu.yaml': { 'items[0].price': H } },
  open_proposals: [{ file: 'menu.yaml', path: 'items[0].price', old: 98, new: 110, reason: 'owner update', verify: true, value_hash: H, proposed_by: 'owner', app_request_id: 'req-1', binding_version: 1 }],
};
const render = (over: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(BrainView, {
  businessSlug: 'mytiv', projectId: 'p1', bindingVersion: 1, status: { id: 'c3a-1', asOf: status.asOf, payload: status },
  proposals: [{ id: 'pr-1', targetId: 'hours.yaml#weekly.sun', createdAt: '2026-01-02T10:00:00.000Z', exportedAt: null, reconciledState: 'awaiting' }], canWrite: true, ...over }));
const row = (h: string, file: string) => { const i = h.indexOf(`>${file}<`); return h.slice(i, h.indexOf('</tr>', i)); };

test('per file: health (C3a files) and verification (field_verification) are separate columns (F09, D13.2)', () => {
  const h = render();
  expect(row(h, 'hours.yaml')).toContain('תקין'); // health
  expect(row(h, 'hours.yaml')).toContain('>מאומת<'); // owner + source verified fields → VERIFIED
  expect(row(h, 'menu.yaml')).toContain('מאומת חלקית (1/2)');
  expect(row(h, 'tracking.yaml')).toContain('לא מאומת — אין נתוני אימות'); // ok file, zero tracked fields → never VERIFIED
  expect(row(h, 'offers.yaml')).toContain('לא עדכני');
  expect(row(h, 'claims.yaml')).toContain('חסר');
  expect(h).toContain('EXPIRED'); // disclosed: C3a does not distinguish it from stale
});
test('a structurally valid file is never shown "invalid" because of partial verification (D13.2)', () => {
  const h = renderToStaticMarkup(createElement(BrainView, { businessSlug: 'mytiv', projectId: 'p1', bindingVersion: 1, proposals: [], canWrite: false,
    status: { id: 'c3a-2', asOf: status.asOf, payload: { ...status, files: { 'hours.yaml': 'ok', 'bad.yaml': 'invalid' },
      field_verification: { 'hours.yaml:weekly.sun': { owner_verified: true, source_verified: false }, 'hours.yaml:weekly.fri': { owner_verified: false, source_verified: false } } } } }));
  expect(row(h, 'hours.yaml')).toContain('תקין');
  expect(row(h, 'hours.yaml')).not.toContain('לא תקין');
  expect(row(h, 'hours.yaml')).toContain('מאומת חלקית (1/2)'); // engine ':' keys
  expect(row(h, 'bad.yaml')).toContain('לא תקין');
  expect(row(h, 'bad.yaml')).toContain('אין נתוני אימות');
});

test('field-level verification distinguishes owner_verified from source_verified, with source and note', () => {
  const h = render();
  expect(h).toContain('hours.yaml#weekly.mon');
  expect(h).toContain('לא אומת ע״י הבעלים · אומת מול המקור');
  expect(h).toContain('google-business');
  expect(h).toContain('price list pending');
});

test('open engine proposals and proposals recorded here (with engine state) are listed', () => {
  const h = render();
  expect(h).toContain('menu.yaml › items[0].price');
  expect(h).toContain('ממתין להחלה במנוע');
  expect(h).toContain('/api/mytiv/ops/projects/p1/marketing/proposals/pr-1');
});

test('writers get the propose form (fields from C3a values); members get none — and no file download', () => {
  const w = render();
  expect(w).toContain('הצעת שינוי במוח העסק');
  expect(w).toContain('hours.yaml › weekly.sun');
  const m = render({ canWrite: false });
  expect(m).not.toContain('הצעת שינוי במוח העסק');
  expect(m).not.toContain('/marketing/proposals/pr-1');
});

test('engine-originated brain changes awaiting a decision come from C2a (not C3a open_proposals)', () => {
  const item = { approval_id: 'apr_1', content_hash: H, state: 'pending' as const, title: 'Change hours.yaml › weekly.fri', why: 'w', action_type: 'brain_update',
    action_class: 'RED' as const, requested_change: 'weekly.fri: closed → 10:00–15:00', facts_cited: [], qa_verdict: 'NOT_RUN' as const, rollback_note: 'r' };
  const h = render({ engineProposals: [item] });
  expect(h).toContain('Change hours.yaml › weekly.fri');
  expect(h).toContain('weekly.fri: closed → 10:00–15:00');
  expect(h).toContain('ממתין בתור האישורים');
  expect(render({ engineProposals: null })).toContain('תור האישורים טרם יובא');
  expect(render({ engineProposals: [] })).not.toContain('ממתין בתור האישורים');
});

test('no imported status → explicit empty state', () => {
  expect(render({ status: null })).toContain('טרם יובא מצב מוח העסק');
});

test('brainVerification derivation — from field_verification only; both key separators', () => {
  expect(brainVerification('x.yaml', {})).toEqual({ level: 'UNVERIFIED', tracked: 0, verified: 0 }); // no data → not verified
  expect(brainVerification('x.yaml', { 'x.yaml#a': { owner_verified: true }, 'y.yaml#a': { owner_verified: false } }).level).toBe('VERIFIED');
  expect(brainVerification('x.yaml', { 'x.yaml#a': { owner_verified: true }, 'x.yaml#b': { owner_verified: false } }).level).toBe('PARTIAL');
  expect(brainVerification('x.yaml', { 'x.yaml#a': { owner_verified: false, source_verified: false } }).level).toBe('UNVERIFIED');
  expect(brainVerification('x.yaml', { 'x.yaml#a': { owner_verified: false, source_verified: true } }).level).toBe('VERIFIED'); // source-verified counts
  expect(brainVerification('x.yaml', { 'x.yaml:a': { owner_verified: true, source_verified: false } }).level).toBe('VERIFIED');
  expect(brainVerification('x.yaml', { 'x.yaml:a': { owner_verified: true }, 'x.yaml#b': { owner_verified: false } }).level).toBe('PARTIAL');
  expect(brainVerification('x.yaml', { 'x.yamlx:a': { owner_verified: true }, 'y.yaml:a': { owner_verified: true } }).level).toBe('UNVERIFIED');
  expect(brainVerificationLabel({ level: 'UNVERIFIED', tracked: 0, verified: 0 })).toContain('אין נתוני אימות');
  expect(brainVerificationLabel({ level: 'UNVERIFIED', tracked: 2, verified: 0 })).toContain('אין להשתמש');
  expect(brainVerificationLabel({ level: 'UNVERIFIED', tracked: 2, verified: 0 })).not.toContain('אין נתוני אימות');
  expect([brainHealthLabel('ok'), brainHealthLabel('invalid'), brainHealthLabel('stale'), brainHealthLabel('missing')]).toEqual(['תקין', 'לא תקין', 'לא עדכני', 'חסר']);
});
