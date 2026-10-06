import "server-only";
import type { Metadata } from "next";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveBusinessOrNull } from "@/lib/tenant";
import { decideFocusScope, fixturesAllowed, prototypeSurfacesEnabled, type FocusScope } from "./scope";

/**
 * The verified Focus scope for this request (server only). Same trust model as lib/api-guard.ts `guard()`: the
 * session from `auth()`, membership from `resolveBusinessOrNull`. Redirects to /login without a session and renders
 * 404 for a business that does not exist or is not yours. Memoised per request, so the layout and its pages share
 * one check. Future Focus adapters start from here (`requireBusinessScope(await getFocusScope(slug))`).
 */
export const getFocusScope = cache(async (businessSlug: string): Promise<FocusScope> => {
  const d = await decideFocusScope(businessSlug, {
    prototype: prototypeSurfacesEnabled(),
    getUserId: async () => (await auth())?.user?.id ?? null,
    resolve: resolveBusinessOrNull,
  });
  if (d.kind === "login") redirect("/login");
  if (d.kind === "notFound") notFound();
  return d.scope;
});

/** For prototype-only pages (screen map, reference, phone-frame redirects): 404 unless this is the demo scope. */
export async function requireDemoScope(businessSlug: string) {
  const scope = await getFocusScope(businessSlug);
  if (scope.kind !== "demo") notFound();
  return scope;
}

export type FocusPageProps = { params: Promise<{ businessSlug: string }> };

/**
 * Page-level guard for the fixture screens: true only in the demo scope. Every Focus page returns `null` otherwise,
 * so fixture screens never render (or serialise) for a business even though the layout already replaces them —
 * the guarantee does not depend on the layout alone.
 */
export async function rendersFixtures(params: FocusPageProps["params"]): Promise<boolean> {
  return fixturesAllowed(await getFocusScope((await params).businessSlug));
}

/**
 * Mytiv Work is connected for business scopes only where its API (and migrations 0012–0013) are live: the flag is
 * server-side and off by default. Everything else in Focus stays "not connected yet" for a business.
 */
export const workConnected = () => process.env.WORK_API_ENABLED === "true";
/** Approvals read the Marketing OS contracts already in Mytiv; on where the marketing module is (its own flag). */
export const approvalsConnected = () => process.env.MARKETING_MODULE_ENABLED === "true";
/** Business mail in Focus: Gmail sends only through backend-owned attempts (migration 0014). Off by default. */
export { externalActionsEnabled as mailConnected } from "@/lib/external/flag";

/** Page-level guard for the Work screens: the demo renders them on fixtures; a business when Work is connected. */
export async function rendersWork(params: FocusPageProps["params"]): Promise<boolean> {
  const scope = await getFocusScope((await params).businessSlug);
  return fixturesAllowed(scope) || workConnected();
}

/** Metadata for a fixture screen: its own title in the demo scope; a neutral one for a business (no fixture names). */
export function fixtureMetadata(metadata: Metadata) {
  return async ({ params }: FocusPageProps): Promise<Metadata> => ((await rendersFixtures(params)) ? metadata : { title: "Focus — Mytiv OS", robots: { index: false } });
}
