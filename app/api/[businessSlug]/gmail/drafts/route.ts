import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { createDraft } from "@/lib/google/gmail";
import { status } from "@/lib/google/oauth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    const { to, subject, body, cc, googleThreadId } = await req.json();
    const s = await status(businessId);
    const draft = await createDraft(businessId, { to, subject, body, cc, googleThreadId, fromEmail: s.email });
    return NextResponse.json(draft);
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
