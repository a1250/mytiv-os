import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";

/**
 * The commit this instance was built from, so an owner can confirm production is
 * serving the approved revision (MKT-F20). `VERCEL_GIT_COMMIT_SHA` is a Vercel
 * system value — a commit hash, never a secret; when it is absent (local dev) the
 * revision is reported as "unknown". Owner-only: the deployed revision is operator
 * information, and members get 403 (401 for anonymous, via guard).
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessSlug } = await params;
    const scope = await guard(businessSlug);
    if (scope.role !== "owner") return NextResponse.json({ error: "owner_required" }, { status: 403 });
    return NextResponse.json({ revision: process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown" });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
