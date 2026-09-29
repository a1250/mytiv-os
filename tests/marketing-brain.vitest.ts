import { expect, test, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { BrainView } from '../components/marketing/brain';
import { brainFileStatus, brainStatusLabel } from '../lib/marketing/view';
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

test('per-file status: verified / partial / unverified (not usable for production copy) / stale / missing (F09)', () => {
  const h = render();
  expect(row(h, 'hours.yaml')).toContain('מאומת'); // owner + source verified fields → VERIFIED
  expect(row(h, 'hours.yaml')).not.toContain('חלקית');
  expect(row(h, 'menu.yaml')).toContain('מאומת חלקית');
  expect(row(h, 'tracking.yaml')).toContain('לא מאומת — אין להשתמש בו לתוכן ייצור');
  expect(row(h, 'offers.yaml')).toContain('לא עדכני');
  expect(row(h, 'claims.yaml')).toContain('חסר');
  expect(h).toContain('EXPIRED'); // disclosed as not representable in C3a
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

test('no imported status → explicit empty state', () => {
  expect(render({ status: null })).toContain('טרם יובא מצב מוח העסק');
});

test('brainFileStatus derivation', () => {
  expect(brainFileStatus('x.yaml', 'ok', {})).toBe('UNVERIFIED'); // no field recorded → not verified
  expect(brainFileStatus('x.yaml', 'ok', { 'x.yaml#a': { owner_verified: true }, 'y.yaml#a': { owner_verified: false } })).toBe('VERIFIED');
  expect(brainFileStatus('x.yaml', 'ok', { 'x.yaml#a': { owner_verified: true }, 'x.yaml#b': { owner_verified: false } })).toBe('PARTIAL');
  expect(brainFileStatus('x.yaml', 'ok', { 'x.yaml#a': { owner_verified: false, source_verified: false } })).toBe('UNVERIFIED');
  expect(brainFileStatus('x.yaml', 'invalid', {})).toBe('INVALID');
  expect(brainStatusLabel('UNVERIFIED')).toContain('אין להשתמש');
});
