import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { listMoodboards, createMoodboard } from "@/lib/db/queries/inspiration";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    return NextResponse.json(await listMoodboards(businessId));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    const { name, description } = await req.json();
    return NextResponse.json(await createMoodboard(businessId, name, description));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
