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
  // Verify ownership before touching child rows — a contactId from another
  // business must not be able to trigger any delete here, not even on
  // contact_sources/outreach_queue.
  const [owned] = await db
    .select({ id: leadContacts.id })
    .from(leadContacts)
    .where(and(eq(leadContacts.businessId, businessId), eq(leadContacts.id, id)))
    .limit(1);
  if (!owned) return;

  await db.delete(contactSources).where(eq(contactSources.contactId, id));
  await db.delete(outreachQueue).where(eq(outreachQueue.contactId, id));
  await db.delete(leadContacts).where(eq(leadContacts.id, id));
}
