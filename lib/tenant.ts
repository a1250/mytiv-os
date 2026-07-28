/**
 * Tenant resolution — the single choke point every Route Handler and Server
 * Component must call before touching business data. Replaces the Electron
 * app's implicit single-tenant assumption (one global settings row, no
 * business concept at all).
 */
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "./db";
import { businesses, businessMemberships } from "./db/schema";
import type { Business } from "./db/schema";

export type ResolvedBusiness = {
  business: Business;
  role: "owner" | "admin" | "member";
};

/**
 * Looks up a business by slug and confirms the given user is a member.
 * Throws Next.js's notFound() (renders as a 404) if the business doesn't
 * exist or the user isn't a member — deliberately indistinguishable from
 * "doesn't exist" so membership can't be probed by slug guessing.
 */
export async function resolveBusiness(slug: string, userId: string): Promise<ResolvedBusiness> {
  const [business] = await db.select().from(businesses).where(eq(businesses.slug, slug)).limit(1);
  if (!business) notFound();

  const [membership] = await db
    .select()
    .from(businessMemberships)
    .where(and(eq(businessMemberships.businessId, business.id), eq(businessMemberships.userId, userId)))
    .limit(1);
  if (!membership) notFound();

  return { business, role: membership.role as ResolvedBusiness["role"] };
}

/** All businesses the given user belongs to — powers the business switcher. */
export async function listBusinessesForUser(userId: string) {
  return db
    .select({ business: businesses, role: businessMemberships.role })
    .from(businessMemberships)
    .innerJoin(businesses, eq(businesses.id, businessMemberships.businessId))
    .where(eq(businessMemberships.userId, userId));
}
