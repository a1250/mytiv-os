import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import { AreaNotConnected } from "@/components/focus/shell/area-not-connected";
import StudioFormatsScreen from "@/components/focus/screens/studio-formats";

export const generateMetadata = fixtureMetadata({ title: "כל הפורמטים · ערבי סושי של חמישי — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return <AreaNotConnected businessSlug={(await params).businessSlug} />;
  return <StudioFormatsScreen />;
}
