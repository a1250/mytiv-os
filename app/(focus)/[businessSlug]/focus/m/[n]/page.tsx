import { notFound, redirect } from "next/navigation";
import { scopeBase, scopedHref } from "@/lib/focus/scope";
import { requireDemoScope } from "@/lib/focus/scope.server";
import { MOBILE_TARGETS } from "@/lib/focus/screens";

/**
 * Prototype only (demo scope): handoff mobile frames M1–M10 are the real responsive screens at 390px, not separate
 * pages — this route redirects to the screen. (The screen map shows them inside a phone frame.)
 */
export default async function Page({ params }: { params: Promise<{ businessSlug: string; n: string }> }) {
  const { businessSlug, n } = await params;
  const scope = await requireDemoScope(businessSlug);
  const target = MOBILE_TARGETS[`M${n}`];
  if (!target) notFound();
  redirect(scopedHref(scopeBase(scope.slug), target[0]));
}
