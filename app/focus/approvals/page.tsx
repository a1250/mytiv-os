import type { Metadata } from "next";
import ApprovalsListScreen from "@/components/focus/screens/approvals-list";

export const metadata: Metadata = { title: "אישורים — Mytiv OS" };

export default function Page() {
  return <ApprovalsListScreen />;
}
