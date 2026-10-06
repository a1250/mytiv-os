import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import { AreaNotConnected } from "@/components/focus/shell/area-not-connected";
import SalesProposalsScreen from "@/components/focus/screens/sales-proposals";

export const generateMetadata = fixtureMetadata({ title: "הצעות מחיר · רשימה — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return <AreaNotConnected businessSlug={(await params).businessSlug} />;
  return <SalesProposalsScreen />;
}
