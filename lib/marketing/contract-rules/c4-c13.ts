import c4Schema from '../contracts/C4.schema.json';
import c13Schema from '../contracts/C13.schema.json';
import { requireNonEmpty, requireTimestamp, requireUnique, rows, trimmed, violation } from './rules';
import { contract, type Envelope } from './spec';

// Canonical source: marketing-os `schemas/contracts/c4-c8.ts` (C4) and `c9-c14.ts` (C13).
// Both are AGGREGATES ONLY (MKT-F14, F15). The canonical contracts make lead/contact PII
// unrepresentable structurally: `.strict()` objects at every level (the vendored schemas carry
// `additionalProperties: false`) and a CLOSED pipeline-stage vocabulary, so no per-lead or
// per-contact field or free-text stage can carry a name/email/phone/customer id.

export type PipelineStageId = 'lead' | 'qualified' | 'quoted' | 'closed_won' | 'closed_lost';
/** C4 — EventsPipelineAggregate v1: stage counts + funnel rates + SLA breaches. No per-lead field. */
export type EventsPipelineAggregate = Envelope & {
  as_of: string; stages: { stage: PipelineStageId; count: number }[]; quote_rate: number; close_rate: number; sla_breaches: number;
};
/** C13 — CustomerConsentAggregate v1: opted-in counts per channel + segment sizes. No contacts. */
export type CustomerConsentAggregate = Envelope & {
  as_of: string; channels: { channel: string; opted_in: number }[]; segments?: { segment: string; size: number }[];
};

/** Funnel stages whose counts must be monotonically non-increasing. */
const FUNNEL_ORDER = ['lead', 'qualified', 'quoted'] as const;

/**
 * App-side no-PII guard for the only free-text labels in these aggregates (C13 channel and segment
 * names). STRICTER than the canonical contract, deliberately and narrowly: a label that is itself an
 * email address or an international phone number is a contact leaking through an aggregate label, so
 * it is refused. Only unambiguous shapes are matched (an `x@y.tld` address; a `+`-prefixed number of
 * 8+ digits) so ordinary labels — including dated cohorts like "2026-01-15 regulars" — never trip it.
 */
const EMAIL_SHAPE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_SHAPE = /\+\d(?:[\s().-]*\d){7,}/;
export function looksLikeContact(label: string): boolean { return EMAIL_SHAPE.test(label) || PHONE_SHAPE.test(label); }

function requireAggregateLabel(v: string, path: string) {
  requireNonEmpty(v, path);
  if (looksLikeContact(v)) violation(path, 'must be an aggregate label, not a contact (no PII)');
}

export const C4_C13_CONTRACTS = {
  C4: contract<EventsPipelineAggregate>({
    schema: c4Schema, envelope: true, bound: false,
    check: (a) => {
      requireTimestamp(a.as_of, '/as_of');
      requireUnique(a.stages, (s) => s.stage, '/stages', 'stage');
      if (a.close_rate > a.quote_rate) violation('/close_rate', 'cannot exceed quote_rate');
      const counts = new Map(a.stages.map((s) => [s.stage, s.count]));
      let prev: { name: string; count: number } | undefined;
      for (const name of FUNNEL_ORDER) {
        const c = counts.get(name);
        if (c === undefined) continue;
        if (prev && c > prev.count) violation('/stages', `${name} count (${c}) cannot exceed the earlier funnel stage ${prev.name} (${prev.count})`);
        prev = { name, count: c };
      }
      // The closed total cannot exceed ANY present upstream stage (omitting `quoted` cannot hide it).
      if (counts.has('closed_won') || counts.has('closed_lost')) {
        const closed = (counts.get('closed_won') ?? 0) + (counts.get('closed_lost') ?? 0);
        for (const name of FUNNEL_ORDER) {
          const c = counts.get(name);
          if (c !== undefined && closed > c) violation('/stages', `closed count (${closed}) cannot exceed the ${name} count (${c})`);
        }
      }
    },
  }),
  C13: contract<CustomerConsentAggregate>({
    schema: c13Schema, envelope: true, bound: false,
    check: (a) => {
      requireTimestamp(a.as_of, '/as_of');
      a.channels.forEach((c, i) => requireAggregateLabel(c.channel, `/channels/${i}/channel`));
      rows(a.segments).forEach((s, i) => requireAggregateLabel(s.segment, `/segments/${i}/segment`));
      requireUnique(a.channels, (c) => trimmed(c.channel), '/channels', 'channel');
      requireUnique(rows(a.segments), (s) => trimmed(s.segment), '/segments', 'segment');
    },
  }),
};
