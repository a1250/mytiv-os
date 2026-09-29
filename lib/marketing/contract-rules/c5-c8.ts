import c5Schema from '../contracts/C5.schema.json';
import c6Schema from '../contracts/C6.schema.json';
import c7Schema from '../contracts/C7.schema.json';
import c8Schema from '../contracts/C8.schema.json';
import { requireDateOrTimestamp, requireNonEmpty, requireSafeRef, requireTimestamp, requireUnique, rows, trimmed, violation } from './rules';
import { contract, type Envelope } from './spec';

// Canonical source: marketing-os `schemas/contracts/c4-c8.ts` (C5–C8).

export type Confidence = 'KNOWN' | 'ESTIMATED' | 'UNKNOWN';

/** C5 — KpiSnapshot v1. `value` is null exactly when the KPI is UNKNOWN (never fabricated). */
export type KpiEntry = { kpi: string; value: number | null; confidence: Confidence; tier: 'T1' | 'T2' | 'T3'; as_of: string; source: string };
export type KpiSnapshot = Envelope & { as_of: string; kpis: KpiEntry[] };

/** C6 — PublishEvidence v1 (app → engine); exactly one evidence form; review attestation mandatory. */
export type PublishEvidence = Envelope & {
  task_id: string; task_hash: string; channel: string;
  evidence: { url?: string; screenshot_ref?: string; measurement_ref?: string };
  published_at: string; by: string; reviewed_by: string; reviewed_at: string; app_request_id: string;
};

export type CompletionState = 'status_changed' | 'evidence_submitted' | 'evidence_reviewed' | 'outcome_verified';
export type EvidenceState = 'none' | 'awaiting' | 'applied' | 'stale' | 'conflict' | 'unreviewed';
/** C7 — WorkboardExport v1 (authoritative status after C6). */
export type WorkboardTask = {
  task_id: string; task_hash: string; status: string; owner: string | null; due: string | null;
  dod: string[]; blockers: string[]; stale: boolean; completion_evidence: boolean;
  completion: CompletionState; evidence_state: EvidenceState; updated_at: string;
};
export type WorkboardExport = Envelope & { as_of: string; tasks: WorkboardTask[] };

/** C8 — WeeklyPriorities v1 (child of a C14 MonthlyPlan via `parent`). */
export type WeeklyPoint = {
  id: string; text: string; why: string; linkedTaskIds?: string[];
  sourceRef: string; sourceRevision: string; asOf: string; confidence: Confidence;
};
export type WeeklyPriorities = Envelope & { week: string; parent: string; as_of: string; points: WeeklyPoint[] };

/** The canonical (completion → allowed evidence_state) pairs. */
const ALLOWED_EVIDENCE: Record<CompletionState, readonly EvidenceState[]> = {
  status_changed: ['none'],
  evidence_submitted: ['awaiting', 'unreviewed'],
  evidence_reviewed: ['applied', 'stale', 'conflict'],
  outcome_verified: ['applied'],
};

/** A value is a real number only when KNOWN/ESTIMATED; UNKNOWN always carries null. */
export function checkValueConfidence(value: number | null, confidence: Confidence, path: string) {
  if (confidence === 'UNKNOWN' && value !== null) violation(path, 'an UNKNOWN value must be null (never fabricated)');
  if (confidence !== 'UNKNOWN' && value === null) violation(path, 'a KNOWN/ESTIMATED value must be present');
}

export const C5_C8_CONTRACTS = {
  C5: contract<KpiSnapshot>({
    schema: c5Schema, envelope: true, bound: false,
    check: (s) => {
      requireTimestamp(s.as_of, '/as_of');
      s.kpis.forEach((k, i) => {
        requireNonEmpty(k.kpi, `/kpis/${i}/kpi`);
        requireNonEmpty(k.source, `/kpis/${i}/source`);
        requireTimestamp(k.as_of, `/kpis/${i}/as_of`);
        checkValueConfidence(k.value, k.confidence, `/kpis/${i}/value`);
      });
      requireUnique(s.kpis, (k) => trimmed(k.kpi), '/kpis', 'kpi');
    },
  }),
  C6: contract<PublishEvidence>({
    schema: c6Schema, envelope: true, bound: false,
    check: (e) => {
      for (const f of ['task_id', 'channel', 'by', 'reviewed_by', 'app_request_id'] as const) requireNonEmpty(e[f], `/${f}`);
      requireTimestamp(e.published_at, '/published_at');
      requireTimestamp(e.reviewed_at, '/reviewed_at');
      const forms = (['url', 'screenshot_ref', 'measurement_ref'] as const).filter((f) => e.evidence[f] !== undefined);
      if (forms.length !== 1) violation('/evidence', 'exactly one of url / screenshot_ref / measurement_ref must be provided');
      requireSafeRef(e.evidence[forms[0]], `/evidence/${forms[0]}`);
    },
  }),
  C7: contract<WorkboardExport>({
    schema: c7Schema, envelope: true, bound: false,
    check: (w) => {
      requireTimestamp(w.as_of, '/as_of');
      w.tasks.forEach((t, i) => {
        const p = `/tasks/${i}`;
        requireNonEmpty(t.task_id, `${p}/task_id`);
        if (t.owner !== null) requireNonEmpty(t.owner, `${p}/owner`);
        if (t.due !== null) requireDateOrTimestamp(t.due, `${p}/due`);
        t.dod.forEach((d, j) => requireNonEmpty(d, `${p}/dod/${j}`));
        t.blockers.forEach((b, j) => requireNonEmpty(b, `${p}/blockers/${j}`));
        requireTimestamp(t.updated_at, `${p}/updated_at`);
        if (t.completion_evidence !== (t.evidence_state !== 'none')) violation(`${p}/completion_evidence`, "must match evidence_state (present iff not 'none')");
        if (!ALLOWED_EVIDENCE[t.completion].includes(t.evidence_state)) violation(`${p}/evidence_state`, `completion '${t.completion}' does not allow evidence_state '${t.evidence_state}'`);
      });
      requireUnique(w.tasks, (t) => trimmed(t.task_id), '/tasks', 'task_id');
    },
  }),
  C8: contract<WeeklyPriorities>({
    schema: c8Schema, envelope: true, bound: false,
    check: (w) => {
      requireNonEmpty(w.week, '/week');
      requireSafeRef(w.parent, '/parent');
      requireTimestamp(w.as_of, '/as_of');
      w.points.forEach((pt, i) => {
        const p = `/points/${i}`;
        for (const f of ['id', 'text', 'why', 'sourceRevision'] as const) requireNonEmpty(pt[f], `${p}/${f}`);
        rows(pt.linkedTaskIds).forEach((id, j) => requireNonEmpty(id, `${p}/linkedTaskIds/${j}`));
        requireSafeRef(pt.sourceRef, `${p}/sourceRef`);
        requireTimestamp(pt.asOf, `${p}/asOf`);
      });
      requireUnique(w.points, (pt) => trimmed(pt.id), '/points', 'point id');
    },
  }),
};
