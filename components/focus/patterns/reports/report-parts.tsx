"use client";

import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import type { Reading } from "@/lib/focus/contracts/common";
import type { ChartBar, SourceDetail } from "@/lib/focus/contracts/reports";
import type { SystemStatus, Verification } from "@/lib/focus/contracts/status";
import { daysBetween, fmtDate, fmtDayMonth, fmtTime, formatNumber } from "@/lib/focus/format";
import { Button, IconButton } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { Dialog } from "@/components/focus/ui/dialog";
import { PlannedTag, ReadingValue, SYSTEM, SystemLine, VERIFICATION, VerificationTag } from "@/components/focus/ui/status";

/**
 * Reports & control building blocks (handoff G1–G6): certainty words, status tags, key/value lists, the source drawer
 * ("מגירת מקור הנתון"), an accessible bar chart (always with a table + summary sentence) and planned actions.
 */

type Unit = "count" | "ils" | "hours" | "percent" | "ratio";

/** "היום 08:08" · "אתמול 17:52" · "28.9 16:40" — when something happened, relative to the demo clock. */
export function fmtWhen(iso: string, now: string) {
  const d = daysBetween(iso, now);
  const day = d === 0 ? "היום" : d === 1 ? "אתמול" : fmtDayMonth(iso);
  return `${day} ${fmtTime(iso)}`;
}

/** 30.9.2026, 09:12 */
export const fmtStamp = (iso: string) => `${fmtDate(iso)}, ${fmtTime(iso)}`;

/** The certainty word next to a value: "ידוע" · "מוערך" · "לא ידוע" · "לא זמין" (the mark "≈"/"—" is on the value itself). */
export function CertWord({ reading, quiet }: { reading: Reading; quiet?: boolean }) {
  const map = {
    known: { word: "ידוע", tone: "known" },
    estimated: { word: "מוערך", tone: "estimated" },
    unknown: { word: "לא ידוע", tone: "na" },
    unavailable: { word: "לא זמין", tone: "na" },
  } as const;
  const c = map[reading.kind];
  return <span className={cx("f-rp-cert", `f-rp-cert--${c.tone}`, quiet && "f-rp-cert--quiet")} aria-hidden={quiet || undefined}>{c.word}</span>;
}

/** A value + its certainty word: "≈ 96 מוערך" · "5 ידוע" · "— לא זמין". */
export function ValueWithCert({ reading, unit, total, strong = true }: { reading: Reading; unit?: Unit; total?: number; strong?: boolean }) {
  const V = strong ? "b" : "span";
  const na = reading.kind === "unknown" || reading.kind === "unavailable";
  return (
    <span className="f-rp-vc">
      <V className={cx("f-rp-vc__v", na && "f-rp-vc__v--na")}><ReadingValue reading={reading} unit={unit} total={total} /></V>
      {" "}<CertWord reading={reading} quiet />
    </span>
  );
}

/** Status tag in the system vocabulary (symbol + word), drawn as a small pill — no live-region role, for lists. */
export function StateTag({ status, children, size = "sm" }: { status: SystemStatus; children: ReactNode; size?: "sm" | "md" }) {
  return (
    <span className={cx("f-rp-state", `f-rp-state--${status}`, size === "md" && "f-rp-state--md")}>
      <span aria-hidden className={status === "processing" ? "f-spin" : undefined}>{SYSTEM[status].glyph}</span>{children}
    </span>
  );
}

/** Inline verification mark for dense tables ("✓ אומת" · "◑ אומת חלקית" · "! תקלה"). */
export function VerifMark({ state }: { state: Verification | "failed" }) {
  if (state === "failed") return <span className="f-rp-vmark f-rp-vmark--failed"><span aria-hidden>{SYSTEM.unavailable.glyph}</span>תקלה</span>;
  const v = VERIFICATION[state];
  return <span className={cx("f-rp-vmark", `f-rp-vmark--${state}`)}><span aria-hidden>{v.glyph}</span>{v.word}</span>;
}

/** A label/value list (drawer facts, connection details). */
export function KvList({ rows, className }: { rows: { label: ReactNode; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cx("f-rp-kv", className)}>
      {rows.map((r, i) => (
        <div key={i} className="f-rp-kv__row"><dt>{r.label}</dt><dd>{r.value}</dd></div>
      ))}
    </dl>
  );
}

