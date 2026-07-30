import { and, eq } from "drizzle-orm";
import { db } from "../index";
import { clientBriefs, briefAnalysisResults } from "../schema";
import { sanitizePatch } from "./_patch";

export async function listBriefs(businessId: string) {
  return db
    .select({ id: clientBriefs.id, title: clientBriefs.title, clientName: clientBriefs.clientName, status: clientBriefs.status, updatedAt: clientBriefs.updatedAt })
    .from(clientBriefs)
    .where(eq(clientBriefs.businessId, businessId));
}

export async function getBrief(businessId: string, id: string) {
  const [brief] = await db.select().from(clientBriefs).where(and(eq(clientBriefs.businessId, businessId), eq(clientBriefs.id, id))).limit(1);
  return brief ?? null;
}

export async function createBrief(
  businessId: string,
  data: { title: string; clientName?: string; projectName?: string; rawText?: string; budget?: string; deadline?: string; links?: string; analysis: unknown }
) {
  const [brief] = await db
    .insert(clientBriefs)
    .values({ businessId, ...data, status: "analyzed" })
    .returning();
  await db.insert(briefAnalysisResults).values({ businessId, briefId: brief.id, payload: data.analysis });
  return brief;
}

export async function updateBrief(businessId: string, id: string, patch: Record<string, unknown>) {
  const [brief] = await db
    .update(clientBriefs)
    .set({ ...sanitizePatch(patch), updatedAt: new Date() })
    .where(and(eq(clientBriefs.businessId, businessId), eq(clientBriefs.id, id)))
    .returning();
  if (brief && patch.analysis) {
    await db.insert(briefAnalysisResults).values({ businessId, briefId: id, payload: patch.analysis });
  }
  return brief;
}

export async function removeBrief(businessId: string, id: string) {
  await db.delete(briefAnalysisResults).where(eq(briefAnalysisResults.briefId, id));
  await db.delete(clientBriefs).where(and(eq(clientBriefs.businessId, businessId), eq(clientBriefs.id, id)));
}
