import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import Screen from "@/components/focus/screens/reports-goals";

export const generateMetadata = fixtureMetadata({ title: "דוחות › יעדים וביצועים · מגירת מקור הנתון — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <Screen />;
}