/** An action that has no backend yet: rendered in full, labelled "מתוכנן", never claims success. */
export function PlannedAction({ label, variant = "neutral", size }: { label: string; variant?: "neutral" | "outline"; size?: "sm" }) {
  const id = useId();
  return (
    <span className="f-rp-planned">
      <button type="button" className={cx("f-btn", `f-btn--${variant}`, size === "sm" && "f-btn--sm")} aria-disabled="true" aria-describedby={id}>{label}</button>
      <span id={id}><PlannedTag /></span>
    </span>
  );
}

/** Drawer header with the title and a 44px close button. */
export function DrawerHead({ id, title, onClose }: { id: string; title: ReactNode; onClose: () => void }) {
  return (
    <div className="f-rp-drawer__head">
      <h2 id={id} className="f-rp-drawer__title">{title}</h2>
      <IconButton icon="x" label="סגירה" onClick={onClose} iconSize={16} />
    </div>
  );
}

/**
 * "מגירת מקור הנתון" (G1): source, updated, calculation and what is missing, where the number is used, and its
 * history. "בקש נתון מהלקוח" records a request — the value stays estimated until the data arrives.
 */
export function SourceDrawer({
  open, onClose, title, reading, unit, total, detail, requested, onRequest,
}: {
  open: boolean; onClose: () => void; title: string; reading: Reading; unit?: Unit; total?: number; detail: SourceDetail;
  requested: boolean; onRequest: () => void;
}) {
  const hid = useId();
  const [history, setHistory] = useState(false);
  const est = reading.kind === "estimated";
  const na = reading.kind === "unknown" || reading.kind === "unavailable";
  return (
    <Dialog open={open} onClose={onClose} variant="drawer" labelledBy={hid} className="f-rp-drawer">
      <DrawerHead id={hid} title="מקור הנתון" onClose={onClose} />
      <div className="f-rp-drawer__body">
        <div className="f-rp-src__lead">
          <span className="f-rp-src__what">{title}</span>
          <div className="f-rp-src__valrow">
            <b className={cx("f-rp-src__val", na && "f-rp-vc__v--na")}><ReadingValue reading={reading} unit={unit} total={total} /></b>
            <span className={cx("f-rp-src__cert", `f-rp-src__cert--${est ? "estimated" : na ? "na" : "known"}`)}>
              {est && <span aria-hidden>≈ </span>}{est ? "מוערך" : na ? (reading.kind === "unknown" ? "לא ידוע" : "לא זמין") : "ידוע"}
            </span>
            <VerificationTag state={detail.verification} />
          </div>
          {na && <span className="f-meta">{reading.reason}</span>}
        </div>
        <KvList className="f-rp-kv--boxed" rows={[
          { label: "מקור", value: detail.source },
          { label: "עודכן", value: detail.updated ? <><span className="f-num">{fmtStamp(detail.updated.at)}</span> · {detail.updated.how}</> : "—" },
          { label: "חישוב", value: detail.calculation },
          { label: "מה חסר", value: detail.missing ?? "לא חסר דבר" },
        ]} />
        {detail.consequence && <p className={cx("f-rp-note", na ? "f-rp-note--na" : "f-rp-note--est")}>{detail.consequence}</p>}
        {detail.fix && <Link href={detail.fix.href} className="f-btn f-btn--secondary f-rp-src__fix">{detail.fix.label}</Link>}
        {requested && <SystemLine status="processing">בקשה נשלחה ללקוח. עד שהנתון יגיע הערך נשאר {est ? "מוערך" : "כפי שהוא"}.</SystemLine>}
        {detail.usedIn.length > 0 && (
          <section className="f-rp-src__sec" aria-labelledby={`${hid}-used`}>
            <h3 id={`${hid}-used`} className="f-rp-src__h">היכן הנתון בשימוש</h3>
            <ul className="f-rp-inline-links">
              {detail.usedIn.map((u) => <li key={u.label}><Link href={u.href} className="f-link">{u.label}</Link></li>)}
            </ul>
          </section>
        )}
        {history && (
          <section className="f-rp-src__sec" aria-labelledby={`${hid}-hist`}>
            <h3 id={`${hid}-hist`} className="f-rp-src__h">היסטוריה</h3>
            <ol className="f-rp-hist">
              {detail.history.map((h) => <li key={h.at + h.text}><span className="f-num f-meta">{fmtStamp(h.at)}</span> {h.text}</li>)}
            </ol>
          </section>
        )}
      </div>
      <div className="f-rp-drawer__foot">
        {detail.canRequest && (
          <Button variant="primary" onClick={onRequest} disabled={requested} disabledReason={requested ? "הבקשה כבר נרשמה" : undefined} id={`${hid}-req`}>בקש נתון מהלקוח</Button>
        )}
        {detail.fileHref ? <Link href={detail.fileHref} className="f-btn f-btn--neutral">פתח את הקובץ</Link> : <PlannedAction label="פתח את הקובץ" />}
        <Button variant="neutral" aria-expanded={history} onClick={() => setHistory((h) => !h)}>{history ? "הסתר היסטוריה" : "היסטוריה"}</Button>
      </div>
    </Dialog>
  );
}

