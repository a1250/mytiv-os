import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { getReview, removeReview } from "@/lib/db/queries/reviews";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ businessSlug: string; id: string }> }
) {
  try {
    const { businessSlug, id } = await params;
    const { businessId } = await guard(businessSlug);
    const row = await getReview(businessId, id);
    if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ businessSlug: string; id: string }> }
) {
  try {
    const { businessSlug, id } = await params;
    const { businessId } = await guard(businessSlug);
    await removeReview(businessId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
