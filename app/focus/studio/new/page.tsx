import type { Metadata } from "next";
import StudioNewScreen from "@/components/focus/screens/studio-new";

export const metadata: Metadata = { title: "תוכן חדש · בריף — Mytiv OS" };

export default function Page() {
  return <StudioNewScreen />;
}
