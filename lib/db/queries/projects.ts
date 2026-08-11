/**
 * businessId-first query helpers for the Project Hub.
 *
 * A project is one client engagement. It owns the canonical spec (stored here,
 * not as a repo file — half of this is read on a phone) and the
 * `clickupFolderId` bridge to the ClickUp folder that holds the actual work.
 */
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../index";
import { projects } from "../schema";
import { sanitizePatch } from "./_patch";

export type ProjectRow = typeof projects.$inferSelect;

export async function listProjects(businessId: string) {
  return db
    .select()
    .from(projects)
    .where(eq(projects.businessId, businessId))
    .orderBy(sql`${projects.status} <> 'active'`, asc(projects.name));
}

export async function getProject(businessId: string, id: string) {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.businessId, businessId), eq(projects.id, id)))
    .limit(1);
  return row ?? null;
}

/** Projects that are wired to a ClickUp folder — the input to every Ops read. */
export async function listLinkedProjects(businessId: string) {
  const rows = await listProjects(businessId);
  return rows.filter((r) => Boolean(r.clickupFolderId));
}

export async function createProject(
  businessId: string,
  data: {
    name: string;
    client?: string;
    status?: string;
    brief?: string;
    budget?: string;
    deadline?: string;
    clickupFolderId?: string;
  }
) {
  const [row] = await db
    .insert(projects)
    .values({ ...sanitizePatch(data), businessId })
    .returning();
  return row;
}

export async function updateProject(businessId: string, id: string, patch: Record<string, unknown>) {
  const [row] = await db
    .update(projects)
    .set({ ...sanitizePatch(patch), updatedAt: new Date() })
    .where(and(eq(projects.businessId, businessId), eq(projects.id, id)))
    .returning();
  return row ?? null;
}
