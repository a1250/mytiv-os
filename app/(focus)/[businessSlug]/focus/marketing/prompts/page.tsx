import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import Screen from "@/components/focus/screens/marketing-prompts";

export const generateMetadata = fixtureMetadata({ title: "פרומפטים · בונה וספרייה — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <Screen />;
}
