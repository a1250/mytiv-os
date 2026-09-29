import 'server-only';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { marketingArtifacts, marketingBindingEvents, marketingDecisions, marketingEvidence } from '../db/schema';
import { OpsPolicyError, objectInput } from '../ops-policy';
import type { MarketingBinding } from './binding';
import { validateArtifact } from './validate-artifact';
import { getArtifact, recordConflict, type StoredArtifact } from './artifacts';
import type { ApprovalDecision, ApprovalQueueExport, BrainChangeProposal, BrainStatusExport } from './contract-rules/c2-c3';
import type { PublishEvidence, WorkboardExport } from './contract-rules/c5-c8';
import type { ExecutionReceipt, OutcomeEvidence } from './contract-rules/c15-c16';

/**
 * App → engine records (T-3.2): every record is built SERVER-SIDE as the canonical contract payload
 * (C2b / C3b / C6 / C15 / C16), validated through the vendored contract, stamped with the ACTIVE binding
 * version, the precondition hash from the artifact the human saw, and — where the contract requires a
 * review — the session user as reviewer. Writes go through the route's `auditedAction`; the 0010 triggers
 * re-check binding version and approval linkage in the database.
 */
type Scope = { businessId: string; userId: string };
export type RecordKind = 'decision' | 'proposal' | 'evidence' | 'outcome' | 'receipt';
const EVIDENCE_KIND = { proposal: 'brain_proposal', evidence: 'publish_evidence', outcome: 'outcome_evidence', receipt: 'execution_receipt' } as const;

const now = () => new Date().toISOString();
function text(v: unknown, name: string, max = 2000): string {
  if (typeof v !== 'string' || !v.trim() || v.length > max) throw new OpsPolicyError(`invalid_${name}`);
  return v;
}
async function source<K extends StoredArtifact['kind']>(scope: Scope, projectId: string, binding: MarketingBinding, id: unknown, kind: K): Promise<StoredArtifact<K>> {
  if (typeof id !== 'string') throw new OpsPolicyError('invalid_source_artifact');
  const artifact = await getArtifact(scope.businessId, projectId, id, binding); // 409 when it is a historical projection
  if (!artifact) throw new OpsPolicyError('not_found', 404);
  if (artifact.kind !== kind) throw new OpsPolicyError('invalid_source_artifact');
  return artifact as StoredArtifact<K>;
}
async function insertEvidence(scope: Scope, projectId: string, binding: MarketingBinding, row: {
  kind: (typeof EVIDENCE_KIND)[keyof typeof EVIDENCE_KIND]; sourceArtifactId: string; targetId: string; approvalId?: string;
  preconditionHash: string; reviewed: boolean; payload: unknown; requestId: string;
}) {
  try {
    const [inserted] = await db.insert(marketingEvidence).values({
      businessId: scope.businessId, projectId, bindingVersion: binding.bindingVersion, kind: row.kind, sourceArtifactId: row.sourceArtifactId,
      targetId: row.targetId, approvalId: row.approvalId ?? null, preconditionHash: row.preconditionHash,
      reviewedBy: row.reviewed ? scope.userId : null, reviewedAt: row.reviewed ? new Date() : null,
      payload: row.payload, createdBy: scope.userId, requestId: row.requestId,
    }).returning({ id: marketingEvidence.id });
    return inserted.id;
  } catch (error) { throw recordConflict(error) ?? error; }
}

