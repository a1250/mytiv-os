import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import { AreaNotConnected } from "@/components/focus/shell/area-not-connected";
import SalesDiscoveryScreen from "@/components/focus/screens/sales-discovery";

export const generateMetadata = fixtureMetadata({ title: "גילוי לידים · חיפוש ברקע — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return <AreaNotConnected businessSlug={(await params).businessSlug} />;
  return <SalesDiscoveryScreen />;
}
