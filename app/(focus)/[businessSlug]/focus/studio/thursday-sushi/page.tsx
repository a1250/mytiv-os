import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import StudioFormatsScreen from "@/components/focus/screens/studio-formats";

export const generateMetadata = fixtureMetadata({ title: "כל הפורמטים · ערבי סושי של חמישי — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <StudioFormatsScreen />;
}
