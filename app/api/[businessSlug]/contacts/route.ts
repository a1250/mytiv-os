import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { listContactsByLead } from "@/lib/db/queries/contacts";
import { insertContact } from "@/lib/db/queries/discovery";

export async function GET(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    const leadId = req.nextUrl.searchParams.get("leadId");
    if (!leadId) return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    return NextResponse.json(await listContactsByLead(businessId, leadId));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    const { leadId, ...data } = await req.json();
    return NextResponse.json(await insertContact(businessId, leadId, data));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
