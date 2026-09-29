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
