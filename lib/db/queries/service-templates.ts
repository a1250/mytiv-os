/**
 * businessId-first helpers for the reusable service catalogue behind the
 * proposal editor's "+ add service" buttons.
 */
import { and, asc, eq } from "drizzle-orm";
import { db } from "../index";
import { serviceTemplates } from "../schema";
import { sanitizePatch } from "./_patch";

export async function listServiceTemplates(businessId: string) {
  return db
    .select()
    .from(serviceTemplates)
    .where(eq(serviceTemplates.businessId, businessId))
    .orderBy(asc(serviceTemplates.position), asc(serviceTemplates.createdAt));
}

export async function createServiceTemplate(
  businessId: string,
  data: { label: string } & Record<string, unknown>
) {
  const [row] = await db
    .insert(serviceTemplates)
    .values({ ...sanitizePatch(data), businessId })
    .returning();
  return row;
}

export async function updateServiceTemplate(businessId: string, id: string, patch: Record<string, unknown>) {
  const [row] = await db
    .update(serviceTemplates)
    .set({ ...sanitizePatch(patch), updatedAt: new Date() })
    .where(and(eq(serviceTemplates.businessId, businessId), eq(serviceTemplates.id, id)))
    .returning();
  return row ?? null;
}

export async function removeServiceTemplate(businessId: string, id: string) {
  await db
    .delete(serviceTemplates)
    .where(and(eq(serviceTemplates.businessId, businessId), eq(serviceTemplates.id, id)));
}

/**
 * Seeds the starter catalogue for a business that has none yet. Returns the
 * rows it created, or an empty array if the business already has templates —
 * so calling it twice can't duplicate the set.
 */
export async function seedStarterServiceTemplates(
  businessId: string,
  starters: Array<{ label: string } & Record<string, unknown>>
) {
  const existing = await listServiceTemplates(businessId);
  if (existing.length > 0) return [];
  return db
    .insert(serviceTemplates)
    .values(starters.map((s, i) => ({ ...sanitizePatch(s), businessId, position: i })))
    .returning();
}
