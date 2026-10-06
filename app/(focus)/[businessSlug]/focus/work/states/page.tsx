import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import { AreaNotConnected } from "@/components/focus/shell/area-not-connected";
import WorkStatesScreen from "@/components/focus/screens/work-states";

export const generateMetadata = fixtureMetadata({ title: "מצבי מערכת · Mytiv Work — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return <AreaNotConnected businessSlug={(await params).businessSlug} />;
  return <WorkStatesScreen />;
}
