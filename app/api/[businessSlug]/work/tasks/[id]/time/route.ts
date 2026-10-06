import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { OpsPolicyError } from "@/lib/ops-policy";
import { logWorkTime } from "@/lib/work/commands";
import { readWorkTasks } from "@/lib/work/read";
import { isUuid, notFound, workApiEnabled, workRouteError, writeEnvelope } from "@/lib/work/route";
import { taskFromRow } from "@/lib/focus/adapters/work";

/**
 * POST { requestId, minutes, startedAt, source: "timer" | "manual" } — the signed-in member logs their OWN time on a
 * task (work_log_time, migration 0015): 1..1440 minutes, not in the future; same origin; ledgered; append-only;
 * the task's version is unchanged. 200 { task } with the new total.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; id: string }> }) {
  if (!workApiEnabled()) return notFound();
  try {
    const { businessSlug, id } = await params;
    const { businessId, userId } = await guard(businessSlug);
    const { requestId, body } = writeEnvelope(req, await req.json());
    if (!isUuid(id)) throw new OpsPolicyError("not_found", 404);
    const { minutes, startedAt, source } = body;
    if (typeof minutes !== "number" || !Number.isInteger(minutes)) throw new OpsPolicyError("invalid_minutes");
    if (typeof startedAt !== "string" || Number.isNaN(Date.parse(startedAt))) throw new OpsPolicyError("invalid_started_at");
    if (source !== "timer" && source !== "manual") throw new OpsPolicyError("invalid_source");
    const r = await logWorkTime({ businessId, userId }, requestId, id, minutes, new Date(startedAt).toISOString(), source);
    const { tasks } = await readWorkTasks(businessId, id);
    return NextResponse.json({ ok: true, requestId, replayed: r.ok && !!r.replayed, task: tasks[0] ? taskFromRow(tasks[0]) : null });
  } catch (err) {
    return workRouteError(err);
  }
}
