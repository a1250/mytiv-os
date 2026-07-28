import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { sendDraft } from "@/lib/google/gmail";

/**
 * The only send path — the client must have already shown a confirmation
 * dialog before calling this (see the Mail page). No bulk-send anywhere.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string; id: string }> }) {
  try {
    const { businessSlug, id } = await params;
    const { businessId } = await guard(businessSlug);
    return NextResponse.json(await sendDraft(businessId, id));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
