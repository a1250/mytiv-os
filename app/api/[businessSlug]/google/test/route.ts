import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { getAccessToken, status } from "@/lib/google/oauth";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    const s = await status(businessId);
    if (!s.connected) return NextResponse.json({ ok: false, message: "No Google account connected." });
    try {
      await getAccessToken(businessId);
      return NextResponse.json({ ok: true, message: `Token valid — connected as ${s.email || "unknown account"}.` });
    } catch (err) {
      return NextResponse.json({ ok: false, message: `Token problem: ${err instanceof Error ? err.message : "unknown"}.` });
    }
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
