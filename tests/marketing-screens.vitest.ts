import { expect, test } from 'vitest';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LeadsView } from '../components/marketing/leads';
import { ReportsView } from '../components/marketing/reports';
import { IntegrationsView, SkillsView } from '../components/marketing/integrations';
import { notVerifiedKpis, percent, tierLabel } from '../lib/marketing/view';
import { validateArtifact } from '../lib/marketing/validate-artifact';
import { BINDING, validOf } from './marketing-vectors';

// T-6.3 Leads & CRM · T-10.2 Reports · T-10.3 Integrations + Skills Lab — static render from canonical vectors.
type K = 'C4' | 'C5' | 'C10' | 'C11' | 'C13' | 'C14';
const art = <T extends K>(k: T, over: Record<string, unknown> = {}) => validateArtifact(k, { ...validOf(k), ...over }, BINDING);
const r = <P extends object>(c: ComponentType<P>, props: P) => renderToStaticMarkup(createElement(c, props));

// ── T-6.3 ──
test('Leads & CRM: aggregates only, with as_of; a missing export is "no data — not zero" (F14, F15)', () => {
  const empty = r(LeadsView, { pipeline: null, consent: null });
  expect(empty).toContain('טרם יובא יצוא משפך האירועים. אין נתונים — ולא אפס.');
  expect(empty).toContain('טרם יובא יצוא הסכמות הלקוחות. אין נתונים — ולא אפס.');
  const pipeline = art('C4'); const consent = art('C13');
  const h = r(LeadsView, { pipeline, consent });
  expect(h).toContain('נתונים מצרפיים בלבד');
  expect(h).toContain('ללא פרטי קשר');
  expect(h).toContain(percent(pipeline.quote_rate));
  expect(h).toContain('>100<'); // lead count
  expect(h).toContain(`${consent.channels[0].opted_in} מסכימים`);
  expect(h).toContain(pipeline.as_of.slice(0, 10));
  expect(h).not.toMatch(/@[a-z]+\.|\+972/); // nothing contact-shaped can appear (the contracts carry none)
});

// ── T-10.2 ──
test('Reports: every KPI carries its attribution tier; UNKNOWN is "—" (RPT02)', () => {
  const h = r(ReportsView, { kpis: art('C5'), monthly: null });
  expect(h).toContain(tierLabel('T1'));
  expect(h).toContain(tierLabel('T3'));
  expect(h).toContain('>—<');
  expect(h).toContain('נתוני פלטפורמות מוגבלים לסך שנמדד במערכת העסק');
});

test('Reports: the "not verified" section is mandatory — always rendered, listing every non-T1 or UNKNOWN KPI', () => {
  for (const props of [{ kpis: null, monthly: null }, { kpis: art('C5'), monthly: null }]) expect(r(ReportsView, props)).toContain('>לא מאומת<');
  expect(r(ReportsView, { kpis: null, monthly: null })).toContain('לא ניתן לאמת דבר: לא יובאה תמונת מדדים.');
  const kpis = art('C5', { kpis: [
    { kpi: 'revenue', value: 1000, confidence: 'KNOWN', tier: 'T1', as_of: '2026-01-01T00:00:00Z', source: 'pos' },
    { kpi: 'meta-conversions', value: 40, confidence: 'ESTIMATED', tier: 'T2', as_of: '2026-01-01T00:00:00Z', source: 'meta' },
    { kpi: 'reach', value: null, confidence: 'UNKNOWN', tier: 'T3', as_of: '2026-01-01T00:00:00Z', source: 'none' },
    // UNKNOWN keeps its intended tier — T1 by default in the engine — and is still not verified
    { kpi: 'covers', value: null, confidence: 'UNKNOWN', tier: 'T1', as_of: '2026-01-01T00:00:00Z', source: 'none' }] });
  expect(notVerifiedKpis(kpis.kpis).map((k) => k.kpi)).toEqual(['meta-conversions', 'reach', 'covers']);
  const h = r(ReportsView, { kpis, monthly: null });
  const section = h.slice(h.indexOf('>לא מאומת<'), h.indexOf('rpt-mbr'));
  expect(section).toContain('meta-conversions');
  expect(section).toContain('reach');
  expect(section).toContain('covers');
  expect(section).not.toContain('>revenue<');
  const allT1 = art('C5', { kpis: [{ kpi: 'revenue', value: 5, confidence: 'KNOWN', tier: 'T1', as_of: '2026-01-01T00:00:00Z', source: 'pos' }] });
  expect(r(ReportsView, { kpis: allT1, monthly: null })).toContain('כל המדדים בתמונה הזו אומתו');
});

test('Reports MBR: monthly targets vs actuals — an actual with no evidence is "—", never 0 (RPT03, F17)', () => {
  const monthly = art('C14', { kpi_targets: [{ kpi: 'revenue', target: 1200, confidence: 'ESTIMATED' }, { kpi: 'leads', target: 50, confidence: 'ESTIMATED' }] });
  const h = r(ReportsView, { kpis: art('C5'), monthly });
  const row = (kpi: string) => { const i = h.indexOf(`>${kpi}<`, h.indexOf('rpt-mbr')); return h.slice(i, h.indexOf('</tr>', i)); };
  expect(row('revenue')).toContain('1,200');
  expect(row('revenue')).toContain('1,000'); // C5 actual
  expect(row('leads')).toContain('>—<'); // no C5 evidence for leads
  expect(r(ReportsView, { kpis: null, monthly: null })).toContain('טרם יובאה תוכנית חודשית');
});

// ── T-10.3 ──
test('Integrations: class, status, verified at/by; unverified shows "—"; no secret can appear (INT01)', () => {
  const h = r(IntegrationsView, { integrations: art('C10') });
  expect(h).toContain('A · API מאומת');
  expect(h).toContain('מאומת');
  expect(h).toContain('לא מאומת');
  expect(h).toContain('owner');
  expect(h).toContain('>—<');
  expect(h).not.toMatch(/token|secret|password|api_key/i);
  expect(r(IntegrationsView, { integrations: null })).toContain('טרם יובא מצב האינטגרציות');
});

test('Skills Lab: read-only lifecycle, golden count, replay score ("—" when never replayed); no promote control (F16)', () => {
  const h = r(SkillsView, { skills: art('C11') });
  expect(h).toContain('build-monthly-plan');
  expect(h).toContain('PRODUCTION');
  expect(h).toContain('0.9');
  expect(h).toContain('>—<');
  expect(h).toContain('קידום מיומנות נעשה רק במנוע');
  expect(h).not.toMatch(/<button|<form|promote|קדם/i);
});
