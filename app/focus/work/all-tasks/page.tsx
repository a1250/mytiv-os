import type { Metadata } from "next";
import AllTasksScreen from "@/components/focus/screens/all-tasks";

export const metadata: Metadata = { title: "משימות — Mytiv OS" };

export default function Page() {
  return <AllTasksScreen />;
}
