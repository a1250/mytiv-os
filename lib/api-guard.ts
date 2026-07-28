/**
 * Shared guard for app/api/[businessSlug]/** Route Handlers: checks the
 * session and resolves+scopes the business in one call, so every route
 * handler body starts from an already-verified businessId. Throws a
 * NextResponse (via a tagged error) that the route should return directly.
 */
import { NextResponse } from "next/server";
import { auth } from "./auth";
import { resolveBusinessOrNull } from "./tenant";

export class ApiGuardError extends Error {
  constructor(public response: NextResponse) {
    super("ApiGuardError");
  }
}

export async function guard(businessSlug: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiGuardError(NextResponse.json({ error: "unauthorized" }, { status: 401 }));
  }
  const resolved = await resolveBusinessOrNull(businessSlug, session.user.id);
  if (!resolved) {
    throw new ApiGuardError(NextResponse.json({ error: "not found" }, { status: 404 }));
  }
  return { businessId: resolved.business.id, business: resolved.business, role: resolved.role, userId: session.user.id };
}

/** Wrap a route handler body so ApiGuardError becomes the right HTTP response. */
export function withGuard<T>(fn: () => Promise<T>): Promise<T | NextResponse> {
  return fn().catch((err) => {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  });
}
