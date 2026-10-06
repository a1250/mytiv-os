import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import CommsUsersScreen from "@/components/focus/screens/comms-users";

export const generateMetadata = fixtureMetadata({ title: "הגדרות › משתמשים והרשאות — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <CommsUsersScreen />;
}
