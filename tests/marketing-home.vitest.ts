import { expect, test } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarketingHome } from '../components/marketing/marketing-home';
import { approvalsWaiting, confidenceLabel, freshnessLabel, ingestedAt, marketingView, metricValue } from '../lib/marketing/view';
import { validateArtifact } from '../lib/marketing/validate-artifact';
import { BINDING, validOf } from './marketing-vectors';

// T-4.4 — Marketing Home (MKT-F01, F02, RPT01), rendered to static HTML from canonical vectors.
const art = <K extends 'C2a' | 'C5' | 'C8' | 'C9'>(k: K, over: Record<string, unknown> = {}) => validateArtifact(k, { ...validOf(k), ...over }, BINDING);
const html = (props: Partial<Parameters<typeof MarketingHome>[0]>) =>
  renderToStaticMarkup(createElement(MarketingHome, { weekly: null, freshness: null, kpis: null, approvalsWaiting: null, ...props }));

test('nothing imported: every block says so explicitly; no sample data, no zeros', () => {
  const h = html({});
  expect(h).toContain('טרם יובאו עדיפויות שבועיות. לא מוצגים נתוני דוגמה.');
  expect(h).toContain('לא יובא מניפסט קליטה — מצב כל המקורות לא ידוע.');
  expect(h).toContain('לא יובאה תמונת מדדים. אין להסיק שהמדדים אפס.');
  expect(h).toContain('תור האישורים טרם יובא — המספר אינו ידוע.');
  expect(h).not.toMatch(/>0</);
});

test('weekly priorities render with as_of, source revision, confidence and source refs (F01)', () => {
  const weekly = art('C8');
  const h = html({ weekly });
  expect(h).toContain(`שבוע ${weekly.week}`);
  expect(h).toContain(`מקור ${weekly.sourceRevision}`);
  for (const p of weekly.points) { expect(h).toContain(p.text); expect(h).toContain(p.why); expect(h).toContain(p.sourceRef); }
  expect(h).toContain(confidenceLabel(weekly.points[0].confidence));
  expect(html({ weekly: art('C8', { points: [] }) })).toContain('אין עדיפויות לשבוע הזה.');
});

test('freshness: a never-ingested source is UNKNOWN / "never ingested" — never "0 days" or 0 rows (F02)', () => {
  const freshness = art('C9'); // spend FRESH (120 rows) + reviews UNKNOWN (as_of null)
  const h = html({ freshness });
  expect(h).toContain('לא נקלט מעולם');
  expect(h).toContain('לא ידוע');
  expect(h).toContain('עדכני');
  expect(h).not.toMatch(/0 ימים|0 days/);
  const unknownRow = h.slice(h.indexOf('>reviews<'));
  expect(unknownRow.slice(0, unknownRow.indexOf('</tr>'))).toContain('—'); // rows of an UNKNOWN source: "—", not 0
});

test('KPI tiles: UNKNOWN renders "—" with its label; KNOWN renders the number with label, tier and source (RPT01)', () => {
  const kpis = art('C5'); // revenue 1000 KNOWN T1 · reach null UNKNOWN T3
  const h = html({ kpis });
  expect(h).toContain('1,000');
  expect(h).toContain('>—<');
  expect(h).toContain('ידוע · T1');
  expect(h).toContain('לא ידוע · T3');
});

test('approvals waiting counts pending items of the imported queue; unknown without a queue', () => {
  expect(approvalsWaiting(null)).toBeNull();
  expect(approvalsWaiting(art('C2a', { items: [
    { approval_id: 'a1', content_hash: 'a'.repeat(64), state: 'pending' }, { approval_id: 'a2', content_hash: 'a'.repeat(64), state: 'approved' },
    { approval_id: 'a3', content_hash: 'a'.repeat(64), state: 'pending' }] }))).toBe(2);
  expect(html({ approvalsWaiting: 0 })).toContain('>0<'); // a real, imported zero IS shown as 0
});

test('view helpers use the canonical vocabulary and never turn unknown into 0', () => {
  expect([confidenceLabel('KNOWN'), confidenceLabel('ESTIMATED'), confidenceLabel('UNKNOWN')]).toEqual(['ידוע', 'משוער', 'לא ידוע']);
  expect([freshnessLabel('FRESH'), freshnessLabel('STALE'), freshnessLabel('UNKNOWN')]).toEqual(['עדכני', 'לא עדכני', 'לא ידוע']);
  expect(metricValue(null, 'UNKNOWN')).toBe('—');
  expect(metricValue(5, 'UNKNOWN')).toBe('—');
  expect(metricValue(null, 'KNOWN')).toBe('—');
  expect(metricValue(0, 'KNOWN')).toBe('0');
  expect(ingestedAt(null)).toBe('לא נקלט מעולם');
  expect(ingestedAt('2026-01-05T10:00:00Z')).toBe('2026-01-05');
  expect([marketingView('brain'), marketingView('nope'), marketingView(undefined)]).toEqual(['brain', 'home', 'home']);
});
