import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import { AreaNotConnected } from "@/components/focus/shell/area-not-connected";
import SalesLeadScreen from "@/components/focus/screens/sales-lead";

export const generateMetadata = fixtureMetadata({ title: "מסך ליד — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return <AreaNotConnected businessSlug={(await params).businessSlug} />;
  return <SalesLeadScreen />;
}
