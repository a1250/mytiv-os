import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { removeMoodboardItem } from "@/lib/db/queries/inspiration";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string; id: string; itemId: string }> }) {
  try {
    const { businessSlug, id, itemId } = await params;
    await guard(businessSlug);
    await removeMoodboardItem(id, itemId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
