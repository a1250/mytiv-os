"use client";

import Link from "@/components/focus/ui/link";
import { useId, useState } from "react";
import type { Metric, Reading } from "@/lib/focus/contracts/common";
import { dataOf } from "@/lib/focus/contracts/loadable";
import type { ProfitRow, SourceDetail } from "@/lib/focus/contracts/reports";
import { PROFIT } from "@/lib/focus/fixtures/reports";
import { formatNumber } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { MetricTile } from "@/components/focus/patterns/metrics";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { DrawerHead, SourceDrawer } from "@/components/focus/patterns/reports/report-parts";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { Dialog } from "@/components/focus/ui/dialog";
import { Banner, EmptyState, LoadableView } from "@/components/focus/ui/feedback";
import { SelectField } from "@/components/focus/ui/field";
import { UsageBar } from "@/components/focus/ui/misc";
import { ReadingValue, RiskPill } from "@/components/focus/ui/status";

/**
 * דוחות › שעות ורווחיות (handoff G2). Estimated values carry "≈" and their basis, a project at risk always says why,
 * usage bars use UsageBar (amber above 80%, red above 100%), and every value opens its source drawer.
 */
type Kpi = "hours" | "revenue" | "cost" | "gross";
type Col = Kpi;

const sum = (rs: Reading[]): Reading => {
  const vals = rs.filter((r): r is Extract<Reading, { value: number }> => r.kind === "known" || r.kind === "estimated");
  if (vals.length < rs.length || !vals.length) return { kind: "unknown", reason: "חסר ערך באחד הפרויקטים" };
  const total = vals.reduce((a, r) => a + r.value, 0);
  const est = vals.find((r) => r.kind === "estimated");
  return est ? { kind: "estimated", value: total, basis: est.kind === "estimated" ? est.basis : "" } : { kind: "known", value: total };
};

function kpis(rows: ProfitRow[]): (Metric & { kpi: Kpi })[] {
  const quota = rows.filter((r) => r.budgetHours != null);
  const hours = sum(quota.map((r) => r.hours));
  const budget = quota.reduce((a, r) => a + (r.budgetHours ?? 0), 0);
  const revenue = sum(rows.map((r) => r.revenue));
  const cost = sum(rows.map((r) => r.cost));
  const gross = sum(rows.map((r) => r.gross));
  const pct = (gross.kind === "known" || gross.kind === "estimated") && (revenue.kind === "known" || revenue.kind === "estimated") && revenue.value > 0
    ? Math.round((gross.value / revenue.value) * 100) : null;
  const src = { system: "mytiv" as const, label: "Mytiv" };
  return [
    {
      kpi: "hours", id: "k-hours", label: "שעות בפועל מול מתוכנן", unit: "ratio", total: budget, source: src,
      reading: !quota.length ? { kind: "unknown", reason: "אין מכסת שעות בפרויקטים שנבחרו" } : hours.kind === "estimated" ? { ...hours, basis: "פרויקטים עם מכסה" } : hours,
    },
    { kpi: "revenue", id: "k-revenue", label: "הכנסה שנחתמה", unit: "ils", source: src, reading: revenue, note: revenue.kind === "known" ? "ידוע · חשבוניות שהופקו" : undefined },
    { kpi: "cost", id: "k-cost", label: "עלות עבודה", unit: "ils", source: src, reading: cost.kind === "estimated" ? { ...cost, basis: "כולל הערכה לפרילנסר" } : cost },
    { kpi: "gross", id: "k-gross", label: "רווח גולמי", unit: "ils", source: src, reading: gross.kind === "estimated" ? { ...gross, basis: pct != null ? `≈ ${pct}%` : gross.basis } : gross },
  ];
}

const COL_LABEL: Record<Col, string> = { hours: "שעות", revenue: "הכנסה", cost: "עלות", gross: "רווח גולמי" };

