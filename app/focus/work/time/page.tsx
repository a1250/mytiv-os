import type { Metadata } from "next";
import WorkTimeScreen from "@/components/focus/screens/work-time";

export const metadata: Metadata = { title: "זמן ודוח שעות — Mytiv OS" };

export default function Page() {
  return <WorkTimeScreen />;
}
