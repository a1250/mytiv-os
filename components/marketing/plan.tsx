import type { WeeklyPriorities, WorkboardExport } from '@/lib/marketing/contract-rules/c5-c8';
import type { MonthlyPlan } from '@/lib/marketing/contract-rules/c9-c14';
import { completionLabel, confidenceLabel, evidenceStateLabel, isoWeekRange, metricValue, monthRange, taskStatusLabel, trackPosition } from '@/lib/marketing/view';

/**
 * M3 Plan, Workboard & Timeline (T-4.6 · MKT-F05 view, F07, F08; T-4.9 · MKT-F17, F18).
 * Monthly plan (C14) → weekly plan (C8) → workboard (C7). Every value comes from the imported artifacts:
 * status is the engine's, "done" is the engine's four-state completion, stale is shown apart from blocked,
 * a task without a due date is shown as "no date", and dependencies are rendered only if the artifact has
 * them — C7 carries none, so none are drawn (never inferred).
 */
export function PlanView({ monthly, weekly, board }: { monthly: MonthlyPlan | null; weekly: WeeklyPriorities | null; board: WorkboardExport | null }) {
  const range = monthly ? monthRange(monthly.month) : null;
  const week = weekly ? isoWeekRange(weekly.week) : null;
  const tasks = board?.tasks ?? [];
  return <div className="space-y-8">
    <section aria-labelledby="plan-monthly">
      <h2 id="plan-monthly" className="text-lg font-semibold">תוכנית חודשית</h2>
      {!monthly ? <p className="bg-card border-border mt-3 rounded-xl border p-5">טרם יובאה תוכנית חודשית.</p> : <>
        <p className="text-muted-foreground mt-1 text-xs">חודש {monthly.month} · מקור {monthly.sourceRevision} · תקציב {metricValue(monthly.budget_pool, 'KNOWN')} · קצב סקירה {monthly.review_cadence}</p>
        <ul className="mt-3 space-y-2">{monthly.objectives.map((o) => <li key={o.id} className="bg-card border-border rounded-lg border p-3">
          <p className="font-medium">{o.text}</p>
          <p className="text-muted-foreground mt-1 text-xs">{confidenceLabel(o.confidence)} · מקור: <span dir="ltr">{o.sourceRef}</span> · {o.asOf.slice(0, 10)}{o.owner ? ` · אחראי: ${o.owner}` : ''}
            {o.approvalRef && <> · הפניה לאישור (הפניה בלבד — אינה מאשרת דבר): <span dir="ltr">{o.approvalRef}</span></>}</p>
        </li>)}</ul>
        {(monthly.themes ?? []).length > 0 && <p className="mt-2 text-sm">נושאים: {(monthly.themes ?? []).join(' · ')}</p>}
      </>}
    </section>

    <section aria-labelledby="plan-weekly">
      <h2 id="plan-weekly" className="text-lg font-semibold">תוכנית שבועית</h2>
      {!weekly ? <p className="bg-card border-border mt-3 rounded-xl border p-5">טרם יובאה תוכנית שבועית.</p> :
        <p className="text-muted-foreground mt-1 text-xs">שבוע {weekly.week} · שייך לחודש <span dir="ltr">{weekly.parent}</span> · {weekly.points.length} עדיפויות{monthly && weekly.parent !== monthly.month ? ' · שים לב: אינו שייך לתוכנית החודשית המוצגת' : ''}</p>}
    </section>

    <section aria-labelledby="plan-board">
      <h2 id="plan-board" className="text-lg font-semibold">לוח העבודה</h2>
      {!board ? <p className="bg-card border-border mt-3 rounded-xl border p-5">טרם יובא לוח עבודה.</p> : <>
        <p className="text-muted-foreground mt-1 text-xs">נכון ל־{board.as_of.slice(0, 16).replace('T', ' ')} · מקור {board.sourceRevision} · הסטטוס והשלמה הם של המנוע</p>
        <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[720px] text-sm [&_th]:px-2 [&_td]:px-2"><thead><tr className="text-muted-foreground text-xs">
          <th className="text-start">משימה</th><th className="text-start">סטטוס</th><th className="text-start">אחראי</th><th className="text-start">יעד</th><th className="text-start">הגדרת סיום</th><th className="text-start">חסמים</th><th className="text-start">השלמה</th><th className="text-start">ראיה</th>
        </tr></thead><tbody>{tasks.map((t) => <tr key={t.task_id} data-task-id={t.task_id} className="border-border border-t align-top">
          <td className="py-2" dir="ltr">{t.task_id}</td>
          <td>{taskStatusLabel(t.status)}{t.stale && <span className="text-warning block text-xs">לא עודכן זמן רב (stale)</span>}</td>
          <td>{t.owner ?? 'ללא אחראי'}</td>
          <td>{t.due ? t.due.slice(0, 10) : 'אין תאריך'}</td>
          <td><ul className="text-xs">{t.dod.map((d) => <li key={d}>{d}</li>)}</ul></td>
          <td>{t.blockers.length ? <ul className="text-danger text-xs">{t.blockers.map((b) => <li key={b}>{b}</li>)}</ul> : <span className="text-muted-foreground text-xs">אין</span>}</td>
          <td>{completionLabel(t.completion)}</td>
          <td>{evidenceStateLabel(t.evidence_state)}</td>
        </tr>)}</tbody></table></div>
        <p className="text-muted-foreground mt-2 text-xs">חסומות: {tasks.filter((t) => t.blockers.length > 0).length} · לא עודכנו זמן רב: {tasks.filter((t) => t.stale).length}</p>
      </>}
    </section>

    <section aria-labelledby="plan-timeline">
      <h2 id="plan-timeline" className="text-lg font-semibold">ציר זמן</h2>
      {!range ? <p className="bg-card border-border mt-3 rounded-xl border p-5">ציר הזמן נבנה מהתוכנית החודשית — טרם יובאה.</p> : <div className="mt-3 space-y-2" dir="ltr">
        <div className="bg-muted relative h-6 rounded"><span className="absolute inset-y-0 left-2 text-xs leading-6">{monthly!.month}</span></div>
        {week && <div className="relative h-5"><div className="bg-foreground/30 absolute h-5 rounded" style={{ left: `${trackPosition(new Date(week[0]).toISOString(), range)}%`, width: `${Math.max(1, (trackPosition(new Date(week[1]).toISOString(), range) ?? 0) - (trackPosition(new Date(week[0]).toISOString(), range) ?? 0))}%` }} /><span className="relative text-xs">{weekly!.week}</span></div>}
        {tasks.map((t) => { const at = trackPosition(t.due, range); return <div key={t.task_id} data-timeline-task={t.task_id} className="grid grid-cols-[160px_1fr] items-center gap-2 text-xs">
          <span className="truncate">{t.task_id} · {taskStatusLabel(t.status)}{t.dod.length ? ' · DoD' : ''}{t.stale ? ' · stale' : ''}</span>
          <div className="bg-muted relative h-4 rounded">{at === null ? <span className="text-muted-foreground absolute inset-0 text-center leading-4" dir="rtl">אין תאריך</span>
            : <span className="bg-foreground absolute top-0 h-4 w-1.5 rounded" style={{ left: `${at}%` }} title={t.due ?? undefined} />}</div>
        </div>; })}
        <p className="text-muted-foreground text-xs" dir="rtl">תלויות אינן מוצגות: לוח העבודה המיובא (C7) אינו כולל תלויות, והן לעולם אינן מוסקות.</p>
      </div>}
    </section>
  </div>;
}
