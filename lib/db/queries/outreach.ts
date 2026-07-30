import { and, eq } from "drizzle-orm";
import { db } from "../index";
import { outreachMessages } from "../schema";
import { sanitizePatch } from "./_patch";

export async function listOutreach(businessId: string, leadId?: string) {
  const conditions = [eq(outreachMessages.businessId, businessId)];
  if (leadId) conditions.push(eq(outreachMessages.leadId, leadId));
  return db.select().from(outreachMessages).where(and(...conditions));
}

export async function createOutreach(
  businessId: string,
  data: { leadId: string; kind: string; language?: string; tone?: string; subject?: string; body: string }
) {
  const [msg] = await db.insert(outreachMessages).values({ ...sanitizePatch(data), businessId, status: "draft" }).returning();
  return msg;
}

export async function updateOutreach(businessId: string, id: string, patch: Record<string, unknown>) {
  const [msg] = await db
    .update(outreachMessages)
    .set({ ...sanitizePatch(patch), updatedAt: new Date() })
    .where(and(eq(outreachMessages.businessId, businessId), eq(outreachMessages.id, id)))
    .returning();
  return msg;
}

export async function removeOutreach(businessId: string, id: string) {
  await db.delete(outreachMessages).where(and(eq(outreachMessages.businessId, businessId), eq(outreachMessages.id, id)));
}
