import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import SalesLeadsScreen from "@/components/focus/screens/sales-leads";

export const generateMetadata = fixtureMetadata({ title: "לידים · רשימה — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <SalesLeadsScreen />;
}
