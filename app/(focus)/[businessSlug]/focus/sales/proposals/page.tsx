import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import SalesProposalsScreen from "@/components/focus/screens/sales-proposals";

export const generateMetadata = fixtureMetadata({ title: "הצעות מחיר · רשימה — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <SalesProposalsScreen />;
}
