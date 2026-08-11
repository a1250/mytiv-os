import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { ClickUpConfigError, ClickUpRateLimitError, updateTask } from "@/lib/clickup";

type Params = { params: Promise<{ businessSlug: string; taskId: string }> };

/**
 * Status and assignee changes made directly in the Tasks tab.
 *
 * This is a deliberate click on a specific row, so it applies immediately —
 * unlike a Copilot write, which previews first. There is no delete: tasks are
 * deleted in ClickUp, by hand, on purpose.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { businessSlug, taskId } = await params;
    await guard(businessSlug);

    const body = (await req.json()) as {
      status?: string;
      assignee?: { add?: number[]; rem?: number[] };
    };

    const patch: { status?: string; assignees?: { add?: number[]; rem?: number[] } } = {};
    if (typeof body.status === "string" && body.status.trim()) patch.status = body.status;
    if (body.assignee && (body.assignee.add?.length || body.assignee.rem?.length)) {
      patch.assignees = body.assignee;
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
    }

    await updateTask(taskId, patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    if (err instanceof ClickUpConfigError) return NextResponse.json({ error: "clickup_not_configured" }, { status: 503 });
    if (err instanceof ClickUpRateLimitError) {
      return NextResponse.json({ error: "clickup_rate_limited" }, { status: 429 });
    }
    throw err;
  }
}
