/** Read-only verification. No task titles, comments, secrets, or contact data are printed. */
import { db } from '../lib/db';
import { businesses } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { listProjects } from '../lib/db/queries/projects';
import { hasSecret } from '../lib/db/queries/secrets';
import { getTasksByFolder, getFolderLists, getTimeByTask } from '../lib/clickup';
import { folderFromProject } from '../lib/ops-config';

async function main() {
  const [business] = await db.select().from(businesses).where(eq(businesses.slug, 'mytiv')).limit(1);
  if (!business) throw new Error('business_not_found');
  const projects = await listProjects(business.id);
  console.log(JSON.stringify({ business: business.slug, projects: projects.length, claudeKeyPresent: await hasSecret(business.id, 'ai_api_key'), clickupTokenPresent: Boolean(process.env.CLICKUP_API_TOKEN), clickupWorkspacePresent: Boolean(process.env.CLICKUP_WORKSPACE_ID), contractorRatePresent: Boolean(process.env.CONTRACTOR_HOURLY_COST) }));
  for (const project of projects) {
    const folder = folderFromProject(project); if (!folder) continue;
    const [tasks, lists, time] = await Promise.all([getTasksByFolder(folder), getFolderLists(folder), getTimeByTask(folder, { from: new Date(Date.now() - 30 * 86400000), to: new Date() })]);
    console.log(JSON.stringify({ project: project.name, lists: lists.length, openRows: tasks.length, loggedHoursLast30Days: time.totalHours, hasSpec: Boolean(project.brief?.trim()) }));
  }
}
main().catch(() => { console.error('READINESS_FAILED: source unavailable; no absence or zero-data conclusion.'); process.exitCode = 1; });
