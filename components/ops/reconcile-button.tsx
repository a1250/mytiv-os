'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';

const REFUSALS: Record<string, string> = {
  no_open_reconciliation: 'אין פריט יישוב פתוח לפעולה הזו.',
  readback_unsupported: 'אין קריאה חוזרת אוטומטית ליעד הזה — יש לבדוק ידנית.',
  readback_unavailable_try_again: 'הקריאה החוזרת מ־ClickUp נכשלה. לא נרשם דבר; נסה שוב.',
};

/** Resolve an open reconciliation item (MKT-GOV06) by recording a FRESH readback — never a write to ClickUp. */
export function ReconcileButton({ businessSlug, projectId, actionId }: { businessSlug: string; projectId: string; actionId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  async function reconcile() {
    if (!window.confirm('לקרוא עכשיו את מצב המשימה ב־ClickUp ולרשום אותו? הפעולה אינה משנה דבר ב־ClickUp; לאחריה אפשר לכתוב שוב למשימה.')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/${businessSlug}/ops/actions/${actionId}/reconcile`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, confirmed: true, requestId: crypto.randomUUID() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast({ message: REFUSALS[body.error] ?? `לא נרשם: ${body.error ?? res.status}`, tone: 'error' }); return; }
      toast({ message: 'המצב העדכני נרשם. הפריט נסגר.', tone: 'ok' });
      router.refresh();
    } catch { toast({ message: 'לא ניתן היה להגיע לשרת. לא נרשם דבר.', tone: 'error' }); }
    finally { setBusy(false); }
  }
  return <button type="button" onClick={reconcile} disabled={busy} className="border-warning/50 rounded border px-2 py-0.5 text-xs disabled:opacity-50">יישוב (קריאה חוזרת)</button>;
}
