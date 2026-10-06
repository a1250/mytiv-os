import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { META_CONFIGURED } from "@/lib/external/providers";
import { workRouteError, writeEnvelope } from "@/lib/work/route";

/**
 * POST — a Meta schedule. Mytiv has no Meta integration (no app, no Page token, no API code), so the request is
 * refused before any attempt is recorded: 503 { error: "meta_not_configured" }. When Meta is connected, this route
 * runs through external_attempt_admit / settle exactly like the Gmail send (target meta:<approvalId>).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessSlug } = await params;
    await guard(businessSlug);
    writeEnvelope(req, await req.json());
    if (!META_CONFIGURED) return NextResponse.json({ error: "meta_not_configured" }, { status: 503 });
    return NextResponse.json({ error: "meta_not_configured" }, { status: 503 });
  } catch (err) {
    return workRouteError(err);
  }
}
