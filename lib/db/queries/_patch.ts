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

/**
 * Declared as T -> T rather than T -> Omit<T, immutable>: callers type their
 * payloads as `{ title: string } & Record<string, unknown>`, and Omit over a
 * type carrying a string index signature collapses the literal keys, so Drizzle
 * would stop seeing that required columns like `title` were supplied. The
 * removal is real at runtime; the type just doesn't narrow. Insert callers put
 * `businessId` after the spread, so the guarded value wins either way.
 */
/**
 * True when a patch has nothing left after sanitizing — e.g. a body containing
 * only `businessId`. Callers whose UPDATE has no other columns to set must
 * check this: Drizzle throws "No values to set" on an empty SET, which would
 * turn a correctly-blocked tenant-reassignment attempt into a 500.
 */
export function isEmptyPatch(patch: Record<string, unknown>): boolean {
  return Object.keys(sanitizePatch(patch)).length === 0;
}

export function sanitizePatch<T extends Record<string, unknown>>(patch: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if ((IMMUTABLE_COLUMNS as readonly string[]).includes(key)) continue;
    out[key] = value;
  }
  return out as T;
}
