import type { Metadata } from "next";
import CommsCalendarScreen from "@/components/focus/screens/comms-calendar";

export const metadata: Metadata = { title: "יומן · שבוע — Mytiv OS" };

export default function Page() {
  return <CommsCalendarScreen />;
}