/** C2b — approve / reject one PENDING item of the C2a the human saw; a note is mandatory (RED never auto). */
export async function recordDecision(scope: Scope, projectId: string, binding: MarketingBinding, body: Record<string, unknown>, requestId: string) {
  const queue = await source(scope, projectId, binding, body.sourceArtifactId, 'C2a');
  const approvalId = text(body.approvalId, 'approval_id', 200);
  const item = queue.payload.items.find((i) => i.approval_id === approvalId);
  if (!item) throw new OpsPolicyError('not_found', 404);
  if (item.content_hash !== body.contentHash) throw new OpsPolicyError('stale_content_hash', 409);
  if (item.state !== 'pending') throw new OpsPolicyError('approval_not_pending', 409);
  if (body.decision !== 'approved' && body.decision !== 'rejected') throw new OpsPolicyError('invalid_decision');
  const at = now();
  const decision: ApprovalDecision = {
    schemaVersion: 1, sourceRevision: queue.sourceRevision, asOf: at, marketingBusiness: binding.marketingBusiness,
    approval_id: approvalId, content_hash: item.content_hash, decision: body.decision, note: text(body.note, 'note'),
    decided_by: scope.userId, decided_at: at, app_request_id: requestId, binding_version: binding.bindingVersion,
  };
  validateArtifact('C2b', decision, binding);
  try {
    const [row] = await db.insert(marketingDecisions).values({
      businessId: scope.businessId, projectId, bindingVersion: binding.bindingVersion, sourceArtifactId: queue.id, approvalId,
      contentHash: item.content_hash, decision: decision.decision, note: decision.note, decidedBy: scope.userId, requestId, decidedAt: new Date(at),
    }).returning({ id: marketingDecisions.id });
    return { ok: true as const, kind: 'decision' as const, id: row.id, payload: decision };
  } catch (error) { throw recordConflict(error) ?? error; }
}

/** C3b — propose a brain change against the value the human saw in C3a (its value_hash is the precondition). */
export async function recordProposal(scope: Scope, projectId: string, binding: MarketingBinding, body: Record<string, unknown>, requestId: string) {
  const status = await source(scope, projectId, binding, body.sourceArtifactId, 'C3a');
  const file = text(body.file, 'file', 300), path = text(body.path, 'path', 300);
  const valueHash = (status.payload as BrainStatusExport).values[file]?.[path];
  if (!valueHash) throw new OpsPolicyError('not_found', 404);
  if (body.valueHash !== valueHash) throw new OpsPolicyError('stale_value_hash', 409);
  if (!('old' in body) || !('new' in body)) throw new OpsPolicyError('invalid_proposal');
  const proposal: BrainChangeProposal = {
    file, path, old: body.old, new: body.new, reason: text(body.reason, 'reason'), verify: body.verify === true,
    value_hash: valueHash, proposed_by: scope.userId, app_request_id: requestId, binding_version: binding.bindingVersion,
  };
  validateArtifact('C3b', proposal, binding);
  const id = await insertEvidence(scope, projectId, binding, { kind: 'brain_proposal', sourceArtifactId: status.id, targetId: `${file}#${path}`, preconditionHash: valueHash, reviewed: false, payload: proposal, requestId });
  return { ok: true as const, kind: 'proposal' as const, id, payload: proposal };
}

function attested(body: Record<string, unknown>) {
  // "I reviewed this evidence": an explicit human attestation; reviewer + time are stamped from the session.
  if (body.reviewed !== true) throw new OpsPolicyError('review_attestation_required');
}
function boardTask(board: StoredArtifact<'C7'>, taskId: unknown) {
  const id = text(taskId, 'task_id', 200).trim();
  const task = (board.payload as WorkboardExport).tasks.find((t) => t.task_id.trim() === id);
  if (!task) throw new OpsPolicyError('not_found', 404);
  return task;
}

/** C6 — publication evidence for a workboard task (the engine decides whether it becomes `published`). */
export async function recordEvidence(scope: Scope, projectId: string, binding: MarketingBinding, body: Record<string, unknown>, requestId: string) {
  attested(body);
  const board = await source(scope, projectId, binding, body.sourceArtifactId, 'C7');
  const task = boardTask(board, body.taskId);
  const at = now();
  const evidence: PublishEvidence = {
    schemaVersion: 1, sourceRevision: board.sourceRevision, asOf: at, marketingBusiness: binding.marketingBusiness,
    task_id: task.task_id, task_hash: task.task_hash, channel: text(body.channel, 'channel', 100),
    evidence: objectInput(body.evidence) as PublishEvidence['evidence'], published_at: text(body.publishedAt, 'published_at', 40),
    by: text(body.by, 'by', 200), reviewed_by: scope.userId, reviewed_at: at, app_request_id: requestId,
  };
  validateArtifact('C6', evidence, binding);
  const id = await insertEvidence(scope, projectId, binding, { kind: 'publish_evidence', sourceArtifactId: board.id, targetId: task.task_id.trim(), preconditionHash: task.task_hash, reviewed: true, payload: evidence, requestId });
  return { ok: true as const, kind: 'evidence' as const, id, payload: evidence };
}

