import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import { AreaNotConnected } from "@/components/focus/shell/area-not-connected";
import CommsNotificationsScreen from "@/components/focus/screens/comms-notifications";

export const generateMetadata = fixtureMetadata({ title: "התראות · ארבע קבוצות — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return <AreaNotConnected businessSlug={(await params).businessSlug} />;
  return <CommsNotificationsScreen />;
}
