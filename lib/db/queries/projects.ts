/**
 * businessId-first query helpers for the Project Hub.
 *
 * A project is one client engagement. It owns the canonical spec (stored here,
 * not as a repo file — half of this is read on a phone) and the
 * `clickupFolderId` bridge to the ClickUp folder that holds the actual work.
 */
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../index";
import { projects, businesses } from "../schema";
import { sanitizePatch } from "./_patch";
import { clientFoldersFor } from "@/lib/ops-config";
import { OpsPolicyError } from "@/lib/ops-policy";
async function allowedFolder(businessId: string, folderId: unknown) {
  if (folderId === null || folderId === undefined || folderId === '') return;
  const [business] = await db.select({ slug: businesses.slug }).from(businesses).where(eq(businesses.id, businessId));
  if (!business || !clientFoldersFor(business.slug).some(f => f.clickupFolderId === folderId)) throw new OpsPolicyError('folder_not_authorized', 403);
}
function projectPatch(data: Record<string, unknown>) {
  const allowed = ['name', 'client', 'status', 'brief', 'budget', 'deadline', 'clickupFolderId'];
  return Object.fromEntries(Object.entries(sanitizePatch(data)).filter(([key]) => allowed.includes(key)));
}

export type ProjectRow = typeof projects.$inferSelect;

export async function listProjects(businessId: string) {
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.businessId, businessId))
    .orderBy(sql`${projects.status} <> 'active'`, asc(projects.name));
  for (const row of rows) await allowedFolder(businessId, row.clickupFolderId);
  return rows;
}

export async function getProject(businessId: string, id: string) {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.businessId, businessId), eq(projects.id, id)))
    .limit(1);
  if (row) await allowedFolder(businessId, row.clickupFolderId);
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
  await allowedFolder(businessId, data.clickupFolderId);
  const [row] = await db
    .insert(projects)
    .values({ ...projectPatch(data), name: data.name.trim(), businessId })
    .returning();
  return row;
}

export async function updateProject(businessId: string, id: string, patch: Record<string, unknown>) {
  await allowedFolder(businessId, patch.clickupFolderId);
  const [row] = await db
    .update(projects)
    .set({ ...projectPatch(patch), updatedAt: new Date() })
    .where(and(eq(projects.businessId, businessId), eq(projects.id, id)))
    .returning();
  return row ?? null;
}
