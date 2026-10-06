import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import { AreaNotConnected } from "@/components/focus/shell/area-not-connected";
import ProjectScreen from "@/components/focus/screens/project";

export const generateMetadata = fixtureMetadata({ title: "השקת תפריט סתיו · UMINO — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return <AreaNotConnected businessSlug={(await params).businessSlug} />;
  return <ProjectScreen />;
}
