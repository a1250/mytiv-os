import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { isConfigured } from "@/lib/ai/claude";

export const runtime = "nodejs";

/** Reports whether a key exists — never the key itself. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    return NextResponse.json({
      configured: await isConfigured(businessId),
      model: "claude-opus-5",
    });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
