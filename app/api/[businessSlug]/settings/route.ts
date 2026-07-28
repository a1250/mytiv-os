import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { getSettingsForBusiness, setSettingForBusiness } from "@/lib/db/queries/settings";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessSlug } = await params;
    const { businessId } = await guard(businessSlug);
    const settings = await getSettingsForBusiness(businessId);
    return NextResponse.json(settings);
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessSlug } = await params;
    const { businessId } = await guard(businessSlug);
    const { key, value } = await req.json();
    if (!key) return NextResponse.json({ error: "key is required" }, { status: 400 });

    await setSettingForBusiness(businessId, key, value == null ? null : String(value));
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
