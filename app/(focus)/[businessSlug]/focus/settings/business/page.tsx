import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import { AreaNotConnected } from "@/components/focus/shell/area-not-connected";
import CommsBusinessScreen from "@/components/focus/screens/comms-business";

export const generateMetadata = fixtureMetadata({ title: "הגדרות › AI · העסק · Brand Kit — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return <AreaNotConnected businessSlug={(await params).businessSlug} />;
  return <CommsBusinessScreen />;
}
