import { and, desc, eq } from 'drizzle-orm';
import { db } from '../index';
import { opsActions, opsAuditEvents } from '../schema';
export async function listOpsAudit(businessId: string, projectId: string) {
  return db.select({ id: opsActions.id, requestId: opsActions.requestId, actor: opsActions.userId, action: opsActions.action, confirmedAt: opsActions.createdAt, event: opsAuditEvents.event, eventAt: opsAuditEvents.createdAt })
    .from(opsActions).leftJoin(opsAuditEvents, and(eq(opsAuditEvents.actionId, opsActions.id), eq(opsAuditEvents.businessId, businessId)))
    .where(and(eq(opsActions.businessId, businessId), eq(opsActions.projectId, projectId)))
    .orderBy(desc(opsActions.createdAt), desc(opsAuditEvents.createdAt)).limit(50);
}
