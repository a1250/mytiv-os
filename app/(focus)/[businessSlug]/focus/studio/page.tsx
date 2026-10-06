import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import { AreaNotConnected } from "@/components/focus/shell/area-not-connected";
import Screen from "@/components/focus/screens/marketing-studio-home";

export const generateMetadata = fixtureMetadata({ title: "סטודיו התוכן · מסך פתיחה — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return <AreaNotConnected businessSlug={(await params).businessSlug} />;
  return <Screen />;
}
