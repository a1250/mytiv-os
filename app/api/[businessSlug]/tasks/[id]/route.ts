import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { updateTask, removeTask } from "@/lib/db/queries/tasks";
import { OpsPolicyError, assertSameOrigin, assertWriter } from "@/lib/ops-policy";
import { isUuid, parseTaskInput } from "@/lib/tasks-policy";
import { assertTaskLinksInBusiness } from "@/lib/tasks-links";
import { taskRouteError } from "@/lib/tasks-route";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; id: string }> }) {
  try {
    const { businessSlug, id } = await params;
    const { businessId } = await guard(businessSlug);
    assertSameOrigin(req);
    if (!isUuid(id)) throw new OpsPolicyError("not_found", 404);
    const input = parseTaskInput(await req.json(), "update");
    await assertTaskLinksInBusiness(businessId, input);
    const task = await updateTask(businessId, id, input);
    if (!task) throw new OpsPolicyError("not_found", 404);
    return NextResponse.json(task);
  } catch (err) {
    return taskRouteError(err);
  }
}

/** Deleting is permanent here (the table has no trash yet), so it is owners' and admins' only. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; id: string }> }) {
  try {
    const { businessSlug, id } = await params;
    const { businessId, role } = await guard(businessSlug);
    assertSameOrigin(req);
    assertWriter(role);
    if (!isUuid(id) || !(await removeTask(businessId, id))) throw new OpsPolicyError("not_found", 404);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return taskRouteError(err);
  }
}
