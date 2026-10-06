/** Pure validation shared by HTTP routes and model proposals. */
export class OpsPolicyError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function objectInput(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new OpsPolicyError('invalid_input');
  return value as Record<string, unknown>;
}
export function requiredText(value: unknown, name: string, max = 4000): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new OpsPolicyError(`invalid_${name}`);
  return value.trim();
}
export function dateMs(value: unknown): number {
  const date = requiredText(value, 'date', 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new OpsPolicyError('invalid_date');
  const ms = Date.parse(`${date}T12:00:00Z`);
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 10) !== date) throw new OpsPolicyError('invalid_date');
  return ms;
}
export function assertWriter(role: string) {
  if (!['owner', 'admin'].includes(role)) throw new OpsPolicyError('approval_role_required', 403);
}
/** Owner-only actions (e.g. the marketing tenant binding, D2): admins and members are refused. */
export function assertOwner(role: string) {
  if (role !== 'owner') throw new OpsPolicyError('owner_role_required', 403);
}
/** A state-changing request must come from this app's own origin (browsers always send Origin on non-GET fetches). */
export function assertSameOrigin(req: Request) {
  if (req.headers.get('origin') !== new URL(req.url).origin) throw new OpsPolicyError('same_origin_required', 403);
}
export function assertConfirmation(req: Request, body: Record<string, unknown>) {
  assertSameOrigin(req);
  if (body.confirmed !== true) throw new OpsPolicyError('explicit_confirmation_required');
  if (typeof body.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.requestId)) throw new OpsPolicyError('invalid_request_id');
}
export function assertClosure(statusType: string, evidenceUrl: unknown, reviewed: unknown, urls: string[]) {
  if (!['closed', 'done'].includes(statusType)) return;
  if (reviewed !== true || typeof evidenceUrl !== 'string' || !urls.includes(evidenceUrl)) {
    throw new OpsPolicyError('Review an attached recording and provide its exact URL before closing.', 409);
  }
}

/**
 * The `date_updated` marker a caller claims to have seen, from the ISO `updatedAt` on a board row.
 * `undefined` = no claim made (no changed-since check); an empty row marker = "" is treated as null.
 * ClickUp's marker is milliseconds as a string, which is how `OpsTask.updatedAt` was derived.
 */
export function expectedMarker(updatedAt: unknown): string | null | undefined {
  if (updatedAt === undefined) return undefined;
  if (updatedAt === null || updatedAt === '') return null;
  if (typeof updatedAt !== 'string') throw new OpsPolicyError('invalid_expected_updated_at');
  const ms = Date.parse(updatedAt);
  if (!Number.isFinite(ms)) throw new OpsPolicyError('invalid_expected_updated_at');
  return String(ms);
}
