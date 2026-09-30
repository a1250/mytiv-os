import 'server-only';
import { createHash } from 'node:crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { marketingArtifacts, marketingDecisions, marketingEvidence } from '../db/schema';
import { OpsPolicyError } from '../ops-policy';
import type { MarketingBinding } from './binding';
import { validateArtifact, type ArtifactKind, type ArtifactPayload } from './validate-artifact';
import type { ApprovalQueueExport, BrainChangeProposal, BrainStatusExport } from './contract-rules/c2-c3';
import type { WorkboardExport } from './contract-rules/c5-c8';

/** Engine → app artifacts that are imported (C1 lives in marketing_snapshots; C2b/C3b/C6/C15/C16 are
 *  app → engine records, never imported). Mirrors the CHECK on marketing_artifacts.kind (migration 0010). */
export const ENGINE_ARTIFACT_KINDS = ['C2a', 'C3a', 'C4', 'C5', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12', 'C13', 'C14'] as const;
export type EngineArtifactKind = (typeof ENGINE_ARTIFACT_KINDS)[number];
export function isEngineArtifactKind(kind: unknown): kind is EngineArtifactKind {
  return typeof kind === 'string' && (ENGINE_ARTIFACT_KINDS as readonly string[]).includes(kind);
}

/** sha256 of a canonical (recursively key-sorted) JSON rendering — identical content, identical hash. */
export function canonicalHash(value: unknown): string {
  const canon = (v: unknown): unknown => Array.isArray(v) ? v.map(canon)
    : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, canon((v as Record<string, unknown>)[k])])) : v;
  return createHash('sha256').update(JSON.stringify(canon(value))).digest('hex');
}

/** Postgres refusals raised by the 0010 functions/triggers → policy errors (conflicts, not outages). */
export function recordConflict(error: unknown): OpsPolicyError | null {
  for (let e: unknown = error, depth = 0; e && typeof e === 'object' && depth < 5; e = (e as { cause?: unknown }).cause, depth++) {
    const { message, code } = e as { message?: unknown; code?: unknown };
    if (typeof message === 'string') {
      if (message.includes('stale_binding_version')) return new OpsPolicyError('stale_binding_version', 409);
      if (message.includes('stale_or_conflicting_revision')) return new OpsPolicyError('stale_or_conflicting_revision', 409);
      if (message.includes('approval_linkage_invalid')) return new OpsPolicyError('approval_linkage_invalid', 409);
    }
    if (code === '23505') return new OpsPolicyError('already_recorded', 409);
    if (code === '23503') return new OpsPolicyError('not_found', 404);
  }
  return null;
}

export type StoredArtifact<K extends EngineArtifactKind = EngineArtifactKind> = {
  id: string; kind: K; bindingVersion: number; revision: number; sourceRevision: string; asOf: string; payload: ArtifactPayload<K>;
};

/** Insert one engine artifact under the ACTIVE binding: validated through the vendored contract first
 *  (tenant scope = the binding), then numbered and stored by ONE atomic database function (a refusal or an
 *  error there writes nothing). `onWrite` fires right before that call (the audit's "write attempted"). */
export async function insertArtifact(scope: { businessId: string; userId: string }, projectId: string, binding: MarketingBinding,
  kind: unknown, payload: unknown, requestId: string, onWrite?: () => void) {
  if (!isEngineArtifactKind(kind)) throw new OpsPolicyError('unsupported_artifact_kind');
  const artifact = validateArtifact(kind, payload, { marketingBusiness: binding.marketingBusiness }) as { sourceRevision: string; asOf: string };
  let revision: number;
  onWrite?.();
  try {
    const result = await db.execute(sql`select marketing_import_artifact(${scope.businessId}::uuid, ${projectId}::uuid, ${kind}, ${binding.bindingVersion},
      ${artifact.sourceRevision}, ${artifact.asOf}::timestamptz, ${canonicalHash(payload)}, ${JSON.stringify(payload)}::jsonb, ${scope.userId}::uuid, ${requestId}::uuid) as r`);
    revision = Number((result.rows[0] as { r?: unknown } | undefined)?.r);
  } catch (error) { throw recordConflict(error) ?? error; }
  if (!Number.isSafeInteger(revision) || revision < 1) throw new Error('artifact import returned no revision');
  return { ok: true as const, kind, revision, bindingVersion: binding.bindingVersion };
}

/** Insert + reconcile (services / tests). The route runs the two separately: the insert is the governed
 *  write, reconciliation a derived projection recomputed outside it (GPT review P1-1). */
export async function importArtifact(scope: { businessId: string; userId: string }, projectId: string, binding: MarketingBinding,
  kind: unknown, payload: unknown, requestId: string) {
  const result = await insertArtifact(scope, projectId, binding, kind, payload, requestId);
  return { ...result, reconciled: await reconcileAll(scope.businessId, projectId, binding) };
}

