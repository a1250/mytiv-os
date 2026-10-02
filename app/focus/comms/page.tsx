import type { Metadata } from "next";
import CommsMailScreen from "@/components/focus/screens/comms-mail";

export const metadata: Metadata = { title: "דואר · שיחה וטיוטת תשובה — Mytiv OS" };

export default function Page() {
  return <CommsMailScreen />;
}
