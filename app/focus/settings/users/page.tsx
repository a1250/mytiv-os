import type { Metadata } from "next";
import CommsUsersScreen from "@/components/focus/screens/comms-users";

export const metadata: Metadata = { title: "הגדרות › משתמשים והרשאות — Mytiv OS" };

export default function Page() {
  return <CommsUsersScreen />;
}