/** The artifact a request id created (unique per business), or null — the readback of an import. */
export async function artifactByRequest(businessId: string, requestId: string) {
  const [row] = await db.select({ id: marketingArtifacts.id, projectId: marketingArtifacts.projectId, kind: marketingArtifacts.kind, revision: marketingArtifacts.revision,
    bindingVersion: marketingArtifacts.bindingVersion, contentHash: marketingArtifacts.contentHash })
    .from(marketingArtifacts).where(and(eq(marketingArtifacts.businessId, businessId), eq(marketingArtifacts.requestId, requestId))).limit(1);
  return row ?? null;
}

/**
 * Recompute every record's reconciled_state from the LATEST artifacts that carry engine state (C2a → decisions
 * and receipts, C7 → publication / outcome evidence, C3a → brain proposals). Idempotent and derived only from
 * stored artifacts, so it can be re-run at any time: after each import, and on the replay of an import whose
 * first attempt stopped after the insert — a failed or interrupted reconciliation converges (P1-1).
 */
export async function reconcileAll(businessId: string, projectId: string, binding: MarketingBinding): Promise<number> {
  let changed = 0;
  for (const kind of ['C2a', 'C7', 'C3a'] as const) {
    const latest = await latestArtifact(businessId, projectId, binding, kind);
    if (latest) changed += await reconcile(businessId, projectId, binding, kind, latest.payload);
  }
  return changed;
}

/** The latest artifact of `kind` under the ACTIVE binding version, re-validated on read (a stored row is
 *  never trusted blindly), or null when none has been imported. */
export async function latestArtifact<K extends EngineArtifactKind>(businessId: string, projectId: string, binding: MarketingBinding, kind: K): Promise<StoredArtifact<K> | null> {
  const [row] = await db.select().from(marketingArtifacts)
    .where(and(eq(marketingArtifacts.businessId, businessId), eq(marketingArtifacts.projectId, projectId), eq(marketingArtifacts.kind, kind), eq(marketingArtifacts.bindingVersion, binding.bindingVersion)))
    .orderBy(desc(marketingArtifacts.revision)).limit(1);
  return row ? toStored(row, binding, kind) : null;
}

/** A specific artifact row of this business/project — the projection a human decided against. */
export async function getArtifact(businessId: string, projectId: string, id: string, binding: MarketingBinding): Promise<StoredArtifact | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const [row] = await db.select().from(marketingArtifacts)
    .where(and(eq(marketingArtifacts.businessId, businessId), eq(marketingArtifacts.projectId, projectId), eq(marketingArtifacts.id, id))).limit(1);
  if (!row || !isEngineArtifactKind(row.kind)) return null;
  // A projection from another binding version is history: it can be read for context, never decided on.
  if (row.bindingVersion !== binding.bindingVersion) throw new OpsPolicyError('stale_binding_version', 409);
  return toStored(row, binding, row.kind);
}

/** Latest artifact per kind under the active binding (for the marketing screens). */
export async function listLatestArtifacts(businessId: string, projectId: string, binding: MarketingBinding) {
  const rows = await db.selectDistinctOn([marketingArtifacts.kind], {
    kind: marketingArtifacts.kind, revision: marketingArtifacts.revision, asOf: marketingArtifacts.asOf, importedAt: marketingArtifacts.createdAt, id: marketingArtifacts.id,
  }).from(marketingArtifacts)
    .where(and(eq(marketingArtifacts.businessId, businessId), eq(marketingArtifacts.projectId, projectId), eq(marketingArtifacts.bindingVersion, binding.bindingVersion)))
    .orderBy(marketingArtifacts.kind, desc(marketingArtifacts.revision));
  return rows.map((r) => ({ ...r, asOf: r.asOf.toISOString(), importedAt: r.importedAt.toISOString() }));
}

function toStored<K extends EngineArtifactKind>(row: typeof marketingArtifacts.$inferSelect, binding: MarketingBinding, kind: K): StoredArtifact<K> {
  const payload = validateArtifact(kind as ArtifactKind, row.payload, { marketingBusiness: binding.marketingBusiness }) as ArtifactPayload<K>;
  return { id: row.id, kind, bindingVersion: row.bindingVersion, revision: row.revision, sourceRevision: row.sourceRevision, asOf: row.asOf.toISOString(), payload };
}

// ── reconciliation: the next matching engine artifact tells the app what became of each record ──

export type ReconciledState = 'awaiting' | 'open' | 'applied' | 'stale' | 'conflict' | 'expired' | 'missing' | 'unreviewed' | 'resolved';

/** C2b decision vs the next C2a: was the decision applied, is it still awaited, or did the item move on? */
export function decisionState(d: { approvalId: string; contentHash: string; decision: string }, queue: ApprovalQueueExport): ReconciledState {
  const item = queue.items.find((i) => i.approval_id === d.approvalId);
  if (!item) return 'missing';
  if (item.content_hash !== d.contentHash) return 'stale';
  if (item.state === 'pending') return 'awaiting';
  // `applied` (contract amendment) = approved AND executed: an approval decision is then applied too.
  if (item.state === d.decision || (item.state === 'applied' && d.decision === 'approved')) return 'applied';
  return item.state === 'expired' ? 'expired' : 'conflict';
}
/** C16 receipt vs the next C2a: `applied` once the engine recorded the execution, awaiting while the item is
 *  still only approved. */
