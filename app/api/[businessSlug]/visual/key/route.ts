import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { setSecret, removeSecret } from "@/lib/db/queries/secrets";
import { HIGGSFIELD_KEY_SECRET } from "@/lib/higgsfield";

export const runtime = "nodejs";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId, role } = await guard((await params).businessSlug);
    if (role === "member") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const { apiKey } = await req.json();
    if (typeof apiKey !== "string" || !/.+:.+/.test(apiKey.trim())) {
      return NextResponse.json({ error: "Key must be in KEY_ID:KEY_SECRET form." }, { status: 400 });
    }
    await setSecret(businessId, HIGGSFIELD_KEY_SECRET, apiKey.trim());
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId, role } = await guard((await params).businessSlug);
    if (role === "member") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    await removeSecret(businessId, HIGGSFIELD_KEY_SECRET);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
