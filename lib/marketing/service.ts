import 'server-only';
import { and, desc, eq, ne } from 'drizzle-orm';
import { db } from '../db';
import { marketingSnapshots } from '../db/schema';
import { type MarketingPlan } from './contract';
import { validateMarketingPlan } from './validate';
import { OpsPolicyError } from '../ops-policy';
import type { MarketingBinding } from './binding';

export { getMarketingBinding } from './binding-store';

/** The current plan: the latest revision imported under the ACTIVE binding version (T-2.3). Plans from an
 *  earlier binding version are history, never the current plan. */
export async function latestPlan(businessId: string, projectId: string, binding: MarketingBinding): Promise<MarketingPlan | null> {
  const [row] = await db.select().from(marketingSnapshots)
    .where(and(eq(marketingSnapshots.businessId, businessId), eq(marketingSnapshots.projectId, projectId), eq(marketingSnapshots.bindingVersion, binding.bindingVersion)))
    .orderBy(desc(marketingSnapshots.revision)).limit(1);
  // Composed C1 validation (AJV structural + reference parser) — never parseMarketingPlan directly.
  return row ? validateMarketingPlan(row.payload, binding.marketingBusiness) : null;
}

/** Plans imported under earlier binding versions, newest first — shown as "previous binding". */
export async function previousBindingPlans(businessId: string, projectId: string, currentVersion: number) {
  return db.select({ bindingVersion: marketingSnapshots.bindingVersion, revision: marketingSnapshots.revision, importedAt: marketingSnapshots.createdAt })
    .from(marketingSnapshots)
    .where(and(eq(marketingSnapshots.businessId, businessId), eq(marketingSnapshots.projectId, projectId), ne(marketingSnapshots.bindingVersion, currentVersion)))
    .orderBy(desc(marketingSnapshots.bindingVersion), desc(marketingSnapshots.revision)).limit(20);
}

/** The database refuses an import under a non-active binding version or out of revision order (0009
 *  trigger); surface those as conflicts rather than an outage. */
function snapshotConflict(error: unknown): OpsPolicyError | null {
  for (let e: unknown = error, depth = 0; e && typeof e === 'object' && depth < 5; e = (e as { cause?: unknown }).cause, depth++) {
    const message = (e as { message?: unknown }).message;
    if (typeof message !== 'string') continue;
    if (message.includes('stale_binding_version')) return new OpsPolicyError('stale_binding_version', 409);
    if (message.includes('stale_or_conflicting_revision')) return new OpsPolicyError('stale_or_conflicting_revision', 409);
  }
  return null;
}

export async function importPlan(businessId: string, projectId: string, userId: string, plan: MarketingPlan, binding: MarketingBinding) {
  const current = await latestPlan(businessId, projectId, binding);
  if (current && (plan.revision <= current.revision || Date.parse(plan.asOf) < Date.parse(current.asOf))) throw new OpsPolicyError('stale_or_conflicting_revision', 409);
  let row: { id: string } | undefined;
  try {
    [row] = await db.insert(marketingSnapshots).values({ businessId, projectId, importedBy: userId, revision: plan.revision, bindingVersion: binding.bindingVersion, payload: plan })
      .onConflictDoNothing().returning({ id: marketingSnapshots.id });
  } catch (error) { throw snapshotConflict(error) ?? error; }
  if (!row) throw new OpsPolicyError('revision_already_imported', 409);
  return { ok: true, revision: plan.revision, bindingVersion: binding.bindingVersion };
}
