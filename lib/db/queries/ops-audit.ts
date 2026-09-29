import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../index';
import { opsActions, opsAuditEvents, projects } from '../schema';

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

/** The last `limit` governed actions of a whole business (Ops + marketing writes), newest first, each with its
 *  project name and all its events — for the unified audit page (T-11.1). Tenant-scoped on every query. */
export async function listBusinessAudit(businessId: string, limit = 100): Promise<(AuditActionView & { projectId: string; projectName: string })[]> {
  const actions = await db.select({ id: opsActions.id, requestId: opsActions.requestId, actor: opsActions.userId, action: opsActions.action, confirmedAt: opsActions.createdAt,
    projectId: opsActions.projectId, projectName: projects.name })
    .from(opsActions).innerJoin(projects, and(eq(projects.businessId, opsActions.businessId), eq(projects.id, opsActions.projectId)))
    .where(eq(opsActions.businessId, businessId)).orderBy(desc(opsActions.createdAt)).limit(limit);
  if (!actions.length) return [];
  const events = await db.select({ actionId: opsAuditEvents.actionId, event: opsAuditEvents.event, detail: opsAuditEvents.detail, at: opsAuditEvents.createdAt })
    .from(opsAuditEvents).where(and(eq(opsAuditEvents.businessId, businessId), inArray(opsAuditEvents.actionId, actions.map((a) => a.id))))
    .orderBy(asc(opsAuditEvents.createdAt));
  return actions.map((a) => ({ ...a, events: events.filter((e) => e.actionId === a.id).map((e) => ({ event: e.event, detail: (e.detail ?? {}) as Record<string, unknown>, at: e.at })) }));
}
