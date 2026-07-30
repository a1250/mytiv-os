import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { listReviews, createReview } from "@/lib/db/queries/reviews";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    return NextResponse.json(await listReviews(businessId));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    const body = await req.json();
    if (!body?.title || !body?.payload) {
      return NextResponse.json({ error: "title and payload are required" }, { status: 400 });
    }
    return NextResponse.json(await createReview(businessId, body));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
