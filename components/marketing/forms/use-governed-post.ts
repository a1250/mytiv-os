'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/** Hebrew message for a refusal code from the marketing record routes. */
export function recordError(code: string): string {
  if (code === 'review_attestation_required') return 'יש לאשר במפורש שהראיה נבדקה.';
  if (code === 'invalid_dod_criteria') return 'יש לסמן את כל תנאי הסיום של המשימה.';
  if (code === 'task_not_published') return 'אפשר לרשום תוצאה רק למשימה שפורסמה.';
  if (code === 'approval_not_approved') return 'האישור המקושר אינו במצב "אושר".';
  if (code === 'stale_content_hash' || code.includes('linkage')) return 'הפריט השתנה מאז שנטען. יש לרענן ולבדוק שוב.';
  if (code.includes('binding_version')) return 'חיבור הפרויקט השתנה. יש לרענן את הדף.';
  if (code.includes('role')) return 'רק בעלים או מנהלים יכולים לרשום.';
  if (code.startsWith('contract_rule_violation') || code.startsWith('contract_structure_invalid') || code.startsWith('invalid_')) return 'חלק מהשדות אינם תקינים (קישור https או נתיב יחסי בלבד, תאריך מלא, שדות חובה).';
  if (code === 'already_recorded' || code.includes('request_already_claimed')) return 'כבר נרשם. יש לבדוק את היסטוריית האישורים לפני ניסיון נוסף.';
  return 'לא ניתן לרשום כרגע. יש לבדוק את היסטוריית האישורים לפני ניסיון נוסף.';
}

/**
 * The governed write pattern of every marketing form: validate locally → explicit confirmation step (fresh
 * request id) → POST with the binding version the human saw → refresh. The server re-checks everything.
 */
export function useGovernedPost(endpoint: string, bindingVersion: number) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const requestId = useRef('');
  function ask(problem?: string | null) {
    if (problem) { setMessage(problem); return; }
    requestId.current = crypto.randomUUID(); setMessage(''); setConfirming(true);
  }
  async function submit(body: Record<string, unknown>, done: string) {
    setBusy(true);
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, confirmed: true, requestId: requestId.current, bindingVersion }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'record_failed');
      setConfirming(false); setMessage(done); router.refresh();
    } catch (e) { setMessage(recordError(e instanceof Error ? e.message : '')); setConfirming(false); }
    finally { setBusy(false); }
  }
  return { confirming, setConfirming, busy, message, ask, submit };
}
