import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import { AreaNotConnected } from "@/components/focus/shell/area-not-connected";
import StudioDirectionsScreen from "@/components/focus/screens/studio-directions";

export const generateMetadata = fixtureMetadata({ title: "שלושה כיוונים — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return <AreaNotConnected businessSlug={(await params).businessSlug} />;
  return <StudioDirectionsScreen />;
}
