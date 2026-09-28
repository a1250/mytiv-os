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
import { clientFoldersFor, folderState, type FolderState } from "@/lib/ops-config";
import { OpsPolicyError } from "@/lib/ops-policy";

/**
 * Writes refuse a folder outside the business's checked-in allowlist. Reads never throw
 * for it: a row that already points elsewhere is returned with `folderState: "unauthorized"`
 * so the screen can say so, while `folderFromProject` refuses to turn it into a ClickUp
 * folder — no task read, no write, no cross-business data. One bad row must not take the
 * whole project list down with it.
 */
async function allowedFolder(businessId: string, folderId: unknown) {
  if (folderId === null || folderId === undefined || folderId === '') return;
  const [business] = await db.select({ slug: businesses.slug }).from(businesses).where(eq(businesses.id, businessId));
  if (!business || !clientFoldersFor(business.slug).some(f => f.clickupFolderId === folderId)) throw new OpsPolicyError('folder_not_authorized', 403);
}
function projectPatch(data: Record<string, unknown>) {
  const allowed = ['name', 'client', 'status', 'brief', 'budget', 'deadline', 'clickupFolderId'];
  return Object.fromEntries(Object.entries(sanitizePatch(data)).filter(([key]) => allowed.includes(key)));
}

export type ProjectRow = typeof projects.$inferSelect & { folderState: FolderState };

/** One query: the project row plus the business slug the allowlist is keyed by. */
const projectWithSlug = { project: projects, slug: businesses.slug } as const;
function annotate(row: { project: typeof projects.$inferSelect; slug: string }): ProjectRow {
  return { ...row.project, folderState: folderState(row.slug, row.project.clickupFolderId) };
}

export async function listProjects(businessId: string): Promise<ProjectRow[]> {
  const rows = await db
    .select(projectWithSlug)
    .from(projects)
    .innerJoin(businesses, eq(businesses.id, projects.businessId))
    .where(eq(projects.businessId, businessId))
    .orderBy(sql`${projects.status} <> 'active'`, asc(projects.name));
  return rows.map(annotate);
}

export async function getProject(businessId: string, id: string): Promise<ProjectRow | null> {
  const [row] = await db
    .select(projectWithSlug)
    .from(projects)
    .innerJoin(businesses, eq(businesses.id, projects.businessId))
    .where(and(eq(projects.businessId, businessId), eq(projects.id, id)))
    .limit(1);
  return row ? annotate(row) : null;
}

/** Projects that are wired to an authorized ClickUp folder — the input to every Ops read. */
export async function listLinkedProjects(businessId: string) {
  const rows = await listProjects(businessId);
  return rows.filter((r) => r.folderState === "linked");
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
