import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import WorkMyScreen from "@/components/focus/screens/work-my";

export const generateMetadata = fixtureMetadata({ title: "המשימות שלי — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <WorkMyScreen />;
}
