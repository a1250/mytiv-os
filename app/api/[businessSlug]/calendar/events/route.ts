import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { listEvents, createEvent } from "@/lib/db/queries/calendar";

export async function GET(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    const from = req.nextUrl.searchParams.get("from") || undefined;
    const to = req.nextUrl.searchParams.get("to") || undefined;
    return NextResponse.json(await listEvents(businessId, from, to));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    const data = await req.json();
    return NextResponse.json(await createEvent(businessId, data));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
