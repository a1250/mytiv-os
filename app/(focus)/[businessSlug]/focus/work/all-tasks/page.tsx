import { fixtureMetadata, rendersWork, type FocusPageProps } from "@/lib/focus/scope.server";
import AllTasksScreen from "@/components/focus/screens/all-tasks";

export const generateMetadata = fixtureMetadata({ title: "משימות — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersWork(params))) return null;
  return <AllTasksScreen />;
}
