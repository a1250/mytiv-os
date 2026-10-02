import type { Metadata } from "next";
import SalesProposalScreen from "@/components/focus/screens/sales-proposal";

export const metadata: Metadata = { title: "הצעת מחיר · עריכה ותצוגה מקדימה — Mytiv OS" };

export default function Page() {
  return <SalesProposalScreen />;
}
