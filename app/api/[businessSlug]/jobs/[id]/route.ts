import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { getDiscoveryJob } from "@/lib/db/queries/discovery";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string; id: string }> }) {
  try {
    const { businessSlug, id } = await params;
    const { businessId } = await guard(businessSlug);
    const job = await getDiscoveryJob(businessId, id);
    if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(job);
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
