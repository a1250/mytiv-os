import type { Metadata } from "next";
import SalesLeadsScreen from "@/components/focus/screens/sales-leads";

export const metadata: Metadata = { title: "לידים · רשימה — Mytiv OS" };

export default function Page() {
  return <SalesLeadsScreen />;
}
