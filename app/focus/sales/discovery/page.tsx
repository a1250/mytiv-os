import type { Metadata } from "next";
import SalesDiscoveryScreen from "@/components/focus/screens/sales-discovery";

export const metadata: Metadata = { title: "גילוי לידים · חיפוש ברקע — Mytiv OS" };

export default function Page() {
  return <SalesDiscoveryScreen />;
}
