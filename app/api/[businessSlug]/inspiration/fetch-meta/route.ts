import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { fetchUrlMeta } from "@/lib/db/queries/inspiration";

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    await guard((await params).businessSlug);
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });
    return NextResponse.json(await fetchUrlMeta(url));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
