import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { syncCalendar } from "@/lib/db/queries/calendar";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    return NextResponse.json(await syncCalendar(businessId));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
