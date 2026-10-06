import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import Screen from "@/components/focus/screens/reports-brain";

export const generateMetadata = fixtureMetadata({ title: "מוח העסק · UMINO — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <Screen />;
}
