import { redirect } from "next/navigation";
import { R } from "@/lib/focus/routes";
import { scopeBase, scopedHref } from "@/lib/focus/scope";
import { getFocusScope } from "@/lib/focus/scope.server";

/** W4 (task drawer) is not a page of its own: the drawer opens over the project list for the task in `?task=`. */
export default async function Page({ params }: { params: Promise<{ businessSlug: string }> }) {
  const scope = await getFocusScope((await params).businessSlug);
  redirect(scopedHref(scopeBase(scope.slug), R.task("t-post45")));
}
