'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const REFUSALS: Record<string, string> = {
  task_changed_since_action: 'המשימה השתנתה ב־ClickUp מאז הפעולה — לא שוחזר, כדי לא לדרוס עבודה חדשה.',
  already_rolled_back: 'הפעולה כבר שוחזרה.',
  target_missing: 'המשימה לא נמצאה ב־ClickUp (נמחקה או הועברה) — אין מה לשחזר.',
  outcome_unknown: 'תוצאת הכתיבה המקורית לא אומתה — שחזור אוטומטי נדחה. בדוק ב־ClickUp ידנית.',
  rollback_would_close_task_use_normal_flow: 'השחזור היה סוגר את המשימה. סגירה דורשת ראיה — השתמש בזרימה הרגילה.',
  nothing_to_restore: 'אין הבדל בין המצב שלפני לאחרי — אין מה לשחזר.',
  request_already_claimed_check_audit_before_retry: 'הבקשה הזו כבר נרשמה. בדוק את ההיסטוריה לפני ניסיון נוסף.',
  write_unverified_check_audit_before_retry: 'השחזור נשלח אך לא אומת. בדוק ב־ClickUp לפני ניסיון נוסף.',
};

/** Nothing optimistic: the page re-renders from the audit log after the server answers. */
export function RollbackButton({ businessSlug, projectId, actionId }: { businessSlug: string; projectId: string; actionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function rollback() {
    if (!window.confirm('לשחזר את המשימה למצב שלפני הפעולה? ClickUp יעודכן.')) return;
    setBusy(true); setMessage('');
    try {
      const res = await fetch(`/api/${businessSlug}/ops/actions/${actionId}/rollback`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, confirmed: true, requestId: crypto.randomUUID() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setMessage(REFUSALS[body.error] ?? `לא שוחזר: ${body.error ?? res.status}`); return; }
      setMessage('שוחזר. ClickUp עודכן למצב שלפני הפעולה.');
      router.refresh();
    } catch { setMessage('לא ניתן היה להגיע לשרת — בדוק את ההיסטוריה לפני ניסיון נוסף.'); }
    finally { setBusy(false); }
  }
  return <span className="inline-flex flex-wrap items-center gap-2">
    <button type="button" onClick={rollback} disabled={busy} className="border-border rounded border px-2 py-0.5 text-xs disabled:opacity-50">שחזר</button>
    {message && <span role="status" className="text-xs">{message}</span>}
  </span>;
}
