import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import SalesDiscoveryScreen from "@/components/focus/screens/sales-discovery";

export const generateMetadata = fixtureMetadata({ title: "גילוי לידים · חיפוש ברקע — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <SalesDiscoveryScreen />;
}
