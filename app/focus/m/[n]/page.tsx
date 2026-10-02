import { notFound, redirect } from "next/navigation";
import { MOBILE_TARGETS } from "@/lib/focus/screens";

/**
 * Handoff mobile frames M1–M10 are the real responsive screens at 390px, not separate pages: this route redirects
 * to the screen. (The screen map shows them inside a phone frame.)
 */
export function generateStaticParams() {
  return Object.keys(MOBILE_TARGETS).map((id) => ({ n: id.slice(1) }));
}

export default async function Page({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const target = MOBILE_TARGETS[`M${n}`];
  if (!target) notFound();
  redirect(target[0]);
}
