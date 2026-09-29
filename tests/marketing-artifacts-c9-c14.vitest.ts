import { expect, test } from 'vitest';
import { validateArtifact } from '../lib/marketing/validate-artifact';
import { BINDING, validOf } from './marketing-vectors';

// T-1.5c — C9 IngestManifest, C10 IntegrationStatus, C11 SkillsStatus, C12 CampaignArtifacts,
// C14 MonthlyPlan. Canonical vectors run in tests/marketing-artifacts.vitest.ts.

type Row = Record<string, unknown>;
type Kind = Parameters<typeof validateArtifact>[0];
const ok = (kind: Kind, v: unknown) => expect(() => validateArtifact(kind, v, BINDING)).not.toThrow();
const bad = (kind: Kind, v: unknown, why: RegExp) => expect(() => validateArtifact(kind, v, BINDING)).toThrow(why);
const withRow = (kind: string, key: string, over: Row) => { const v = validOf(kind); v[key] = [{ ...(v[key] as Row[])[0], ...over }]; return v; };

// ── C9 ──
test('C9: FRESH/STALE sources need an as_of; UNKNOWN sources have no rows; sources unique after trim', () => {
  bad('C9', withRow('C9', 'sources', { status: 'STALE', as_of: null }), /STALE source must have an as_of/);
  bad('C9', withRow('C9', 'sources', { status: 'UNKNOWN', as_of: null, rows: 3 }), /UNKNOWN source has no rows/);
  ok('C9', withRow('C9', 'sources', { status: 'UNKNOWN', as_of: null, rows: 0 }));
  ok('C9', withRow('C9', 'sources', { status: 'UNKNOWN', as_of: '2026-01-01T00:00:00Z', rows: 0 })); // canonical allows a stale timestamp on UNKNOWN
  bad('C9', withRow('C9', 'sources', { source: ' ' }), /sources\/0\/source/);
  bad('C9', withRow('C9', 'sources', { as_of: '2026-01-01' }), /sources\/0\/as_of/);
  const m = validOf('C9'); const s0 = (m.sources as Row[])[0];
  bad('C9', { ...m, sources: [s0, { ...s0, source: `${s0.source as string}\t` }] }, /duplicate source/);
});

// ── C10 ──
test('C10: verified <=> verified_at + verified_by; never a credential field; ids unique', () => {
  bad('C10', withRow('C10', 'integrations', { status: 'verified', verified_by: null }), /requires verified_at and verified_by/);
  bad('C10', withRow('C10', 'integrations', { status: 'unverified', verified_at: '2026-01-01T00:00:00Z', verified_by: null }), /must not carry/);
  ok('C10', withRow('C10', 'integrations', { status: 'unverified', verified_at: null, verified_by: null }));
  bad('C10', withRow('C10', 'integrations', { api_key: 'sk-live-123' }), /contract_structure_invalid/);
  bad('C10', { ...validOf('C10'), secret: 'x' }, /contract_structure_invalid/);
  bad('C10', withRow('C10', 'integrations', { verified_by: '  ' }), /verified_by/);
  bad('C10', withRow('C10', 'integrations', { verified_at: 'today' }), /verified_at/);
  const s = validOf('C10'); const i0 = (s.integrations as Row[])[0];
  bad('C10', { ...s, integrations: [i0, { ...i0, id: ` ${i0.id as string}` }] }, /duplicate integration id/);
});

// ── C11 ──
test('C11: a PRODUCTION skill needs a golden example and a replay score; skills unique', () => {
  bad('C11', withRow('C11', 'skills', { status: 'PRODUCTION', golden_count: 0, last_replay_score: 0.5 }), /golden example/);
  bad('C11', withRow('C11', 'skills', { status: 'PRODUCTION', golden_count: 1, last_replay_score: null }), /replay score/);
  ok('C11', withRow('C11', 'skills', { status: 'TESTING', golden_count: 0, last_replay_score: null }));
  bad('C11', withRow('C11', 'skills', { skill: ' ' }), /skills\/0\/skill/);
  const s = validOf('C11'); const k0 = (s.skills as Row[])[0];
  bad('C11', { ...s, skills: [k0, { ...k0, skill: `${k0.skill as string} ` }] }, /duplicate skill/);
});

