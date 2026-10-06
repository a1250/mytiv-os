import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import WorkProjectScreen from "@/components/focus/screens/work-project";

export const generateMetadata = fixtureMetadata({ title: "לוח עבודה · השקת תפריט סתיו — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <WorkProjectScreen view="board" />;
}
