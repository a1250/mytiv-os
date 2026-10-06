import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireDemoScope } from "@/lib/focus/scope.server";
import D1 from "@/components/focus/reference/D1";
import D2 from "@/components/focus/reference/D2";
import D3 from "@/components/focus/reference/D3";
import D4 from "@/components/focus/reference/D4";
import D5 from "@/components/focus/reference/D5";
import D6 from "@/components/focus/reference/D6";
import D7 from "@/components/focus/reference/D7";
import D8 from "@/components/focus/reference/D8";
import E1 from "@/components/focus/reference/E1";
import E2 from "@/components/focus/reference/E2";
import E3 from "@/components/focus/reference/E3";
import E4 from "@/components/focus/reference/E4";
import E5 from "@/components/focus/reference/E5";
import E6 from "@/components/focus/reference/E6";
import E7 from "@/components/focus/reference/E7";
import F1 from "@/components/focus/reference/F1";
import F2 from "@/components/focus/reference/F2";
import F3 from "@/components/focus/reference/F3";
import F4 from "@/components/focus/reference/F4";
import F5 from "@/components/focus/reference/F5";
import F6 from "@/components/focus/reference/F6";
import G1 from "@/components/focus/reference/G1";
import G2 from "@/components/focus/reference/G2";
import G3 from "@/components/focus/reference/G3";
import G4 from "@/components/focus/reference/G4";
import G5 from "@/components/focus/reference/G5";
import G6 from "@/components/focus/reference/G6";
import H1 from "@/components/focus/reference/H1";
import H10 from "@/components/focus/reference/H10";
import H11 from "@/components/focus/reference/H11";
import H12 from "@/components/focus/reference/H12";
import H13 from "@/components/focus/reference/H13";
import H14 from "@/components/focus/reference/H14";
import H15 from "@/components/focus/reference/H15";
import H2 from "@/components/focus/reference/H2";
import H3 from "@/components/focus/reference/H3";
import H4 from "@/components/focus/reference/H4";
import H5 from "@/components/focus/reference/H5";
import H6 from "@/components/focus/reference/H6";
import H7 from "@/components/focus/reference/H7";
import H8 from "@/components/focus/reference/H8";
import H9 from "@/components/focus/reference/H9";
import M1 from "@/components/focus/reference/M1";
import M10 from "@/components/focus/reference/M10";
import M2 from "@/components/focus/reference/M2";
import M3 from "@/components/focus/reference/M3";
import M4 from "@/components/focus/reference/M4";
import M5 from "@/components/focus/reference/M5";
import M6 from "@/components/focus/reference/M6";
import M7 from "@/components/focus/reference/M7";
import M8 from "@/components/focus/reference/M8";
import M9 from "@/components/focus/reference/M9";
import W1 from "@/components/focus/reference/W1";
import W2 from "@/components/focus/reference/W2";
import W3 from "@/components/focus/reference/W3";
import W4 from "@/components/focus/reference/W4";
import W5 from "@/components/focus/reference/W5";
import W6 from "@/components/focus/reference/W6";

/**
 * Visual reference: the raw conversion of each Claude Design frame, kept only as the pixel source of truth for
 * parity checks (scripts/focus/qa). Not product UI — the product screens live in components/focus/screens.
 */
const REFERENCE = { D1, D2, D3, D4, D5, D6, D7, D8, E1, E2, E3, E4, E5, E6, E7, F1, F2, F3, F4, F5, F6, G1, G2, G3, G4, G5, G6, H1, H10, H11, H12, H13, H14, H15, H2, H3, H4, H5, H6, H7, H8, H9, M1, M10, M2, M3, M4, M5, M6, M7, M8, M9, W1, W2, W3, W4, W5, W6 } as const;
type RefId = keyof typeof REFERENCE;

// metadata is resolved even when the layout 404s: gate it too, so a production 404 carries no prototype title
export async function generateMetadata({ params }: { params: Promise<{ businessSlug: string }> }): Promise<Metadata> {
  await requireDemoScope((await params).businessSlug);
  return { title: "Handoff reference — Mytiv OS", robots: { index: false } };
}

/** Prototype only (demo scope — development / Preview; 404 in production and for every business). */
export default async function Page({ params }: { params: Promise<{ businessSlug: string; id: string }> }) {
  const { businessSlug, id } = await params;
  await requireDemoScope(businessSlug);
  const Screen = REFERENCE[id as RefId];
  if (!Screen) notFound();
  return <div data-reference={id}><Screen /></div>;
}
