import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import TodayScreen from "@/components/focus/screens/today";

export const generateMetadata = fixtureMetadata({ title: "היום שלי — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <TodayScreen />;
}
