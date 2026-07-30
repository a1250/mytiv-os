/**
 * Update helpers take a caller-supplied patch object and spread it into
 * Drizzle's .set(). The WHERE clause scopes the lookup to the caller's
 * business, so a caller can't reach another tenant's row — but without this
 * filter it could still put `businessId` in the request body and *move its own
 * row into another business*, injecting data into a workspace it doesn't own.
 *
 * Identity and provenance columns are never patchable from a request body;
 * strip them before they reach .set(). updatedAt is stripped too because every
 * update helper sets it to the server clock itself.
 */
const IMMUTABLE_COLUMNS = ["id", "businessId", "createdAt", "updatedAt"] as const;

export function sanitizePatch<T extends Record<string, unknown>>(patch: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if ((IMMUTABLE_COLUMNS as readonly string[]).includes(key)) continue;
    out[key] = value;
  }
  return out;
}
