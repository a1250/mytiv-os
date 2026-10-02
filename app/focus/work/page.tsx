import type { Metadata } from "next";
import WorkMyScreen from "@/components/focus/screens/work-my";

export const metadata: Metadata = { title: "המשימות שלי — Mytiv OS" };

export default function Page() {
  return <WorkMyScreen />;
}
