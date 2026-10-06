import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import Screen from "@/components/focus/screens/clients-board";

export const generateMetadata = fixtureMetadata({ title: "לוח עבודה · Kanban — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <Screen />;
}
