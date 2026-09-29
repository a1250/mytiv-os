import { expect, test } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { ARTIFACT_KINDS, isArtifactKind, validateArtifact, type ArtifactKind } from '../lib/marketing/validate-artifact';
import { isDateOnly, isDateTimeZ, isSafeRef, isTimestamp } from '../lib/marketing/contract-rules/rules';
import parity from './fixtures/marketing-canonical-parity.json';

// Vendored canonical vectors use this tenant. They are context-free (they carry different
// binding_versions), so the vector runs do not pin a caller binding version; rule tests do.
const VECTOR_BINDING = { marketingBusiness: 'demo-biz' };
const BINDING = { marketingBusiness: 'demo-biz', bindingVersion: 1 };
const DIR = path.join(process.cwd(), 'lib/marketing/contracts');
type Vectors = { valid: unknown[]; invalid: unknown[] };
const vectors = (kind: string): Vectors => JSON.parse(readFileSync(path.join(DIR, `${kind}.vectors.json`), 'utf8'));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

// ── every vendored contract is registered, and every registered kind is vendored ──
test('every vendored non-C1 contract is a registered artifact kind (and vice versa)', () => {
  const vendored = readdirSync(DIR).filter(f => f.endsWith('.schema.json')).map(f => f.replace('.schema.json', '')).filter(k => k !== 'C1');
  expect([...ARTIFACT_KINDS].sort()).toEqual(vendored.sort());
});

// ── canonical vectors through the composed app validator ──
test('every valid canonical vector passes validateArtifact', () => {
  for (const kind of ARTIFACT_KINDS) {
    vectors(kind).valid.forEach((v, i) => expect(() => validateArtifact(kind, clone(v), VECTOR_BINDING, contextFor(kind)), `${kind} valid[${i}]`).not.toThrow());
  }
});

test('every invalid canonical vector is rejected by validateArtifact', () => {
  for (const kind of ARTIFACT_KINDS) {
    vectors(kind).invalid.forEach((v, i) => expect(() => validateArtifact(kind, clone(v), VECTOR_BINDING, contextFor(kind)), `${kind} invalid[${i}]`).toThrow());
  }
});

// C16 receipts must link to an APPROVED item of the imported C2a queue: the vector runs supply a
// queue approving every approval the C16 vectors reference, with the content they carry.
function contextFor(kind: ArtifactKind) {
  if (kind !== 'C16') return {};
  const receipts = vectors('C16').valid as { approval_id: string; content_hash: string }[];
  const queue = { ...(vectors('C2a').valid[0] as object), items: receipts.map(r => ({ approval_id: r.approval_id, content_hash: r.content_hash, state: 'approved' })) };
  return { approvalQueue: validateArtifact('C2a', queue, VECTOR_BINDING) };
}

// ── vendored bytes = recorded canonical hashes ──
test('every vendored contract file matches HASHES.md, and every file is recorded', () => {
  const hashes = readFileSync(path.join(DIR, 'HASHES.md'), 'utf8');
  const recorded = new Map([...hashes.matchAll(/^\| (\S+\.json) \| ([0-9a-f]{64}) \|$/gm)].map(m => [m[1], m[2]]));
  const files = readdirSync(DIR).filter(f => f.endsWith('.json'));
  expect([...recorded.keys()].sort()).toEqual(files.sort());
  for (const f of files) expect(createHash('sha256').update(readFileSync(path.join(DIR, f))).digest('hex'), f).toBe(recorded.get(f));
});

// ── exact parity with the canonical zod formats and isSafeRef (fixture generated from marketing-os) ──
test('datetime/date checks agree with canonical zod on every fixture case', () => {
  for (const c of parity.datetime) {
    expect(isDateTimeZ(c.s), `datetime() ${JSON.stringify(c.s)}`).toBe(c.z);
    expect(isTimestamp(c.s), `datetime({offset}) ${JSON.stringify(c.s)}`).toBe(c.offset);
    expect(isDateOnly(c.s), `date() ${JSON.stringify(c.s)}`).toBe(c.date);
  }
});

test('isSafeRef agrees with the canonical isSafeRef on every fixture case', () => {
  for (const c of parity.safeRef) expect(isSafeRef(c.s), JSON.stringify(c.s)).toBe(c.ok);
});

