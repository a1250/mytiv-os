import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import SalesProposalScreen from "@/components/focus/screens/sales-proposal";

export const generateMetadata = fixtureMetadata({ title: "הצעת מחיר · עריכה ותצוגה מקדימה — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <SalesProposalScreen />;
}
