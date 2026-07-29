import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { runDiscoveryJob } from "@/lib/db/queries/discovery";

// contactDiscovery paces queries 9s apart (DDG rate-limit avoidance) — give
// this worker real room. Only QStash (verified via signature below) can
// reach this route.
export const maxDuration = 120;

async function handler(req: Request) {
  const { jobId } = await req.json();
  await runDiscoveryJob(jobId);
  return NextResponse.json({ ok: true });
}

export const POST = verifySignatureAppRouter(handler);
