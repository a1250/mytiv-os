"use client";

import { useRef, type ReactNode } from "react";
import type { OutreachClaim } from "@/lib/focus/contracts/sales";
import { fmtWeekday } from "@/lib/focus/format";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { RISK } from "@/components/focus/ui/status";

/**
 * Outreach fact check (handoff F4): finds what in the draft needs checking — claims the sources do not back, and a
 * weekday that does not match its date (computed, not hard-coded) — marks them in the text (an overlay behind a real,
 * fully editable textarea) and offers fixes. Verified spans are marked too, with their source.
 */
export type Issue = {
  id: string;
  level: "medium" | "high";
  title: string;
  message: string;
  quote: string;
  fixes: { label: string; apply: (text: string) => string }[];
};

const DATE_RE = /יום (ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת),? (\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?/g;
const pad = (n: number) => String(n).padStart(2, "0");

/** A weekday name next to a date must be that date's weekday (Asia/Jerusalem calendar). */
export function dateIssues(text: string, now: string): Issue[] {
  const year = Number(now.slice(0, 4));
  const out: Issue[] = [];
  for (const m of text.matchAll(DATE_RE)) {
    const [quote, said, dd, mm, yyyy] = m;
    const d = Number(dd), mo = Number(mm), y = yyyy ? Number(yyyy) : year;
    if (mo < 1 || mo > 12 || d < 1 || d > 31) continue;
    const iso = `${y}-${pad(mo)}-${pad(d)}`;
    const actual = fmtWeekday(iso);
    if (actual === said) continue;
    // the nearest date (from today) that really falls on the weekday that was written
    const base = new Date(`${now.slice(0, 10)}T12:00:00+03:00`).getTime();
    let alt = "";
    for (let i = 0; i < 7; i++) {
      const cand = new Date(base + i * 86_400_000).toISOString().slice(0, 10);
      if (fmtWeekday(cand) === said) { alt = `${Number(cand.slice(8, 10))}.${Number(cand.slice(5, 7))}`; break; }
    }
    out.push({
      id: `date-${m.index}`, level: "high", quote, title: `"${quote}"`,
      message: `${d}.${mo}.${y} הוא יום ${actual}. לתקן ל"יום ${actual}" או לשנות תאריך?`,
      fixes: [
        { label: `תקן ל״יום ${actual}״`, apply: (t) => t.replace(quote, quote.replace(`יום ${said}`, `יום ${actual}`)) },
        ...(alt ? [{ label: `שנה ל־${alt}`, apply: (t: string) => t.replace(quote, `יום ${said}, ${alt}`) }] : []),
      ],
    });
  }
  return out;
}

export function claimIssues(text: string, claims: OutreachClaim[]): Issue[] {
  return claims.filter((c) => text.includes(c.quote)).map((c) => ({
    id: c.id, level: c.level, title: c.title, message: c.message, quote: c.quote,
    fixes: c.fixes.map((f) => ({ label: f.label, apply: (t: string) => (t.includes(f.find) ? t.replace(f.find, f.replace) : t.replace(c.quote, f.replace)) })),
  }));
}

type Span = { start: number; end: number; tone: "medium" | "high" | "verified" };

function segments(text: string, marks: { quote: string; tone: Span["tone"] }[]) {
  const spans: Span[] = [];
  for (const m of marks) {
    const i = text.indexOf(m.quote);
    if (i >= 0 && !spans.some((s) => i < s.end && i + m.quote.length > s.start)) spans.push({ start: i, end: i + m.quote.length, tone: m.tone });
  }
  spans.sort((a, b) => a.start - b.start);
  const out: ReactNode[] = [];
  let at = 0;
  spans.forEach((s, k) => {
    if (s.start > at) out.push(text.slice(at, s.start));
    out.push(<mark key={k} className={cx("f-sl-hl__mark", `f-sl-hl__mark--${s.tone}`)}>{text.slice(s.start, s.end)}</mark>);
    at = s.end;
  });
  out.push(text.slice(at));
  return out;
}

/** A real <textarea> with the marks drawn behind it (same font, padding and wrapping). */
export function HighlightEditor({ id, value, onChange, issues, verified, readOnly, describedBy }: {
  id: string; value: string; onChange: (v: string) => void; issues: Issue[]; verified: string[]; readOnly?: boolean; describedBy?: string;
}) {
  const back = useRef<HTMLDivElement>(null);
  const marks = [...issues.map((i) => ({ quote: i.quote, tone: i.level })), ...verified.map((q) => ({ quote: q, tone: "verified" as const }))];
  return (
    <div className={cx("f-sl-hl", readOnly && "f-sl-hl--busy")}>
      <div ref={back} className="f-sl-hl__back" aria-hidden>{segments(value, marks)}{"\n "}</div>
      <textarea id={id} className="f-sl-hl__input" value={value} readOnly={readOnly} aria-describedby={describedBy} spellCheck
        onChange={(e) => onChange(e.target.value)} onScroll={(e) => { if (back.current) back.current.scrollTop = e.currentTarget.scrollTop; }} />
    </div>
  );
}

export function FactCheckList({ issues, onFix }: { issues: Issue[]; onFix: (issue: Issue, apply: (t: string) => string, label: string) => void }) {
  return (
    <section className="f-sl-panel f-sl-side f-sl-facts" aria-labelledby="sl-facts-h">
      <h2 id="sl-facts-h" className="f-sl-panel__h f-sl-panel__h--sm">פרטים לבדיקה · {issues.length}</h2>
      {issues.length === 0 ? (
        <p className="f-sl-facts__ok" role="status"><span aria-hidden>✓</span> כל הפרטים בטיוטה נבדקו. אין טענות בלי מקור.</p>
      ) : (
        <ul className="f-sl-facts__list">
          {issues.map((i) => (
            <li key={i.id} className={cx("f-sl-fact", `f-sl-fact--${i.level}`)}>
              <b className="f-sl-fact__t"><span aria-hidden>{RISK[i.level].glyph}</span> <span className="f-sr">{i.level === "high" ? "שגוי:" : "לא אומת:"} </span>{i.title}</b>
              <span className="f-sl-fact__m">{i.message}</span>
              <span className="f-sl-fact__fixes">
                {i.fixes.map((f) => <Button key={f.label} variant="onaccent" size="sm" className="f-sl-fact__fix" onClick={() => onFix(i, f.apply, f.label)}>{f.label}</Button>)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
