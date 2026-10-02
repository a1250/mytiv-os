"use client";

import Link from "next/link";
import type { TimeReportData, TimeReportGroup, TimeReportRow } from "@/lib/focus/contracts/work";
import { fmtDayMonth, formatNumber } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { cx } from "@/components/focus/ui/cx";
import { PlannedTag } from "@/components/focus/ui/status";
import { Tabs } from "@/components/focus/ui/tabs";

/**
 * TimeReport (Mytiv Work contract): `{ range, groupBy, rows: { key, hours, budgetHours, certainty }[] }`. Every value
 * carries its certainty (known "=" / estimated "≈"); a row without a budget shows "—", never 0%.
 */
const GROUPS: { key: TimeReportGroup; label: string }[] = [
  { key: "employee", label: "עובד" }, { key: "project", label: "פרויקט" }, { key: "client", label: "לקוח" }, { key: "task", label: "משימה" },
];

function budgetText(r: TimeReportRow) {
  if (r.budgetHours == null) return { mark: "—", text: "אין תקציב", tone: "na" as const };
  const over = r.hours > r.budgetHours;
  if (r.certainty === "estimated") return { mark: "≈", text: r.note ?? "מוערך", tone: "est" as const };
  return { mark: "=", text: over ? "חורג" : "תקין", tone: over ? ("over" as const) : ("ok" as const) };
}

export function TimeReport({ data, groupBy, onGroupBy, rows }: { data: TimeReportData; groupBy: TimeReportGroup; onGroupBy: (g: TimeReportGroup) => void; rows: TimeReportRow[] }) {
  const t = data.totals;
  const pct = Math.round((t.hours / t.budgetHours) * 100);
  const label = GROUPS.find((g) => g.key === groupBy)!.label;
  return (
    <section className="f-panel f-trep" aria-labelledby="trep-h">
      <div className="f-trep__head">
        <h2 id="trep-h" className="f-trep__h">דוח שעות</h2>
        <span className="f-meta f-num">{fmtDayMonth(data.range.from)} – {fmtDayMonth(data.range.to)}</span>
        <span className="f-grow" />
        <span className="f-trep__export"><button type="button" className="f-btn f-btn--neutral f-btn--sm" aria-disabled="true" aria-describedby="trep-export-why">ייצוא</button> <span id="trep-export-why"><PlannedTag /></span></span>
      </div>
      <Tabs label="קיבוץ לפי" value={groupBy} onChange={onGroupBy} items={GROUPS} size="sm" className="f-trep__tabs" idBase="trep" />
      <div className="f-trep__kpis">
        <div className="f-trep__kpi">
          <span className="f-meta-sm">סה״כ נרשם</span>
          <b className="f-trep__num f-num">{formatNumber(t.hours)}h</b>
          <span className="f-cert-word f-cert-word--estimated">≈ {t.unreported} ללא דיווח</span>
        </div>
        <div className="f-trep__kpi">
          <span className="f-meta-sm">מול תקציב</span>
          <b className="f-trep__num f-num">{formatNumber(t.hours)}/{t.budgetHours}h</b>
          <span className="f-trep__ok">= {pct}% מנוצל</span>
        </div>
        <div className="f-trep__kpi">
          <span className="f-meta-sm">פרויקט חורג</span>
          <b className={cx("f-trep__num", t.overBudgetProjects.count > 0 && "f-text-risk")}>{t.overBudgetProjects.count}</b>
          <span className="f-meta-sm">{t.overBudgetProjects.label}</span>
        </div>
      </div>
      <table className="f-trep__table" id={`trep-panel-${groupBy}`}>
        <caption className="f-sr">שעות לפי {label}, {fmtDayMonth(data.range.from)}–{fmtDayMonth(data.range.to)}</caption>
        <thead><tr><th scope="col">{label}</th><th scope="col">שעות</th><th scope="col">מול תקציב</th></tr></thead>
        <tbody>
          {rows.map((r) => {
            const b = budgetText(r);
            return (
              <tr key={r.key}>
                <th scope="row"><span className="f-trep__who">{r.initial && <span className={cx("f-tl__av", `f-tl__av--${r.key}`)} aria-hidden>{r.initial}</span>}{r.label}</span></th>
                <td className="f-mono" dir="ltr">{r.certainty === "estimated" ? "≈ " : ""}{r.hours.toFixed(1)}h</td>
                <td className={cx("f-trep__b", `f-trep__b--${b.tone}`)}><span aria-hidden>{b.mark}</span> {b.text}{r.budgetHours != null && <span className="f-sr"> ({r.hours} מתוך {r.budgetHours} שעות)</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="f-meta-sm f-trep__basis">{data.basis} · <Link href={R.reportHours} className="f-link">מקור חישוב</Link></p>
    </section>
  );
}
