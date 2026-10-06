import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import { AreaNotConnected } from "@/components/focus/shell/area-not-connected";
import CommsMailScreen from "@/components/focus/screens/comms-mail";

export const generateMetadata = fixtureMetadata({ title: "דואר · שיחה וטיוטת תשובה — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return <AreaNotConnected businessSlug={(await params).businessSlug} />;
  return <CommsMailScreen />;
}
