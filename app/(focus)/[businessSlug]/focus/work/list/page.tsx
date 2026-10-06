import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import { AreaNotConnected } from "@/components/focus/shell/area-not-connected";
import WorkProjectScreen from "@/components/focus/screens/work-project";

export const generateMetadata = fixtureMetadata({ title: "משימות · השקת תפריט סתיו — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return <AreaNotConnected businessSlug={(await params).businessSlug} />;
  return <WorkProjectScreen view="list" />;
}
