import type { Metadata } from "next";
import TodayScreen from "@/components/focus/screens/today";

export const metadata: Metadata = { title: "היום שלי — Mytiv OS" };

export default function Page() {
  return <TodayScreen />;
}
