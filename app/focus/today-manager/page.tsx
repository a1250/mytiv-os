import type { Metadata } from "next";
import CommsTodayManagerScreen from "@/components/focus/screens/comms-today-manager";

export const metadata: Metadata = { title: "היום שלי · מנהלת · נתונים חלקיים ותקלה — Mytiv OS" };

export default function Page() {
  return <CommsTodayManagerScreen />;
}
