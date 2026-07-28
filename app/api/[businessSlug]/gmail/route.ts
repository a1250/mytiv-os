import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { listMessages } from "@/lib/google/gmail";

const TAB_QUERIES: Record<string, string> = {
  inbox: "in:inbox",
  sent: "in:sent",
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    const tab = req.nextUrl.searchParams.get("tab") || "inbox";
    const search = req.nextUrl.searchParams.get("q");
    const q = search || TAB_QUERIES[tab] || TAB_QUERIES.inbox;
    return NextResponse.json(await listMessages(businessId, q));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    if (err instanceof Error && err.message === "not_connected") {
      return NextResponse.json({ error: "not_connected" }, { status: 409 });
    }
    throw err;
  }
}
