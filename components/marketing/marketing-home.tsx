import type { KpiSnapshot, WeeklyPriorities } from '@/lib/marketing/contract-rules/c5-c8';
import type { IngestManifest } from '@/lib/marketing/contract-rules/c9-c14';
import { confidenceLabel, freshnessLabel, ingestedAt, metricValue, UNKNOWN_VALUE } from '@/lib/marketing/view';

/**
 * M1 Marketing Home (T-4.4 · MKT-F01, F02, RPT01): this week's priorities (C8), approvals waiting (C2a),
 * data freshness per source (C9) and KPI tiles (C5) with their confidence. Every block renders only the
 * imported artifact; a missing artifact is said out loud ("not imported"), never replaced by sample data,
 * and an unknown value is "—", never 0.
 */
export function MarketingHome({ weekly, freshness, kpis, approvalsWaiting }: {
  weekly: WeeklyPriorities | null; freshness: IngestManifest | null; kpis: KpiSnapshot | null; approvalsWaiting: number | null;
}) {
  return <div className="space-y-8">
    <section aria-labelledby="mkt-weekly">
      <h2 id="mkt-weekly" className="text-lg font-semibold">העדיפויות השבוע</h2>
      {!weekly ? <p className="bg-card border-border mt-3 rounded-xl border p-5">טרם יובאו עדיפויות שבועיות. לא מוצגים נתוני דוגמה.</p> : <>
        <p className="text-muted-foreground mt-1 text-xs">שבוע {weekly.week} · מעודכן ל־{weekly.as_of.slice(0, 16).replace('T', ' ')} · מקור {weekly.sourceRevision}</p>
        {weekly.points.length === 0 ? <p className="mt-3">אין עדיפויות לשבוע הזה.</p> :
          <ol className="mt-3 space-y-2">{weekly.points.map((p) => <li key={p.id} className="bg-card border-border rounded-lg border p-3">
            <p className="font-medium">{p.text}</p>
            <p className="text-muted-foreground mt-1 text-sm">למה: {p.why}</p>
            <p className="text-muted-foreground mt-1 text-xs">{confidenceLabel(p.confidence)} · מקור: <span dir="ltr">{p.sourceRef}</span> · {p.asOf.slice(0, 10)}</p>
          </li>)}</ol>}
      </>}
    </section>

    <section aria-labelledby="mkt-approvals" className="bg-card border-border rounded-xl border p-4">
      <h2 id="mkt-approvals" className="text-sm font-semibold">אישורים ממתינים</h2>
      <p className="mt-1 text-2xl font-bold tabular-nums">{approvalsWaiting ?? UNKNOWN_VALUE}</p>
      {approvalsWaiting === null && <p className="text-muted-foreground text-xs">תור האישורים טרם יובא — המספר אינו ידוע.</p>}
    </section>

    <section aria-labelledby="mkt-freshness">
      <h2 id="mkt-freshness" className="text-lg font-semibold">עדכניות הנתונים לפי מקור</h2>
      {!freshness ? <p className="bg-card border-border mt-3 rounded-xl border p-5">לא יובא מניפסט קליטה — מצב כל המקורות לא ידוע.</p> :
        <table className="mt-3 w-full text-sm"><thead><tr className="text-muted-foreground text-xs"><th className="text-start">מקור</th><th className="text-start">מצב</th><th className="text-start">נקלט לאחרונה</th><th className="text-start">שורות</th></tr></thead>
          <tbody>{freshness.sources.map((s) => <tr key={s.source} className="border-border border-t">
            <td className="py-2" dir="ltr">{s.source}</td><td>{freshnessLabel(s.status)}</td><td>{ingestedAt(s.as_of)}</td>
            <td className="tabular-nums">{s.status === 'UNKNOWN' ? UNKNOWN_VALUE : s.rows}</td>
          </tr>)}</tbody></table>}
    </section>

    <section aria-labelledby="mkt-kpis">
      <h2 id="mkt-kpis" className="text-lg font-semibold">מדדים</h2>
      {!kpis ? <p className="bg-card border-border mt-3 rounded-xl border p-5">לא יובאה תמונת מדדים. אין להסיק שהמדדים אפס.</p> : <>
        <p className="text-muted-foreground mt-1 text-xs">נכון ל־{kpis.as_of.slice(0, 10)}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{kpis.kpis.map((k) => <div key={k.kpi} className="bg-card border-border rounded-xl border px-4 py-3">
          <div className="text-2xl font-bold tabular-nums">{metricValue(k.value, k.confidence)}</div>
          <div className="mt-0.5 text-xs" dir="ltr">{k.kpi}</div>
          <div className="text-muted-foreground mt-1 text-[11px]">{confidenceLabel(k.confidence)} · {k.tier} · <span dir="ltr">{k.source}</span></div>
        </div>)}</div>
      </>}
    </section>
  </div>;
}
