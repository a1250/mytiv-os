import 'server-only';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { marketingBindings } from '../db/schema';
import { activeBinding, bindingPolicyError, MARKETING_TENANT_SLUG, type MarketingBinding } from './binding';
import { OpsPolicyError } from '../ops-policy';

/** The active marketing binding of (business, project) from the database — the only runtime source of
 *  truth (D2). No row, revoked, malformed or a database error → null ("not connected"): fail closed. */
export async function getMarketingBinding(businessId: string, projectId: string): Promise<MarketingBinding | null> {
  try {
    const [row] = await db.select().from(marketingBindings)
      .where(and(eq(marketingBindings.businessId, businessId), eq(marketingBindings.projectId, projectId))).limit(1);
    return activeBinding(row);
  } catch (error) {
    console.error('marketing binding read failed — treating the project as not connected', error instanceof Error ? error.message : error);
    return null;
  }
}

async function callBindingFunction(query: ReturnType<typeof sql>): Promise<number> {
  try {
    const result = await db.execute(query);
    const version = Number((result.rows[0] as { v?: unknown } | undefined)?.v);
    if (!Number.isSafeInteger(version) || version < 1) throw new Error('binding function returned no version');
    return version;
  } catch (error) {
    throw bindingPolicyError(error) ?? error;
  }
}

/** Bind or rebind (business, project) to a marketing tenant. Owner-only and serialized in the database;
 *  every call appends an event (actor + request id) and returns the new binding version. */
export async function bindMarketing(scope: { businessId: string; userId: string }, projectId: string, marketingBusiness: string, requestId: string) {
  if (!MARKETING_TENANT_SLUG.test(marketingBusiness)) throw new OpsPolicyError('invalid_marketing_business');
  const bindingVersion = await callBindingFunction(sql`select marketing_bind(${scope.businessId}::uuid, ${projectId}::uuid, ${marketingBusiness}, ${scope.userId}::uuid, ${requestId}::uuid) as v`);
  return { ok: true as const, marketingBusiness, bindingVersion };
}

/** Revoke the current binding ("not connected"); the version is kept, a later bind opens version + 1. */
export async function revokeMarketing(scope: { businessId: string; userId: string }, projectId: string, requestId: string) {
  const bindingVersion = await callBindingFunction(sql`select marketing_revoke(${scope.businessId}::uuid, ${projectId}::uuid, ${scope.userId}::uuid, ${requestId}::uuid) as v`);
  return { ok: true as const, revoked: true as const, bindingVersion };
}
