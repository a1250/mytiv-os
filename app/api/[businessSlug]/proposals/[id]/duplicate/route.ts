import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { duplicateProposal } from "@/lib/db/queries/proposals";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string; id: string }> }) {
  try {
    const { businessSlug, id } = await params;
    const { businessId } = await guard(businessSlug);
    return NextResponse.json(await duplicateProposal(businessId, id));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
