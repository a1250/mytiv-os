"use client";

import Link from "@/components/focus/ui/link";
import { useState } from "react";
import type { GoalRow } from "@/lib/focus/contracts/reports";
import { GOALS, REPORT_PERIODS } from "@/lib/focus/fixtures/reports";
import { fmtAgo, fmtDayMonth, formatNumber } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { BarChart, PlannedAction, SourceDrawer, ValueWithCert, VerifMark } from "@/components/focus/patterns/reports/report-parts";
import { useDemo } from "@/components/focus/shell/demo-store";
import { cx } from "@/components/focus/ui/cx";
import { SelectField } from "@/components/focus/ui/field";
import { formatReadingNumber } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";

/**
 * דוחות › יעדים וביצועים (handoff G1, flow 8). Every number shows its source, freshness and certainty; the source
 * opens "מגירת מקור הנתון". The chart is accompanied by a table and a summary sentence.
 */
const countWord = (n: number, one: string, many: string) => (n === 1 ? one : `${n} ${many}`);

function statusSentence(rows: GoalRow[]) {
  const above = rows.filter((r) => (r.reading.kind === "known" || r.reading.kind === "estimated") && r.reading.value >= r.target).length;
  const est = rows.filter((r) => r.reading.kind === "estimated").length;
  const na = rows.filter((r) => r.reading.kind === "unknown" || r.reading.kind === "unavailable").length;
  const parts = [
    above === 0 ? "אף מדד לא מעל היעד" : `${countWord(above, "מדד אחד", "מדדים")} מעל היעד`,
    est ? `${countWord(est, "אחד", "")} מוערך`.trim() : null,
    na ? `${countWord(na, "אחד", "")} לא זמין`.trim() : null,
  ].filter(Boolean) as string[];
  if (parts.length === 1) return `${parts[0]}.`;
  return `${parts.slice(0, -1).join(", ")} ו${parts[parts.length - 1]}.`;
}

function freshText(r: GoalRow, now: string) {
  const f = r.freshness;
  if (!f) return "";
  if (f.state === "unavailable") return `לא זמין מ־${fmtDayMonth(f.since)} · ${f.reason}`;
  return `${f.state === "stale" ? "לא מעודכן · " : ""}עודכן ${fmtAgo(f.updatedAt, now)}`;
}

function Delta({ row }: { row: GoalRow }) {
  if (!row.delta || row.reading.kind === "unknown" || row.reading.kind === "unavailable") return <span className="f-value--unavailable" aria-label="לא ידוע">—</span>;
  const v = row.delta.value;
  return (
    <span className={cx("f-num", `f-rp-delta--${row.delta.tone}`)}>
      {row.reading.kind === "estimated" && <span aria-hidden>≈ </span>}{v > 0 ? "+" : ""}{formatNumber(v)}
      <span className="f-sr"> מול החודש הקודם</span>
    </span>
  );
}

export default function ReportsGoalsScreen() {
  const { now } = useDemo();
  const toast = useToast();
  const [periodId, setPeriodId] = useState(REPORT_PERIODS[0].id);
  const [openId, setOpenId] = useState<string | null>(null);
  const [requests, setRequests] = useState<string[]>([]);
  const report = GOALS[periodId];
  const open = report.rows.find((r) => r.id === openId) ?? null;
  const reqKey = (id: string) => `${periodId}:${id}`;

  const request = (row: GoalRow) => {
    const key = reqKey(row.id);
    setRequests((xs) => [...xs, key]);
    toast.push({
      title: "הבקשה נרשמה",
      detail: `${row.label}: נבקש מ־${report.client.name} את הנתון החסר. עד שיגיע הערך נשאר מוערך.`,
      undo: { onUndo: () => setRequests((xs) => xs.filter((x) => x !== key)) },
    });
  };

  return (
    <Page className="f-rp-goals">
      <PageHeader
        eyebrow={<nav aria-label="נתיב" className="f-crumbs"><Link href={R.reports}>דוחות ובקרה</Link> <span aria-hidden>›</span> יעדים וביצועים</nav>}
        title={`${report.client.name} · ${report.periodLabel}`}
        size="entity"
        status={statusSentence(report.rows)}
        actions={<>
          <SelectField
            label="תקופה" labelClassName="f-sr" className="f-rp-period" inputClassName="f-rp-period__select"
            value={periodId} onChange={(e) => { setPeriodId(e.target.value); setOpenId(null); }}
            options={REPORT_PERIODS.map((p) => ({ value: p.id, label: p.label }))}
          />
          <PlannedAction label="ייצוא" variant="outline" />
        </>}
      />

      <section className="f-panel f-rp-tablewrap" aria-label="מדדים מול יעד">
        <table className="f-rp-table f-rp-table--goals">
          <caption className="f-sr">מדדים מול יעד, {report.periodLabel}. לחיצה על המקור פותחת את מגירת מקור הנתון.</caption>
          <thead>
            <tr><th scope="col">מדד</th><th scope="col">יעד</th><th scope="col">ביצוע</th><th scope="col">שינוי</th><th scope="col">מקור ואימות</th></tr>
          </thead>
          <tbody>
            {report.rows.map((r) => (
              <tr key={r.id} className={cx(openId === r.id && "f-rp-row--active")}>
                <th scope="row" data-label="מדד"><b>{r.label}</b></th>
                <td data-label="יעד" className="f-num">{formatReadingNumber(r.target, r.unit)}</td>
                <td data-label="ביצוע"><ValueWithCert reading={r.reading} unit={r.unit} /></td>
                <td data-label="שינוי"><Delta row={r} /></td>
                <td data-label="מקור ואימות">
                  <button type="button" className="f-rp-srcbtn" aria-haspopup="dialog" aria-label={`מקור הנתון: ${r.label} · ${r.source.label}`} onClick={() => setOpenId(r.id)}>
                    {r.source.label} <span aria-hidden>·</span> <VerifMark state={r.sourceState} />
                  </button>
                  <span className="f-rp-fresh">{freshText(r, now)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <BarChart title={report.chart.title} caption={report.chart.caption} bars={report.chart.bars} unitWord="הזמנות" />

      {open && (
        <SourceDrawer
          key={`${periodId}-${open.id}`}
          open
          onClose={() => setOpenId(null)}
          title={`${open.label} · ${report.periodLabel}`}
          reading={open.reading}
          unit={open.unit}
          detail={open.detail}
          requested={requests.includes(reqKey(open.id))}
          onRequest={() => request(open)}
        />
      )}
    </Page>
  );
}
