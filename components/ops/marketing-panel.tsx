'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { type MarketingPlan } from '@/lib/marketing/contract';
import { timelineBars } from '@/lib/marketing/timeline';
import type { OpsTask } from '@/lib/clickup';
import { MarketingBindingEditor, type BindingEditorState } from './marketing-binding-editor';

function importError(error: unknown): string {
  const code = error instanceof Error ? error.message : '';
  if (code.includes('scope') || code.includes('version')) return 'התוכנית אינה מתאימה לעסק המקושר או שגרסת הקובץ אינה נתמכת.';
  if (code.includes('binding_version')) return 'חיבור הפרויקט ל־Marketing OS השתנה מאז שהתוכנית נבדקה. יש לרענן את הדף ולבדוק שוב.';
  if (code.includes('revision')) return 'גרסת התוכנית כבר קיימת או ישנה מהגרסה שנקלטה.';
  if (code.includes('dependency')) return 'יש לתקן את התלויות ואת סדר התאריכים בתוכנית.';
  if (code.includes('priority')) return 'כל פריט בתוכנית חייב להיות מקושר לעדיפות עסקית קיימת.';
  if (code.includes('unauthorized') || code.includes('role')) return 'נדרשת התחברות כבעלים או כמנהל כדי לייבא תוכנית.';
  if (code.includes('unavailable')) return 'הייבוא אינו זמין כרגע. יש לבדוק את היסטוריית האישורים לפני ניסיון נוסף.';
  return 'לא ניתן לקרוא את התוכנית. יש לבדוק את מבנה הקובץ, התאריכים וההפניות למקורות.';
}
export function MarketingPanel({ businessSlug, projectId, binding, plan, tasks, canImport, unavailable, now, bindingEditor, bindingVersion, previousPlans, moduleEnabled }: {
  businessSlug: string; projectId: string; binding: string | null; plan: MarketingPlan | null; tasks: OpsTask[]; canImport: boolean; unavailable: boolean; now: string;
  /** Present only for owners (T-2.2): the binding editor's view of the current binding row. */
  bindingEditor?: BindingEditorState;
  /** The active binding version the import is confirmed against (T-2.3); null when not connected. */
  bindingVersion: number | null;
  /** Plans imported under earlier binding versions — history only, never the current plan. */
  previousPlans: { bindingVersion: number; revision: number; importedAt: string }[];
  /** The marketing module (E4 screens) is enabled — link to it when the project is connected. */
  moduleEnabled: boolean;
}) {
  const router = useRouter();
  const [raw, setRaw] = useState('');
  const [candidate, setCandidate] = useState<MarketingPlan | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const requestId = useRef(crypto.randomUUID());
  const previewSeq = useRef(0); // guards the async (dynamic-import) preview against stale textarea content
  const nowMs = Date.parse(now);
  const bars = timelineBars(plan?.items ?? []);
  const stale = plan && Date.parse(now) - Date.parse(plan.asOf) > 7 * 86400000;
  async function preview() {
    // Composed validator (ajv structural + parser) is loaded on demand so the ajv runtime
    // stays out of the main client chunk; structural-first, parser-second order is preserved.
    // The seq guard drops the result if the textarea changed while the import was in flight,
    // so an in-flight preview can never restore a candidate for stale content.
    const seq = ++previewSeq.current;
    const snapshot = raw;
    try {
      const { validateMarketingPlan } = await import('@/lib/marketing/validate');
      if (seq !== previewSeq.current) return;
      const parsed = validateMarketingPlan(JSON.parse(snapshot), binding!);
      if (seq !== previewSeq.current) return;
      requestId.current = crypto.randomUUID();
      setCandidate(parsed); setMessage('');
    } catch (e) { if (seq === previewSeq.current) { setCandidate(null); setMessage(importError(e)); } }
  }
  async function importPlan() {
    if (!candidate) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/${businessSlug}/ops/projects/${projectId}/marketing`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true, requestId: requestId.current, bindingVersion, plan: candidate }),
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
    {binding && moduleEnabled && <a href={`/${businessSlug}/ops/projects/${projectId}/marketing`} className="bg-muted inline-block rounded px-4 py-2 text-sm">למודול השיווק: בית, אישורים, מוח העסק ודוחות</a>}
    {bindingEditor !== undefined && <MarketingBindingEditor businessSlug={businessSlug} projectId={projectId} state={bindingEditor} />}
    {binding && !plan && !unavailable && <p className="bg-card border-border rounded-xl border p-6">טרם יובאה תוכנית שיווק לפרויקט. לא מוצגים נתוני דוגמה.</p>}
    {plan && <>
      <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
        <span>גרסה {plan.revision}</span><span>מעודכן ל־{plan.asOf}</span><span>מקור: {plan.sourceRevision}</span>
        {stale && <strong className="text-warning">המידע בן יותר משבוע — נדרשת רעננות</strong>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {plan.priorities.map(p => <article key={p.id} className="bg-card border-border rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">{p.confidence === 'KNOWN' ? 'ידוע' : p.confidence === 'ESTIMATED' ? 'משוער' : 'לא ידוע'} · {p.provenance === 'source_verified' ? 'מאומת מול המקור' : p.provenance === 'owner_verified' ? 'אומת ע״י הבעלים' : 'נמסר ע״י הבעלים'}</p>
          <h3 className="mt-2 font-semibold">{p.title}</h3><p className="text-muted-foreground mt-2 break-words text-xs">מקור: {p.evidenceRef}</p>
        </article>)}
      </div>
      <section className="border-border overflow-hidden rounded-xl border">
        <h3 className="bg-muted px-4 py-3 font-semibold">לוח התוכנית</h3>
        <div className="overflow-x-auto"><div className="min-w-[600px] p-4" dir="ltr">
          {plan.items.map(i => {
            const task = tasks.find(t => t.id === i.clickupTaskId);
            const priority = plan.priorities.find(p => p.id === i.priorityId);
            const b = bars.bar(i);
            return <article key={i.id} className="border-border grid grid-cols-[210px_1fr] gap-4 border-b py-4 last:border-0">
              <div dir="rtl"><h4 className="font-medium">{i.title}</h4><p className="text-muted-foreground text-xs">{i.kind} · {priority?.title}</p>
                <p className="mt-2 text-xs">{task ? <a href={task.url} target="_blank" rel="noreferrer" className="underline">{task.status} · {task.assignee?.name || 'ללא אחראי'}</a> : i.clickupTaskId ? 'מצב הביצוע לא זמין ברשימה הנוכחית' : 'טרם קושרה משימת ביצוע'}</p>
              </div>
              <div><p className="text-muted-foreground mb-2 text-xs">{i.start.slice(0, 10)} → {i.end.slice(0, 10)}</p>
                <div className="bg-muted relative h-6 rounded"><div className="bg-foreground/70 absolute h-6 rounded" style={{ left: `${b.left}%`, width: `${b.width}%` }} /></div>
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
          <span>{r.title} · {r.cadence === 'weekly' ? 'שבועי' : r.cadence === 'monthly' ? 'חודשי' : r.cadence}</span><span className={Date.parse(r.due) < nowMs ? 'text-warning' : 'text-muted-foreground'}>{r.due.slice(0, 10)}{Date.parse(r.due) < nowMs ? ' · מועד הסקירה חלף' : ''}</span>
          <span className="text-muted-foreground w-full text-xs">מקור: {r.sourceRef}</span>
        </li>)}
      </ul></section>
    </>}
    {binding && canImport && <details className="border-border rounded-xl border p-4"><summary className="cursor-pointer font-medium">ייבוא תוכנית מ־Marketing OS</summary>
      <p className="text-muted-foreground my-3 text-sm">ייבוא עותק לתצוגה בלבד. התוכנית אינה יוצרת משימות ואינה מאשרת הוצאה או פרסום.</p>
      <label htmlFor="marketing-json" className="text-sm">קובץ התוכנית בפורמט JSON</label>
      <textarea id="marketing-json" dir="ltr" value={raw} onChange={e => { previewSeq.current++; setRaw(e.target.value); setCandidate(null); }} className="bg-muted mt-2 w-full rounded border p-3 font-mono text-xs" rows={6} />
      <button onClick={preview} disabled={busy || !raw} className="bg-muted rounded px-4 py-2 text-sm disabled:opacity-40">בדיקת התוכנית</button>
      {candidate && <div className="mt-4 space-y-3"><p>גרסה {candidate.revision} · {candidate.priorities.length} עדיפויות · {candidate.items.length} פריטים · {candidate.reviews.length} סקירות</p>
        <ul className="text-sm">{candidate.items.map(i => <li key={i.id}>{i.title} · {i.start.slice(0, 10)}–{i.end.slice(0, 10)}</li>)}</ul>
        <button onClick={importPlan} disabled={busy} className="bg-foreground text-background rounded px-4 py-2">{busy ? 'מייבא…' : 'אישור ייבוא התוכנית'}</button>
      </div>}
    </details>}
    {previousPlans.length > 0 && <section className="border-border rounded-xl border p-4"><h3 className="mb-2 text-sm font-semibold">תוכניות מחיבור קודם</h3>
      <p className="text-muted-foreground mb-2 text-xs">נקלטו תחת גרסת חיבור קודמת. להיסטוריה בלבד — אינן התוכנית הנוכחית.</p>
      <ul className="text-muted-foreground space-y-1 text-xs">{previousPlans.map(p => <li key={`${p.bindingVersion}-${p.revision}`}>גרסת חיבור {p.bindingVersion} · גרסת תוכנית {p.revision} · נקלטה {p.importedAt.slice(0, 10)}</li>)}</ul>
    </section>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </section>;
}
