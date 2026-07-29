import { and, eq } from "drizzle-orm";
import { db } from "../index";
import { leadContacts, contactSources, outreachQueue } from "../schema";

export async function listContactsByLead(businessId: string, leadId: string) {
  return db
    .select()
    .from(leadContacts)
    .where(and(eq(leadContacts.businessId, businessId), eq(leadContacts.leadId, leadId)));
}

export async function updateContact(businessId: string, id: string, patch: Record<string, unknown>) {
  const [contact] = await db
    .update(leadContacts)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(leadContacts.businessId, businessId), eq(leadContacts.id, id)))
    .returning();
  return contact;
}

export async function removeContact(businessId: string, id: string) {
  await db.delete(contactSources).where(eq(contactSources.contactId, id));
  await db.delete(outreachQueue).where(eq(outreachQueue.contactId, id));
  await db.delete(leadContacts).where(and(eq(leadContacts.businessId, businessId), eq(leadContacts.id, id)));
}
