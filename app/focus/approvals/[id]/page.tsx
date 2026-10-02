import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { APPROVALS } from "@/lib/focus/fixtures/approvals";
import ApprovalScreen from "@/components/focus/screens/approval";

/** Approval in focus mode — one route for every approval kind (decision · content · external action). */
export function generateStaticParams() {
  return APPROVALS.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const a = APPROVALS.find((x) => x.id === id);
  return { title: a ? `${a.title} · אישור — Mytiv OS` : "אישור — Mytiv OS" };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!APPROVALS.some((a) => a.id === id)) notFound();
  return <ApprovalScreen id={id} />;
}
