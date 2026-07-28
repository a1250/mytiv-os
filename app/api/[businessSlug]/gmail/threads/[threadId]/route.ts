import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { readThread } from "@/lib/google/gmail";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string; threadId: string }> }) {
  try {
    const { businessSlug, threadId } = await params;
    const { businessId } = await guard(businessSlug);
    return NextResponse.json(await readThread(businessId, threadId));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
