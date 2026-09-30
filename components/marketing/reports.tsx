import type { KpiSnapshot } from '@/lib/marketing/contract-rules/c5-c8';
import type { MonthlyPlan } from '@/lib/marketing/contract-rules/c9-c14';
import { confidenceLabel, metricValue, notVerifiedKpis, tierLabel, UNKNOWN_VALUE } from '@/lib/marketing/view';

/**
 * M7 Reports (T-10.2 · MKT-RPT02, RPT03). Weekly performance = the latest C5 KPI snapshot with every KPI's
 * attribution tier; the monthly (MBR) data section = the C14 monthly plan's KPI targets against the C5
 * actuals — UNKNOWN where no evidence. The "not verified" section is mandatory: it is always rendered, and
 * lists every KPI that is not first-party verified (UNKNOWN or tier ≠ T1). Platform values are already
 * capped at first-party totals by the engine; the app only labels them.
 */
export function ReportsView({ kpis, monthly }: { kpis: KpiSnapshot | null; monthly: MonthlyPlan | null }) {
  const unverified = kpis ? notVerifiedKpis(kpis.kpis) : [];
  return <div className="space-y-8">
    <section aria-labelledby="rpt-weekly">
      <h2 id="rpt-weekly" className="text-lg font-semibold">דוח ביצועים שבועי</h2>
      {!kpis ? <p className="bg-card border-border mt-3 rounded-xl border p-5">לא יובאה תמונת מדדים. אין דוח — ולא אפסים.</p> : <>
        <p className="text-muted-foreground mt-1 text-xs">נכון ל־{kpis.as_of.slice(0, 10)} · מקור {kpis.sourceRevision}</p>
        <table className="mt-3 w-full text-sm [&_th]:px-2 [&_td]:px-2"><thead><tr className="text-muted-foreground text-xs"><th className="text-start">מדד</th><th className="text-start">ערך</th><th className="text-start">רמת ייחוס</th><th className="text-start">ודאות</th><th className="text-start">מקור</th></tr></thead>
          <tbody>{kpis.kpis.map((k) => <tr key={k.kpi} className="border-border border-t">
            <td className="py-2" dir="ltr">{k.kpi}</td><td className="tabular-nums">{metricValue(k.value, k.confidence)}</td>
            <td>{tierLabel(k.tier)}</td><td>{confidenceLabel(k.confidence)}</td><td dir="ltr">{k.source}</td>
          </tr>)}</tbody></table>
        <p className="text-muted-foreground mt-2 text-xs">נתוני פלטפורמות מוגבלים לסך שנמדד במערכת העסק כשהוא ידוע; שייכות מפלטפורמה בלבד היא סיפור, לא מדידה.</p>
      </>}
    </section>
    <section aria-labelledby="rpt-not-verified" className="border-warning/40 rounded-xl border p-4">
      <h2 id="rpt-not-verified" className="font-semibold">לא מאומת</h2>
      {!kpis ? <p className="mt-2 text-sm">לא ניתן לאמת דבר: לא יובאה תמונת מדדים.</p>
        : unverified.length === 0 ? <p className="mt-2 text-sm">כל המדדים בתמונה הזו אומתו מול מערכת העסק (T1).</p>
        : <ul className="mt-2 space-y-1 text-sm">{unverified.map((k) => <li key={k.kpi}><span dir="ltr">{k.kpi}</span> · {k.confidence === 'UNKNOWN' ? 'לא ידוע' : tierLabel(k.tier)}</li>)}</ul>}
    </section>
    <section aria-labelledby="rpt-mbr">
      <h2 id="rpt-mbr" className="text-lg font-semibold">סקירה עסקית חודשית — יעד מול ביצוע</h2>
      {!monthly ? <p className="bg-card border-border mt-3 rounded-xl border p-5">טרם יובאה תוכנית חודשית. אין יעדים להשוואה.</p> : <>
        <p className="text-muted-foreground mt-1 text-xs">חודש {monthly.month} · מקור {monthly.sourceRevision}</p>
        {(monthly.kpi_targets ?? []).length === 0 ? <p className="mt-3 text-sm">בתוכנית החודשית אין יעדי מדדים.</p> :
          <table className="mt-3 w-full text-sm [&_th]:px-2 [&_td]:px-2"><thead><tr className="text-muted-foreground text-xs"><th className="text-start">מדד</th><th className="text-start">יעד</th><th className="text-start">ביצוע</th></tr></thead>
            <tbody>{(monthly.kpi_targets ?? []).map((t) => {
              const actual = kpis?.kpis.find((k) => k.kpi.trim() === t.kpi.trim());
              return <tr key={t.kpi} className="border-border border-t"><td className="py-2" dir="ltr">{t.kpi}</td>
                <td className="tabular-nums">{metricValue(t.target, t.confidence)} <span className="text-muted-foreground text-xs">({confidenceLabel(t.confidence)})</span></td>
                <td className="tabular-nums">{actual ? metricValue(actual.value, actual.confidence) : UNKNOWN_VALUE}{actual && actual.tier !== 'T1' ? <span className="text-muted-foreground text-xs"> ({tierLabel(actual.tier)})</span> : null}</td></tr>;
            })}</tbody></table>}
      </>}
    </section>
  </div>;
}
