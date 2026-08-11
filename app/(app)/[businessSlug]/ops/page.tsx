import { StatTiles } from "@/components/ops/stat-tiles";
import { StuckList } from "@/components/ops/stuck-list";
import { RefreshButton } from "@/components/ops/refresh-button";
import {
  ClickUpFailed,
  ClickUpNotConfigured,
  ClickUpRateLimited,
  NothingStuck,
} from "@/components/ops/notice";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveBusiness } from "@/lib/tenant";
import { listLinkedProjects } from "@/lib/db/queries/projects";
import { foldersForBusiness, stuckThresholdDays } from "@/lib/ops-config";
import {
  ClickUpConfigError,
  ClickUpRateLimitError,
  getOpenTasks,
  statsFor,
  type OpsStats,
  type OpsTask,
} from "@/lib/clickup";

/**
 * Ops Home — one screen answering one question: what is stuck, and on whom.
 *
 * Membership is already enforced by the [businessSlug] layout via
 * resolveBusiness(); the folder mapping is keyed by slug on top of that, so a
 * business with no configured folders sees an empty board rather than Mytiv's.
 */
export default async function OpsHomePage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { business } = await resolveBusiness(businessSlug, session.user.id);

  // Linked projects are the source of the folder map; the checked-in config is
  // only a fallback for a database that has no projects yet.
  const folders = foldersForBusiness(businessSlug, await listLinkedProjects(business.id));
  const thresholdDays = stuckThresholdDays();

  let open: OpsTask[] | null = null;
  let failure: React.ReactNode = null;

  if (folders.length === 0) {
    failure = (
      <ClickUpFailed message="No project is linked to a ClickUp folder yet. Create one under Projects and paste its folder ID." />
    );
  } else {
    try {
      open = await getOpenTasks(folders);
    } catch (err) {
      if (err instanceof ClickUpConfigError) failure = <ClickUpNotConfigured />;
      else if (err instanceof ClickUpRateLimitError)
        failure = <ClickUpRateLimited retryAfterSeconds={err.retryAfterSeconds} />;
      else failure = <ClickUpFailed message={err instanceof Error ? err.message : "Unknown error"} />;
    }
  }

  const stats: OpsStats = open ? statsFor(open, thresholdDays) : { stuck: 0, overdue: 0, openTasks: 0, openBugs: 0 };
  const stuck = (open ?? [])
    .filter((t) => t.daysIdle >= thresholdDays)
    .sort((a, b) => b.daysIdle - a.daysIdle);

  return (
    <div className="ops-root">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Ops</h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Live from ClickUp · stuck after {thresholdDays} days without an update
          </p>
        </div>
        <RefreshButton />
      </header>

      <div className="mt-6">
        <StatTiles stats={stats} />
      </div>

      <section className="mt-8">
        <h2 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
          Stuck {stuck.length > 0 && <span className="tabular-nums">({stuck.length})</span>}
        </h2>

        {failure ?? (stuck.length === 0 ? <NothingStuck thresholdDays={thresholdDays} /> : <StuckList tasks={stuck} />)}
      </section>
    </div>
  );
}