/**
 * Bar chart (G1) — the bars are decoration for sighted users; the same data is in a table (screen readers) and in a
 * visible summary sentence. An estimated bar is hatched + "≈" + the word "מוערך"; an unknown bar has no height.
 */
export function BarChart({ title, caption, bars, unitWord }: { title: string; caption: string; bars: ChartBar[]; unitWord: string }) {
  const hid = useId();
  const values = bars.map((b) => (b.reading.kind === "known" || b.reading.kind === "estimated" ? b.reading.value : 0));
  const max = Math.max(1, ...values);
  const known = bars.filter((b) => b.reading.kind === "known");
  const est = bars.filter((b) => b.reading.kind === "estimated");
  const na = bars.filter((b) => b.reading.kind === "unknown" || b.reading.kind === "unavailable");
  const summary = [
    known.length ? `בגרף: ${known.map((b) => (b.reading.kind === "known" ? formatNumber(b.reading.value) : "")).join(", ")} ${unitWord} ב${known.length === 1 ? "יום אחד ידוע" : `־${known.length} ימים ידועים`}.` : "",
    est.length ? `${est.length === 1 ? "יום אחד הושלם" : `${est.length} ימים הושלמו`} לפי ממוצע, ולכן הסכום מסומן "מוערך".` : "כל הימים ידועים.",
    na.length ? `${na.length} ימים ללא נתון.` : "",
  ].filter(Boolean).join(" ");
  return (
    <figure className="f-panel f-rp-chart" aria-labelledby={hid}>
      <div className="f-rp-chart__head">
        <h2 id={hid} className="f-rp-chart__title">{title}</h2>
        <span className="f-meta">{caption}</span>
      </div>
      <div className="f-rp-chart__plot" aria-hidden>
        {bars.map((b) => {
          const r = b.reading;
          const v = r.kind === "known" || r.kind === "estimated" ? r.value : null;
          return (
            <div key={b.id} className="f-rp-chart__col">
              <b className={cx("f-rp-chart__val", r.kind === "estimated" && "f-rp-chart__val--est")}>{v == null ? "—" : `${r.kind === "estimated" ? "≈ " : ""}${formatNumber(v)}`}</b>
              {v != null && <span className={cx("f-rp-chart__bar", r.kind === "estimated" && "f-rp-chart__bar--est")} style={{ ["--h" as string]: v / max }} />}
            </div>
          );
        })}
      </div>
      <div className="f-rp-chart__axis" aria-hidden>
        {bars.map((b) => (
          <span key={b.id} className={cx(b.reading.kind === "estimated" && "f-rp-chart__tick--est")}>{fmtDayMonth(b.date)}{b.reading.kind === "estimated" ? " · מוערך" : ""}</span>
        ))}
      </div>
      <table className="f-sr">
        <caption>{title}</caption>
        <thead><tr><th scope="col">תאריך</th><th scope="col">ערך</th><th scope="col">ודאות</th></tr></thead>
        <tbody>
          {bars.map((b) => (
            <tr key={b.id}>
              <th scope="row">{fmtDate(b.date)}</th>
              <td>{b.reading.kind === "known" || b.reading.kind === "estimated" ? formatNumber(b.reading.value) : "—"}</td>
              <td>{b.reading.kind === "known" ? "ידוע" : b.reading.kind === "estimated" ? `מוערך · ${b.reading.basis}` : "לא ידוע"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="f-rp-chart__sum">{summary}</figcaption>
    </figure>
  );
}
