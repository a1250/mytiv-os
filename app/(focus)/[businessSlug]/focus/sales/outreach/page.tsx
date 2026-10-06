import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import SalesOutreachScreen from "@/components/focus/screens/sales-outreach";

export const generateMetadata = fixtureMetadata({ title: "פניות יזומות · טיוטה ובדיקת עובדות — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <SalesOutreachScreen />;
}
