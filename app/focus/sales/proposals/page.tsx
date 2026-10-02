import type { Metadata } from "next";
import SalesProposalsScreen from "@/components/focus/screens/sales-proposals";

export const metadata: Metadata = { title: "הצעות מחיר · רשימה — Mytiv OS" };

export default function Page() {
  return <SalesProposalsScreen />;
}
