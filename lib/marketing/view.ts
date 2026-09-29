// Pure view helpers for the marketing screens (E4). No data access, no React — unit-testable.
// Vocabulary is the canonical one (MKT-DAT04): confidence KNOWN/ESTIMATED/UNKNOWN, freshness
// FRESH/STALE/UNKNOWN. Unknown is rendered as "—" (or "never ingested"), never as 0 / "0 days".
import type { Confidence } from './contract-rules/c5-c8';
import type { ApprovalQueueExport } from './contract-rules/c2-c3';

export const UNKNOWN_VALUE = '—';

export function confidenceLabel(c: Confidence): string {
  return c === 'KNOWN' ? 'ידוע' : c === 'ESTIMATED' ? 'משוער' : 'לא ידוע';
}

/** A KPI / measured value: a number only when KNOWN or ESTIMATED; UNKNOWN (null) is "—", never 0. */
export function metricValue(value: number | null, confidence: Confidence): string {
  if (confidence === 'UNKNOWN' || value === null || !Number.isFinite(value)) return UNKNOWN_VALUE;
  return new Intl.NumberFormat('he-IL', { maximumFractionDigits: 2 }).format(value);
}

export function freshnessLabel(status: 'FRESH' | 'STALE' | 'UNKNOWN'): string {
  return status === 'FRESH' ? 'עדכני' : status === 'STALE' ? 'לא עדכני' : 'לא ידוע';
}

/** When a source was last ingested: a date, or "never ingested" — never "0 days". */
export function ingestedAt(asOf: string | null): string {
  return asOf ? asOf.slice(0, 10) : 'לא נקלט מעולם';
}

/** Approvals waiting for a decision in the imported queue; null when no queue was imported (unknown). */
export function approvalsWaiting(queue: ApprovalQueueExport | null): number | null {
  return queue ? queue.items.filter((i) => i.state === 'pending').length : null;
}

export const MARKETING_VIEWS = [
  { id: 'home', label: 'בית' },
  { id: 'approvals', label: 'אישורים' },
  { id: 'plan', label: 'תוכנית ולוח עבודה' },
  { id: 'campaigns', label: 'קמפיינים ותוכן' },
  { id: 'brain', label: 'מוח העסק' },
  { id: 'leads', label: 'לידים ולקוחות' },
  { id: 'reports', label: 'דוחות' },
  { id: 'integrations', label: 'אינטגרציות' },
  { id: 'skills', label: 'מעבדת מיומנויות' },
] as const;
export type MarketingView = (typeof MARKETING_VIEWS)[number]['id'];
export function marketingView(v: unknown): MarketingView {
  return MARKETING_VIEWS.some((x) => x.id === v) ? (v as MarketingView) : 'home';
}

export function approvalStateLabel(state: 'pending' | 'approved' | 'rejected' | 'expired' | 'applied'): string {
  return state === 'pending' ? 'ממתין להחלטה' : state === 'approved' ? 'אושר' : state === 'rejected' ? 'נדחה' : state === 'applied' ? 'אושר ובוצע במנוע' : 'פג תוקף';
}
export function actionClassLabel(c: 'GREEN' | 'YELLOW' | 'RED'): string {
  return c === 'RED' ? 'RED · דורש אישור מפורש, לעולם לא אוטומטי' : c === 'YELLOW' ? 'YELLOW · דורש אישור' : 'GREEN';
}
export function qaVerdictLabel(v: 'PASS' | 'BLOCKED' | 'NOT_RUN'): string {
  return v === 'PASS' ? 'עבר QA' : v === 'BLOCKED' ? 'נחסם ב־QA' : 'QA לא הורץ';
}

