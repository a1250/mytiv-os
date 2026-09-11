import { NextRequest, NextResponse } from "next/server";
import { clientFoldersFor } from "@/lib/ops-config";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { ClickUpConfigError, ClickUpRateLimitError, getWorkspaceMembers } from "@/lib/clickup";

/** Assignee options for the Tasks tab — ClickUp members, not app users. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { business } = await guard((await params).businessSlug);
    if (!clientFoldersFor(business.slug).length) return NextResponse.json({ error: "clickup_not_configured" }, { status: 503 });
    return NextResponse.json(await getWorkspaceMembers());
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    if (err instanceof ClickUpConfigError) return NextResponse.json({ error: "clickup_unavailable" }, { status: 503 });
    if (err instanceof ClickUpRateLimitError) return NextResponse.json({ error: "clickup_unavailable" }, { status: 503 });
    throw err;
  }
}
