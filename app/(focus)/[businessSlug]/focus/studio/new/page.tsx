import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import StudioNewScreen from "@/components/focus/screens/studio-new";

export const generateMetadata = fixtureMetadata({ title: "תוכן חדש · בריף — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <StudioNewScreen />;
}
