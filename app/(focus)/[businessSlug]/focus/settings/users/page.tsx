import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import { AreaNotConnected } from "@/components/focus/shell/area-not-connected";
import CommsUsersScreen from "@/components/focus/screens/comms-users";

export const generateMetadata = fixtureMetadata({ title: "הגדרות › משתמשים והרשאות — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return <AreaNotConnected businessSlug={(await params).businessSlug} />;
  return <CommsUsersScreen />;
}
