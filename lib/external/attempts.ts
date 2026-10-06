import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { payloadHash, workRefusalOf } from "@/lib/work/commands";

/**
 * Backend-owned external attempts (migration 0014). The server — never the browser — records an attempt BEFORE it
 * calls the provider and settles it with the provider's answer. The DB function `external_attempt_admit` is the
 * gate (per target, under a lock): in flight or confirmed → refused; after an UNKNOWN outcome → refused unless the
 * user attested, for that attempt, that they checked the target and the earlier attempt did not happen.
 */
export type AttemptKind = "gmail_send" | "meta_schedule";
export type AttemptState = "in_flight" | "confirmed" | "failed" | "unknown";
export type Attempt = {
  id: string; kind: AttemptKind; target: string; state: AttemptState; requestId: string; actorId: string;
  attestedUnknownAttemptId: string | null; providerRef: string | null; error: string | null; createdAt: string; settledAt: string | null;
};

const fromRow = (r: Record<string, unknown>): Attempt => ({
  id: String(r.id), kind: r.kind as AttemptKind, target: String(r.target), state: r.state as AttemptState, requestId: String(r.request_id),
  actorId: String(r.actor_id), attestedUnknownAttemptId: (r.attested_unknown_attempt_id as string | null) ?? null, providerRef: (r.provider_ref as string | null) ?? null,
  error: (r.error as string | null) ?? null, createdAt: String(r.created_at), settledAt: (r.settled_at as string | null) ?? null,
});
const first = (res: unknown) => { const row = (res as { rows: Record<string, unknown>[] }).rows[0]; const v = Object.values(row ?? {})[0]; return (typeof v === "string" ? JSON.parse(v) : v) as Record<string, unknown>; };

export async function admitAttempt(scope: { businessId: string; userId: string }, requestId: string, kind: AttemptKind, target: string, payload: Record<string, unknown>, attestedUnknownAttemptId?: string | null):
  Promise<{ admitted: true; attempt: Attempt } | { admitted: false; replayed: true; attempt: Attempt }> {
  const hash = payloadHash(kind, { target, payload, attestedUnknownAttemptId: attestedUnknownAttemptId ?? null });
  await expire(scope.businessId, target);
  try {
    const r = first(await db.execute(sql`select external_attempt_admit(${scope.businessId}::uuid, ${scope.userId}::uuid, ${requestId}::uuid, ${kind}, ${target}, ${hash}, ${JSON.stringify(payload)}::jsonb, ${attestedUnknownAttemptId ?? null}::uuid) as r`));
    const attempt = fromRow(r.attempt as Record<string, unknown>);
    return r.admitted ? { admitted: true, attempt } : { admitted: false, replayed: true, attempt };
  } catch (e) {
    throw workRefusalOf(e) ?? e;
  }
}

export async function settleAttempt(businessId: string, attemptId: string, state: Exclude<AttemptState, "in_flight">, providerRef: string | null, error: string | null): Promise<Attempt> {
  return fromRow(first(await db.execute(sql`select external_attempt_settle(${businessId}::uuid, ${attemptId}::uuid, ${state}, ${providerRef}, ${error}) as r`)));
}

/** Committed on its own: an attempt the server never settled becomes UNKNOWN (and stays so even if the next admit is refused). */
async function expire(businessId: string, target: string) {
  await db.execute(sql`select external_attempt_expire(${businessId}::uuid, ${target})`);
}

export async function listAttempts(businessId: string, target: string): Promise<Attempt[]> {
  await expire(businessId, target);
  const res = await db.execute(sql`select to_jsonb(a) as r from external_attempts a where a.business_id = ${businessId}::uuid and a.target = ${target} order by a.created_at desc, a.id desc limit 50`);
  return (res as { rows: Record<string, unknown>[] }).rows.map((x) => fromRow((typeof x.r === "string" ? JSON.parse(x.r) : x.r) as Record<string, unknown>));
}
