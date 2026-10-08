"use client";

import Link, { useFocusRouter } from "@/components/focus/ui/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import type { Reading } from "@/lib/focus/contracts/common";
import type { Health, Move, MoveState, PriorityPlan, PriorityStatus } from "@/lib/focus/contracts/plan";
import { fmtMoney, formatNumber } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { unscopedPath } from "@/lib/focus/scope";
import type { Coverage } from "@/lib/focus/state/plan";
import { useFocusScope } from "@/components/focus/shell/scope";
import { Menu, MenuLink } from "@/components/focus/shell/menu";
import { cx } from "@/components/focus/ui/cx";

/**
 * Plan building blocks (Plan design package): the Plan frame (title, period, plan state, the five view tabs, the
 * "השבוע" filter), state words (lifecycle + overlays — never colour only), goal and coverage lines, money and the
 * "unknown" pattern. Every view of the Plan is built from these, so the same records read the same everywhere.
 */

/* ---------- words ---------- */

export const MOVE_STATE: Record<MoveState, { word: string; hint: string }> = {
  idea: { word: "רעיון", hint: "עוד לא בתוכנית" },
  planned: { word: "מתוכנן", hint: "קיים בתוכנית, שום דבר לא נבנה" },
  building: { word: "בבנייה", hint: "מישהו בונה את זה" },
  ready_for_review: { word: "מוכן לבדיקה", hint: "ההצעה שלמה; אישורים לפי מדיניות הלקוח" },
  approved: { word: "אושר", hint: "אושר, מחכה להשקה ידנית" },
  live: { word: "פעיל", hint: "כבר רץ" },
  paused: { word: "מושהה", hint: "נעצר, אפשר לחדש" },
  ended: { word: "הסתיים", hint: "תוצאות ולקחים נשמרו" },
};

export const PRIORITY_STATUS: Record<PriorityStatus, { word: string; glyph: string }> = {
  on_track: { word: "בדרך ליעד", glyph: "●" },
  at_risk: { word: "בסיכון", glyph: "●" },
  off_track: { word: "לא בדרך", glyph: "▲" },
  unknown: { word: "לא ידוע", glyph: "○" },
};

export const HEALTH: Record<Health, string> = { good: "תקין", attention: "דורש תשומת לב", unknown: "לא ידוע" };

/** Lifecycle state: a dot + the word (the dot is never the only signal). `chip` = the pill form used in headers. */
export function MoveStateTag({ state, chip, className }: { state: MoveState; chip?: boolean; className?: string }) {
  const s = MOVE_STATE[state];
  return (
    <span className={cx(chip ? "f-pl-chip" : "f-pl-state", `f-pl-state--${state}`, className)} title={s.hint}>
      {!chip && <span className="f-pl-dot" aria-hidden />}{s.word}
    </span>
  );
}

/** Needs attention — an overlay on a move (LIVE + needs attention), never a lifecycle state. */
export function AttentionTag({ reason, short }: { reason: string; short?: boolean }) {
  return <span className="f-pl-overlay f-pl-overlay--attention" title={reason}><span aria-hidden>▲</span>דורש תשומת לב{!short && <span className="f-sr">: {reason}</span>}</span>;
}

/** Optimization in progress — activity detail on a live move, not a state. */
export function OptimizingTag({ text }: { text: string }) {
  return <span className="f-pl-overlay f-pl-overlay--opt" title={text}><span aria-hidden>⟳</span>שינוי בביצוע</span>;
}

export function HealthChip({ health, state }: { health: Health; state: MoveState }) {
  if (state === "planned" || state === "idea") return <span className="f-pl-faint">—</span>;
  const word = health === "unknown" && state !== "live" ? "לא ידוע · לא פעיל" : HEALTH[health];
  return <span className={cx("f-pl-chip", `f-pl-chip--health-${health}`)}>{word}</span>;
}

export function PriorityStatusChip({ status, size }: { status: PriorityStatus; size?: "sm" }) {
  const s = PRIORITY_STATUS[status];
  return <span className={cx("f-pl-chip", `f-pl-chip--${status}`, size === "sm" && "f-pl-chip--sm")}><span aria-hidden>{s.glyph} </span>{s.word}</span>;
}

/* ---------- numbers ---------- */

/** Numbers, money, URLs and platform names are isolated LTR inside Hebrew lines. */
export function Num({ children, strong, className }: { children: ReactNode; strong?: boolean; className?: string }) {
  return <bdi dir="ltr" className={cx("f-mono", "f-pl-num", strong && "f-pl-num--strong", className)}>{children}</bdi>;
}
export const Money = ({ v, strong }: { v: number; strong?: boolean }) => <Num strong={strong}>{fmtMoney(v)}</Num>;

