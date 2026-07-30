import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { rateLimitGuard } from "@/lib/rate-limit";
import { createDiscoveryJob } from "@/lib/db/queries/discovery";
import { publishDiscoveryJob } from "@/lib/qstash";

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    const limited = await rateLimitGuard(businessId, "discovery");
    if (limited) return limited;

    const body = await req.json();
    const job = await createDiscoveryJob(businessId, "contact_discovery", body);
    await publishDiscoveryJob(job.id, process.env.NEXTAUTH_URL!);
    return NextResponse.json({ jobId: job.id });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
