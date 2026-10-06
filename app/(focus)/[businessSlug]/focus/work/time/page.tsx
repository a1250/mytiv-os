import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import WorkTimeScreen from "@/components/focus/screens/work-time";

export const generateMetadata = fixtureMetadata({ title: "זמן ודוח שעות — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <WorkTimeScreen />;
}
