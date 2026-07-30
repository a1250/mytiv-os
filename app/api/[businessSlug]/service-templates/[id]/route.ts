import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { updateServiceTemplate, removeServiceTemplate } from "@/lib/db/queries/service-templates";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ businessSlug: string; id: string }> }
) {
  try {
    const { businessSlug, id } = await params;
    const { businessId } = await guard(businessSlug);
    const row = await updateServiceTemplate(businessId, id, await req.json());
    if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ businessSlug: string; id: string }> }
) {
  try {
    const { businessSlug, id } = await params;
    const { businessId } = await guard(businessSlug);
    await removeServiceTemplate(businessId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
