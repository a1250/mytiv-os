// Pure: no database import, so this is testable and safe to call during any render.
import { OpsPolicyError } from '../ops-policy';

/**
 * Marketing tenant binding (owner decision D2). The database (`marketing_bindings`, migration 0008) is
 * the ONLY runtime source of truth: a request never falls back to the environment. The legacy
 * `OPS_MARKETING_BINDINGS` variable survives only as input to the explicit, owner-run bootstrap
 * (`scripts/marketing-bind-bootstrap.ts`), which records an audited version-1 bind in the database.
 */
export type MarketingBinding = { marketingBusiness: string; bindingVersion: number };

/** The canonical marketing-os tenant slug (`Slug` in marketing-os `schemas/common.ts`). */
export const MARKETING_TENANT_SLUG = /^[a-z0-9][a-z0-9-]*$/;

/** A current `marketing_bindings` row → the active binding, or null ("not connected") when there is no
 *  row, it is revoked, or it is malformed. Fails closed. */
export function activeBinding(row: { marketingBusiness?: unknown; bindingVersion?: unknown; revoked?: unknown } | null | undefined): MarketingBinding | null {
  if (!row || row.revoked !== false) return null;
  const { marketingBusiness, bindingVersion } = row;
  if (typeof marketingBusiness !== 'string' || !MARKETING_TENANT_SLUG.test(marketingBusiness)) return null;
  if (!Number.isSafeInteger(bindingVersion) || (bindingVersion as number) < 1) return null;
  return { marketingBusiness, bindingVersion: bindingVersion as number };
}

/** Postgres errors raised by the binding functions/constraints → the policy error the caller sees. */
const DB_ERRORS: Record<string, [string, number]> = {
  marketing_binding_owner_required: ['binding_owner_required', 403],
  marketing_binding_unchanged: ['binding_unchanged', 409],
  marketing_binding_not_bound: ['binding_not_bound', 409],
};
export function bindingPolicyError(error: unknown): OpsPolicyError | null {
  for (let e: unknown = error, depth = 0; e && typeof e === 'object' && depth < 5; e = (e as { cause?: unknown }).cause, depth++) {
    const { code, message } = e as { code?: unknown; message?: unknown };
    if (typeof message === 'string') {
      for (const [raised, [name, status]] of Object.entries(DB_ERRORS)) if (message.includes(raised)) return new OpsPolicyError(name, status);
    }
    if (code === '23514') return new OpsPolicyError('invalid_marketing_business'); // check_violation (slug)
    if (code === '23503') return new OpsPolicyError('not_found', 404); // project not in this business
    if (code === '23505') return new OpsPolicyError('request_already_claimed_check_audit_before_retry', 409); // replayed request id
  }
  return null;
}

/** Bootstrap input only: `{"<ops-business-slug>:<project-uuid>": "<marketing tenant slug>"}`. Unlike the
 *  request path this is strict — malformed input is an error the owner must see, never silently skipped. */
export type BootstrapBinding = { businessSlug: string; projectId: string; marketingBusiness: string };
export function parseBootstrapBindings(raw: string | undefined): BootstrapBinding[] {
  if (!raw || !raw.trim()) return [];
  let map: unknown;
  try { map = JSON.parse(raw); } catch { throw new Error('OPS_MARKETING_BINDINGS is not valid JSON'); }
  if (!map || typeof map !== 'object' || Array.isArray(map)) throw new Error('OPS_MARKETING_BINDINGS must be a JSON object');
  return Object.entries(map as Record<string, unknown>).map(([key, value]) => {
    const m = /^([a-z0-9][a-z0-9-]*):([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.exec(key);
    if (!m) throw new Error(`OPS_MARKETING_BINDINGS key "${key}" is not "<business-slug>:<project-uuid>"`);
    if (typeof value !== 'string' || !MARKETING_TENANT_SLUG.test(value)) throw new Error(`OPS_MARKETING_BINDINGS value for "${key}" is not a marketing tenant slug`);
    return { businessSlug: m[1], projectId: m[2].toLowerCase(), marketingBusiness: value };
  });
}
