import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { listLeadNotes, addLeadNote } from "@/lib/db/queries/leads";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string; id: string }> }) {
  try {
    const { businessSlug, id } = await params;
    const { businessId } = await guard(businessSlug);
    return NextResponse.json(await listLeadNotes(businessId, id));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; id: string }> }) {
  try {
    const { businessSlug, id } = await params;
    const { businessId } = await guard(businessSlug);
    const { body } = await req.json();
    return NextResponse.json(await addLeadNote(businessId, id, body));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
