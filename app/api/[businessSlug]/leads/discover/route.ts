import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { createDiscoveryJob } from "@/lib/db/queries/discovery";
import { publishDiscoveryJob } from "@/lib/qstash";

/**
 * Discover Leads is slow (web-search pacing) — this route just creates a
 * job row and hands it to QStash, per the plan's note that a synchronous
 * route risks Vercel's function timeout. The UI polls /jobs/[id] for status.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    const body = await req.json();
    const job = await createDiscoveryJob(businessId, "lead_discovery", body);
    await publishDiscoveryJob(job.id, process.env.NEXTAUTH_URL!);
    return NextResponse.json({ jobId: job.id });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
