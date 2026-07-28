/**
 * Prompt Library only for Phase 1 (saved_prompts CRUD) — Prompt Builder's
 * generation engine (src/services/promptEngine.js + promptKB/*) ports
 * verbatim in a later phase since it's pure client-side logic with no
 * Electron dependency; nothing to port here yet beyond storage.
 */
import { and, desc, eq } from "drizzle-orm";
import { db } from "../index";
import { savedPrompts } from "../schema";

export async function listSavedPrompts(businessId: string) {
  return db.select().from(savedPrompts).where(eq(savedPrompts.businessId, businessId)).orderBy(desc(savedPrompts.updatedAt));
}

export async function getSavedPrompt(businessId: string, id: string) {
  const [row] = await db
    .select()
    .from(savedPrompts)
    .where(and(eq(savedPrompts.businessId, businessId), eq(savedPrompts.id, id)))
    .limit(1);
  return row ?? null;
}

export async function createSavedPrompt(
  businessId: string,
  data: { title: string; tool?: string; fields?: unknown; output?: unknown; tags?: string; favorite?: boolean }
) {
  const [row] = await db.insert(savedPrompts).values({ businessId, ...data } as typeof savedPrompts.$inferInsert).returning();
  return row;
}

export async function updateSavedPrompt(businessId: string, id: string, patch: Record<string, unknown>) {
  const [row] = await db
    .update(savedPrompts)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(savedPrompts.businessId, businessId), eq(savedPrompts.id, id)))
    .returning();
  return row;
}

export async function removeSavedPrompt(businessId: string, id: string) {
  await db.delete(savedPrompts).where(and(eq(savedPrompts.businessId, businessId), eq(savedPrompts.id, id)));
}
