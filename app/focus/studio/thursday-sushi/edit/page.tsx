import type { Metadata } from "next";
import StudioEditorScreen from "@/components/focus/screens/studio-editor";

export const metadata: Metadata = { title: "עורך · סטורי ערבי סושי של חמישי — Mytiv OS" };

export default function Page() {
  return <StudioEditorScreen designId="thursday-sushi" />;
}