/** C15 — measured outcome for a PUBLISHED task; the criteria met must be the task's own DoD criteria (D10). */
export async function recordOutcome(scope: Scope, projectId: string, binding: MarketingBinding, body: Record<string, unknown>, requestId: string) {
  attested(body);
  const board = await source(scope, projectId, binding, body.sourceArtifactId, 'C7');
  const task = boardTask(board, body.taskId);
  if (task.status !== 'published') throw new OpsPolicyError('task_not_published', 409);
  const criteria = Array.isArray(body.dodCriteriaMet) ? body.dodCriteriaMet : [];
  const dod = new Set(task.dod.map((d) => d.trim()));
  if (!criteria.length || criteria.some((c) => typeof c !== 'string' || !dod.has(c.trim()))) throw new OpsPolicyError('invalid_dod_criteria');
  const at = now();
  const outcome: OutcomeEvidence = {
    schemaVersion: 1, sourceRevision: board.sourceRevision, asOf: at, marketingBusiness: binding.marketingBusiness,
    task_id: task.task_id, task_hash: task.task_hash, dod_criteria_met: criteria as string[],
    measurement: objectInput(body.measurement) as OutcomeEvidence['measurement'],
    reviewed_by: scope.userId, reviewed_at: at, app_request_id: requestId, binding_version: binding.bindingVersion,
  };
  validateArtifact('C15', outcome, binding);
  const id = await insertEvidence(scope, projectId, binding, { kind: 'outcome_evidence', sourceArtifactId: board.id, targetId: task.task_id.trim(), preconditionHash: task.task_hash, reviewed: true, payload: outcome, requestId });
  return { ok: true as const, kind: 'outcome' as const, id, payload: outcome };
}

/** C16 — execution receipt for an APPROVED campaign/message item of the C2a the human saw. */
export async function recordReceipt(scope: Scope, projectId: string, binding: MarketingBinding, body: Record<string, unknown>, requestId: string) {
  attested(body);
  const queue = await source(scope, projectId, binding, body.sourceArtifactId, 'C2a');
  const approvalId = text(body.approvalId, 'approval_id', 200);
  const item = (queue.payload as ApprovalQueueExport).items.find((i) => i.approval_id === approvalId.trim());
  if (!item) throw new OpsPolicyError('not_found', 404);
  const at = now();
  const receipt: ExecutionReceipt = {
    schemaVersion: 1, sourceRevision: queue.sourceRevision, asOf: at, marketingBusiness: binding.marketingBusiness,
    approval_id: approvalId, content_hash: text(body.contentHash, 'content_hash', 64), action_type: body.actionType as ExecutionReceipt['action_type'],
    executed_by: text(body.executedBy, 'executed_by', 200), executed_at: text(body.executedAt, 'executed_at', 40),
    evidence: objectInput(body.evidence) as ExecutionReceipt['evidence'],
    reviewed_by: scope.userId, reviewed_at: at, app_request_id: requestId, binding_version: binding.bindingVersion,
  };
  // Linkage (approved item, same content, same tenant) is part of the C16 contextual contract.
  validateArtifact('C16', receipt, binding, { approvalQueue: queue.payload as ApprovalQueueExport });
  const id = await insertEvidence(scope, projectId, binding, { kind: 'execution_receipt', sourceArtifactId: queue.id, targetId: approvalId.trim(), approvalId: approvalId.trim(), preconditionHash: item.content_hash, reviewed: true, payload: receipt, requestId });
  return { ok: true as const, kind: 'receipt' as const, id, payload: receipt };
}

