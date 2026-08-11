import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { ClickUpConfigError, ClickUpRateLimitError, getWorkspaceMembers } from "@/lib/clickup";

/** Assignee options for the Tasks tab — ClickUp members, not app users. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    await guard((await params).businessSlug);
    return NextResponse.json(await getWorkspaceMembers());
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    if (err instanceof ClickUpConfigError) return NextResponse.json([], { status: 200 });
    if (err instanceof ClickUpRateLimitError) return NextResponse.json([], { status: 200 });
    throw err;
  }
}
