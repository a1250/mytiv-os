/**
 * Per-business rate limiting for the endpoints that cost money on every call
 * (Claude) or hit third-party sites (discovery scraping). Without it a single
 * runaway loop — or one impatient user holding down a button — can burn the
 * whole API budget.
 *
 * Fixed window rather than sliding: the counter is a single row per
 * business + bucket + window, incremented with INSERT ... ON CONFLICT DO
 * UPDATE ... RETURNING, which Postgres evaluates atomically. Two concurrent
 * requests therefore cannot both read "9 of 10" and both proceed — the second
 * one sees 10. A sliding window would need per-hit rows and pruning for a
 * precision this workload doesn't need.
 */
import { NextResponse } from "next/server";
import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "./db";
import { rateLimits } from "./db/schema";

export type Bucket = "ai" | "discovery";

/** Deliberately generous — these guard against runaway loops, not against use. */
const LIMITS: Record<Bucket, { limit: number; windowMs: number; label: string }> = {
  ai: { limit: 60, windowMs: 60 * 60 * 1000, label: "AI generations" },
  discovery: { limit: 20, windowMs: 60 * 60 * 1000, label: "discovery searches" },
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  /** Seconds until the current window rolls over. */
  retryAfter: number;
};

function windowStartFor(windowMs: number) {
  return new Date(Math.floor(Date.now() / windowMs) * windowMs);
}

export async function checkRateLimit(businessId: string, bucket: Bucket): Promise<RateLimitResult> {
  const { limit, windowMs } = LIMITS[bucket];
  const windowStart = windowStartFor(windowMs);

  const [row] = await db
    .insert(rateLimits)
    .values({ businessId, bucket, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.businessId, rateLimits.bucket, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });

  const count = row?.count ?? 1;
  const retryAfter = Math.max(1, Math.ceil((windowStart.getTime() + windowMs - Date.now()) / 1000));

  // Opportunistic cleanup of windows that can no longer be hit. Cheap, indexed,
  // and avoids needing a cron just to prune counters.
  if (count === 1) {
    void db
      .delete(rateLimits)
      .where(and(eq(rateLimits.businessId, businessId), lt(rateLimits.windowStart, new Date(Date.now() - windowMs * 2))))
      .catch(() => {});
  }

  return { allowed: count <= limit, remaining: Math.max(0, limit - count), limit, retryAfter };
}

/**
 * Returns a 429 response when the caller is over its limit, or null to proceed.
 * Route handlers call this right after guard().
 */
export async function rateLimitGuard(businessId: string, bucket: Bucket): Promise<NextResponse | null> {
  const result = await checkRateLimit(businessId, bucket);
  if (result.allowed) return null;

  const { label } = LIMITS[bucket];
  return NextResponse.json(
    {
      ok: false,
      error: `Rate limit reached: ${result.limit} ${label} per hour for this business. Try again in ${Math.ceil(result.retryAfter / 60)} minute(s).`,
      code: "rate_limited",
      retryAfter: result.retryAfter,
    },
    { status: 429, headers: { "Retry-After": String(result.retryAfter) } }
  );
}
