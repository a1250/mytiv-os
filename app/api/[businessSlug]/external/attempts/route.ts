import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { OpsPolicyError } from "@/lib/ops-policy";
import { listAttempts } from "@/lib/external/attempts";
import { workRouteError } from "@/lib/work/route";

/** GET ?target=gmail:thread:<id> — the attempts on one target, newest first (what the UI shows as sent / failed / unknown). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    const target = req.nextUrl.searchParams.get("target") ?? "";
    if (!/^(gmail:thread|meta:approval):[A-Za-z0-9_-]{1,200}$/.test(target)) throw new OpsPolicyError("invalid_target");
    return NextResponse.json({ attempts: await listAttempts(businessId, target) });
  } catch (err) {
    return workRouteError(err);
  }
}
