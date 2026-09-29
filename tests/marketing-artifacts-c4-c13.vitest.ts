import { expect, test } from 'vitest';
import { validateArtifact } from '../lib/marketing/validate-artifact';
import { looksLikeContact } from '../lib/marketing/contract-rules/c4-c13';
import { BINDING, validOf } from './marketing-vectors';

// T-1.5d — C4 EventsPipelineAggregate + C13 CustomerConsentAggregate: aggregates only, no PII.
// Canonical vectors run in tests/marketing-artifacts.vitest.ts.

type Kind = Parameters<typeof validateArtifact>[0];
const ok = (kind: Kind, v: unknown) => expect(() => validateArtifact(kind, v, BINDING)).not.toThrow();
const bad = (kind: Kind, v: unknown, why: RegExp) => expect(() => validateArtifact(kind, v, BINDING)).toThrow(why);
const stages = (s: [string, number][]) => ({ ...validOf('C4'), stages: s.map(([stage, count]) => ({ stage, count })) });

// ── no-PII assertions: PII cannot be represented at any level ──
test('C4: no per-lead data can ride along — unknown keys at every level and free-text stages are refused', () => {
  bad('C4', { ...validOf('C4'), leads: [{ email: 'jane@example.com' }] }, /contract_structure_invalid/);
  bad('C4', { ...validOf('C4'), stages: [{ stage: 'lead', count: 1, name: 'Jane Doe' }] }, /contract_structure_invalid/);
  for (const stage of ['jane-doe', 'jane@example.com', '+972501234567', 'Lead']) bad('C4', stages([[stage, 1]]), /contract_structure_invalid/);
});
test('C13: no per-contact data can ride along, and a channel/segment label that IS a contact is refused', () => {
  bad('C13', { ...validOf('C13'), contacts: [{ email: 'a@b.com' }] }, /contract_structure_invalid/);
  bad('C13', { ...validOf('C13'), channels: [{ channel: 'email', opted_in: 1, phone: '+972501234567' }] }, /contract_structure_invalid/);
  bad('C13', { ...validOf('C13'), segments: [{ segment: 'vip', size: 1, customer_id: 'c-1' }] }, /contract_structure_invalid/);
  bad('C13', { ...validOf('C13'), segments: [{ segment: 'dana.levi@example.com', size: 1 }] }, /segments\/0\/segment must be an aggregate label/);
  bad('C13', { ...validOf('C13'), channels: [{ channel: '+972 50-123-4567', opted_in: 1 }] }, /channels\/0\/channel must be an aggregate label/);
  ok('C13', { ...validOf('C13'), segments: [{ segment: '2026-01-15 regulars', size: 10 }, { segment: 'events@home-lovers', size: 3 }] });
});
test('looksLikeContact only matches unambiguous contact shapes', () => {
  for (const s of ['a@b.co', 'x.y+tag@mail.example.org', '+97250-123-4567', '+1 (212) 555-0100']) expect(looksLikeContact(s), s).toBe(true);
  for (const s of ['email', 'sms', 'whatsapp', 'regulars', 'cohort 2026-01-15', 'events@home', '050', 'top-10%', '+5 visits']) expect(looksLikeContact(s), s).toBe(false);
});

// ── C4 funnel rules ──
test('C4: close_rate never exceeds quote_rate', () => {
  bad('C4', { ...validOf('C4'), quote_rate: 0.1, close_rate: 0.2 }, /close_rate cannot exceed quote_rate/);
  ok('C4', { ...validOf('C4'), quote_rate: 0.2, close_rate: 0.2 });
});
test('C4: funnel counts are non-increasing and the closed total never exceeds any present upstream stage', () => {
  bad('C4', stages([['lead', 10], ['qualified', 11]]), /qualified count \(11\) cannot exceed the earlier funnel stage lead/);
  bad('C4', stages([['lead', 10], ['quoted', 12]]), /quoted count/); // a skipped middle stage still compares to the last present one
  bad('C4', stages([['lead', 10], ['qualified', 5], ['closed_won', 4], ['closed_lost', 2]]), /closed count \(6\) cannot exceed the qualified count/);
  bad('C4', stages([['quoted', 3], ['closed_lost', 4]]), /closed count \(4\) cannot exceed the quoted count/);
  ok('C4', stages([['lead', 10], ['qualified', 5], ['quoted', 5], ['closed_won', 3], ['closed_lost', 2]]));
  ok('C4', stages([['closed_won', 3]])); // no upstream stage present → nothing to compare
});
test('C4: stages are unique; timestamps are datetimes', () => {
  bad('C4', stages([['lead', 10], ['lead', 10]]), /duplicate stage/);
  bad('C4', { ...validOf('C4'), as_of: '2026-01-01' }, /\/as_of/);
});

// ── C13 ──
test('C13: channel/segment names are non-empty and unique after trim; segments default to empty', () => {
  bad('C13', { ...validOf('C13'), channels: [{ channel: ' ', opted_in: 1 }] }, /channels\/0\/channel/);
  bad('C13', { ...validOf('C13'), channels: [{ channel: 'email', opted_in: 1 }, { channel: 'email ', opted_in: 2 }] }, /duplicate channel/);
  bad('C13', { ...validOf('C13'), segments: [{ segment: 'vip', size: 1 }, { segment: ' vip', size: 2 }] }, /duplicate segment/);
  const { segments: _s, ...noSegments } = validOf('C13'); void _s;
  ok('C13', noSegments);
  bad('C13', { ...validOf('C13'), as_of: 'now' }, /\/as_of/);
});
