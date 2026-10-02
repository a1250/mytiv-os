import type { Metadata } from "next";
import CommsNotificationsScreen from "@/components/focus/screens/comms-notifications";

export const metadata: Metadata = { title: "התראות · ארבע קבוצות — Mytiv OS" };

export default function Page() {
  return <CommsNotificationsScreen />;
}
