import type { Metadata } from "next";
import SalesLeadScreen from "@/components/focus/screens/sales-lead";

export const metadata: Metadata = { title: "מסך ליד — Mytiv OS" };

export default function Page() {
  return <SalesLeadScreen />;
}
