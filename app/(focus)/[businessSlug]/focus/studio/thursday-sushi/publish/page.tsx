import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import Screen from "@/components/focus/screens/marketing-publish";

export const generateMetadata = fixtureMetadata({ title: "יצוא ופרסום · אחרי אישור — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <Screen />;
}
