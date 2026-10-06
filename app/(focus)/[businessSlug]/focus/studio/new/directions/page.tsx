import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import StudioDirectionsScreen from "@/components/focus/screens/studio-directions";

export const generateMetadata = fixtureMetadata({ title: "שלושה כיוונים — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <StudioDirectionsScreen />;
}
