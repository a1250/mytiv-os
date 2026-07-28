import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { uploadAsset } from "@/lib/blob";

const ALLOWED_FOLDERS = new Set(["logo", "inspiration", "carousel"]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    const form = await req.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") || "");

    if (!(file instanceof File)) return NextResponse.json({ error: "file is required" }, { status: 400 });
    if (!ALLOWED_FOLDERS.has(folder)) return NextResponse.json({ error: "invalid folder" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "only image uploads are allowed" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "file too large (max 10MB)" }, { status: 400 });

    const url = await uploadAsset(businessId, folder, file);
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
