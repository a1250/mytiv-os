import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { OpsPolicyError } from "@/lib/ops-policy";
import { addWorkComment } from "@/lib/work/commands";
import { readWorkTasks } from "@/lib/work/read";
import { isUuid, notFound, workApiEnabled, workRouteError, writeEnvelope } from "@/lib/work/route";
import { taskFromRow } from "@/lib/focus/adapters/work";

/**
 * POST { requestId, body } — a comment on a task (work_add_comment, migration 0015). Any active member; same origin;
 * a replay of the request id returns the same comment. Append-only; the task's version is unchanged. 200 { task }.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; id: string }> }) {
  if (!workApiEnabled()) return notFound();
  try {
    const { businessSlug, id } = await params;
    const { businessId, userId } = await guard(businessSlug);
    const { requestId, body } = writeEnvelope(req, await req.json());
    if (!isUuid(id)) throw new OpsPolicyError("not_found", 404);
    if (typeof body.body !== "string") throw new OpsPolicyError("invalid_comment");
    const r = await addWorkComment({ businessId, userId }, requestId, id, body.body);
    const { tasks } = await readWorkTasks(businessId, id);
    return NextResponse.json({ ok: true, requestId, replayed: r.ok && !!r.replayed, task: tasks[0] ? taskFromRow(tasks[0]) : null });
  } catch (err) {
    return workRouteError(err);
  }
}
