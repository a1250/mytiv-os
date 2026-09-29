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

export function approvalStateLabel(state: 'pending' | 'approved' | 'rejected' | 'expired'): string {
  return state === 'pending' ? 'ממתין להחלטה' : state === 'approved' ? 'אושר' : state === 'rejected' ? 'נדחה' : 'פג תוקף';
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