/** "לא ידוע" — never 0, always a word (and a dashed bar where a bar would be). */
export function Unknown({ children = "לא ידוע", strong }: { children?: ReactNode; strong?: boolean }) {
  return strong ? <b className="f-pl-unknown">{children}</b> : <span className="f-pl-unknown">{children}</span>;
}

export const goalAmount = (pp: PriorityPlan, n: number) => (pp.goal.unit === "ils" ? fmtMoney(n) : formatNumber(n));
export const goalShort = (pp: PriorityPlan, n: number) => (pp.goal.unit === "ils" ? `₪${formatNumber(Math.round(n / 1000))}K` : formatNumber(n));

export function readingWord(r: Reading) {
  if (r.kind === "known") return "ידוע";
  if (r.kind === "estimated") return "הערכה";
  return "לא ידוע";
}

/** A reading with its certainty: known → value, estimated → value + "הערכה", unknown → "לא ידוע" (never 0). */
export function ReadingText({ r, pp }: { r: Reading | null; pp: PriorityPlan }) {
  if (!r || r.kind === "unknown" || r.kind === "unavailable") return <Unknown />;
  return <><Num>{goalAmount(pp, r.value)}</Num>{r.kind === "estimated" && <span className="f-pl-est"> הערכה</span>}</>;
}

/** Goal progress: "11 מתוך 40 לידים מוסמכים" with a bar that fills from the right; unknown = dashed bar. */
export function GoalLine({ pp, compact }: { pp: PriorityPlan; compact?: boolean }) {
  const a = pp.goal.actual;
  const known = a.kind === "known" || a.kind === "estimated";
  const value = known ? (a as { value: number }).value : 0;
  const pct = known ? Math.min(100, (value / pp.goal.target) * 100) : 0;
  return (
    <div className="f-pl-goal">
      {!compact && <span className="f-pl-label">יעד</span>}
      <span className="f-pl-goal__text">
        {known ? <b><Num>{goalAmount(pp, value)}</Num></b> : <b>לא ידוע</b>} מתוך <b><Num>{goalAmount(pp, pp.goal.target)}</Num></b> {pp.goal.unit === "ils" ? pp.goal.metricLabel : pp.goal.metricLabel}
        {a.kind === "estimated" && <span className="f-pl-est"> · הערכה</span>}
      </span>
      {known
        ? <span className="f-pl-bar" role="meter" aria-label={`התקדמות ליעד ${pp.goal.metricLabel}`} aria-valuemin={0} aria-valuemax={pp.goal.target} aria-valuenow={value}><span className="f-pl-bar__fill" style={{ width: `${pct}%` }} /></span>
        : <span className="f-pl-bar f-pl-bar--unknown" aria-hidden />}
    </div>
  );
}

const SEG_TONE: Partial<Record<MoveState, string>> = { live: "live", building: "build", ready_for_review: "build", approved: "build" };

/**
 * Planned coverage: a stacked bar of each move's expected contribution, a gap drawn as an outlined segment, and the
 * words. Planned coverage is never presented as the result — "בפועל" (actual) stays a separate line.
 */
export function CoverageBar({ pp, moves, cov, labels, showActual = true }: { pp: PriorityPlan; moves: Move[]; cov: Coverage; labels?: boolean; showActual?: boolean }) {
  const counted = moves.filter((m) => m.state !== "idea" && m.state !== "ended");
  return (
    <div className="f-pl-cov">
      <span className={cx("f-pl-cov__bar", labels && "f-pl-cov__bar--labels")} aria-hidden>
        {counted.map((m) => (
          <span key={m.id} className={cx("f-pl-cov__seg", `f-pl-cov__seg--${SEG_TONE[m.state] ?? "plan"}`, m.type === "organic_series" && "f-pl-cov__seg--soft")} style={{ flexGrow: m.expected }}>
            {labels && <span>{m.channelLabel === "Instagram" && m.type === "organic_series" ? "אורגני" : m.channelLabel} {goalShort(pp, m.expected)}</span>}
          </span>
        ))}
        {cov.gap > 0 && <span className="f-pl-cov__seg f-pl-cov__seg--gap" style={{ flexGrow: cov.gap }}>{labels && <span>{goalShort(pp, cov.gap)}</span>}</span>}
      </span>
      <span className="f-pl-cov__text">
        כיסוי מתוכנן: <b><Num>{goalShort(pp, cov.planned)} / {goalShort(pp, cov.target)}</Num></b> {pp.goal.unit === "ils" ? "" : pp.goal.metricLabel.split(" ")[0]}
        {cov.gap > 0 && <> · <b className="f-pl-gap">חסרות <Num>{goalShort(pp, cov.gap)}</Num></b></>}
        {showActual && <span className="f-pl-cov__actual"> · בפועל: <ReadingText r={cov.actual} pp={pp} /></span>}
      </span>
    </div>
  );
}