/** Downloadable JSON of one record (the exact canonical payload), stamping `exported_at` on first export. */
export async function exportRecord(businessId: string, projectId: string, kind: RecordKind, id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new OpsPolicyError('not_found', 404);
  if (kind === 'decision') {
    const [d] = await db.select().from(marketingDecisions).where(and(eq(marketingDecisions.businessId, businessId), eq(marketingDecisions.projectId, projectId), eq(marketingDecisions.id, id))).limit(1);
    if (!d) throw new OpsPolicyError('not_found', 404);
    const [src] = await db.select({ sourceRevision: marketingArtifacts.sourceRevision }).from(marketingArtifacts)
      .where(and(eq(marketingArtifacts.businessId, businessId), eq(marketingArtifacts.id, d.sourceArtifactId))).limit(1);
    // The tenant is the one bound at the decision's binding version (from the append-only binding log), so
    // an export after a rebind still names the tenant the decision was made for.
    const [bound] = await db.select({ marketingBusiness: marketingBindingEvents.marketingBusiness }).from(marketingBindingEvents)
      .where(and(eq(marketingBindingEvents.businessId, businessId), eq(marketingBindingEvents.projectId, projectId), eq(marketingBindingEvents.bindingVersion, d.bindingVersion), eq(marketingBindingEvents.event, 'bind'))).limit(1);
    if (!bound) throw new OpsPolicyError('not_found', 404);
    const marketingBusiness = bound.marketingBusiness;
    const at = d.decidedAt.toISOString();
    const payload: ApprovalDecision = {
      schemaVersion: 1, sourceRevision: src?.sourceRevision ?? 'unknown', asOf: at, marketingBusiness, approval_id: d.approvalId, content_hash: d.contentHash,
      decision: d.decision as ApprovalDecision['decision'], note: d.note, decided_by: d.decidedBy, decided_at: at, app_request_id: d.requestId, binding_version: d.bindingVersion,
    };
    await db.update(marketingDecisions).set({ exportedAt: new Date() }).where(and(eq(marketingDecisions.id, d.id), isNull(marketingDecisions.exportedAt)));
    return payload;
  }
  const [e] = await db.select().from(marketingEvidence).where(and(eq(marketingEvidence.businessId, businessId), eq(marketingEvidence.projectId, projectId), eq(marketingEvidence.id, id), eq(marketingEvidence.kind, EVIDENCE_KIND[kind]))).limit(1);
  if (!e) throw new OpsPolicyError('not_found', 404);
  await db.update(marketingEvidence).set({ exportedAt: new Date() }).where(and(eq(marketingEvidence.id, e.id), isNull(marketingEvidence.exportedAt)));
  return e.payload;
}

/** Records under the ACTIVE binding version, for the screens: decisions and evidence with their state. */
export async function listRecords(businessId: string, projectId: string, binding: MarketingBinding) {
  const where = <T extends typeof marketingDecisions | typeof marketingEvidence>(t: T) =>
    and(eq(t.businessId, businessId), eq(t.projectId, projectId), eq(t.bindingVersion, binding.bindingVersion));
  const [decisions, evidence] = await Promise.all([
    db.select({ id: marketingDecisions.id, approvalId: marketingDecisions.approvalId, contentHash: marketingDecisions.contentHash, decision: marketingDecisions.decision,
      note: marketingDecisions.note, decidedAt: marketingDecisions.decidedAt, exportedAt: marketingDecisions.exportedAt, reconciledState: marketingDecisions.reconciledState })
      .from(marketingDecisions).where(where(marketingDecisions)),
    db.select({ id: marketingEvidence.id, kind: marketingEvidence.kind, targetId: marketingEvidence.targetId, approvalId: marketingEvidence.approvalId,
      createdAt: marketingEvidence.createdAt, exportedAt: marketingEvidence.exportedAt, reconciledState: marketingEvidence.reconciledState })
      .from(marketingEvidence).where(where(marketingEvidence)),
  ]);
  const iso = (d: Date | null) => d?.toISOString() ?? null;
  return {
    decisions: decisions.map((d) => ({ ...d, decidedAt: d.decidedAt.toISOString(), exportedAt: iso(d.exportedAt) })),
    evidence: evidence.map((e) => ({ ...e, createdAt: e.createdAt.toISOString(), exportedAt: iso(e.exportedAt) })),
  };
}
export type MarketingRecords = Awaited<ReturnType<typeof listRecords>>;
