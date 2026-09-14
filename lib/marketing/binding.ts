// Pure: no database import, so this is testable and safe to call during any render.

/** Configured by deployment operator, never through a request body or editable project field. */
export function marketingBinding(businessSlug: string, projectId: string): string | null {
  // A malformed binding table is an operator error, not a request error: fail closed to "not
  // connected" for every project rather than surfacing a JSON parse failure as `invalid_json`.
  let mappings: Record<string, unknown>;
  try { mappings = JSON.parse(process.env.OPS_MARKETING_BINDINGS || '{}') as Record<string, unknown>; }
  catch { console.error('OPS_MARKETING_BINDINGS is not valid JSON — no marketing binding will resolve'); return null; }
  const value = mappings[`${businessSlug}:${projectId}`];
  return typeof value === 'string' && /^[a-z0-9_-]+$/.test(value) ? value : null;
}
