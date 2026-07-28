import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { removeEvent } from "@/lib/db/queries/calendar";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string; id: string }> }) {
  try {
    const { businessSlug, id } = await params;
    const { businessId } = await guard(businessSlug);
    await removeEvent(businessId, id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