/** What the engine's next export said about an app record (reconciled_state); null = no export seen yet. */
export function reconciledLabel(state: string | null): string {
  switch (state) {
    case 'awaiting': return 'ממתין להחלה במנוע';
    case 'applied': return 'הוחל במנוע';
    case 'stale': return 'התוכן השתנה — הרשומה אינה תקפה עוד';
    case 'conflict': return 'סתירה מול המנוע';
    case 'expired': return 'פג תוקף';
    case 'missing': return 'הפריט אינו מופיע עוד ביצוא';
    case 'unreviewed': return 'המנוע סימן כלא נבדק';
    case 'resolved': return 'נסגר במנוע';
    default: return 'טרם התקבל יצוא מהמנוע';
  }
}

/**
 * Per-file Brain status (MKT-F09) derived from C3a: STALE / missing / invalid from `files`; otherwise
 * VERIFIED (every recorded field owner- or source-verified), PARTIAL (some), UNVERIFIED (none, or no field
 * recorded). EXPIRED is not representable in the canonical C3a contract.
 */
export type BrainFileStatus = 'VERIFIED' | 'PARTIAL' | 'UNVERIFIED' | 'STALE' | 'MISSING' | 'INVALID';
export function brainFileStatus(file: string, fileState: 'ok' | 'missing' | 'invalid' | 'stale',
  verification: Record<string, { owner_verified: boolean; source_verified?: boolean }>): BrainFileStatus {
  if (fileState === 'stale') return 'STALE';
  if (fileState === 'missing') return 'MISSING';
  if (fileState === 'invalid') return 'INVALID';
  const fields = Object.entries(verification).filter(([key]) => key.startsWith(`${file}#`));
  const verified = fields.filter(([, v]) => v.owner_verified || v.source_verified === true).length;
  return fields.length > 0 && verified === fields.length ? 'VERIFIED' : verified > 0 ? 'PARTIAL' : 'UNVERIFIED';
}
export function brainStatusLabel(s: BrainFileStatus): string {
  return { VERIFIED: 'מאומת', PARTIAL: 'מאומת חלקית', UNVERIFIED: 'לא מאומת — אין להשתמש בו לתוכן ייצור', STALE: 'לא עדכני', MISSING: 'חסר', INVALID: 'לא תקין' }[s];
}

/** Attribution tier (MKT-RPT02): the C5 tier reflects provenance — T1 first-party (HIGH), T2 platform data
 *  reconciled to a first-party total (MEDIUM), T3 platform-only / modelled (LOW, narrative only). */
export function tierLabel(tier: 'T1' | 'T2' | 'T3'): string {
  return tier === 'T1' ? 'HIGH · מערכת העסק' : tier === 'T2' ? 'MEDIUM · פלטפורמה מתואמת' : 'LOW · פלטפורמה בלבד';
}
/** "Not verified" (mandatory report section): every KPI that is not first-party verified — UNKNOWN or
 *  tier ≠ T1 — exactly as the engine's KPI snapshot defines it (marketing-os core/lib/kpi-snapshot.ts). */
export function notVerifiedKpis<K extends { kpi: string; confidence: string; tier: string }>(kpis: K[]): K[] {
  return kpis.filter((k) => k.confidence === 'UNKNOWN' || k.tier !== 'T1');
}
/** A rate in [0,1] as a percentage. */
export function percent(rate: number): string {
  return `${new Intl.NumberFormat('he-IL', { maximumFractionDigits: 1 }).format(rate * 100)}%`;
}

