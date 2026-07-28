import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveBusiness } from "@/lib/tenant";
import { getSettingsForBusiness, setSettingForBusiness } from "@/lib/db/queries/settings";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { businessSlug } = await params;
  const { business } = await resolveBusiness(businessSlug, session.user.id);
  const settings = await getSettingsForBusiness(business.id);
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { businessSlug } = await params;
  const { business } = await resolveBusiness(businessSlug, session.user.id);
  const { key, value } = await req.json();
  if (!key) return NextResponse.json({ error: "key is required" }, { status: 400 });

  await setSettingForBusiness(business.id, key, value == null ? null : String(value));
  return NextResponse.json({ ok: true });
}
