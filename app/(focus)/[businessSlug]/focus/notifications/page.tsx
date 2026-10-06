import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import CommsNotificationsScreen from "@/components/focus/screens/comms-notifications";

export const generateMetadata = fixtureMetadata({ title: "התראות · ארבע קבוצות — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <CommsNotificationsScreen />;
}
