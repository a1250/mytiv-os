/**
 * Ported from electron/ipc/leads.cjs. leads:remove's cascade (delete
 * outreach_messages + lead_notes, null out tasks.lead_id) is handled by the
 * schema's onDelete: "cascade" / "set null" FKs where declared — for tables
 * without a DB-level cascade defined we do it explicitly here.
 */
import { and, desc, eq } from "drizzle-orm";
import { db } from "../index";
import { leads, leadNotes } from "../schema";

export async function listLeads(businessId: string) {
  return db.select().from(leads).where(eq(leads.businessId, businessId)).orderBy(desc(leads.updatedAt));
}

export async function getLead(businessId: string, id: string) {
  const [lead] = await db.select().from(leads).where(and(eq(leads.businessId, businessId), eq(leads.id, id))).limit(1);
  return lead ?? null;
}

export async function createLead(businessId: string, data: { company: string; [key: string]: unknown }) {
  const [lead] = await db.insert(leads).values({ businessId, ...data } as typeof leads.$inferInsert).returning();
  return lead;
}

export async function updateLead(businessId: string, id: string, patch: Record<string, unknown>) {
  const [lead] = await db
    .update(leads)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(leads.businessId, businessId), eq(leads.id, id)))
    .returning();
  return lead;
}

export async function removeLead(businessId: string, id: string) {
  await db.delete(leads).where(and(eq(leads.businessId, businessId), eq(leads.id, id)));
}

export async function listLeadNotes(businessId: string, leadId: string) {
  return db
    .select()
    .from(leadNotes)
    .where(and(eq(leadNotes.businessId, businessId), eq(leadNotes.leadId, leadId)))
    .orderBy(desc(leadNotes.createdAt));
}

export async function addLeadNote(businessId: string, leadId: string, body: string) {
  const [note] = await db.insert(leadNotes).values({ businessId, leadId, body }).returning();
  await db.update(leads).set({ updatedAt: new Date() }).where(and(eq(leads.businessId, businessId), eq(leads.id, leadId)));
  return note;
}
