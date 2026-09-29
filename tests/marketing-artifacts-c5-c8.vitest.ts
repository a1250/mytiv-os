import { expect, test } from 'vitest';
import { validateArtifact } from '../lib/marketing/validate-artifact';
import { BINDING, validOf } from './marketing-vectors';

// T-1.5b — C5 KpiSnapshot, C6 PublishEvidence, C7 WorkboardExport, C8 WeeklyPriorities.
// Canonical vectors run in tests/marketing-artifacts.vitest.ts; these pin each contextual rule.

type Row = Record<string, unknown>;
const ok = (kind: Parameters<typeof validateArtifact>[0], v: unknown) => expect(() => validateArtifact(kind, v, BINDING)).not.toThrow();
const bad = (kind: Parameters<typeof validateArtifact>[0], v: unknown, why: RegExp) => expect(() => validateArtifact(kind, v, BINDING)).toThrow(why);

// ── C5 ──
const kpi = (over: Row) => { const s = validOf('C5'); s.kpis = [{ ...(s.kpis as Row[])[0], ...over }]; return s; };
test('C5: an UNKNOWN KPI carries null; a KNOWN/ESTIMATED KPI carries a number', () => {
  bad('C5', kpi({ confidence: 'UNKNOWN', value: 5 }), /never fabricated/);
  bad('C5', kpi({ confidence: 'KNOWN', value: null }), /must be present/);
  bad('C5', kpi({ confidence: 'ESTIMATED', value: null }), /must be present/);
  ok('C5', kpi({ confidence: 'UNKNOWN', value: null }));
  ok('C5', kpi({ confidence: 'ESTIMATED', value: 0 }));
});
test('C5: kpi/source are non-empty after trim; kpi names are unique after trim; timestamps allow offsets', () => {
  bad('C5', kpi({ source: '   ' }), /kpis\/0\/source/);
  bad('C5', kpi({ kpi: ' ' }), /kpis\/0\/kpi/);
  const s = validOf('C5'); const k0 = (s.kpis as Row[])[0];
  bad('C5', { ...s, kpis: [k0, { ...k0, kpi: ` ${k0.kpi as string} ` }] }, /duplicate kpi/);
  ok('C5', kpi({ as_of: '2026-01-01T02:00:00+02:00' }));
  bad('C5', kpi({ as_of: '2026-02-30T00:00:00Z' }), /kpis\/0\/as_of/);
  bad('C5', { ...validOf('C5'), as_of: 'yesterday' }, /\/as_of/);
});

// ── C6 ──
test('C6: exactly one evidence form, and it must be a safe ref', () => {
  const e = validOf('C6');
  bad('C6', { ...e, evidence: {} }, /exactly one/);
  bad('C6', { ...e, evidence: { url: 'https://example.com/p', screenshot_ref: 'shots/1.png' } }, /exactly one/);
  bad('C6', { ...e, evidence: { url: 'http://example.com/p' } }, /unsafe ref/);
  bad('C6', { ...e, evidence: { measurement_ref: '../../etc/passwd' } }, /unsafe ref/);
  ok('C6', { ...e, evidence: { screenshot_ref: 'shots/2026-01/post-1.png' } });
});
test('C6: review attestation and identities are mandatory (non-empty after trim); timestamps are datetimes', () => {
  const e = validOf('C6');
  for (const f of ['reviewed_by', 'by', 'task_id', 'channel', 'app_request_id']) bad('C6', { ...e, [f]: ' \t ' }, new RegExp(`/${f} must be non-empty`));
  bad('C6', { ...e, reviewed_at: '2026-01-01' }, /reviewed_at/);
  bad('C6', { ...e, published_at: '2026-01-01T25:00:00Z' }, /published_at/);
});

// ── C7 ──
const task = (over: Row) => { const w = validOf('C7'); w.tasks = [{ ...(w.tasks as Row[])[0], ...over }]; return w; };
test('C7: completion_evidence agrees with evidence_state, and only the canonical completion pairs are allowed', () => {
  bad('C7', task({ completion_evidence: true, evidence_state: 'none' }), /completion_evidence/);
  const pairs: [string, string, boolean][] = [
    ['status_changed', 'none', true], ['status_changed', 'awaiting', false],
    ['evidence_submitted', 'awaiting', true], ['evidence_submitted', 'unreviewed', true], ['evidence_submitted', 'applied', false],
    ['evidence_reviewed', 'applied', true], ['evidence_reviewed', 'stale', true], ['evidence_reviewed', 'conflict', true], ['evidence_reviewed', 'unreviewed', false],
    ['outcome_verified', 'applied', true], ['outcome_verified', 'stale', false],
  ];
  for (const [completion, evidence_state, allowed] of pairs) {
    const v = task({ completion, evidence_state, completion_evidence: evidence_state !== 'none' });
    if (allowed) ok('C7', v); else bad('C7', v, /does not allow evidence_state/);
  }
});
test('C7: due is a date or datetime (or null); owner/dod/blockers/task_id are non-empty; task ids unique after trim', () => {
  ok('C7', task({ due: '2026-03-01' }));
  ok('C7', task({ due: null, owner: null }));
  bad('C7', task({ due: '2026-13-01' }), /due/);
  bad('C7', task({ owner: '  ' }), /owner/);
  bad('C7', task({ dod: [' '] }), /dod\/0/);
  bad('C7', task({ blockers: [''] }), /blockers\/0/);
  bad('C7', task({ updated_at: 'now' }), /updated_at/);
  const w = validOf('C7'); const t0 = (w.tasks as Row[])[0];
  bad('C7', { ...w, tasks: [t0, { ...t0, task_id: `${t0.task_id as string} ` }] }, /duplicate task_id/);
});

// ── C8 ──
const point = (over: Row) => { const w = validOf('C8'); w.points = [{ ...(w.points as Row[])[0], ...over }]; return w; };
test('C8: parent and point sourceRef are safe refs; point ids unique after trim', () => {
  bad('C8', { ...validOf('C8'), parent: '../2026-01' }, /\/parent unsafe ref/);
  bad('C8', point({ sourceRef: 'https://user:pw@example.com/p' }), /sourceRef unsafe ref/);
  const w = validOf('C8'); const p0 = (w.points as Row[])[0];
  bad('C8', { ...w, points: [p0, { ...p0, id: ` ${p0.id as string}` }] }, /duplicate point id/);
});
test('C8: identity/provenance strings are non-empty; linkedTaskIds may be omitted; at most ten points', () => {
  for (const f of ['id', 'text', 'why', 'sourceRevision']) bad('C8', point({ [f]: ' ' }), new RegExp(`points/0/${f}`));
  bad('C8', point({ linkedTaskIds: [' '] }), /linkedTaskIds\/0/);
  bad('C8', { ...validOf('C8'), week: '' }, /week/);
  bad('C8', point({ asOf: '2026-01-01' }), /points\/0\/asOf/);
  const { linkedTaskIds: _l, ...noLinks } = (validOf('C8').points as Row[])[0]; void _l;
  ok('C8', { ...validOf('C8'), points: [noLinks] });
  const p0 = (validOf('C8').points as Row[])[0];
  bad('C8', { ...validOf('C8'), points: Array.from({ length: 11 }, (_, i) => ({ ...p0, id: `p${i}` })) }, /contract_structure_invalid/);
});
