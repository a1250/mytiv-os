import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { rateLimitGuard } from "@/lib/rate-limit";
import { complete } from "@/lib/ai/claude";

export const runtime = "nodejs";

/** Cheap round-trip so Settings can verify a freshly-saved key actually works. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    const limited = await rateLimitGuard(businessId, "ai");
    if (limited) return limited;

    const result = await complete(businessId, {
      prompt: 'Reply with exactly this JSON and nothing else: {"ok":true}',
      system: "You are a connection test. Reply with the exact JSON requested.",
      maxTokens: 64,
      json: true,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
