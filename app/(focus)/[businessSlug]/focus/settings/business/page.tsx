import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import CommsBusinessScreen from "@/components/focus/screens/comms-business";

export const generateMetadata = fixtureMetadata({ title: "הגדרות › AI · העסק · Brand Kit — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <CommsBusinessScreen />;
}
