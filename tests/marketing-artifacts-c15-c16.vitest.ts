import { expect, test } from 'vitest';
import { validateArtifact, type ArtifactContext } from '../lib/marketing/validate-artifact';
import { BINDING, CARD, validOf } from './marketing-vectors';

// T-1.5e — C15 OutcomeEvidence + C16 ExecutionReceipt: mandatory review attestation, approval linkage.
// Canonical vectors run in tests/marketing-artifacts.vitest.ts.

type Row = Record<string, unknown>;
const HASH = 'a'.repeat(64);
const queueOf = (items: { approval_id: string; content_hash?: string; state: string }[], over: Row = {}) =>
  validateArtifact('C2a', { ...validOf('C2a'), ...over, items: items.map(i => ({ content_hash: HASH, ...CARD, ...i })) }, BINDING);
const APPROVED: ArtifactContext = { approvalQueue: queueOf([{ approval_id: 'a1', state: 'approved' }]) };
const ok = (kind: 'C15' | 'C16', v: unknown, ctx: ArtifactContext = APPROVED) => expect(() => validateArtifact(kind, v, BINDING, ctx)).not.toThrow();
const bad = (kind: 'C15' | 'C16', v: unknown, why: RegExp, ctx: ArtifactContext = APPROVED) => expect(() => validateArtifact(kind, v, BINDING, ctx)).toThrow(why);
const outcome = (over: Row) => ({ ...validOf('C15'), ...over });
const receipt = (over: Row) => ({ ...validOf('C16'), ...over });

// ── review attestation (both) ──
test('C15/C16: the review attestation is mandatory — reviewed_by non-empty after trim, reviewed_at a datetime', () => {
  for (const kind of ['C15', 'C16'] as const) {
    const v = kind === 'C15' ? outcome({}) : receipt({});
    const { reviewed_by: _r, ...unreviewed } = v; void _r;
    bad(kind, unreviewed, /contract_structure_invalid/);
    bad(kind, { ...v, reviewed_by: '   ' }, /reviewed_by must be non-empty/);
    bad(kind, { ...v, reviewed_at: '2026-01-01' }, /reviewed_at/);
    bad(kind, { ...v, app_request_id: ' ' }, /app_request_id/);
    ok(kind, { ...v, reviewed_at: '2026-01-01T03:00:00+03:00' });
  }
});

test('C15/C16: binding_version must be the current binding (409 when stale)', () => {
  bad('C15', outcome({ binding_version: 2 }), /stale_binding_version/);
  bad('C16', receipt({ binding_version: 2 }), /stale_binding_version/);
});

// ── C15 ──
test('C15: exactly one measurement form; refs are safe; measured values never fabricate an UNKNOWN', () => {
  bad('C15', outcome({ measurement: {} }), /exactly one/);
  bad('C15', outcome({ measurement: { kpi_snapshot_ref: 'exports/k.json', ingest_manifest_ref: 'exports/i.json' } }), /exactly one/);
  bad('C15', outcome({ measurement: { ingest_manifest_ref: 'https://a:b@example.com/i.json' } }), /ingest_manifest_ref unsafe ref/);
  bad('C15', outcome({ measurement: { kpi_snapshot_ref: '/abs/k.json' } }), /kpi_snapshot_ref unsafe ref/);
  bad('C15', outcome({ measurement: { measured_values: [{ metric: 'reach', value: 3, confidence: 'UNKNOWN' }] } }), /never fabricated/);
  bad('C15', outcome({ measurement: { measured_values: [{ metric: 'reach', value: null, confidence: 'ESTIMATED' }] } }), /must be present/);
  bad('C15', outcome({ measurement: { measured_values: [{ metric: ' ', value: 1, confidence: 'KNOWN' }] } }), /metric/);
  bad('C15', outcome({ measurement: { measured_values: [] } }), /contract_structure_invalid/);
  ok('C15', outcome({ measurement: { measured_values: [{ metric: 'reach', value: null, confidence: 'UNKNOWN' }] } }));
});
test('C15: task id and every DoD criterion met are non-empty', () => {
  bad('C15', outcome({ task_id: ' ' }), /task_id/);
  bad('C15', outcome({ dod_criteria_met: ['shipped', ' '] }), /dod_criteria_met\/1/);
  bad('C15', outcome({ dod_criteria_met: [] }), /contract_structure_invalid/);
});

// ── C16 approval linkage ──
test('C16: linkage fails closed without the imported approval queue', () => {
  bad('C16', receipt({}), /requires the imported C2a approval queue/, {});
});
test('C16: only an APPROVED item with the exact approved content can be executed', () => {
  bad('C16', receipt({ approval_id: 'a9' }), /unknown approval "a9"/);
  bad('C16', receipt({}), /stale linkage/, { approvalQueue: queueOf([{ approval_id: 'a1', content_hash: 'b'.repeat(64), state: 'approved' }]) });
  for (const state of ['pending', 'rejected', 'expired']) {
    bad('C16', receipt({}), new RegExp(`is ${state}, not approved`), { approvalQueue: queueOf([{ approval_id: 'a1', state }]) });
  }
  bad('C16', receipt({}), /ambiguous approval/, { approvalQueue: queueOf([{ approval_id: 'a1', state: 'approved' }, { approval_id: 'a1', state: 'approved' }]) });
  ok('C16', receipt({ approval_id: ' a1 ' })); // the canonical NonEmpty id is trimmed before linking
});
test('C16: an approval queue from another tenant never links', () => {
  const foreign = { approvalQueue: { ...queueOf([{ approval_id: 'a1', state: 'approved' }]), marketingBusiness: 'other-biz' } };
  bad('C16', receipt({}), /another tenant/, foreign);
});

// ── C16 evidence ──
test('C16: the executed pack is a mandatory safe ref; optional pointers are safe / non-empty', () => {
  bad('C16', receipt({ evidence: { pack_ref: '../packs/p.json' } }), /pack_ref unsafe ref/);
  bad('C16', receipt({ evidence: { pack_ref: 'packs/p.json', url: 'javascript:alert(1)' } }), /evidence\/url unsafe ref/);
  bad('C16', receipt({ evidence: { pack_ref: 'packs/p.json', screenshot_ref: 'a//b.png' } }), /screenshot_ref unsafe ref/);
  bad('C16', receipt({ evidence: { pack_ref: 'packs/p.json', external_ref: '  ' } }), /external_ref/);
  bad('C16', receipt({ executed_by: '' }), /executed_by/);
  bad('C16', receipt({ executed_at: 'yesterday' }), /executed_at/);
  bad('C16', receipt({ action_type: 'publish' }), /contract_structure_invalid/); // a publish resolves via C6, never a receipt
  ok('C16', receipt({ evidence: { pack_ref: 'packs/p.json', screenshot_ref: 'shots/receipt-1.png', external_ref: 'provider-msg-1' } }));
});
