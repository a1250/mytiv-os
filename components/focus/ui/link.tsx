"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, type ComponentProps } from "react";
import { scopedHref } from "@/lib/focus/scope";
import { useNavGuardEntry } from "@/components/focus/shell/nav-guard";
import { useFocusScope } from "@/components/focus/shell/scope";

/**
 * Focus links. `R.*` paths are written scope-relative ("/focus/..."); this resolves them against the verified
 * scope base ("/{businessSlug}/focus"), so every Focus link stays inside the business it was rendered for.
 * Drop-in for next/link — every Focus component imports Link from here.
 */
type Href = ComponentProps<typeof NextLink>["href"];

export function useScopedHref() {
  const { base } = useFocusScope();
  return useMemo(() => (href: string) => scopedHref(base, href), [base]);
}

function resolve(base: string, href: Href): Href {
  if (typeof href === "string") return scopedHref(base, href);
  return href.pathname ? { ...href, pathname: scopedHref(base, href.pathname) } : href;
}

export default function Link({ href, ...rest }: ComponentProps<typeof NextLink>) {
  const { base } = useFocusScope();
  return <NextLink {...rest} href={resolve(base, href)} />;
}

/**
 * next/navigation's router with Focus paths resolved against the scope (push / replace / prefetch). A push made while
 * the unsaved-changes guard entry is on top of history replaces that entry (the user already confirmed), so Back
 * from the destination returns to the page instead of to a duplicate of it.
 */
export function useFocusRouter() {
  const router = useRouter();
  const { base } = useFocusScope();
  const consumeGuardEntry = useNavGuardEntry();
  return useMemo(() => ({
    ...router,
    push: (href: string, options?: Parameters<typeof router.push>[1]) => (consumeGuardEntry?.() ? router.replace : router.push)(scopedHref(base, href), options),
    // a replace over the guard entry turns it into the destination: it must not be "removed" again by stepping back
    replace: (href: string, options?: Parameters<typeof router.replace>[1]) => { consumeGuardEntry?.(); router.replace(scopedHref(base, href), options); },
    prefetch: (href: string, options?: Parameters<typeof router.prefetch>[1]) => router.prefetch(scopedHref(base, href), options),
  }), [router, base, consumeGuardEntry]);
}
