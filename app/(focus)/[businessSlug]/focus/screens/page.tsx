import type { Metadata } from "next";
import { requireDemoScope } from "@/lib/focus/scope.server";
import { ScreenMap } from "@/components/focus/screens/screen-map";

// metadata is resolved even when the layout 404s: gate it too, so a production 404 carries no prototype title
export async function generateMetadata({ params }: { params: Promise<{ businessSlug: string }> }): Promise<Metadata> {
  await requireDemoScope((await params).businessSlug);
  return { title: "מפת מסכים — Mytiv OS", robots: { index: false } };
}

/**
 * Prototype only (demo scope — development / Preview; 404 in production and for every business): index of every
 * handoff screen with its product screen, its reference frame, phone previews and the demo controls.
 */
export default async function Page({ params }: { params: Promise<{ businessSlug: string }> }) {
  await requireDemoScope((await params).businessSlug);
  return <ScreenMap />;
}
