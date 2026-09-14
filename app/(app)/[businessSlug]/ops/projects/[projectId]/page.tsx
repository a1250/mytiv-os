import { AuditLog } from "@/components/ops/audit-log";
import { Suspense } from "react";
import { marketingBinding, latestPlan } from "@/lib/marketing/service";
import type { MarketingPlan } from "@/lib/marketing/contract";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { resolveBusiness } from "@/lib/tenant";
import { getProject } from "@/lib/db/queries/projects";
import { folderFromProject } from "@/lib/ops-config";
import { getFolderLists, getTasksByFolder, getWorkspaceMembers, type OpsTask, type WorkspaceMember } from "@/lib/clickup";
import { ClientWorkspace } from "@/components/ops/client-workspace";
import { ClickUpFailed } from "@/components/ops/notice";

export default async function ClientWorkspacePage({
  params,
}: {
  params: Promise<{ businessSlug: string; projectId: string }>;
}) {
  const { businessSlug, projectId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { business, role } = await resolveBusiness(businessSlug, session.user.id);

  const project = await getProject(business.id, projectId);
  if (!project) notFound();

  const folder = folderFromProject(project);
  const binding = marketingBinding(businessSlug, projectId);
  let plan: MarketingPlan | null = null;
  let marketingUnavailable = false;
  if (binding) {
    try { plan = await latestPlan(business.id, projectId, binding); }
    catch { marketingUnavailable = true; }
  }

  let rows: OpsTask[] = [];
  let members: WorkspaceMember[] = [];
  let statusesByList: Record<string, string[]> = {};
  let failure: string | null = null;

  if (folder) {
    try {
      const [tasks, lists, people] = await Promise.all([
        getTasksByFolder(folder),
        getFolderLists(folder),
        getWorkspaceMembers(),
      ]);
      rows = tasks;
      members = people;
      statusesByList = Object.fromEntries(lists.map((l) => [l.id, l.statuses]));
    } catch (err) {
      failure = err instanceof Error ? err.message : "Unknown ClickUp error";
    }
  }

  return (
    <div className="ops-root">
      <Link
        href={`/${businessSlug}/ops/projects`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
      >
        <ArrowLeft className="size-3.5" />
        Projects
      </Link>

      <header className="mt-2 mb-5">
        <h1 className="text-xl font-bold">{project.name}</h1>
        <p className="text-muted-foreground mt-1 text-xs">
          {project.client || "No client name set"}
          {project.folderState === "linked"
            ? ` · ClickUp folder ${project.clickupFolderId}`
            : project.folderState === "unauthorized"
              ? ` · ClickUp folder ${project.clickupFolderId} is not authorized for this business — tasks not read`
              : " · not linked to ClickUp"}
        </p>
      </header>

      {failure && (
        <div className="mb-5">
          <ClickUpFailed message={failure} />
        </div>
      )}

      <ClientWorkspace
        businessSlug={businessSlug}
        project={project}
        marketing={{ binding, plan, canImport: role === "owner" || role === "admin", unavailable: marketingUnavailable, now: new Date().toISOString() }}
        tasks={rows.filter((t) => t.listKind === "tasks" || t.listKind === "other")}
        bugs={rows.filter((t) => t.isBug)}
        decisions={rows.filter((t) => t.isDecision)}
        members={members}
        statusesByList={statusesByList}
      />
      <Suspense fallback={<p className="mt-6 text-xs">טוען היסטוריית אישורים…</p>}>
        <AuditLog businessSlug={businessSlug} businessId={business.id} projectId={projectId} canWrite={role === "owner" || role === "admin"} />
      </Suspense>
    </div>
  );
}
