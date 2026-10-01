/**
 * businessId-first query helpers — ported from electron/ipc/tasks.cjs.
 * List ordered by due_date (nulls last) then created_at. Inputs arrive already validated and
 * tenant-checked by the route (lib/tasks-policy.ts); every statement is still scoped by businessId.
 */
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../index";
import { tasks } from "../schema";
import type { TaskInput } from "../../tasks-policy";

export async function listTasks(businessId: string) {
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.businessId, businessId))
    .orderBy(sql`${tasks.dueDate} is null`, asc(tasks.dueDate), asc(tasks.createdAt));
}

export async function createTask(businessId: string, data: TaskInput & { title: string }) {
  const [task] = await db
    .insert(tasks)
    .values({
      businessId,
      title: data.title,
      notes: data.notes ?? "",
      status: data.status ?? "todo",
      priority: data.priority ?? "medium",
      category: data.category ?? "",
      dueDate: data.dueDate ?? null,
      leadId: data.leadId ?? null,
      projectId: data.projectId ?? null,
      doneAt: data.status === "done" ? new Date() : null,
    })
    .returning();
  return task;
}

/**
 * Returns the updated row, or null when no task with that id exists in this business.
 * `done_at` follows the status transition in the same statement: set when a task becomes done,
 * kept when it was already done, cleared when it leaves done.
 */
export async function updateTask(businessId: string, id: string, patch: TaskInput) {
  const { title, notes, status, priority, category, dueDate, leadId, projectId } = patch;
  const [task] = await db
    .update(tasks)
    .set({
      ...(title !== undefined && { title }),
      ...(notes !== undefined && { notes }),
      ...(priority !== undefined && { priority }),
      ...(category !== undefined && { category }),
      ...(dueDate !== undefined && { dueDate }),
      ...(leadId !== undefined && { leadId }),
      ...(projectId !== undefined && { projectId }),
      ...(status !== undefined && {
        status,
        doneAt: status === "done" ? sql`case when ${tasks.status} = 'done' then ${tasks.doneAt} else now() end` : null,
      }),
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.businessId, businessId), eq(tasks.id, id)))
    .returning();
  return task ?? null;
}

/** True when a row was deleted; false when no task with that id exists in this business. */
export async function removeTask(businessId: string, id: string): Promise<boolean> {
  const deleted = await db
    .delete(tasks)
    .where(and(eq(tasks.businessId, businessId), eq(tasks.id, id)))
    .returning({ id: tasks.id });
  return deleted.length > 0;
}
