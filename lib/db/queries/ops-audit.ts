import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../index';
import { opsActions, opsAuditEvents } from '../schema';

export type AuditActionView = {
  id: string; requestId: string; actor: string; action: string; confirmedAt: Date;
  events: { event: string; detail: Record<string, unknown>; at: Date }[];
};

/**
 * The last 50 claimed actions of a project with all their events, oldest event first.
 * Two queries, not one per action; the UI derives outcome and rollback eligibility from the events.
 */
export async function listOpsAudit(businessId: string, projectId: string): Promise<AuditActionView[]> {
  const actions = await db.select({ id: opsActions.id, requestId: opsActions.requestId, actor: opsActions.userId, action: opsActions.action, confirmedAt: opsActions.createdAt })
    .from(opsActions).where(and(eq(opsActions.businessId, businessId), eq(opsActions.projectId, projectId)))
    .orderBy(desc(opsActions.createdAt)).limit(50);
  if (!actions.length) return [];
  const events = await db.select({ actionId: opsAuditEvents.actionId, event: opsAuditEvents.event, detail: opsAuditEvents.detail, at: opsAuditEvents.createdAt })
    .from(opsAuditEvents).where(and(eq(opsAuditEvents.businessId, businessId), inArray(opsAuditEvents.actionId, actions.map((a) => a.id))))
    .orderBy(asc(opsAuditEvents.createdAt));
  return actions.map((a) => ({ ...a, events: events.filter((e) => e.actionId === a.id).map((e) => ({ event: e.event, detail: (e.detail ?? {}) as Record<string, unknown>, at: e.at })) }));
}
