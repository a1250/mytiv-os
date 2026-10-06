import { redirect } from "next/navigation";
import { R } from "@/lib/focus/routes";
import { scopeBase, scopedHref } from "@/lib/focus/scope";
import { requireDemoScope } from "@/lib/focus/scope.server";

/** W4 (task drawer) is not a page of its own: the drawer opens over the project list for the task in `?task=`. */
export default async function Page({ params }: { params: Promise<{ businessSlug: string }> }) {
  // the target is a fixture task: demo scope only (a business gets a 404 like every other prototype route)
  const scope = await requireDemoScope((await params).businessSlug);
  redirect(scopedHref(scopeBase(scope.slug), R.task("t-post45")));
}
