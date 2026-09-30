import 'server-only';
import { createHash } from 'node:crypto';
import { and, asc, eq } from 'drizzle-orm';
import { db } from './db';
import { opsActions, opsAuditEvents } from './db/schema';
import { OpsPolicyError } from './ops-policy';
import { ClickUpError, ClickUpWriteUnverifiedError } from './clickup';
import { rollbackEligibility, type TaskSnapshot } from './ops-snapshot';
import { openReconciliationOn } from './ops-reconciliation';

/**
 * One record shape for every governed external write.
 *
 *   confirmed          actor · approval (request id + evidence claims) · action · target · payload hash
 *                      · rollback eligibility, decided at claim time
 *   succeeded          ClickUp result/reference · pre_state · post_state
 *   rejected_or_unknown the operation itself said no (result.ok === false); nothing verified as written
 *   refused_before_write a deterministic policy refusal (e.g. rollback guard) taken before any external call
 *   failed_or_unknown  phase says how far it got: before_write / write_outcome_unknown /
 *                      after_write_unverified — the last two keep pre_state so a human can restore by hand
 *   rolled_back        appended to the ORIGINAL action by a later rollback_task action
 *
 * Every event is an INSERT; the tables reject UPDATE and DELETE by trigger.
 */
export type AuditTarget = { kind: 'task' | 'list' | 'project' | 'action'; id: string };
export type ExternalRef = { taskId?: string; url?: string; date_updated?: string | null };
/** `writing()` marks the moment the write itself is attempted (for writes without a task snapshot, e.g. a
 *  marketing artifact insert): a later non-policy failure is then an UNKNOWN outcome, never `before_write`. */
export type Capture = { pre(s: TaskSnapshot): void; post(s: TaskSnapshot): void; ref(r: ExternalRef): void; writing(): void };
export type AuditMeta = { target?: AuditTarget; approval?: Record<string, unknown> };

export type FailurePhase = 'before_write' | 'write_outcome_unknown' | 'after_write_unverified';
export function failurePhase(error: unknown, preCaptured: boolean): FailurePhase {
  if (error instanceof ClickUpWriteUnverifiedError) return 'after_write_unverified';
  if (error instanceof OpsPolicyError) return 'before_write';
  if (error instanceof ClickUpError && error.status >= 400 && error.status < 500) return 'before_write';
  return preCaptured ? 'write_outcome_unknown' : 'before_write';
}

/** The claim's payload hash: sha256 of the request payload as sent (an exact replay has the same hash). */
export function auditPayloadHash(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

/** Claim once before the external write. Unknown outcomes are never automatically retried. */
export async function auditedAction<T>(
  scope: { businessId: string; userId: string },
  projectId: string,
  requestId: string,
  action: string,
  payload: unknown,
  run: (capture: Capture) => Promise<T>,
  meta: AuditMeta = {}
): Promise<T> {
  // MKT-GOV06: while an earlier write to this target has an unknown outcome, no new write is attempted —
  // a blind retry could double-apply. Resolved only by a fresh readback (POST …/actions/[id]/reconcile).
  if (meta.target && await openReconciliationOn(scope.businessId, meta.target)) throw new OpsPolicyError('reconciliation_pending', 409);
  const payloadHash = auditPayloadHash(payload);
  const [claim] = await db.insert(opsActions).values({ businessId: scope.businessId, userId: scope.userId, projectId, requestId, action, payloadHash })
    .onConflictDoNothing().returning({ id: opsActions.id });
  if (!claim) throw new OpsPolicyError('request_already_claimed_check_audit_before_retry', 409);
  const event = (name: string, detail: Record<string, unknown>) =>
    db.insert(opsAuditEvents).values({ businessId: scope.businessId, actionId: claim.id, event: name, detail });
  // If audit cannot be persisted, no external write is attempted.
  await event('confirmed', {
    actor: scope.userId, approval: { requestId, ...(meta.approval ?? {}) }, action,
    target: meta.target ?? null, payloadHash, rollback_eligibility: rollbackEligibility(action),
  });
  let pre: TaskSnapshot | undefined, post: TaskSnapshot | undefined, ref: ExternalRef | undefined, writing = false;
  const capture: Capture = { pre: (s) => { pre = s; }, post: (s) => { post = s; }, ref: (r) => { ref = r; }, writing: () => { writing = true; } };
  let result: T;
  try { result = await run(capture); }
  catch (error) {
    await event('failed_or_unknown', { phase: failurePhase(error, pre !== undefined || writing), ...(pre ? { pre_state: pre } : {}), error: error instanceof Error ? error.constructor.name : 'unknown' });
    throw error;
  }
  const r = result && typeof result === 'object' ? (result as { ok?: unknown; refused?: unknown }) : null;
  // `refused` marks a deterministic policy refusal taken before any external call — "not written",
  // as opposed to `rejected_or_unknown`, where the operation itself declined and nothing is verified.
  const name = r?.ok === false ? (r.refused === true ? 'refused_before_write' : 'rejected_or_unknown') : 'succeeded';
  await event(name, {
    result, ...(ref ? { external_ref: ref } : {}), ...(pre ? { pre_state: pre } : {}), ...(post ? { post_state: post } : {}),
  });
  return result;
}

/** Append an event to an existing action (e.g. `rolled_back` on the original write). Tenant-scoped. */
export async function appendActionEvent(businessId: string, actionId: string, name: string, detail: Record<string, unknown>) {
  await db.insert(opsAuditEvents).values({ businessId, actionId, event: name, detail });
}

/** The claim of a request id in this business (unique per business), or null. */
export async function findOpsActionByRequest(businessId: string, requestId: string) {
  const [row] = await db.select().from(opsActions).where(and(eq(opsActions.businessId, businessId), eq(opsActions.requestId, requestId))).limit(1);
  return row ?? null;
}

export async function getOpsAction(businessId: string, projectId: string, actionId: string) {
  const [row] = await db.select().from(opsActions)
    .where(and(eq(opsActions.businessId, businessId), eq(opsActions.projectId, projectId), eq(opsActions.id, actionId))).limit(1);
  return row ?? null;
}

export async function listActionEvents(businessId: string, actionId: string) {
  return db.select({ event: opsAuditEvents.event, detail: opsAuditEvents.detail, createdAt: opsAuditEvents.createdAt })
    .from(opsAuditEvents).where(and(eq(opsAuditEvents.businessId, businessId), eq(opsAuditEvents.actionId, actionId)))
    .orderBy(asc(opsAuditEvents.createdAt));
}
