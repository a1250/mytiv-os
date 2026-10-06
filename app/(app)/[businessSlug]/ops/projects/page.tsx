import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveBusiness } from "@/lib/tenant";
import { listProjects } from "@/lib/db/queries/projects";
import { folderFromProject, stuckThresholdDays } from "@/lib/ops-config";
import { projectTaskSource } from "@/lib/work-source";
import { stuckItems, type WorkItem } from "@/lib/work-source/types";
import { NewProject } from "@/components/ops/new-project";
import { Badge } from "@/components/ui/badge";

/** One card per client. The stuck count is the number that matters, so it is the biggest. */
export default async function ProjectHubPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { business } = await resolveBusiness(businessSlug, session.user.id);

  const projects = await listProjects(business.id);
  const thresholdDays = stuckThresholdDays();

  const summaries = await Promise.all(
    projects.map(async (project) => {
      const source = projectTaskSource(folderFromProject(project));
      if (!source) return { project, open: [] as WorkItem[], failed: false, incomplete: false, state: project.folderState };
      try {
        const { items, complete } = await source.items();
        return { project, open: items.filter((t) => t.kind !== "decision"), failed: false, incomplete: !complete, state: project.folderState };
      } catch {
        return { project, open: [] as WorkItem[], failed: true, incomplete: false, state: project.folderState };
      }
    })
  );

  return (
    <div className="ops-root">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1 text-xs">
            One project per client. Tasks stay in ClickUp; the spec and the link live here.
          </p>
        </div>
        <NewProject businessSlug={businessSlug} />
      </header>

      {projects.length === 0 ? (
        <div className="bg-card border-border text-muted-foreground mt-6 rounded-xl border px-6 py-12 text-center text-sm">
          No projects yet. Create one per active client and paste its ClickUp folder ID.
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summaries.map(({ project, open, failed, incomplete, state }) => {
            const stuck = stuckItems(open, thresholdDays);
            const overdue = open.filter((t) => t.overdue).length;
            // Counts are shown only when ClickUp was actually read in full. A truncated
            // read (20-page cap) is unknown too, and unknown is not zero.
            const counted = state === "linked" && !failed && !incomplete;

            const nextAction = state === "unlinked"
              ? "Not linked to a ClickUp folder"
              : state === "unauthorized"
                ? "ClickUp folder not authorized for this business — tasks not read"
              : failed
                ? "ClickUp unavailable"
              : incomplete
                ? "Too many tasks to read (20-page cap) — counts hidden"
                : stuck.length > 0
                  ? `Worst: ${stuck[0].title}`
                  : overdue > 0
                    ? `${overdue} overdue`
                    : open.length === 0
                      ? "No open work"
                      : `${open.length} open, nothing stuck`;

            return (
              <Link
                key={project.id}
                href={`/${businessSlug}/ops/projects/${project.id}`}
                className="bg-card border-border hover:border-active/50 flex flex-col gap-3 rounded-xl border p-4 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{project.name}</span>
                  <Badge variant={project.status === "active" ? "active" : "neutral"}>{project.status}</Badge>
                </div>

                <div className="flex items-end gap-4">
                  <div>
                    <div
                      className={`text-3xl font-bold tabular-nums ${stuck.length > 0 ? "text-warning" : "text-muted-foreground"}`}
                    >
                      {counted ? stuck.length : "—"}
                    </div>
                    <div className="text-muted-foreground text-[11px]">stuck</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold tabular-nums">{counted ? open.length : "—"}</div>
                    <div className="text-muted-foreground text-[11px]">open</div>
                  </div>
                  {project.deadline && (
                    <div className="ml-auto text-right">
                      <div className="text-sm tabular-nums">{project.deadline}</div>
                      <div className="text-muted-foreground text-[11px]">deadline</div>
                    </div>
                  )}
                </div>

                <div className="text-muted-foreground truncate text-xs" title={nextAction}>
                  {nextAction}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
