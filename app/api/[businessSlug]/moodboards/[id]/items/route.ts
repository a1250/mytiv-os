import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { addMoodboardItem } from "@/lib/db/queries/inspiration";

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; id: string }> }) {
  try {
    const { businessSlug, id } = await params;
    const { businessId } = await guard(businessSlug);
    const { itemId } = await req.json();
    return NextResponse.json(await addMoodboardItem(businessId, id, itemId));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
