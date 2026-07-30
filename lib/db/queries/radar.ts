import { and, eq } from "drizzle-orm";
import { db } from "../index";
import { newsItems } from "../schema";
import { sanitizePatch, isEmptyPatch } from "./_patch";
import { DEFAULT_FEEDS, WHY_BY_CATEGORY, ACTION_BY_CATEGORY, fetchUrl, parseFeed, categorize, score, extractTags } from "../../services/rss";

export async function listNews(businessId: string) {
  return db.select().from(newsItems).where(eq(newsItems.businessId, businessId));
}

export async function createNews(businessId: string, data: { title: string } & Record<string, unknown>) {
  const [item] = await db.insert(newsItems).values({ ...sanitizePatch(data), businessId }).returning();
  return item;
}

export async function updateNews(businessId: string, id: string, patch: Record<string, unknown>) {
  // news_items has no updatedAt, so a patch of only immutable fields would
  // leave an empty SET — return the row unchanged instead of erroring.
  if (isEmptyPatch(patch)) {
    const [current] = await db
      .select()
      .from(newsItems)
      .where(and(eq(newsItems.businessId, businessId), eq(newsItems.id, id)))
      .limit(1);
    return current ?? null;
  }
  const [item] = await db
    .update(newsItems)
    .set(sanitizePatch(patch))
    .where(and(eq(newsItems.businessId, businessId), eq(newsItems.id, id)))
    .returning();
  return item;
}

export async function removeNews(businessId: string, id: string) {
  await db.delete(newsItems).where(and(eq(newsItems.businessId, businessId), eq(newsItems.id, id)));
}

/** Ported from rss.cjs's refreshRadar — same dedupe/cap logic, Drizzle instead of raw SQLite. */
export async function refreshRadar(businessId: string, feedUrls?: string[]) {
  const feeds = (feedUrls && feedUrls.length ? feedUrls : DEFAULT_FEEDS).slice(0, 12);
  const rows = await db.select({ url: newsItems.url, title: newsItems.title }).from(newsItems).where(eq(newsItems.businessId, businessId));
  const existingUrls = new Set(rows.map((r) => r.url));
  const existingTitles = new Set(rows.map((r) => r.title.toLowerCase()));

  let added = 0;
  let skipped = 0;
  const errors: { feed: string; message: string }[] = [];

  for (const feed of feeds) {
    try {
      const xml = await fetchUrl(feed.trim());
      const items = parseFeed(xml, feed.trim()).slice(0, 20);
      for (const item of items) {
        if (added >= 40) break;
        if (existingUrls.has(item.url) || existingTitles.has(item.title.toLowerCase())) {
          skipped++;
          continue;
        }
        const haystack = `${item.title} ${item.summary}`;
        const category = categorize(haystack);
        if (!category) {
          skipped++;
          continue;
        }
        const relevance = score(haystack, category);
        await db.insert(newsItems).values({
          businessId,
          title: item.title,
          source: item.source,
          url: item.url,
          category,
          publishedAt: item.published_at,
          summary: item.summary,
          whyItMatters: WHY_BY_CATEGORY[category] || "",
          relevance,
          tags: extractTags(haystack),
          saved: false,
          actionIdea: ACTION_BY_CATEGORY[category] || "",
        });
        existingUrls.add(item.url);
        existingTitles.add(item.title.toLowerCase());
        added++;
      }
    } catch (err) {
      errors.push({ feed, message: err instanceof Error ? err.message : "unknown error" });
    }
  }

  return { added, skipped, errors };
}