export function receiptState(r: { approvalId: string | null; preconditionHash: string }, queue: ApprovalQueueExport): ReconciledState {
  const item = queue.items.find((i) => i.approval_id === r.approvalId);
  if (!item) return 'missing';
  if (item.content_hash !== r.preconditionHash) return 'stale';
  return item.state === 'applied' ? 'applied' : item.state === 'approved' ? 'awaiting' : item.state === 'expired' ? 'expired' : 'conflict';
}
/** C6 / C15 vs the next C7: the engine's evidence state is authoritative (the app never marks "published"). */
export function taskEvidenceState(kind: 'publish_evidence' | 'outcome_evidence', targetId: string, board: WorkboardExport): ReconciledState {
  const task = board.tasks.find((t) => t.task_id.trim() === targetId);
  if (!task) return 'missing';
  if (kind === 'outcome_evidence' && task.completion === 'outcome_verified') return 'applied';
  if (task.evidence_state === 'stale' || task.evidence_state === 'conflict' || task.evidence_state === 'unreviewed') return task.evidence_state;
  if (kind === 'publish_evidence' && task.evidence_state === 'applied') return 'applied';
  return 'awaiting';
}
/**
 * C3b proposal vs the next C3a. C3a says only whether the proposal is OPEN in the engine (a pending
 * brain_update approval for the same proposal) and the field's current value hash, so the
 * previous state carries what earlier exports showed:
 *   - open in this export                           → open      (the engine took it in; awaiting the decision)
 *   - not open, and it WAS open / resolved before   → resolved  (closed by the engine: applied, rejected or
 *                                                                 applied-then-rolled-back — the value may be back)
 *   - never seen open, and the value has moved      → stale     (changed before the engine took it in; the
 *                                                                 engine refuses a stale proposal)
 *   - never seen open, value unchanged              → awaiting  (not taken in yet)
 */
export function proposalState(p: BrainChangeProposal, status: BrainStatusExport, prev: ReconciledState | string | null = null): ReconciledState {
  // "Open" = the engine holds THIS proposal as a pending brain_update. C3a open_proposals re-export the app's
  // C3b unchanged (ARCHITECTURE §3.1: reconciliation = {app_request_id, state}), so the identity is the app's
  // request id plus the precondition it was made against — two requests are never conflated.
  if (status.open_proposals.some((o) => o.app_request_id === p.app_request_id && o.file === p.file && o.path === p.path && o.value_hash === p.value_hash)) return 'open';
  if (prev === 'open' || prev === 'resolved') return 'resolved';
  const current = status.values[p.file]?.[p.path];
  return current !== undefined && current !== p.value_hash ? 'stale' : 'awaiting';
}

async function reconcile(businessId: string, projectId: string, binding: MarketingBinding, kind: EngineArtifactKind, payload: unknown): Promise<number> {
  const scope = (t: typeof marketingDecisions | typeof marketingEvidence) =>
    and(eq(t.businessId, businessId), eq(t.projectId, projectId), eq(t.bindingVersion, binding.bindingVersion));
  let changed = 0;
  if (kind === 'C2a') {
    const queue = payload as ApprovalQueueExport;
    for (const d of await db.select().from(marketingDecisions).where(scope(marketingDecisions))) {
      const next = decisionState(d, queue);
      if (next !== d.reconciledState) { await db.update(marketingDecisions).set({ reconciledState: next }).where(eq(marketingDecisions.id, d.id)); changed++; }
    }
    for (const r of await db.select().from(marketingEvidence).where(and(scope(marketingEvidence), eq(marketingEvidence.kind, 'execution_receipt')))) {
      const next = receiptState(r, queue);
      if (next !== r.reconciledState) { await db.update(marketingEvidence).set({ reconciledState: next }).where(eq(marketingEvidence.id, r.id)); changed++; }
    }
  } else if (kind === 'C7') {
    const board = payload as WorkboardExport;
    for (const e of await db.select().from(marketingEvidence).where(scope(marketingEvidence))) {
      if (e.kind !== 'publish_evidence' && e.kind !== 'outcome_evidence') continue;
      const next = taskEvidenceState(e.kind, e.targetId, board);
      if (next !== e.reconciledState) { await db.update(marketingEvidence).set({ reconciledState: next }).where(eq(marketingEvidence.id, e.id)); changed++; }
    }
  } else if (kind === 'C3a') {
    const status = payload as BrainStatusExport;
    for (const e of await db.select().from(marketingEvidence).where(and(scope(marketingEvidence), eq(marketingEvidence.kind, 'brain_proposal')))) {
      const next = proposalState(e.payload as BrainChangeProposal, status, e.reconciledState);
      if (next !== e.reconciledState) { await db.update(marketingEvidence).set({ reconciledState: next }).where(eq(marketingEvidence.id, e.id)); changed++; }
    }
  }
  return changed;
}
