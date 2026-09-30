import type { EventsPipelineAggregate, CustomerConsentAggregate } from '@/lib/marketing/contract-rules/c4-c13';
import { percent } from '@/lib/marketing/view';

const STAGE_LABEL: Record<string, string> = { lead: 'ליד', qualified: 'מתאים', quoted: 'הצעת מחיר', closed_won: 'נסגר בהצלחה', closed_lost: 'לא נסגר' };

/**
 * M6 Leads & CRM (T-6.3 · MKT-F14, F15): read-only AGGREGATES from C4 (events pipeline) and C13 (consent /
 * segments). There is no per-lead or per-contact field anywhere in these contracts, so no PII can be shown;
 * each block shows its source as_of, and a missing export is said out loud.
 */
export function LeadsView({ pipeline, consent }: { pipeline: EventsPipelineAggregate | null; consent: CustomerConsentAggregate | null }) {
  return <div className="space-y-8">
    <section aria-labelledby="mkt-pipeline">
      <h2 id="mkt-pipeline" className="text-lg font-semibold">משפך האירועים</h2>
      {!pipeline ? <p className="bg-card border-border mt-3 rounded-xl border p-5">טרם יובא יצוא משפך האירועים. אין נתונים — ולא אפס.</p> : <>
        <p className="text-muted-foreground mt-1 text-xs">נכון ל־{pipeline.as_of.slice(0, 16).replace('T', ' ')} · מקור {pipeline.sourceRevision} · נתונים מצרפיים בלבד</p>
        <table className="mt-3 w-full text-sm [&_th]:px-2 [&_td]:px-2"><thead><tr className="text-muted-foreground text-xs"><th className="text-start">שלב</th><th className="text-start">כמות</th></tr></thead>
          <tbody>{pipeline.stages.map((s) => <tr key={s.stage} className="border-border border-t"><td className="py-2">{STAGE_LABEL[s.stage] ?? s.stage}</td><td className="tabular-nums">{s.count}</td></tr>)}</tbody></table>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="bg-card border-border rounded-xl border px-4 py-3"><div className="text-xl font-bold tabular-nums">{percent(pipeline.quote_rate)}</div><div className="text-muted-foreground text-xs">שיעור הצעות מחיר</div></div>
          <div className="bg-card border-border rounded-xl border px-4 py-3"><div className="text-xl font-bold tabular-nums">{percent(pipeline.close_rate)}</div><div className="text-muted-foreground text-xs">שיעור סגירה</div></div>
          <div className="bg-card border-border rounded-xl border px-4 py-3"><div className="text-xl font-bold tabular-nums">{pipeline.sla_breaches}</div><div className="text-muted-foreground text-xs">חריגות זמן תגובה ללידים</div></div>
        </div>
      </>}
    </section>
    <section aria-labelledby="mkt-consent">
      <h2 id="mkt-consent" className="text-lg font-semibold">לקוחות והסכמות</h2>
      {!consent ? <p className="bg-card border-border mt-3 rounded-xl border p-5">טרם יובא יצוא הסכמות הלקוחות. אין נתונים — ולא אפס.</p> : <>
        <p className="text-muted-foreground mt-1 text-xs">נכון ל־{consent.as_of.slice(0, 16).replace('T', ' ')} · מקור {consent.sourceRevision} · ספירות בלבד, ללא פרטי קשר</p>
        <ul className="mt-3 space-y-1 text-sm">{consent.channels.map((c) => <li key={c.channel}><span dir="ltr">{c.channel}</span>: {c.opted_in} מסכימים לקבל פניות</li>)}</ul>
        {(consent.segments ?? []).length > 0 && <><h3 className="mt-4 text-sm font-semibold">פלחים</h3>
          <ul className="mt-2 space-y-1 text-sm">{(consent.segments ?? []).map((s) => <li key={s.segment}>{s.segment}: {s.size}</li>)}</ul></>}
      </>}
    </section>
  </div>;
}
