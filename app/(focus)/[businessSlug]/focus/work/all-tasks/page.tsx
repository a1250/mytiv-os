import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import AllTasksScreen from "@/components/focus/screens/all-tasks";

export const generateMetadata = fixtureMetadata({ title: "משימות — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <AllTasksScreen />;
}
