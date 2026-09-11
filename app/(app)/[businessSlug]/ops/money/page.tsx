import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveBusiness } from "@/lib/tenant";
import { listProjects } from "@/lib/db/queries/projects";
import { listAcceptedProposalsForProject } from "@/lib/db/queries/proposals";
import { computeTotals } from "@/lib/pdf-helpers";
import { folderFromProject } from "@/lib/ops-config";
import { getTasksByFolder, getTimeByTask } from "@/lib/clickup";
import {
  allTimeWindow,
  compareEstimates,
  computeClientMoney,
  contractorHourlyCost,
  formatHours,
  formatMoney,
  monthWindow,
  parseBudget,
  type ClientMoney,
  type EstimateVsActual,
  type RevenueSource,
} from "@/lib/money";
import { MoneyCard } from "@/components/ops/money-card";
import { MonthPicker } from "@/components/ops/month-picker";
import { ClickUpFailed } from "@/components/ops/notice";

function currentMonth() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Hours against revenue, per client.
 *
 * Built last on purpose: it depends on the contractors logging time, and until
 * they do it reports honestly that cost is unknown rather than rendering a
 * flattering margin out of a zero.
 */
export default async function MoneyPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { businessSlug } = await params;
  const { month: monthParam } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { business } = await resolveBusiness(businessSlug, session.user.id);

  const month = /^\d{4}-\d{2}$/.test(monthParam ?? "") ? monthParam! : currentMonth();
  const window = monthWindow(month);
  const hourlyCost = contractorHourlyCost();

  const projects = (await listProjects(business.id)).filter((p) => p.folderState === "linked");

  let failure: string | null = null;
  const rows: { money: ClientMoney; overruns: EstimateVsActual[] }[] = [];

  for (const project of projects) {
    const folder = folderFromProject(project);
    if (!folder) continue;

    // Revenue comes from the database, so it is resolved before any ClickUp
    // call — a retainer client needs only the month window, which halves the
    // requests against a rate limit that is very real here.
    const accepted = await listAcceptedProposalsForProject(business.id, project.id);
    let revenue: RevenueSource;
    if (accepted.length > 0) {
      const totals = accepted.map((p) => computeTotals(p as Parameters<typeof computeTotals>[0]));
      revenue = {
        kind: "proposal",
        monthly: totals.reduce((s, t) => s + t.totalMonthly, 0),
        setup: totals.reduce((s, t) => s + t.totalSetup, 0),
        proposals: accepted.length,
      };
    } else {
      const parsed = parseBudget(project.budget);
      revenue =
        parsed.amount === null
          ? { kind: "none" }
          : { kind: "budget", total: parsed.amount, raw: parsed.raw, ambiguous: parsed.ambiguous };
    }

    try {
      const monthTime = await getTimeByTask(folder, window);
      const allTime = revenue.kind === "budget" ? await getTimeByTask(folder, allTimeWindow()) : monthTime;

      const tasks = await getTasksByFolder(folder, { includeClosed: true });
      const estimates = new Map(
        tasks.map((t) => [t.id, { name: t.title, estimateHours: t.estimateHours }])
      );

      rows.push({
        money: computeClientMoney({
          projectId: project.id,
          name: project.name,
          monthHours: monthTime.totalHours,
          totalHours: allTime.totalHours,
          hourlyCost,
          revenue,
        }),
        overruns: compareEstimates(monthTime.perTask, estimates).filter(
          (e) => e.overrunPct !== null && e.overrunPct > 0
        ),
      });
    } catch (err) {
      failure = err instanceof Error ? err.message : "ClickUp request failed.";
      break;
    }
  }

  const totalHours = rows.reduce((s, r) => s + r.money.monthHours, 0);
  const completeCosts = rows.length > 0 && rows.every(r => r.money.monthCost !== null);
  const matchingRevenue = rows.length > 0 && rows.every(r => r.money.revenue.kind === "proposal");
  const totalCost = rows.reduce((s, r) => s + (r.money.monthCost ?? 0), 0);
  const totalRetainer = rows.reduce(
    (s, r) => s + (r.money.revenue.kind === "proposal" ? r.money.revenue.monthly : 0),
    0
  );
  const overruns = rows.flatMap((r) => r.overruns);
  const noTimeClients = rows.filter((r) => r.money.totalHours === 0);

  return (
    <div className="ops-root">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Money</h1>
          <p className="text-muted-foreground mt-1 text-xs">
            {window.label} · hours logged in ClickUp against what each client pays
          </p>
        </div>
        <MonthPicker month={month} />
      </header>

      {failure ? (
        <div className="mt-6">
          <ClickUpFailed message={failure} />
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-card border-border text-muted-foreground mt-6 rounded-xl border px-6 py-12 text-center text-sm">
          No project is linked to a ClickUp folder yet.
        </div>
      ) : (
        <>
          {/* Executive summary — the one-page read. */}
          <section className="bg-card border-border mt-6 rounded-xl border p-4">
            <h2 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
              {window.label} — summary
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <div className="text-2xl font-bold tabular-nums">{formatHours(totalHours)}</div>
                <div className="text-muted-foreground text-[11px]">hours logged</div>
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums">{!completeCosts ? "—" : formatMoney(totalCost)}</div>
                <div className="text-muted-foreground text-[11px]">contractor cost</div>
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums">
                  {totalRetainer > 0 ? formatMoney(totalRetainer) : "—"}
                </div>
                <div className="text-muted-foreground text-[11px]">retainer revenue</div>
              </div>
              <div>
                <div
                  className={`text-2xl font-bold tabular-nums ${
                    totalRetainer > 0 && completeCosts && matchingRevenue
                      ? totalRetainer - totalCost < 0
                        ? "text-danger"
                        : "text-success"
                      : "text-muted-foreground"
                  }`}
                >
                  {totalRetainer > 0 && completeCosts && matchingRevenue
                    ? formatMoney(totalRetainer - totalCost)
                    : "—"}
                </div>
                <div className="text-muted-foreground text-[11px]">margin</div>
              </div>
            </div>

            <ul className="text-muted-foreground mt-4 flex flex-col gap-1.5 text-xs leading-relaxed">
              {noTimeClients.length > 0 && (
                <li>
                  <span className="text-warning font-medium">
                    {noTimeClients.length} of {rows.length} clients have no tracked time at all
                  </span>{" "}
                  ({noTimeClients.map((r) => r.money.name).join(", ")}). Until time is logged, cost per client is
                  unknown — not zero — and no margin on this page can be trusted.
                </li>
              )}
              {hourlyCost === null && (
                <li>
                  <span className="text-warning font-medium">CONTRACTOR_HOURLY_COST is not set.</span> Add it to the
                  environment and every cost figure here fills in.
                </li>
              )}
              {overruns.length > 0 && (
                <li>
                  {overruns.length} task{overruns.length === 1 ? "" : "s"} ran over estimate this month — see below.
                </li>
              )}
              {rows.every((r) => r.money.revenue.kind !== "proposal") && (
                <li>
                  No accepted proposal is linked to any project, so revenue is read from the free-text budget field.
                  Linking proposals turns that into a real monthly figure.
                </li>
              )}
            </ul>
          </section>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <MoneyCard key={r.money.projectId} money={r.money} />
            ))}
          </div>

          <section className="mt-8">
            <h2 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
              Estimate vs actual
            </h2>
            {overruns.length === 0 ? (
              <div className="bg-card border-border text-muted-foreground rounded-xl border px-6 py-8 text-center text-sm">
                {totalHours === 0
                  ? "Nothing to compare — no time was logged this month."
                  : "No task ran over its estimate this month."}
              </div>
            ) : (
              <div className="border-border bg-card overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-border text-muted-foreground border-b text-left text-xs">
                      <th className="px-4 py-2.5 font-medium">Task</th>
                      <th className="px-3 py-2.5 font-medium">Estimate</th>
                      <th className="px-3 py-2.5 font-medium">Actual</th>
                      <th className="px-3 py-2.5 font-medium">Over</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overruns.map((e) => (
                      <tr key={e.taskId} className="border-border/60 border-b last:border-0">
                        <td className="max-w-md truncate px-4 py-2.5">{e.taskName}</td>
                        <td className="px-3 py-2.5 tabular-nums">{formatHours(e.estimateHours ?? 0)}h</td>
                        <td className="px-3 py-2.5 tabular-nums">{formatHours(e.actualHours)}h</td>
                        <td className="text-warning px-3 py-2.5 font-medium tabular-nums">
                          +{e.overrunPct!.toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
