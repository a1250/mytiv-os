import type { ReactNode } from "react";
import type { Reading } from "@/lib/focus/contracts/common";
import type { ApprovalStatus, ContentOrigin, RiskLevel, SystemStatus, Verification, WorkStatus } from "@/lib/focus/contracts/status";
import { formatNumber } from "@/lib/focus/format";
import { cx } from "./cx";

/**
 * Status language (handoff §5). Each family has its own shape and always renders symbol + word — colour is never
 * the only signal. Vocabulary lives here once; screens pass enum values, never glyphs.
 */
export const RISK: Record<RiskLevel, { glyph: string; word: string; long: string }> = {
  low: { glyph: "●", word: "נמוך", long: "סיכון נמוך" },
  medium: { glyph: "◆", word: "בינוני", long: "סיכון בינוני" },
  high: { glyph: "▲", word: "גבוה", long: "סיכון גבוה" },
  connection: { glyph: "!", word: "תקלה", long: "תקלה בחיבור" },
};
export const WORK: Record<WorkStatus, { glyph: string; word: string }> = {
  todo: { glyph: "○", word: "לא התחיל" },
  in_progress: { glyph: "◐", word: "בתהליך" },
  waiting: { glyph: "⏸", word: "ממתין" },
  blocked: { glyph: "■", word: "חסום" },
  done: { glyph: "✓", word: "הושלם" },
  cancelled: { glyph: "✕", word: "בוטל" },
  unknown: { glyph: "?", word: "לא ממופה" },
};
export const APPROVAL: Record<ApprovalStatus, { glyph: string; word: string }> = {
  draft: { glyph: "✎", word: "טיוטה" },
  pending: { glyph: "…", word: "ממתין לאישור" },
  approved: { glyph: "✓", word: "אושר" },
  changes_requested: { glyph: "↺", word: "נדרש תיקון" },
  rejected: { glyph: "✕", word: "נדחה" },
};
export const VERIFICATION: Record<Verification, { glyph: string; word: string }> = {
  verified: { glyph: "✓", word: "אומת" },
  partial: { glyph: "◑", word: "אומת חלקית" },
  unverified: { glyph: "○", word: "לא אומת" },
};
export const SYSTEM: Record<SystemStatus, { glyph: string; word: string }> = {
  loading: { glyph: "…", word: "בטעינה" },
  processing: { glyph: "⟳", word: "מעבד" },
  done: { glyph: "✓", word: "הושלם" },
  failed: { glyph: "!", word: "נכשל" },
  unavailable: { glyph: "⊘", word: "לא זמין" },
  partial: { glyph: "◑", word: "התקבל חלקית" },
  stale: { glyph: "⧗", word: "לא מעודכן" },
};
export const ORIGIN: Record<Exclude<ContentOrigin, "original">, string> = {
  ai_edited: "נערך בעזרת AI",
  ai_concept: "קונספט AI",
  ai_suggested: "הצעת AI",
};

type Size = "xs" | "sm" | "md" | "lg" | "xl";

/** Risk — filled pill, the symbol grows with the level. `label` overrides the word ("סיכון בינוני · דורש בדיקה"). */
export function RiskPill({ level, label, short, size = "sm", className }: { level: RiskLevel; label?: ReactNode; short?: boolean; size?: Size; className?: string }) {
  const r = RISK[level];
  return (
    <span className={cx("f-risk", `f-risk--${level}`, size !== "sm" && `f-risk--${size}`, className)}>
      <span aria-hidden>{r.glyph}</span>{label ?? (short ? r.word : r.long)}
    </span>
  );
}

/** Inline risk text for meta lines: "◆ בינוני" (no pill). */
export function riskText(level: RiskLevel, long = false) {
  return `${RISK[level].glyph} ${long ? RISK[level].long : RISK[level].word}`;
}

export function WorkStatusTag({ status, label, size = "sm", glyphOnly, className }: { status: WorkStatus; label?: string; size?: Size; glyphOnly?: boolean; className?: string }) {
  const w = WORK[status];
  return (
    <span className={cx("f-work", `f-work--${status}`, size === "xs" && "f-work--xs", className)} title={glyphOnly ? w.word : undefined}>
      <span aria-hidden>{w.glyph}</span>
      {glyphOnly ? <span className="f-sr">{w.word}</span> : (label ?? w.word)}
    </span>
  );
}

export function ApprovalPill({ status, label, size = "md", className }: { status: ApprovalStatus; label?: string; size?: Size; className?: string }) {
  const a = APPROVAL[status];
  return (
    <span className={cx("f-appr", `f-appr--${status}`, size === "sm" && "f-appr--sm", className)}>
      <span aria-hidden>{a.glyph}</span>{label ?? a.word}
    </span>
  );
}

export function VerificationTag({ state, label, className }: { state: Verification; label?: string; className?: string }) {
  const v = VERIFICATION[state];
  return <span className={cx("f-verif", `f-verif--${state}`, className)}><span aria-hidden>{v.glyph}</span>{label ?? v.word}</span>;
}

export function OriginTag({ origin, label, size = "md" }: { origin: ContentOrigin; label?: string; size?: Size }) {
  if (origin === "original") return null;
  return <span className={cx("f-origin", size === "sm" && "f-origin--sm")}><span aria-hidden>✦</span>{label ?? ORIGIN[origin]}</span>;
}

export function SystemLine({ status, children, className }: { status: SystemStatus; children: ReactNode; className?: string }) {
  return (
    <span className={cx("f-sysline", `f-sysline--${status}`, className)} role={status === "failed" ? "alert" : undefined}>
      <span aria-hidden className={status === "processing" ? "f-spin" : undefined}>{SYSTEM[status].glyph}</span>{children}
    </span>
  );
}

export function CountPill({ n, tone = "accent", label }: { n: number; tone?: "accent" | "risk"; label: string }) {
  return <span className={cx("f-count", tone === "risk" && "f-count--risk")} aria-label={`${label}: ${n}`}>{n}</span>;
}

/** Provider dot for a task source (thin, never the centre of the UI). */
export function SourceDot({ source }: { source: "mytiv" | "clickup" }) {
  return <span className={cx("f-source-dot", source === "mytiv" && "f-source-dot--mytiv")}>{source === "mytiv" ? "Mytiv" : "ClickUp"}</span>;
}

export function PlannedTag() {
  return <span className="f-planned" title="יכולת שעדיין אין לה backend — מוזנת מנתוני דוגמה">⧗ מתוכנן</span>;
}

/**
 * A number with its certainty mark: known → value, estimated → "≈ value", unknown/unavailable → "—" (never 0).
 */
export function ReadingValue({ reading, unit, total, className }: { reading: Reading; unit?: "count" | "ils" | "hours" | "percent" | "ratio"; total?: number; className?: string }) {
  if (reading.kind === "unknown" || reading.kind === "unavailable") {
    return <span className={cx("f-value--unavailable", className)} aria-label={reading.kind === "unknown" ? "לא ידוע" : "לא זמין"}>—</span>;
  }
  const v = formatReadingNumber(reading.value, unit, total);
  return (
    <span className={cx("f-num", className)}>
      {reading.kind === "estimated" && <><span aria-hidden>≈ </span><span className="f-sr">מוערך: </span></>}
      {v}
    </span>
  );
}

export function formatReadingNumber(value: number, unit?: string, total?: number) {
  if (unit === "ils") return `${formatNumber(value)} ₪`;
  if (unit === "percent") return `${formatNumber(value)}%`;
  if (unit === "ratio" && total != null) return `${formatNumber(value)}/${formatNumber(total)}`;
  return formatNumber(value);
}
