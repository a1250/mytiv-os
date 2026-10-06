import { fixtureMetadata, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import StudioEditorScreen from "@/components/focus/screens/studio-editor";

export const generateMetadata = fixtureMetadata({ title: "עורך · סטורי ערבי סושי של חמישי — Mytiv OS" });

export default async function Page({ params }: FocusPageProps) {
  if (!(await rendersFixtures(params))) return null;
  return <StudioEditorScreen designId="thursday-sushi" />;
}
