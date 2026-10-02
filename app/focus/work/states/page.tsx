import type { Metadata } from "next";
import WorkStatesScreen from "@/components/focus/screens/work-states";

export const metadata: Metadata = { title: "מצבי מערכת · Mytiv Work — Mytiv OS" };

export default function Page() {
  return <WorkStatesScreen />;
}