export default function ReportsHoursScreen() {
  const { now } = useDemo();
  const missingId = useId();
  const [filter, setFilter] = useState("all");
  const [drawer, setDrawer] = useState<{ kind: Kpi; title: string; reading: Reading; unit: "ils" | "ratio" | "hours"; total?: number } | null>(null);
  const [missingOpen, setMissingOpen] = useState(false);
  const all = dataOf(PROFIT.rows) ?? [];
  const rows = all.filter((r) => filter === "all" || (filter === "risk" ? r.overrun != null : r.id === filter));
  const tiles = kpis(rows);
  const atRisk = all.filter((r) => r.overrun).length;

  const openCell = (r: ProfitRow, col: Col) => {
    const reading = r[col];
    setDrawer({ kind: col, title: `${COL_LABEL[col]} · ${r.project} · ${r.client.name}`, reading, unit: col === "hours" ? (r.budgetHours != null ? "ratio" : "hours") : "ils", total: col === "hours" ? r.budgetHours ?? undefined : undefined });
  };
  const detail: SourceDetail | null = drawer ? PROFIT.details[drawer.kind] : null;

  const valueBtn = (r: ProfitRow, col: Col) => (
    <button type="button" className="f-rp-cellbtn" aria-haspopup="dialog" aria-label={`${COL_LABEL[col]} · ${r.project}: מקור הנתון`} onClick={() => openCell(r, col)}>
      <ReadingValue reading={r[col]} unit={col === "hours" ? undefined : "ils"} />
    </button>
  );

  return (
    <Page className="f-rp-hours">
      <PageHeader
        eyebrow={<nav aria-label="נתיב" className="f-crumbs"><Link href={R.reports}>דוחות ובקרה</Link> <span aria-hidden>›</span> שעות ורווחיות</nav>}
        title={PROFIT.periodLabel}
        size="entity"
        status={`${atRisk === 1 ? "פרויקט אחד דורש" : `${atRisk} פרויקטים דורשים`} בדיקה בשעות. הנתונים מוערכים עד שיסתיים דיווח השעות.`}
        actions={
          <SelectField
            label="סינון לפי פרויקט" labelClassName="f-sr" className="f-rp-period" inputClassName="f-rp-period__select"
            value={filter} onChange={(e) => setFilter(e.target.value)}
            options={[
              { value: "all", label: "כל הפרויקטים" },
              { value: "risk", label: "רק פרויקטים בסיכון" },
              ...all.map((r) => ({ value: r.id, label: `${r.project} · ${r.client.name}` })),
            ]}
          />
        }
      />

      <Banner
        kind="warning"
        className="f-rp-estbanner"
        title={PROFIT.estimateNote.title}
        detail={PROFIT.estimateNote.detail}
        action={<Button variant="link" className="f-rp-estbanner__btn" aria-haspopup="dialog" onClick={() => setMissingOpen(true)}>מה חסר</Button>}
      />

      <section className="f-rp-kpis" aria-label="סיכום החודש">
        {tiles.map((m) => (
          <div key={m.id} className="f-panel f-rp-kpi">
            <MetricTile m={m} now={now} />
            <button type="button" className="f-rp-kpi__src" aria-haspopup="dialog" aria-label={`${m.label}: מקור הנתון`}
              onClick={() => setDrawer({ kind: m.kpi, title: `${m.label} · ${PROFIT.periodLabel}`, reading: m.reading, unit: m.unit === "ratio" ? "ratio" : "ils", total: m.total })}>
              מקור
            </button>
          </div>
        ))}
      </section>

      <section className="f-panel f-rp-tablewrap" aria-label="פרויקטים">
        <LoadableView value={PROFIT.rows} label="שעות ורווחיות">
          {() => rows.length === 0 ? (
            <EmptyState title="אין פרויקטים שמתאימים לסינון" action={<Button variant="neutral" onClick={() => setFilter("all")}>הצג את כל הפרויקטים</Button>} />
          ) : (
            <table className="f-rp-table f-rp-table--hours">
              <caption className="f-sr">שעות ורווחיות לפי פרויקט, {PROFIT.periodLabel}. ערך עם ≈ הוא מוערך.</caption>
              <thead>
                <tr>
                  <th scope="col">פרויקט ולקוח</th><th scope="col">שעות</th><th scope="col">ניצול</th><th scope="col">הכנסה</th>
                  <th scope="col">עלות</th><th scope="col">רווח גולמי</th><th scope="col">חריגה</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const h = r.hours.kind === "known" || r.hours.kind === "estimated" ? r.hours.value : null;
                  return (
                    <tr key={r.id}>
                      <th scope="row" data-label="פרויקט ולקוח">
                        <span className="f-rp-proj">
                          {r.href ? <Link href={r.href} className="f-rp-proj__name">{r.project}</Link> : <b className="f-rp-proj__name">{r.project}</b>}
                          <span className="f-meta">{r.client.name}</span>
                        </span>
                      </th>
                      <td data-label="שעות">
                        <span className={cx("f-rp-hrs", r.budgetHours == null && "f-rp-hrs--nobudget")}>
                          {valueBtn(r, "hours")}<span className="f-num"> / {r.budgetHours == null ? <span aria-label="אין מכסה">—</span> : formatNumber(r.budgetHours)}</span>
                        </span>
                        {r.hours.kind === "estimated" && <span className="f-rp-basis">≈ {r.hours.basis}</span>}
                      </td>
                      <td data-label="ניצול">
                        {r.budgetHours != null && h != null ? (
                          <span className="f-rp-usage">
                            <UsageBar value={h} max={r.budgetHours} label={`ניצול שעות ${r.project}: ${Math.round((h / r.budgetHours) * 100)}%`} className="f-rp-usage__bar" />
                            <span className="f-meta-sm f-num">{Math.round((h / r.budgetHours) * 100)}%</span>
                          </span>
                        ) : <span className="f-rp-nobudget">ללא מכסה מוגדרת</span>}
                      </td>
                      <td data-label="הכנסה">{valueBtn(r, "revenue")}</td>
                      <td data-label="עלות">{valueBtn(r, "cost")}</td>
                      <td data-label="רווח גולמי">{valueBtn(r, "gross")}</td>
                      <td data-label="חריגה">
                        {r.overrun ? (
                          <span className="f-rp-over">
                            <RiskPill level={r.overrun.level} label={r.overrun.label} size="xs" />
                            <span className="f-rp-over__why">{r.overrun.reason}</span>
                          </span>
                        ) : <span className="f-meta">אין חריגה</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </LoadableView>
      </section>
      <p className="f-meta">כל סכום מוערך מסומן ב־≈. סכום ידוע מגיע מחשבונית שהופקה. לחיצה על ערך פותחת את מגירת המקור.</p>

      {drawer && detail && (
        <SourceDrawer key={drawer.title} open onClose={() => setDrawer(null)} title={drawer.title} reading={drawer.reading} unit={drawer.unit} total={drawer.total} detail={detail} requested={false} onRequest={() => {}} />
      )}

      <Dialog open={missingOpen} onClose={() => setMissingOpen(false)} variant="drawer" labelledBy={missingId} className="f-rp-drawer">
        <DrawerHead id={missingId} title="מה חסר כדי שהנתונים יהיו סופיים" onClose={() => setMissingOpen(false)} />
        <div className="f-rp-drawer__body">
          <ul className="f-rp-missing">
            {PROFIT.estimateNote.missing.map((m) => <li key={m}><span aria-hidden>≈</span> {m}</li>)}
          </ul>
          <p className="f-rp-note f-rp-note--est">{PROFIT.estimateNote.detail}</p>
        </div>
        <div className="f-rp-drawer__foot">
          <Link href={R.workTime} className="f-btn f-btn--primary">לדיווח שעות</Link>
          <Button variant="neutral" onClick={() => setMissingOpen(false)}>סגירה</Button>
        </div>
      </Dialog>
    </Page>
  );
}
