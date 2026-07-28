import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { getCarousel, updateCarousel, removeCarousel } from "@/lib/db/queries/carousel";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string; id: string }> }) {
  try {
    const { businessSlug, id } = await params;
    const { businessId } = await guard(businessSlug);
    const result = await getCarousel(businessId, id);
    if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; id: string }> }) {
  try {
    const { businessSlug, id } = await params;
    const { businessId } = await guard(businessSlug);
    const patch = await req.json();
    return NextResponse.json(await updateCarousel(businessId, id, patch));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string; id: string }> }) {
  try {
    const { businessSlug, id } = await params;
    const { businessId } = await guard(businessSlug);
    await removeCarousel(businessId, id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
