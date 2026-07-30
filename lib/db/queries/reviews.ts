/**
 * Ported from electron/ipc/reviews.cjs. Action items cascade from the review
 * row (FK onDelete: cascade), but the review lookup is still business-scoped so
 * a caller can't delete another tenant's review by id.
 */
import { and, desc, eq } from "drizzle-orm";
import { db } from "../index";
import { weeklyReviews } from "../schema";

export async function listReviews(businessId: string) {
  return db
    .select({
      id: weeklyReviews.id,
      title: weeklyReviews.title,
      weekStart: weeklyReviews.weekStart,
      weekEnd: weeklyReviews.weekEnd,
      createdAt: weeklyReviews.createdAt,
    })
    .from(weeklyReviews)
    .where(eq(weeklyReviews.businessId, businessId))
    .orderBy(desc(weeklyReviews.createdAt));
}

export async function getReview(businessId: string, id: string) {
  const [row] = await db
    .select()
    .from(weeklyReviews)
    .where(and(eq(weeklyReviews.businessId, businessId), eq(weeklyReviews.id, id)))
    .limit(1);
  return row ?? null;
}

export async function createReview(
  businessId: string,
  data: { title: string; weekStart?: string | null; weekEnd?: string | null; payload: unknown }
) {
  const [row] = await db
    .insert(weeklyReviews)
    .values({
      businessId,
      title: data.title,
      weekStart: data.weekStart ?? null,
      weekEnd: data.weekEnd ?? null,
      payload: data.payload,
    })
    .returning();
  return row;
}

export async function removeReview(businessId: string, id: string) {
  await db
    .delete(weeklyReviews)
    .where(and(eq(weeklyReviews.businessId, businessId), eq(weeklyReviews.id, id)));
}
