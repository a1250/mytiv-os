import type { Metadata } from "next";
import ProjectExecutionScreen from "@/components/focus/screens/project-execution";

export const metadata: Metadata = { title: "ביצוע · השקת תפריט סתיו — Mytiv OS" };

export default function Page() {
  return <ProjectExecutionScreen />;
}
