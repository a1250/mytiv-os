import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import WorkStatesScreen from "@/components/focus/screens/work-states";

export const generateMetadata = fixtureMetadata({ title: "מצבי מערכת · Mytiv Work — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <WorkStatesScreen />;
}
