import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { listCarousels, createCarousel } from "@/lib/db/queries/carousel";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    return NextResponse.json(await listCarousels(businessId));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    const data = await req.json();
    return NextResponse.json(await createCarousel(businessId, data));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
