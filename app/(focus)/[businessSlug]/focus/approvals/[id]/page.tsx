import type { Metadata } from "next";
import { AreaNotConnected } from "@/components/focus/shell/area-not-connected";
import { notFound } from "next/navigation";
import { APPROVALS } from "@/lib/focus/fixtures/approvals";
import { rendersFixtures } from "@/lib/focus/scope.server";
import ApprovalScreen from "@/components/focus/screens/approval";

type Props = { params: Promise<{ businessSlug: string; id: string }> };

/** Approval in focus mode — one route for every approval kind (decision · content · external action). */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // fixture titles only in the demo scope; a business gets a neutral title (no fixture data in its tab)
  if (!(await rendersFixtures(params))) return { title: "Focus — Mytiv OS", robots: { index: false } };
  const { id } = await params;
  const a = APPROVALS.find((x) => x.id === id);
  return { title: a ? `${a.title} · אישור — Mytiv OS` : "אישור — Mytiv OS" };
}

export default async function Page({ params }: Props) {
  if (!(await rendersFixtures(params))) return <AreaNotConnected businessSlug={(await params).businessSlug} />;
  const { id } = await params;
  if (!APPROVALS.some((a) => a.id === id)) notFound();
  return <ApprovalScreen id={id} />;
}
