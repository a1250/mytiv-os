import type { Metadata } from "next";
import WorkProjectScreen from "@/components/focus/screens/work-project";

export const metadata: Metadata = { title: "לוח עבודה · השקת תפריט סתיו — Mytiv OS" };

export default function Page() {
  return <WorkProjectScreen view="board" />;
}
