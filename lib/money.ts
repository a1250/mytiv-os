/**
 * The money layer: hours logged against what the client pays.
 *
 * Everything here is a pure function over numbers that came from somewhere
 * verifiable, and every number that could not be established comes back as
 * `null` with a named gap rather than a zero. That distinction is the whole
 * point of this file — a client with no tracked time and a client with a real
 * loss must never render the same way, and today every client on the board is
 * the former.
 */

export type MoneyGap =
  | "no_hourly_rate"
  | "no_time_tracked"
  | "no_revenue_recorded"
  | "budget_ambiguous"
  | "budget_unparsed";

export type RevenueSource =
  /** Accepted proposals linked to the project — a real monthly retainer. */
  | { kind: "proposal"; monthly: number; setup: number; proposals: number }
  /** The free-text `projects.budget` column, parsed. A total, not a monthly figure. */
  | { kind: "budget"; total: number; raw: string; ambiguous: boolean }
  | { kind: "none" };

export type ClientMoney = {
  projectId: string;
  name: string;
  /** Hours in the selected month. */
  monthHours: number;
  /** Hours since the beginning, for the budget-burn view. */
  totalHours: number;
  hourlyCost: number | null;
  monthCost: number | null;
  totalCost: number | null;
  revenue: RevenueSource;
  /** Monthly retainer minus this month's cost. Only when revenue is a retainer. */
  monthMargin: number | null;
  monthMarginPct: number | null;
  /** Share of a fixed budget consumed so far. Only when revenue is a budget. */
  budgetUsedPct: number | null;
  gaps: MoneyGap[];
};

/** Cost of an hour of contractor time. Unset means margin cannot be computed at all. */
export function contractorHourlyCost(): number | null {
  const raw = Number(process.env.CONTRACTOR_HOURLY_COST);
  return Number.isFinite(raw) && raw > 0 ? raw : null;
}

/** First and last instant of a YYYY-MM month, in UTC. */
export function monthWindow(month: string): { from: Date; to: Date; label: string } {
  const [y, m] = month.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const to = new Date(Date.UTC(y, m, 0, 23, 59, 59));
  const label = from.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return { from, to, label };
}

/** A window wide enough to mean "everything ClickUp has". */
export function allTimeWindow(): { from: Date; to: Date } {
  return { from: new Date(Date.UTC(2020, 0, 1)), to: new Date() };
}

/**
 * Reads a number out of the free-text budget column.
 *
 * `projects.budget` is text a human typed, so "6,500" and "₪6500 setup + 490/mo"
 * both land here. More than one number means the intent is ambiguous — the
 * caller is told so rather than quietly being handed the first one as truth.
 */
export function parseBudget(text: string | null | undefined): {
  amount: number | null;
  ambiguous: boolean;
  raw: string;
} {
  const raw = (text ?? "").trim();
  if (!raw) return { amount: null, ambiguous: false, raw };

  const numbers = [...raw.matchAll(/\d[\d,.\s]*/g)]
    .map((m) => Number(m[0].replace(/[,\s]/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (numbers.length === 0) return { amount: null, ambiguous: false, raw };
  return { amount: numbers[0], ambiguous: numbers.length > 1, raw };
}

export function computeClientMoney(args: {
  projectId: string;
  name: string;
  monthHours: number;
  totalHours: number;
  hourlyCost: number | null;
  revenue: RevenueSource;
}): ClientMoney {
  const { projectId, name, monthHours, totalHours, hourlyCost, revenue } = args;
  const gaps: MoneyGap[] = [];

  if (hourlyCost === null) gaps.push("no_hourly_rate");
  if (totalHours === 0) gaps.push("no_time_tracked");
  if (revenue.kind === "none") gaps.push("no_revenue_recorded");
  if (revenue.kind === "budget") {
    if (revenue.ambiguous) gaps.push("budget_ambiguous");
    if (!Number.isFinite(revenue.total) || revenue.total <= 0) gaps.push("budget_unparsed");
  }

  const monthCost = hourlyCost === null || monthHours === 0 ? null : monthHours * hourlyCost;
  const totalCost = hourlyCost === null || totalHours === 0 ? null : totalHours * hourlyCost;

  let monthMargin: number | null = null;
  let monthMarginPct: number | null = null;
  let budgetUsedPct: number | null = null;

  // A margin is only meaningful when both sides are real. With no tracked time
  // the cost is not zero, it is unknown — reporting 100% margin would be a lie
  // told confidently, which is worse than an empty cell.
  if (revenue.kind === "proposal" && monthCost !== null && totalHours > 0) {
    monthMargin = revenue.monthly - monthCost;
    monthMarginPct = revenue.monthly > 0 ? (monthMargin / revenue.monthly) * 100 : null;
  }
  if (revenue.kind === "budget" && totalCost !== null && revenue.total > 0 && totalHours > 0 && !revenue.ambiguous) {
    budgetUsedPct = (totalCost / revenue.total) * 100;
  }

  return {
    projectId,
    name,
    monthHours,
    totalHours,
    hourlyCost,
    monthCost,
    totalCost,
    revenue,
    monthMargin,
    monthMarginPct,
    budgetUsedPct,
    gaps,
  };
}

/** Tasks where the logged time overshot the estimate — the under-estimation signal. */
export type EstimateVsActual = {
  taskId: string;
  taskName: string;
  estimateHours: number | null;
  actualHours: number;
  overrunPct: number | null;
};

export function compareEstimates(
  perTask: { taskId: string; taskName: string; hours: number }[],
  estimates: Map<string, { name: string; estimateHours: number | null }>
): EstimateVsActual[] {
  return perTask
    .map((t) => {
      const est = estimates.get(t.taskId)?.estimateHours ?? null;
      return {
        taskId: t.taskId,
        taskName: estimates.get(t.taskId)?.name ?? t.taskName,
        estimateHours: est,
        actualHours: t.hours,
        overrunPct: est && est > 0 ? ((t.hours - est) / est) * 100 : null,
      };
    })
    .sort((a, b) => (b.overrunPct ?? -Infinity) - (a.overrunPct ?? -Infinity));
}

export function formatMoney(amount: number | null): string {
  if (amount === null) return "—";
  return `₪${Math.round(amount).toLocaleString("en-US")}`;
}

export function formatHours(hours: number): string {
  return hours === 0 ? "0" : hours.toFixed(1);
}
