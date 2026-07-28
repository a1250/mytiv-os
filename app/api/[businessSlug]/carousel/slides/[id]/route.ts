import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { updateSlide } from "@/lib/db/queries/carousel";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; id: string }> }) {
  try {
    const { businessSlug, id } = await params;
    const { businessId } = await guard(businessSlug);
    const patch = await req.json();
    return NextResponse.json(await updateSlide(businessId, id, patch));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