const TASK_STATUS: Record<string, string> = {
  requested: 'התבקש', accepted: 'התקבל', in_progress: 'בעבודה', needs_asset: 'חסר נכס', needs_data: 'חסרים נתונים', qa_pending: 'ממתין ל־QA',
  qa_blocked: 'נחסם ב־QA', approval_pending: 'ממתין לאישור', approved: 'אושר', rejected: 'נדחה', scheduled: 'מתוזמן', published: 'פורסם',
  measured: 'נמדד', learned: 'הופקו לקחים', cancelled: 'בוטל',
};
/** The canonical workboard status (C7 TaskStatus) in Hebrew; an unknown value is shown as-is, never guessed. */
export function taskStatusLabel(status: string): string { return TASK_STATUS[status] ?? status; }
/** The engine's four-state completion (MKT-F08) — the business truth of "done", not a board column. */
export function completionLabel(c: 'status_changed' | 'evidence_submitted' | 'evidence_reviewed' | 'outcome_verified'): string {
  return { status_changed: 'רק שינוי סטטוס — ללא ראיה', evidence_submitted: 'ראיה הוגשה', evidence_reviewed: 'ראיה נבדקה', outcome_verified: 'תוצאה אומתה' }[c];
}
export function evidenceStateLabel(e: 'none' | 'awaiting' | 'applied' | 'stale' | 'conflict' | 'unreviewed'): string {
  return { none: 'אין ראיה', awaiting: 'ממתין להחלה במנוע', applied: 'הוחל במנוע', stale: 'הראיה אינה תואמת עוד', conflict: 'סתירה', unreviewed: 'הוגש ללא אישור בדיקה' }[e];
}

/** [start, end) of a `YYYY-MM` month id, in epoch ms (UTC). */
export function monthRange(month: string): [number, number] | null {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
  if (!m) return null;
  const y = +m[1], mo = +m[2] - 1;
  return [Date.UTC(y, mo, 1), Date.UTC(y, mo + 1, 1)];
}
/** [start, end) of an ISO week id `YYYY-Www` (Monday start), or null when the id is not an ISO week. */
export function isoWeekRange(week: string): [number, number] | null {
  const m = /^(\d{4})-W(0[1-9]|[1-4]\d|5[0-3])$/.exec(week);
  if (!m) return null;
  const y = +m[1], w = +m[2];
  const jan4 = Date.UTC(y, 0, 4);
  const dow = (new Date(jan4).getUTCDay() + 6) % 7; // 0 = Monday
  const start = jan4 - dow * 86400000 + (w - 1) * 7 * 86400000;
  return [start, start + 7 * 86400000];
}
/** Position (0–100%) of an instant on a [start, end) track, clamped; null when it has no date. */
export function trackPosition(at: string | null, range: [number, number]): number | null {
  if (!at) return null;
  const t = Date.parse(at.length === 10 ? `${at}T12:00:00Z` : at);
  if (!Number.isFinite(t)) return null;
  return Math.min(100, Math.max(0, ((t - range[0]) / (range[1] - range[0])) * 100));
}

/** C16 action type for an approval's action type — mirrors the engine's RECEIPT_ACTION_FOR
 *  (marketing-os core/lib/apply-receipts.ts); any other action has no execution receipt. */
export function receiptActionFor(actionType: string): 'campaign_activation' | 'message_batch' | null {
  return actionType === 'campaign_activate' ? 'campaign_activation'
    : actionType === 'message_marketing' || actionType === 'message_service_optin' ? 'message_batch' : null;
}
/** A publication approval that C6 evidence can resolve (MKT-F19) — exactly the engine's set
 *  (marketing-os core/lib/publish-approval.ts: publish_organic_new / publish_organic_recurring; job_ad_publish
 *  has no Manual Publish Pack, so the engine cannot resolve it through C6). The engine re-checks, including
 *  that the approval belongs to the same task (C2a does not export the task link). */
export function isPublishAction(actionType: string): boolean {
  return actionType === 'publish_organic_recurring' || actionType === 'publish_organic_new';
}
/** Creative provenance label (MKT-F13): an AI concept is never presented as real. */
export function provenanceLabel(p: 'real' | 'ai_enhanced' | 'ai_concept'): string {
  return p === 'real' ? 'REAL · צילום/נכס אמיתי' : p === 'ai_enhanced' ? 'AI_ENHANCED · אמיתי ששופר ב־AI' : 'AI_CONCEPT · קונספט AI — אינו אמיתי';
}
