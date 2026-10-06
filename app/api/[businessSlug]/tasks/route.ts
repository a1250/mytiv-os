import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { listTasks, createTask } from "@/lib/db/queries/tasks";
import { assertSameOrigin } from "@/lib/ops-policy";
import { parseTaskInput } from "@/lib/tasks-policy";
import { assertTaskLinksInBusiness } from "@/lib/tasks-links";
import { taskRouteError } from "@/lib/tasks-route";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    return NextResponse.json(await listTasks(businessId));
  } catch (err) {
    return taskRouteError(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    assertSameOrigin(req);
    const input = parseTaskInput(await req.json(), "create");
    await assertTaskLinksInBusiness(businessId, input);
    return NextResponse.json(await createTask(businessId, { ...input, title: input.title! }));
  } catch (err) {
    return taskRouteError(err);
  }
}
