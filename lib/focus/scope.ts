/**
 * Focus tenant scope — who and which business a Focus page is rendered for.
 *
 * Focus product routes live under the canonical tenant segment, `/{businessSlug}/focus/...` (the same model as
 * app/(app)/[businessSlug] and app/api/[businessSlug]): the scope is verified on the server from the session plus
 * membership (`auth()` → `resolveBusinessOrNull`, exactly like lib/api-guard.ts). The slug only *selects* a business;
 * it never becomes an identity without the membership check, and query parameters are not an input at all.
 *
 * The fixture demo is a separate scope, `/_demo/focus/...`. It exists only where prototype surfaces are enabled
 * (development and Vercel Preview), carries no business identity, and is the only scope that may render fixtures.
 * `_demo` has a leading underscore, so it cannot collide with a slug a business is created with (seeded slugs are
 * lowercase letters, digits and dashes); `decideFocusScope` checks it before any tenant lookup either way.
 *
 * Pure: the server wrapper (scope.server.ts) injects the session and the tenant lookup; tests inject stubs.
 */

export const DEMO_SCOPE_SLUG = "_demo";

export type BusinessRole = "owner" | "admin" | "member";

/** A verified business scope — the only input future Focus adapters accept (see `requireBusinessScope`). */
export type BusinessScope = { kind: "business"; businessId: string; slug: string; name: string; role: BusinessRole; userId: string };
/** The fixture demo: no business, no user, fixtures only. Never available in production. */
export type DemoScope = { kind: "demo"; slug: typeof DEMO_SCOPE_SLUG };
export type FocusScope = BusinessScope | DemoScope;

export type ScopeDecision = { kind: "login" } | { kind: "notFound" } | { kind: "scope"; scope: FocusScope };

type Resolved = { business: { id: string; slug: string; name: string }; role: string } | null;

export type ScopeDeps = {
  /** prototype surfaces (fixture demo, screen map, reference) are enabled in this environment */
  prototype: boolean;
  /** the signed-in user's id from the verified session, or null */
  getUserId: () => Promise<string | null>;
  /** membership-checked lookup (lib/tenant `resolveBusinessOrNull`): null when the business is missing or not yours */
  resolve: (slug: string, userId: string) => Promise<Resolved>;
};

/**
 * Decide the scope for a Focus request. Fails closed:
 * - the demo slug → the demo scope only when prototype surfaces are on; otherwise not found (no session consulted);
 * - no session → login;
 * - not a member (or no such business) → not found, indistinguishable, like `resolveBusiness`;
 * - a member → a business scope whose identity comes from the resolved row, not from the URL.
 */
export async function decideFocusScope(slug: string, deps: ScopeDeps): Promise<ScopeDecision> {
  if (slug === DEMO_SCOPE_SLUG) return deps.prototype ? { kind: "scope", scope: { kind: "demo", slug: DEMO_SCOPE_SLUG } } : { kind: "notFound" };
  const userId = await deps.getUserId();
  if (!userId) return { kind: "login" };
  const r = await deps.resolve(slug, userId);
  if (!r) return { kind: "notFound" };
  const role: BusinessRole = r.role === "owner" || r.role === "admin" ? r.role : "member";
  return { kind: "scope", scope: { kind: "business", businessId: r.business.id, slug: r.business.slug, name: r.business.name, role, userId } };
}

/**
 * Prototype surfaces (the fixture demo scope, `/_demo/focus/screens`, `/_demo/focus/reference/*`, demo controls)
 * are on in development and on Vercel Preview only. A production build — Vercel production or a plain
 * `next start` — has them off, so it fails closed.
 */
export function prototypeSurfacesEnabled(env: { NODE_ENV?: string; VERCEL_ENV?: string } = process.env): boolean {
  return env.NODE_ENV !== "production" || env.VERCEL_ENV === "preview";
}

/** Only the demo scope may render fixtures; a business scope renders real data (via adapters) or nothing. */
export const fixturesAllowed = (scope: FocusScope) => scope.kind === "demo";

/** Narrow for adapters: business data is only ever read with a verified business scope. */
export function requireBusinessScope(scope: FocusScope): BusinessScope {
  if (scope.kind !== "business") throw new Error("Focus adapters require a verified business scope; the demo scope has no business.");
  return scope;
}

/** `/{slug}/focus` — the base every Focus URL of this scope hangs from. */
export const scopeBase = (slug: string) => `/${encodeURIComponent(slug)}/focus`;

/**
 * Resolve a Focus path (`R.*`, written scope-relative as "/focus/...") against a scope base. Anything else (other
 * app routes, absolute URLs, `tel:`/`mailto:`, hashes) is returned untouched.
 */
export function scopedHref(base: string, href: string): string {
  // already absolute inside this scope (e.g. a pathname from the router): idempotent, never doubled — matters for a
  // business whose slug is itself "focus" (base "/focus/focus")
  if (href === base || href.startsWith(base + "/") || href.startsWith(base + "?") || href.startsWith(base + "#")) return href;
  if (href === "/focus") return base;
  if (href.startsWith("/focus/") || href.startsWith("/focus?") || href.startsWith("/focus#")) return base + href.slice("/focus".length);
  return href;
}

/** The inverse, for active-state checks: an absolute Focus pathname → its scope-relative "/focus/..." form. */
export function unscopedPath(base: string, pathname: string): string {
  if (pathname === base) return "/focus";
  return pathname.startsWith(base + "/") ? "/focus" + pathname.slice(base.length) : pathname;
}
