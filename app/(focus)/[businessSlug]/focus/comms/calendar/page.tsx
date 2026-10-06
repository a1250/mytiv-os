import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import { AreaNotConnected } from "@/components/focus/shell/area-not-connected";
import CommsCalendarScreen from "@/components/focus/screens/comms-calendar";

export const generateMetadata = fixtureMetadata({ title: "יומן · שבוע — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return <AreaNotConnected businessSlug={(await params).businessSlug} />;
  return <CommsCalendarScreen />;
}
