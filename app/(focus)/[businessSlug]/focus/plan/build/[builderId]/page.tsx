import { notFound } from "next/navigation";
import { BUILDERS } from "@/lib/focus/fixtures/plan";
import { fixtureMetadata, rendersFixtures } from "@/lib/focus/scope.server";
import Screen from "@/components/focus/screens/plan-builder";

export const generateMetadata = fixtureMetadata({ title: "בונה מהלך — Mytiv OS" });

type Props = { params: Promise<{ businessSlug: string; builderId: string }> };

export default async function Page({ params }: Props) {
  if (!(await rendersFixtures(params))) return null;
  const { builderId } = await params;
  if (!BUILDERS.some((b) => b.id === builderId)) notFound();
  return <Screen builderId={builderId} />;
}
