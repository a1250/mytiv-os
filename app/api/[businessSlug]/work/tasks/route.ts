import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { createWorkTask, type CreateFields } from "@/lib/work/commands";
import { readWorkPeople, readWorkProjects, readWorkTasks } from "@/lib/work/read";
import { notFound, workApiEnabled, workRouteError, writeEnvelope } from "@/lib/work/route";
import { MYTIV_LIVE_CAPABILITIES, taskFromRow } from "@/lib/focus/adapters/work";

/** GET: the business's Work read model (tasks as the Focus contract, members, projects, capabilities). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  if (!workApiEnabled()) return notFound();
  try {
    const { businessSlug } = await params;
    const { businessId, userId, role } = await guard(businessSlug);
    const [{ tasks, complete }, people, projects] = await Promise.all([readWorkTasks(businessId), readWorkPeople(businessId), readWorkProjects(businessId)]);
    return NextResponse.json({ tasks: tasks.map(taskFromRow), complete, people, projects, viewerId: userId, role, capabilities: { mytiv: MYTIV_LIVE_CAPABILITIES } });
  } catch (err) {
    return workRouteError(err);
  }
}

/** POST { requestId, fields }: create a task through work_create_task; returns the task as read back. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  if (!workApiEnabled()) return notFound();
  try {
    const { businessSlug } = await params;
    const { businessId, userId } = await guard(businessSlug);
    const { requestId, body } = writeEnvelope(req, await req.json());
    const fields = (body.fields ?? {}) as CreateFields;
    const r = await createWorkTask({ businessId, userId }, requestId, fields);
    if (!r.ok) return NextResponse.json({ error: "version_conflict" }, { status: 409 });
    const { tasks } = await readWorkTasks(businessId, r.taskId);
    return NextResponse.json({ ok: true, requestId, replayed: !!r.replayed, task: tasks[0] ? taskFromRow(tasks[0]) : null });
  } catch (err) {
    return workRouteError(err);
  }
}
