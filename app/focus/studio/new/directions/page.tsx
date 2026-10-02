import type { Metadata } from "next";
import StudioDirectionsScreen from "@/components/focus/screens/studio-directions";

export const metadata: Metadata = { title: "שלושה כיוונים — Mytiv OS" };

export default function Page() {
  return <StudioDirectionsScreen />;
}
