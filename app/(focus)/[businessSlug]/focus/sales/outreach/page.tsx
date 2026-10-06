import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import { AreaNotConnected } from "@/components/focus/shell/area-not-connected";
import SalesOutreachScreen from "@/components/focus/screens/sales-outreach";

export const generateMetadata = fixtureMetadata({ title: "פניות יזומות · טיוטה ובדיקת עובדות — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return <AreaNotConnected businessSlug={(await params).businessSlug} />;
  return <SalesOutreachScreen />;
}
