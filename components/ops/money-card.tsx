import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatHours, formatMoney, type ClientMoney, type MoneyGap } from "@/lib/money";

const GAP_TEXT: Record<MoneyGap, string> = {
  no_hourly_rate: "CONTRACTOR_HOURLY_COST is not set — cost cannot be computed.",
  no_time_tracked: "No time tracked in ClickUp, so cost is unknown rather than zero.",
  no_revenue_recorded: "No accepted proposal and no budget recorded for this client.",
  budget_ambiguous: "The budget field holds more than one number — the first was used.",
  budget_unparsed: "The budget field has no usable number in it.",
};

function Figure({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className={cn("text-lg font-semibold tabular-nums", tone)}>{value}</div>
      <div className="text-muted-foreground text-[11px]">{label}</div>
    </div>
  );
}

/**
 * One client's month. The headline is whichever indicator the recorded revenue
 * actually supports — a retainer gives a margin, a fixed budget gives a burn
 * percentage — and neither is shown when the inputs for it are missing.
 */
export function MoneyCard({ money }: { money: ClientMoney }) {
  const { revenue } = money;
  const marginKnown = money.monthMarginPct !== null;
  const burnKnown = money.budgetUsedPct !== null;

  const headline = marginKnown
    ? {
        value: `${money.monthMarginPct!.toFixed(0)}%`,
        label: "margin this month",
        tone: money.monthMarginPct! < 0 ? "text-danger" : money.monthMarginPct! < 30 ? "text-warning" : "text-success",
      }
    : burnKnown
      ? {
          value: `${money.budgetUsedPct!.toFixed(0)}%`,
          label: "of budget consumed",
          tone: money.budgetUsedPct! > 100 ? "text-danger" : money.budgetUsedPct! > 85 ? "text-warning" : "text-success",
        }
      : { value: "—", label: "not enough recorded to judge", tone: "text-muted-foreground" };

  return (
    <div className="bg-card border-border flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold">{money.name}</span>
        <Badge variant={revenue.kind === "proposal" ? "active" : "neutral"}>
          {revenue.kind === "proposal"
            ? "retainer"
            : revenue.kind === "budget"
              ? "fixed budget"
              : "no revenue"}
        </Badge>
      </div>

      <div className="flex items-end gap-4">
        <div>
          <div className={cn("text-3xl font-bold tabular-nums", headline.tone)}>{headline.value}</div>
          <div className="text-muted-foreground text-[11px]">{headline.label}</div>
        </div>
        <div className="ml-auto flex gap-4">
          <Figure label="hours (month)" value={formatHours(money.monthHours)} />
          <Figure label="cost (month)" value={formatMoney(money.monthCost)} />
        </div>
      </div>

      <dl className="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="flex justify-between">
          <dt>Revenue</dt>
          <dd className="text-foreground tabular-nums">
            {revenue.kind === "proposal"
              ? `${formatMoney(revenue.monthly)}/mo`
              : revenue.kind === "budget"
                ? formatMoney(revenue.total)
                : "—"}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Hours all time</dt>
          <dd className="text-foreground tabular-nums">{formatHours(money.totalHours)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>{marginKnown ? "Margin" : "Cost all time"}</dt>
          <dd className="text-foreground tabular-nums">
            {marginKnown ? formatMoney(money.monthMargin) : formatMoney(money.totalCost)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Rate</dt>
          <dd className="text-foreground tabular-nums">
            {money.hourlyCost === null ? "—" : `${formatMoney(money.hourlyCost)}/h`}
          </dd>
        </div>
      </dl>

      {money.gaps.length > 0 && (
        <ul className="border-border flex flex-col gap-1 border-t pt-2">
          {money.gaps.map((gap) => (
            <li key={gap} className="text-muted-foreground flex items-start gap-1.5 text-[11px] leading-snug">
              <AlertTriangle className="text-warning mt-px size-3 shrink-0" />
              {GAP_TEXT[gap]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
