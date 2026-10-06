import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import ProjectExecutionScreen from "@/components/focus/screens/project-execution";

export const generateMetadata = fixtureMetadata({ title: "ביצוע · השקת תפריט סתיו — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <ProjectExecutionScreen />;
}
