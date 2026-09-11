import 'server-only';
import { createHash } from 'node:crypto';
import { db } from './db';
import { opsActions, opsAuditEvents } from './db/schema';
import { OpsPolicyError } from './ops-policy';

/** Claim once before the external write. Unknown outcomes are never automatically retried. */
export async function auditedAction<T>(scope: { businessId: string; userId: string }, projectId: string, requestId: string, action: string, payload: unknown, run: () => Promise<T>): Promise<T> {
  const payloadHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const [claim] = await db.insert(opsActions).values({ businessId: scope.businessId, userId: scope.userId, projectId, requestId, action, payloadHash })
    .onConflictDoNothing().returning({ id: opsActions.id });
  if (!claim) throw new OpsPolicyError('request_already_claimed_check_audit_before_retry', 409);
  // If audit cannot be persisted, no external write is attempted.
  await db.insert(opsAuditEvents).values({ businessId: scope.businessId, actionId: claim.id, event: 'confirmed', detail: { payloadHash, actor: scope.userId } });
  let result: T;
  try { result = await run(); }
  catch (error) {
    await db.insert(opsAuditEvents).values({ businessId: scope.businessId, actionId: claim.id, event: 'failed_or_unknown', detail: {} });
    throw error;
  }
  await db.insert(opsAuditEvents).values({ businessId: scope.businessId, actionId: claim.id, event: result && typeof result === 'object' && 'ok' in result && result.ok === false ? 'rejected_or_unknown' : 'succeeded', detail: { result } });
  return result;
}
