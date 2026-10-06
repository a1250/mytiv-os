import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import ProjectScreen from "@/components/focus/screens/project";

export const generateMetadata = fixtureMetadata({ title: "השקת תפריט סתיו · UMINO — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <ProjectScreen />;
}
