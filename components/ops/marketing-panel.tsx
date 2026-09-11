'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { parseMarketingPlan, type MarketingPlan } from '@/lib/marketing/contract';
import type { OpsTask } from '@/lib/clickup';

function importError(error: unknown): string {
  const code = error instanceof Error ? error.message : '';
  if (code.includes('scope') || code.includes('version')) return 'התוכנית אינה מתאימה לעסק המקושר או שגרסת הקובץ אינה נתמכת.';
  if (code.includes('revision')) return 'גרסת התוכנית כבר קיימת או ישנה מהגרסה שנקלטה.';
  if (code.includes('dependency')) return 'יש לתקן את התלויות ואת סדר התאריכים בתוכנית.';
  if (code.includes('priority')) return 'כל פריט בתוכנית חייב להיות מקושר לעדיפות עסקית קיימת.';
  if (code.includes('unauthorized') || code.includes('role')) return 'נדרשת התחברות כבעלים או כמנהל כדי לייבא תוכנית.';
  if (code.includes('unavailable')) return 'הייבוא אינו זמין כרגע. יש לבדוק את היסטוריית האישורים לפני ניסיון נוסף.';
  return 'לא ניתן לקרוא את התוכנית. יש לבדוק את מבנה הקובץ, התאריכים וההפניות למקורות.';
}
const day = (date: string) => Date.parse(`${date}T00:00:00Z`) / 86400000;
export function MarketingPanel({ businessSlug, projectId, binding, plan, tasks, canImport, unavailable, now }: {
  businessSlug: string; projectId: string; binding: string | null; plan: MarketingPlan | null; tasks: OpsTask[]; canImport: boolean; unavailable: boolean; now: string;
}) {
  const router = useRouter();
  const [raw, setRaw] = useState('');
  const [candidate, setCandidate] = useState<MarketingPlan | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const requestId = useRef(crypto.randomUUID());
  const today = now.slice(0, 10);
  const from = plan?.items.length ? Math.min(...plan.items.map(i => day(i.start))) : 0;
  const to = plan?.items.length ? Math.max(...plan.items.map(i => day(i.end))) : 1;
  const span = Math.max(1, to - from + 1);
  const stale = plan && Date.parse(now) - Date.parse(plan.asOf) > 7 * 86400000;
  function preview() {
    try { requestId.current = crypto.randomUUID(); setCandidate(parseMarketingPlan(JSON.parse(raw), binding!)); setMessage(''); }
    catch (e) { setCandidate(null); setMessage(importError(e)); }
  }
  async function importPlan() {
    if (!candidate) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/${businessSlug}/ops/projects/${projectId}/marketing`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true, requestId: requestId.current, plan: candidate }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Import failed');
      setCandidate(null); setRaw(''); setMessage('התוכנית נקלטה'); router.refresh();
    } catch (e) { setMessage(importError(e)); }
    finally { setBusy(false); }
  }
  return <section dir="rtl" className="space-y-6">
    <header className="border-border border-b pb-4">
      <p className="text-muted-foreground text-xs">תכנון · ביצוע · למידה</p>
      <h2 className="mt-1 text-xl font-semibold">מה מקדמים ולמה</h2>
      <p className="text-muted-foreground mt-2 text-sm">התוכנית מ־Marketing OS. מצב הביצוע מ־ClickUp. אישור משימה אינו אישור תקציב או פרסום.</p>
    </header>
    {unavailable && <p role="alert" className="text-warning">נתוני השיווק אינם זמינים כרגע. אין להסיק שאין תוכנית.</p>}
    {!binding && <p className="bg-card border-border rounded-xl border p-6">הפרויקט עדיין לא חובר לעסק ב־Marketing OS.</p>}
    {binding && !plan && !unavailable && <p className="bg-card border-border rounded-xl border p-6">טרם יובאה תוכנית שיווק לפרויקט. לא מוצגים נתוני דוגמה.</p>}
    {plan && <>
      <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
        <span>גרסה {plan.revision}</span><span>מעודכן ל־{plan.asOf}</span><span>מקור: {plan.sourceRevision}</span>
        {stale && <strong className="text-warning">המידע בן יותר משבוע — נדרשת רעננות</strong>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {plan.priorities.map(p => <article key={p.id} className="bg-card border-border rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">{p.confidence === 'verified_gap' ? 'פער מאומת לפי המקור' : p.confidence === 'owner_priority' ? 'עדיפות בעלים לפי המקור' : 'טרם אומת'}</p>
          <h3 className="mt-2 font-semibold">{p.title}</h3><p className="text-muted-foreground mt-2 break-words text-xs">מקור: {p.evidenceRef}</p>
        </article>)}
      </div>
      <section className="border-border overflow-hidden rounded-xl border">
        <h3 className="bg-muted px-4 py-3 font-semibold">לוח התוכנית</h3>
        <div className="overflow-x-auto"><div className="min-w-[600px] p-4" dir="ltr">
          {plan.items.map(i => {
            const task = tasks.find(t => t.id === i.clickupTaskId);
            const priority = plan.priorities.find(p => p.id === i.priorityId);
            return <article key={i.id} className="border-border grid grid-cols-[210px_1fr] gap-4 border-b py-4 last:border-0">
              <div dir="rtl"><h4 className="font-medium">{i.title}</h4><p className="text-muted-foreground text-xs">{i.kind} · {priority?.title}</p>
                <p className="mt-2 text-xs">{task ? <a href={task.url} target="_blank" rel="noreferrer" className="underline">{task.status} · {task.assignee?.name || 'ללא אחראי'}</a> : i.clickupTaskId ? 'מצב הביצוע לא זמין ברשימה הנוכחית' : 'טרם קושרה משימת ביצוע'}</p>
              </div>
              <div><p className="text-muted-foreground mb-2 text-xs">{i.start} → {i.end}</p>
                <div className="bg-muted relative h-6 rounded"><div className="bg-foreground/70 absolute h-6 rounded" style={{ left: `${(day(i.start) - from) / span * 100}%`, width: `${Math.max(0.5, (day(i.end) - day(i.start) + 1) / span * 100)}%` }} /></div>
                <p className="text-muted-foreground mt-2 break-words text-xs">Source: {i.sourceRef}{i.dependsOn.length ? ` · Depends on: ${i.dependsOn.join(', ')}` : ''}</p>
                <p className="text-muted-foreground text-xs">Approval reference: {i.approvalRef || 'not provided'} (reference only)</p>
              </div>
            </article>;
          })}
          {!plan.items.length && <p dir="rtl">אין פריטים מתוזמנים בתוכנית המיובאת.</p>}
        </div></div>
      </section>
      <section><h3 className="mb-3 font-semibold">קצב הבקרה</h3><ul className="space-y-2">
        {plan.reviews.map(r => <li key={r.id} className="bg-card border-border flex flex-wrap justify-between gap-2 rounded-lg border p-3">
          <span>{r.title} · {r.cadence === 'weekly' ? 'שבועי' : 'חודשי'}</span><span className={r.due < today ? 'text-warning' : 'text-muted-foreground'}>{r.due}{r.due < today ? ' · מועד הסקירה חלף' : ''}</span>
          <span className="text-muted-foreground w-full text-xs">מקור: {r.sourceRef}</span>
        </li>)}
      </ul></section>
    </>}
    {binding && canImport && <details className="border-border rounded-xl border p-4"><summary className="cursor-pointer font-medium">ייבוא תוכנית מ־Marketing OS</summary>
      <p className="text-muted-foreground my-3 text-sm">ייבוא עותק לתצוגה בלבד. התוכנית אינה יוצרת משימות ואינה מאשרת הוצאה או פרסום.</p>
      <label htmlFor="marketing-json" className="text-sm">קובץ התוכנית בפורמט JSON</label>
      <textarea id="marketing-json" dir="ltr" value={raw} onChange={e => { setRaw(e.target.value); setCandidate(null); }} className="bg-muted mt-2 w-full rounded border p-3 font-mono text-xs" rows={6} />
      <button onClick={preview} disabled={busy || !raw} className="bg-muted rounded px-4 py-2 text-sm disabled:opacity-40">בדיקת התוכנית</button>
      {candidate && <div className="mt-4 space-y-3"><p>גרסה {candidate.revision} · {candidate.priorities.length} עדיפויות · {candidate.items.length} פריטים · {candidate.reviews.length} סקירות</p>
        <ul className="text-sm">{candidate.items.map(i => <li key={i.id}>{i.title} · {i.start}–{i.end}</li>)}</ul>
        <button onClick={importPlan} disabled={busy} className="bg-foreground text-background rounded px-4 py-2">{busy ? 'מייבא…' : 'אישור ייבוא התוכנית'}</button>
      </div>}
    </details>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </section>;
}