// ── generic gates ──
test('unregistered kinds are refused (C1 has its own validator; prototype keys are not kinds)', () => {
  for (const k of ['C1', 'C99', 'toString', '__proto__', 'constructor', '', 42]) {
    expect(isArtifactKind(k), String(k)).toBe(false);
    expect(() => validateArtifact(k as ArtifactKind, {}, BINDING)).toThrow('unsupported_artifact_kind');
  }
});

test('an envelope artifact for another tenant is refused', () => {
  const v = clone(vectors('C2a').valid[0]);
  expect(() => validateArtifact('C2a', v, { marketingBusiness: 'other-biz' })).toThrow('contract_scope_or_version_mismatch');
});

test('an artifact whose asOf is in the future (beyond clock skew) is refused; seconds-less UTC asOf is canonical', () => {
  const v = clone(vectors('C2a').valid[0]) as Record<string, unknown>;
  expect(() => validateArtifact('C2a', { ...v, asOf: new Date(Date.now() + 600_000).toISOString() }, BINDING)).toThrow(/asOf must not be in the future/);
  expect(() => validateArtifact('C2a', { ...v, asOf: new Date(Date.now() + 60_000).toISOString() }, BINDING)).not.toThrow();
  expect(() => validateArtifact('C2a', { ...v, asOf: '2026-01-01T00:00Z' }, BINDING)).not.toThrow();
  expect(() => validateArtifact('C2a', { ...v, asOf: '2026-01-01T00:00:00+02:00' }, BINDING)).toThrow(/asOf/); // envelope asOf is UTC-only
  expect(() => validateArtifact('C2a', { ...v, asOf: '2026-02-30T00:00:00Z' }, BINDING)).toThrow(/asOf/);
});

test('an unknown top-level field is refused structurally', () => {
  const v = clone(vectors('C2a').valid[0]) as Record<string, unknown>;
  expect(() => validateArtifact('C2a', { ...v, token: 'secret' }, BINDING)).toThrow('contract_structure_invalid');
});

test('a bound payload with a stale binding_version is refused with 409; absent caller version is not enforced', () => {
  for (const kind of ['C2b', 'C3b'] as const) {
    const v = clone(vectors(kind).valid[0]);
    try { validateArtifact(kind, v, { ...BINDING, bindingVersion: 2 }); throw new Error('accepted'); }
    catch (e) { expect((e as Error).message, kind).toBe('stale_binding_version'); expect((e as { status?: number }).status).toBe(409); }
    expect(() => validateArtifact(kind, v, { marketingBusiness: 'demo-biz' })).not.toThrow();
  }
});

// ── C2/C3 contextual rules (the canonical refinements the JSON Schema cannot carry) ──
test('C2b decided_at must be a UTC datetime (canonical .datetime(), no offset)', () => {
  const v = clone(vectors('C2b').valid[0]) as Record<string, unknown>;
  expect(() => validateArtifact('C2b', { ...v, decided_at: '2026-01-01T00:00:00+02:00' }, BINDING)).toThrow(/decided_at/);
  expect(() => validateArtifact('C2b', { ...v, decided_at: '2026-02-29T00:00:00Z' }, BINDING)).toThrow(/decided_at/);
  expect(() => validateArtifact('C2b', { ...v, decided_at: 'not-a-date' }, BINDING)).toThrow(/decided_at/);
});

test('C3b requires old AND new to be present; explicit null is allowed', () => {
  const v = clone(vectors('C3b').valid[0]) as Record<string, unknown>;
  const { old: _old, ...noOld } = v; void _old;
  expect(() => validateArtifact('C3b', noOld, BINDING)).toThrow(/\/old is required/);
  expect(() => validateArtifact('C3b', { ...v, old: null, new: null }, BINDING)).not.toThrow();
  expect(() => validateArtifact('C3b', { ...v, new: undefined }, BINDING)).toThrow(/\/new/);
});

test('C3a open proposals are held to the C3b old/new rule', () => {
  const proposal = clone(vectors('C3b').valid[0]) as Record<string, unknown>;
  const { new: _new, ...noNew } = proposal; void _new;
  const status = clone(vectors('C3a').valid[0]) as Record<string, unknown>;
  expect(() => validateArtifact('C3a', { ...status, open_proposals: [proposal] }, BINDING)).not.toThrow();
  expect(() => validateArtifact('C3a', { ...status, open_proposals: [proposal, noNew] }, BINDING)).toThrow(/\/open_proposals\/1\/new is required/);
});

test('validateArtifact returns the validated payload unchanged', () => {
  const v = clone(vectors('C2a').valid[0]);
  expect(validateArtifact('C2a', v, BINDING)).toBe(v);
});
