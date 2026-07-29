import { and, eq } from "drizzle-orm";
import { db } from "../index";
import { inspirationItems, moodboards, moodboardItems } from "../schema";
import { deleteAsset } from "../../blob";

export async function listInspiration(businessId: string) {
  return db.select().from(inspirationItems).where(eq(inspirationItems.businessId, businessId));
}

export async function createInspiration(
  businessId: string,
  data: { title: string; url?: string; imageUrl?: string; category?: string; tags?: string; notes?: string; whySaved?: string; source?: string }
) {
  const [item] = await db.insert(inspirationItems).values({ businessId, ...data }).returning();
  return item;
}

export async function updateInspiration(businessId: string, id: string, patch: Record<string, unknown>) {
  const [item] = await db
    .update(inspirationItems)
    .set(patch)
    .where(and(eq(inspirationItems.businessId, businessId), eq(inspirationItems.id, id)))
    .returning();
  return item;
}

export async function removeInspiration(businessId: string, id: string) {
  const [existing] = await db
    .select()
    .from(inspirationItems)
    .where(and(eq(inspirationItems.businessId, businessId), eq(inspirationItems.id, id)))
    .limit(1);
  if (!existing) return;
  if (existing.imageUrl) await deleteAsset(existing.imageUrl);
  await db.delete(moodboardItems).where(eq(moodboardItems.itemId, id));
  await db.delete(inspirationItems).where(and(eq(inspirationItems.businessId, businessId), eq(inspirationItems.id, id)));
}

export async function fetchUrlMeta(url: string) {
  const res = await fetch(url, { headers: { "user-agent": "MytivOS/1.0 (inspiration fetch)" } });
  const html = await res.text();
  const pick = (prop: string) => {
    const m = html.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"));
    return m?.[1] || "";
  };
  return {
    title: pick("og:title") || (html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? ""),
    imageUrl: pick("og:image"),
    description: pick("og:description"),
  };
}

// ---------------------------------------------------------------------------
// Moodboards
// ---------------------------------------------------------------------------

export async function listMoodboards(businessId: string) {
  return db.select().from(moodboards).where(eq(moodboards.businessId, businessId));
}

export async function getMoodboard(businessId: string, id: string) {
  const [board] = await db.select().from(moodboards).where(and(eq(moodboards.businessId, businessId), eq(moodboards.id, id))).limit(1);
  if (!board) return null;
  const items = await db
    .select({ item: inspirationItems, position: moodboardItems.position })
    .from(moodboardItems)
    .innerJoin(inspirationItems, eq(inspirationItems.id, moodboardItems.itemId))
    .where(eq(moodboardItems.moodboardId, id));
  return { board, items };
}

export async function createMoodboard(businessId: string, name: string, description?: string) {
  const [board] = await db.insert(moodboards).values({ businessId, name, description: description ?? "" }).returning();
  return board;
}

export async function removeMoodboard(businessId: string, id: string) {
  const [owned] = await db.select({ id: moodboards.id }).from(moodboards).where(and(eq(moodboards.businessId, businessId), eq(moodboards.id, id))).limit(1);
  if (!owned) return;
  await db.delete(moodboardItems).where(eq(moodboardItems.moodboardId, id));
  await db.delete(moodboards).where(eq(moodboards.id, id));
}

export async function addMoodboardItem(businessId: string, moodboardId: string, itemId: string) {
  const [existing] = await db
    .select()
    .from(moodboardItems)
    .where(and(eq(moodboardItems.moodboardId, moodboardId), eq(moodboardItems.itemId, itemId)))
    .limit(1);
  if (existing) return existing;
  const [added] = await db.insert(moodboardItems).values({ businessId, moodboardId, itemId }).returning();
  return added;
}

export async function removeMoodboardItem(moodboardId: string, itemId: string) {
  await db.delete(moodboardItems).where(and(eq(moodboardItems.moodboardId, moodboardId), eq(moodboardItems.itemId, itemId)));
}