/* ---------- the Plan frame ---------- */

export type PlanView = "overview" | "timeline" | "moves" | "assets" | "budget";

const VIEWS: { key: PlanView; label: string; mobile?: string; href: string }[] = [
  { key: "overview", label: "מה מקדמים", href: R.plan },
  { key: "timeline", label: "ציר זמן", href: R.planTimeline },
  { key: "moves", label: "מפת המהלכים", mobile: "מהלכים", href: R.planMoves },
  { key: "assets", label: "נכסים", href: R.planAssets },
  { key: "budget", label: "תקציב", href: R.planBudget },
];

export const PERIODS = [{ month: "2026-10", label: "אוקטובר 2026", title: "תוכנית אוקטובר" }, { month: "2026-11", label: "נובמבר 2026", title: "תוכנית נובמבר" }] as const;

/** The selected period (V1: calendar months only; November is the next period's draft) and the "השבוע" filter. */
export function usePlanParams() {
  const sp = useSearchParams();
  const period = PERIODS.find((p) => p.month === sp.get("period")) ?? PERIODS[0];
  const week = sp.get("week") === "1";
  return { period, week, sp };
}

function withParams(href: string, sp: URLSearchParams, patch: Record<string, string | null>) {
  const q = new URLSearchParams();
  for (const k of ["period", "week"]) { const v = sp.get(k); if (v) q.set(k, v); }
  for (const [k, v] of Object.entries(patch)) { if (v == null) q.delete(k); else q.set(k, v); }
  const s = q.toString();
  return s ? `${href}?${s}` : href;
}

export function PlanFrame({ view, controls, children, stateChip = true }: { view: PlanView; controls?: ReactNode; children: ReactNode; stateChip?: boolean }) {
  const { period, week, sp } = usePlanParams();
  const router = useFocusRouter();
  const path = unscopedPath(useFocusScope().base, usePathname());
  const current = VIEWS.find((v) => v.key === view)!;
  const draft = period.month !== "2026-10";
  return (
    <div className="f-pl">
      <header className="f-pl-head">
        <div className="f-pl-head__row">
          <h1 className="f-pl-head__title">{period.title}</h1>
          <Menu label="תקופת התוכנית" buttonLabel={`תקופה: ${period.label}`} align="start" buttonClassName="f-pl-period f-hit" buttonContent={<>{period.label} <span aria-hidden>▾</span></>}>
            {(close) => PERIODS.map((p) => (
              <MenuLink key={p.month} href={withParams(current.href, sp, { period: p.month === "2026-10" ? null : p.month })} onSelect={close} current={p.month === period.month}>
                {p.label}{p.month !== "2026-10" && " · טיוטה"}
              </MenuLink>
            ))}
          </Menu>
          {stateChip && (draft ? <span className="f-pl-chip f-pl-chip--draft">טיוטה</span> : <span className="f-pl-chip f-pl-chip--on_track">בביצוע</span>)}
          <span className="f-pl-head__spacer" />
          {controls}
          {!draft && (
            <div className="f-pl-toggle" role="group" aria-label="טווח התצוגה">
              <button type="button" className="f-pl-toggle__item f-hit" aria-pressed={!week} onClick={() => router.replace(withParams(path, sp, { week: null }))}>כל החודש</button>
              <button type="button" className="f-pl-toggle__item f-hit" aria-pressed={week} onClick={() => router.replace(withParams(path, sp, { week: "1" }))}>השבוע</button>
            </div>
          )}
        </div>
        <nav className="f-pl-tabs" aria-label="תצוגות התוכנית">
          {VIEWS.map((v) => (
            <Link key={v.key} href={withParams(v.href, sp, {})} className="f-pl-tabs__item f-hit" aria-label={v.label} aria-current={v.key === view ? "page" : undefined}>
              <span className="f-pl-tabs__full">{v.label}</span><span className="f-pl-tabs__short" aria-hidden>{v.mobile ?? v.label}</span>
            </Link>
          ))}
        </nav>
      </header>
      <div className={cx("f-pl-body", `f-pl-body--${view}`)}>{children}</div>
    </div>
  );
}

/** "השבוע" banner — the filter is on; what this week means. */
export function WeekNote({ children }: { children: ReactNode }) {
  return <p className="f-pl-weeknote" role="status"><b>השבוע · 4–10.10</b> · {children}</p>;
}

/** A small annotation shown where the prototype simulates something a real integration will do. */
export function DemoNote({ children }: { children: ReactNode }) {
  return <span className="f-pl-demo"><span aria-hidden>⧗ </span>{children}</span>;
}
