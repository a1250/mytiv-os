import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import ApprovalsListScreen from "@/components/focus/screens/approvals-list";

export const generateMetadata = fixtureMetadata({ title: "אישורים — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <ApprovalsListScreen />;
}