// ── C12 ──
test('C12: asset refs are safe and keep a provenance label; publish packs reference known campaigns', () => {
  bad('C12', withRow('C12', 'asset_refs', { ref: 'https://evil@example.com/x.png' }), /asset_refs\/0\/ref unsafe ref/);
  bad('C12', withRow('C12', 'asset_refs', { disclosure: ' ' }), /disclosure/);
  ok('C12', withRow('C12', 'asset_refs', { provenance: 'ai_concept', disclosure: 'AI concept — not a real photo' }));
  const a = validOf('C12');
  bad('C12', { ...a, manual_publish_packs: [{ id: 'mp1', campaign_id: 'nope', instructions: 'post it' }] }, /unknown campaign/);
  ok('C12', { ...a, manual_publish_packs: [{ id: 'mp1', campaign_id: ' c1 ', instructions: 'post it' }] });
  ok('C12', { ...a, manual_publish_packs: [{ id: 'mp1', instructions: 'post it' }] });
});
test('C12: collections default to empty; entries are non-empty, dated, and unique after trim', () => {
  const { schemaVersion, sourceRevision, asOf, marketingBusiness } = validOf('C12');
  ok('C12', { schemaVersion, sourceRevision, asOf, marketingBusiness });
  const a = validOf('C12');
  bad('C12', withRow('C12', 'campaigns', { audiences: [' '] }), /audiences\/0/);
  bad('C12', withRow('C12', 'campaigns', { tracking_spec: '  ' }), /tracking_spec/);
  bad('C12', { ...a, content_calendar: [{ id: 'e1', date: '2026-02-30', channel: 'ig', status: 'planned' }] }, /content_calendar\/0\/date/);
  ok('C12', { ...a, content_calendar: [{ id: 'e1', date: '2026-02-28', channel: 'ig', status: 'planned' }] });
  const c0 = (a.campaigns as Row[])[0];
  bad('C12', { ...a, campaigns: [c0, { ...c0, id: 'c1 ' }] }, /duplicate campaign id/);
  bad('C12', { ...a, content_calendar: [{ id: 'e', date: '2026-01-01', channel: 'ig', status: 's' }, { id: ' e', date: '2026-01-02', channel: 'ig', status: 's' }] }, /duplicate content entry id/);
  bad('C12', { ...a, manual_publish_packs: [{ id: 'p', instructions: 'x' }, { id: 'p ', instructions: 'y' }] }, /duplicate publish pack id/);
});

// ── C14 ──
test('C14: objectives carry safe provenance; approvalRef is validated as a pointer only (MKT-GOV05)', () => {
  bad('C14', withRow('C14', 'objectives', { approvalRef: '../approvals/a1.yaml' }), /approvalRef unsafe ref/);
  bad('C14', withRow('C14', 'objectives', { sourceRef: 'file:///etc/passwd' }), /sourceRef unsafe ref/);
  // An approvalRef that names no imported approval — or one the queue says was rejected — still
  // validates: validation never resolves or trusts the reference (it authorizes nothing).
  const rejectedQueue = { ...validOf('C2a'), items: [{ approval_id: 'a1', content_hash: 'a'.repeat(64), state: 'rejected' }] };
  expect(() => validateArtifact('C14', withRow('C14', 'objectives', { approvalRef: 'approvals/a1.yaml' }), BINDING, { approvalQueue: rejectedQueue as never })).not.toThrow();
  ok('C14', withRow('C14', 'objectives', { approvalRef: 'approvals/unknown.yaml' }));
  bad('C14', withRow('C14', 'objectives', { owner: ' ' }), /objectives\/0\/owner/);
  bad('C14', withRow('C14', 'objectives', { asOf: '2026-01-01' }), /objectives\/0\/asOf/);
});
test('C14: month id, trimmed identities, and unique objectives / kpi targets', () => {
  bad('C14', { ...validOf('C14'), month: '2026-13' }, /month/);
  bad('C14', { ...validOf('C14'), themes: ['  '] }, /themes\/0/);
  bad('C14', withRow('C14', 'kpi_targets', { kpi: ' ' }), /kpi_targets\/0\/kpi/);
  const m = validOf('C14'); const o0 = (m.objectives as Row[])[0]; const k0 = (m.kpi_targets as Row[])[0];
  bad('C14', { ...m, objectives: [o0, { ...o0, id: ` ${o0.id as string}` }] }, /duplicate objective id/);
  bad('C14', { ...m, kpi_targets: [k0, { ...k0, kpi: `${k0.kpi as string} ` }] }, /duplicate kpi target/);
  const { themes: _t, kpi_targets: _k, ...minimal } = m; void _t; void _k;
  ok('C14', minimal);
});
