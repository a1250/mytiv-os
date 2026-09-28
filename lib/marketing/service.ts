import 'server-only';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { marketingSnapshots } from '../db/schema';
import { parseMarketingPlan, type MarketingPlan } from './contract';
import { OpsPolicyError } from '../ops-policy';

export { marketingBinding } from './binding';
export async function latestPlan(businessId: string, projectId: string, marketingBusiness: string): Promise<MarketingPlan | null> {
  const [row] = await db.select().from(marketingSnapshots).where(and(eq(marketingSnapshots.businessId, businessId), eq(marketingSnapshots.projectId, projectId))).orderBy(desc(marketingSnapshots.revision)).limit(1);
  return row ? parseMarketingPlan(row.payload, marketingBusiness) : null;
}
export async function importPlan(businessId: string, projectId: string, userId: string, plan: MarketingPlan) {
  const current = await latestPlan(businessId, projectId, plan.marketingBusiness);
  if (current && (plan.revision <= current.revision || Date.parse(plan.asOf) < Date.parse(current.asOf))) throw new OpsPolicyError('stale_or_conflicting_revision', 409);
  const [row] = await db.insert(marketingSnapshots).values({ businessId, projectId, importedBy: userId, revision: plan.revision, payload: plan }).onConflictDoNothing().returning({ id: marketingSnapshots.id });
  if (!row) throw new OpsPolicyError('revision_already_imported', 409);
  return { ok: true, revision: plan.revision };
}
