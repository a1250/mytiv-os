'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/** What the owner editor shows: the current binding row (incl. a revoked one), none, or unavailable. */
export type BindingEditorState = { marketingBusiness: string; bindingVersion: number; revoked: boolean } | null | 'unavailable';

const SLUG = /^[a-z0-9][a-z0-9-]*$/;

function bindingError(code: string): string {
  if (code.includes('owner')) return 'רק בעלי העסק יכולים לחבר או לנתק את הפרויקט.';
  if (code === 'binding_unchanged') return 'הפרויקט כבר מחובר לעסק הזה. אין שינוי לרשום.';
  if (code === 'binding_not_bound') return 'אין חיבור פעיל לביטול.';
  if (code === 'invalid_marketing_business') return 'מזהה העסק חייב להיות באותיות לועזיות קטנות, ספרות ומקפים.';
  if (code.includes('request_already_claimed')) return 'הבקשה כבר נרשמה. יש לבדוק את היסטוריית האישורים לפני ניסיון נוסף.';
  return 'לא ניתן לעדכן את החיבור כרגע. יש לבדוק את היסטוריית האישורים לפני ניסיון נוסף.';
}

/**
 * Owner-only editor of the project's marketing-os tenant binding (T-2.2, owner decision D2). Bind,
 * rebind (opens a new binding version) or revoke ("not connected"). Each change needs an explicit
 * confirmation and is recorded as an audited action.
 */
export function MarketingBindingEditor({ businessSlug, projectId, state }: { businessSlug: string; projectId: string; state: BindingEditorState }) {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [pending, setPending] = useState<null | { action: 'bind' } | { action: 'revoke' }>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const requestId = useRef(crypto.randomUUID());
  const active = state && state !== 'unavailable' && !state.revoked ? state : null;

  function ask(action: 'bind' | 'revoke') {
    if (action === 'bind' && !SLUG.test(slug)) { setMessage(bindingError('invalid_marketing_business')); return; }
    requestId.current = crypto.randomUUID();
    setMessage(''); setPending({ action });
  }
  async function confirm() {
    if (!pending) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/${businessSlug}/ops/projects/${projectId}/marketing/binding`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true, requestId: requestId.current, action: pending.action, ...(pending.action === 'bind' ? { marketingBusiness: slug } : {}) }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'binding_failed');
      setMessage(pending.action === 'bind' ? `הפרויקט חובר לעסק ${slug} (גרסת חיבור ${result.bindingVersion}).` : 'החיבור בוטל. הפרויקט אינו מחובר.');
      setPending(null); setSlug(''); router.refresh();
    } catch (e) { setMessage(bindingError(e instanceof Error ? e.message : '')); setPending(null); }
    finally { setBusy(false); }
  }

  return <details className="border-border rounded-xl border p-4" dir="rtl">
    <summary className="cursor-pointer font-medium">חיבור ל־Marketing OS (בעלים בלבד)</summary>
    <p className="my-3 text-sm" role="status">
      {state === 'unavailable' ? 'מצב החיבור אינו זמין כרגע. אין להסיק שהפרויקט אינו מחובר.'
        : active ? `מחובר לעסק ${active.marketingBusiness} · גרסת חיבור ${active.bindingVersion}`
        : state?.revoked ? `החיבור בוטל (גרסה ${state.bindingVersion}). הפרויקט אינו מחובר.`
        : 'הפרויקט אינו מחובר לעסק ב־Marketing OS.'}
    </p>
    {state !== 'unavailable' && <div className="space-y-3">
      <label htmlFor="marketing-tenant" className="block text-sm">מזהה העסק ב־Marketing OS</label>
      <input id="marketing-tenant" dir="ltr" value={slug} onChange={e => { setSlug(e.target.value.trim()); setPending(null); }} placeholder="umino"
        className="bg-muted w-full max-w-xs rounded border p-2 font-mono text-sm" />
      <div className="flex flex-wrap gap-2">
        <button onClick={() => ask('bind')} disabled={busy || !slug} className="bg-muted rounded px-4 py-2 text-sm disabled:opacity-40">{active ? 'חיבור מחדש (גרסה חדשה)' : 'חיבור'}</button>
        {active && <button onClick={() => ask('revoke')} disabled={busy} className="bg-muted rounded px-4 py-2 text-sm disabled:opacity-40">ביטול החיבור</button>}
      </div>
    </div>}
    {pending && <div className="bg-card border-border mt-4 space-y-3 rounded-lg border p-3">
      <p className="text-sm">{pending.action === 'bind'
        ? `לאשר חיבור של הפרויקט לעסק ${slug}? ${active ? 'נפתחת גרסת חיבור חדשה; ארטיפקטים מגרסה קודמת יסומנו כחיבור קודם.' : ''} הפעולה נרשמת ביומן.`
        : 'לבטל את החיבור? הפרויקט יוצג כלא מחובר והפעולה נרשמת ביומן.'}</p>
      <div className="flex gap-2">
        <button onClick={confirm} disabled={busy} className="bg-foreground text-background rounded px-4 py-2 text-sm">{busy ? 'מעדכן…' : 'אישור'}</button>
        <button onClick={() => setPending(null)} disabled={busy} className="bg-muted rounded px-4 py-2 text-sm">ביטול</button>
      </div>
    </div>}
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
  </details>;
}
