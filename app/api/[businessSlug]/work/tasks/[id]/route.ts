import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { OpsPolicyError } from "@/lib/ops-policy";
import { updateWorkTask, type UpdatePatch } from "@/lib/work/commands";
import { readWorkTasks } from "@/lib/work/read";
import { isUuid, notFound, workApiEnabled, workRouteError, writeEnvelope } from "@/lib/work/route";
import { taskFromRow } from "@/lib/focus/adapters/work";

/**
 * PATCH { requestId, expectedVersion, patch }: one Work write through work_update_task.
 * 200 { task } · 409 { error: "version_conflict", current } (nothing written) · 4xx { error, detail? } refused by a rule.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; id: string }> }) {
  if (!workApiEnabled()) return notFound();
  try {
    const { businessSlug, id } = await params;
    const { businessId, userId } = await guard(businessSlug);
    const { requestId, body } = writeEnvelope(req, await req.json());
    if (!isUuid(id)) throw new OpsPolicyError("not_found", 404);
    const expected = body.expectedVersion;
    if (typeof expected !== "number" || !Number.isInteger(expected) || expected < 1) throw new OpsPolicyError("invalid_expected_version");
    const patch = body.patch;
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) throw new OpsPolicyError("invalid_patch");
    const r = await updateWorkTask({ businessId, userId }, requestId, id, expected, patch as UpdatePatch);
    const { tasks } = await readWorkTasks(businessId, id);
    const current = tasks[0] ? taskFromRow(tasks[0]) : null;
    if (!r.ok) return NextResponse.json({ error: "version_conflict", current }, { status: 409 });
    return NextResponse.json({ ok: true, requestId, replayed: !!r.replayed, task: current });
  } catch (err) {
    return workRouteError(err);
  }
}
