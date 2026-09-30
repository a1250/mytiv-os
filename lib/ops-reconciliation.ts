import 'server-only';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { db } from './db';
import { opsAuditEvents } from './db/schema';
import { isOpenReconciliation } from './ops-audit-view';

/**
 * The open reconciliation item on a write target, if any (MKT-GOV06): an earlier governed write to the same
 * target whose external outcome is unknown and has not been resolved by a fresh readback. Tenant-scoped.
 */
export async function openReconciliationOn(businessId: string, target: { kind: string; id: string }): Promise<{ actionId: string } | null> {
  const claims = await db.select({ actionId: opsAuditEvents.actionId }).from(opsAuditEvents)
    .where(and(eq(opsAuditEvents.businessId, businessId), eq(opsAuditEvents.event, 'confirmed'),
      sql`${opsAuditEvents.detail}->'target'->>'kind' = ${target.kind}`, sql`${opsAuditEvents.detail}->'target'->>'id' = ${target.id}`))
    .limit(500);
  if (!claims.length) return null;
  const events = await db.select({ actionId: opsAuditEvents.actionId, event: opsAuditEvents.event, detail: opsAuditEvents.detail })
    .from(opsAuditEvents).where(and(eq(opsAuditEvents.businessId, businessId), inArray(opsAuditEvents.actionId, claims.map((c) => c.actionId))))
    .orderBy(asc(opsAuditEvents.createdAt));
  for (const { actionId } of claims) {
    const own = events.filter((e) => e.actionId === actionId).map((e) => ({ event: e.event, detail: (e.detail ?? {}) as Record<string, unknown> }));
    if (isOpenReconciliation(own)) return { actionId };
  }
  return null;
}
