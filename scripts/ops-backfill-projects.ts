/**
 * Creates one project row per folder in the checked-in Phase 0 map, so Ops
 * stops depending on that map and starts reading `projects.clickupFolderId`.
 *
 * Idempotent: a folder already claimed by a project is skipped, and the unique
 * index on (business_id, clickup_folder_id) is the real guard behind that.
 *
 * Run: npm run ops:backfill [businessSlug]
 */
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { businesses } from "../lib/db/schema";
import { listProjects, createProject } from "../lib/db/queries/projects";
import { clientFoldersFor } from "../lib/ops-config";

const SLUG = process.argv[2] ?? "mytiv";

async function main() {
  const [business] = await db.select().from(businesses).where(eq(businesses.slug, SLUG)).limit(1);
  if (!business) {
    console.error(`No business with slug "${SLUG}".`);
    process.exit(1);
  }

  const folders = clientFoldersFor(SLUG);
  if (folders.length === 0) {
    console.log(`No folders mapped for "${SLUG}" — nothing to backfill.`);
    return;
  }

  const existing = await listProjects(business.id);
  const claimed = new Set(existing.map((p) => p.clickupFolderId).filter(Boolean));

  for (const folder of folders) {
    if (claimed.has(folder.clickupFolderId)) {
      console.log(`skip   ${folder.label.padEnd(10)} folder ${folder.clickupFolderId} already linked`);
      continue;
    }
    const row = await createProject(business.id, {
      name: folder.label,
      client: folder.internal ? "" : folder.label,
      status: "active",
      clickupFolderId: folder.clickupFolderId,
    });
    console.log(`create ${folder.label.padEnd(10)} folder ${folder.clickupFolderId} -> project ${row.id}`);
  }

  const after = await listProjects(business.id);
  console.log(`\n${after.length} projects, ${after.filter((p) => p.clickupFolderId).length} linked to ClickUp.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
