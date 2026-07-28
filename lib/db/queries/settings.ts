/**
 * businessId-first query helpers, per the plan's mandatory-first-parameter
 * convention (structurally hard to write a query that forgets tenant scoping).
 */
import { eq, and } from "drizzle-orm";
import { db } from "../index";
import { settings } from "../schema";

export async function getSettingsForBusiness(businessId: string): Promise<Record<string, string | null>> {
  const rows = await db.select().from(settings).where(eq(settings.businessId, businessId));
  const out: Record<string, string | null> = {};
  for (const row of rows) out[row.key] = row.value;
  return out;
}

export async function setSettingForBusiness(businessId: string, key: string, value: string | null) {
  const [existing] = await db
    .select()
    .from(settings)
    .where(and(eq(settings.businessId, businessId), eq(settings.key, key)))
    .limit(1);

  if (existing) {
    await db.update(settings).set({ value }).where(eq(settings.id, existing.id));
  } else {
    await db.insert(settings).values({ businessId, key, value });
  }
}
