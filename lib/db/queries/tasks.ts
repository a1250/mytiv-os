/**
 * businessId-first query helpers — ported from electron/ipc/tasks.cjs.
 * Same behavior: list ordered by due_date (nulls last) then created_at,
 * auto-manage done_at on status transitions.
 */
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../index";
import { tasks } from "../schema";

export async function listTasks(businessId: string) {
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.businessId, businessId))
    .orderBy(sql`${tasks.dueDate} is null`, asc(tasks.dueDate), asc(tasks.createdAt));
}

export async function createTask(
  businessId: string,
  data: { title: string; notes?: string; status?: string; priority?: string; category?: string; dueDate?: string; leadId?: string }
) {
  const [task] = await db
    .insert(tasks)
    .values({
      businessId,
      title: data.title,
      notes: data.notes ?? "",
      status: data.status ?? "todo",
      priority: data.priority ?? "medium",
      category: data.category ?? "",
      dueDate: data.dueDate,
      leadId: data.leadId,
      doneAt: data.status === "done" ? new Date() : null,
    })
    .returning();
  return task;
}

export async function updateTask(businessId: string, id: string, patch: Record<string, unknown>) {
  const updates: Record<string, unknown> = { ...patch, updatedAt: new Date() };
  if (patch.status) {
    updates.doneAt = patch.status === "done" ? new Date() : null;
  }
  const [task] = await db
    .update(tasks)
    .set(updates)
    .where(and(eq(tasks.businessId, businessId), eq(tasks.id, id)))
    .returning();
  return task;
}

export async function removeTask(businessId: string, id: string) {
  await db.delete(tasks).where(and(eq(tasks.businessId, businessId), eq(tasks.id, id)));
}
