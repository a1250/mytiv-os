import c15Schema from '../contracts/C15.schema.json';
import c16Schema from '../contracts/C16.schema.json';
import { requireNonEmpty, requireSafeRef, requireTimestamp, trimmed, violation } from './rules';
import { contract, type ArtifactContext, type Envelope } from './spec';
import { checkValueConfidence, type Confidence } from './c5-c8';

// Canonical source: marketing-os `schemas/contracts/c15-c16.ts`. Both are app → engine artifacts
// with a MANDATORY review attestation (`reviewed_by` / `reviewed_at`) and a `binding_version`.

/** C15 — OutcomeEvidence v1 (distinct from C6 publication evidence): exactly one measurement form. */
export type MeasuredValue = { metric: string; value: number | null; confidence: Confidence };
export type OutcomeEvidence = Envelope & {
  task_id: string; task_hash: string; dod_criteria_met: string[];
  measurement: { ingest_manifest_ref?: string; kpi_snapshot_ref?: string; measured_values?: MeasuredValue[] };
  reviewed_by: string; reviewed_at: string; app_request_id: string; binding_version: number;
};

/** C16 — ExecutionReceipt v1: resolves a decided campaign/message approval to `applied`. */
export type ExecutionReceipt = Envelope & {
  approval_id: string; content_hash: string; action_type: 'campaign_activation' | 'message_batch';
  executed_by: string; executed_at: string;
  evidence: { pack_ref: string; external_ref?: string; url?: string; screenshot_ref?: string };
  reviewed_by: string; reviewed_at: string; app_request_id: string; binding_version: number;
};

function checkAttestation(a: { reviewed_by: string; reviewed_at: string; app_request_id: string }) {
  requireNonEmpty(a.reviewed_by, '/reviewed_by');
  requireTimestamp(a.reviewed_at, '/reviewed_at');
  requireNonEmpty(a.app_request_id, '/app_request_id');
}

/**
 * Approval linkage (the app-side half of the engine's `apply-receipts` check): a receipt may only
 * record the execution of an approval the imported C2a queue shows as APPROVED, for the exact content
 * the human approved. Fails closed: without the queue the linkage cannot be verified, so it is refused;
 * an unknown, ambiguous (duplicated), stale (content_hash changed) or not-approved item is refused.
 */
export function checkReceiptLinkage(r: ExecutionReceipt, context: ArtifactContext): void {
  const queue = context.approvalQueue;
  if (!queue) violation('/approval_id', 'approval linkage requires the imported C2a approval queue');
  if (queue.marketingBusiness !== r.marketingBusiness) violation('/approval_id', 'approval queue belongs to another tenant');
  const id = trimmed(r.approval_id);
  const matches = queue.items.filter((it) => it.approval_id === id);
  if (matches.length === 0) violation('/approval_id', `unknown approval "${id}"`);
  if (matches.length > 1) violation('/approval_id', `ambiguous approval "${id}" (duplicated in the queue)`);
  const item = matches[0];
  if (item.content_hash !== r.content_hash) violation('/content_hash', 'stale linkage: the approved content has changed');
  if (item.state !== 'approved') violation('/approval_id', `approval "${id}" is ${item.state}, not approved`);
}

export const C15_C16_CONTRACTS = {
  C15: contract<OutcomeEvidence>({
    schema: c15Schema, envelope: true, bound: true,
    check: (o) => {
      requireNonEmpty(o.task_id, '/task_id');
      o.dod_criteria_met.forEach((c, i) => requireNonEmpty(c, `/dod_criteria_met/${i}`));
      checkAttestation(o);
      const m = o.measurement;
      const forms = [m.ingest_manifest_ref, m.kpi_snapshot_ref, m.measured_values].filter((x) => x !== undefined);
      if (forms.length !== 1) violation('/measurement', 'exactly one of ingest_manifest_ref / kpi_snapshot_ref / measured_values must be provided');
      if (m.ingest_manifest_ref !== undefined) requireSafeRef(m.ingest_manifest_ref, '/measurement/ingest_manifest_ref');
      if (m.kpi_snapshot_ref !== undefined) requireSafeRef(m.kpi_snapshot_ref, '/measurement/kpi_snapshot_ref');
      (m.measured_values ?? []).forEach((v, i) => {
        requireNonEmpty(v.metric, `/measurement/measured_values/${i}/metric`);
        checkValueConfidence(v.value, v.confidence, `/measurement/measured_values/${i}/value`);
      });
    },
  }),
  C16: contract<ExecutionReceipt>({
    schema: c16Schema, envelope: true, bound: true,
    check: (r, context) => {
      requireNonEmpty(r.approval_id, '/approval_id');
      requireNonEmpty(r.executed_by, '/executed_by');
      requireTimestamp(r.executed_at, '/executed_at');
      checkAttestation(r);
      requireSafeRef(r.evidence.pack_ref, '/evidence/pack_ref');
      if (r.evidence.external_ref !== undefined) requireNonEmpty(r.evidence.external_ref, '/evidence/external_ref');
      if (r.evidence.url !== undefined) requireSafeRef(r.evidence.url, '/evidence/url');
      if (r.evidence.screenshot_ref !== undefined) requireSafeRef(r.evidence.screenshot_ref, '/evidence/screenshot_ref');
      checkReceiptLinkage(r, context);
    },
  }),
};
