import type { Metadata } from "next";
import { ScreenMap } from "@/components/focus/screens/screen-map";

export const metadata: Metadata = { title: "מפת מסכים — Mytiv OS", robots: { index: false } };

/** Prototype index of every handoff screen: the product screen, its reference frame and (for mobile) a phone preview. */
export default function Page() {
  return <ScreenMap />;
}
