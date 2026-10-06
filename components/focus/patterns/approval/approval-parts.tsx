import Link from "@/components/focus/ui/link";
import type { ReactNode } from "react";
import type { ChangeRow, Reversibility } from "@/lib/focus/contracts/approvals";
import type { Fact } from "@/lib/focus/contracts/common";
import { cx } from "@/components/focus/ui/cx";
import { VERIFICATION } from "@/components/focus/ui/status";

/**
 * Approval building blocks (handoff §6.7): queue side panel, header, "what will change" (today vs after), verified
 * facts vs unverified assumptions, impact tiles. Pure and server-safe.
 */
export type QueueEntry = { id: string; title: string; meta: string; href: string; status?: { glyph: string; text: string; tone: "done" | "changes" | "rejected" }; dim?: boolean };

export function QueueSide({ handled, next, note }: { handled: QueueEntry[]; next: QueueEntry[]; note?: string }) {
  return (
    <aside className="f-qside" aria-label="תור האישורים">
      {handled.length > 0 && (
        <>
          <h2 className="f-qside__h">טופלו</h2>
          {handled.map((e) => (
            <Link key={e.id} href={e.href} className="f-qside__card">
              {e.status && <span className={cx("f-qside__status", `f-qside__status--${e.status.tone}`)}><span aria-hidden>{e.status.glyph}</span> {e.status.text}</span>}
              <span className="f-qside__title">{e.title}</span>
              <span className="f-qside__meta">{e.meta}</span>
            </Link>
          ))}
        </>
      )}
      {next.length > 0 && <h2 className={cx("f-qside__h", handled.length > 0 && "f-qside__h--gap")}>הבא בתור</h2>}
      {next.map((e) => (
        <Link key={e.id} href={e.href} className={cx("f-qside__card", e.dim && "f-qside__card--dim")}>
          <span className="f-qside__title">{e.title}</span>
          <span className="f-qside__meta">{e.meta}</span>
        </Link>
      ))}
      {next.length === 0 && handled.length > 0 && <p className="f-qside__note">אין עוד פריטים בתור.</p>}
      {note && <p className="f-qside__note">{note}</p>}
    </aside>
  );
}

export function ApprovalHead({ context, title, chips, meta, size = "lg" }: { context: string; title: string; chips: ReactNode; meta?: ReactNode; size?: "lg" | "md" }) {
  return (
    <header className={cx("f-ahead", size === "md" && "f-ahead--md")}>
      <span className="f-ahead__ctx">{context}</span>
      <h1 id="approval-title" className="f-ahead__title">{title}</h1>
      <div className="f-ahead__chips">{chips}{meta && <span className="f-ahead__meta">{meta}</span>}</div>
    </header>
  );
}

export function ChangeTable({ rows }: { rows: ChangeRow[] }) {
  return (
    <section className="f-asec" aria-labelledby="chg-h">
      <h2 id="chg-h" className="f-asec__h">מה עומד להשתנות?</h2>
      <table className="f-chg">
        <thead><tr><th scope="col">מה</th><th scope="col">היום</th><th scope="col">אחרי אישור</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.what}>
              <th scope="row">{r.what}</th>
              <td className={r.before == null ? "f-chg__none" : undefined}>{r.before ?? <><span aria-hidden>—</span><span className="f-sr">אין</span></>}</td>
              <td className={cx(r.emphasis === "changed" && "f-chg__changed", r.emphasis === "warning" && "f-chg__warn")}>{r.after}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function WhyBlock({ title = "למה מוצע לבצע זאת?", children }: { title?: string; children: ReactNode }) {
  return (
    <section className="f-asec f-asec--tight">
      <h2 className="f-asec__h">{title}</h2>
      <p className="f-why">{children}</p>
    </section>
  );
}

export function FactsSplit({ facts }: { facts: Fact[] }) {
  const ok = facts.filter((f) => f.verification === "verified");
  const no = facts.filter((f) => f.verification !== "verified");
  return (
    <section className="f-asec" aria-labelledby="facts-h">
      <h2 id="facts-h" className="f-asec__h">על סמך מה?</h2>
      <div className="f-facts">
        <div className="f-facts__box f-facts__box--ok">
          <h3 className="f-facts__h"><span aria-hidden>{VERIFICATION.verified.glyph}</span> עובדות שאומתו · {ok.length}</h3>
          {ok.map((f) => (
            <div key={f.id} className="f-facts__item">
              <span className="f-facts__text">{f.text}</span>
              <span className="f-facts__basis">{f.basis}{f.source?.href && <> · <Link href={f.source.href} className="f-facts__src">{f.source.label}</Link></>}</span>
            </div>
          ))}
        </div>
        <div className="f-facts__box f-facts__box--no">
          <h3 className="f-facts__h"><span aria-hidden>{VERIFICATION.unverified.glyph}</span> הנחות שלא אומתו · {no.length}</h3>
          {no.map((f) => (
            <div key={f.id} className="f-facts__item">
              <span className="f-facts__text">{f.text}</span>
              <span className="f-facts__basis">{f.basis}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ImpactTiles({ effect, whyRisk, whyRiskLabel, reversibility }: { effect: string; whyRisk: string; whyRiskLabel: string; reversibility: Reversibility }) {
  return (
    <div className="f-impact">
      <div className="f-impact__tile"><span className="f-impact__l">השפעה</span><span>{effect}</span></div>
      <div className="f-impact__tile"><span className="f-impact__l">{whyRiskLabel}</span><span>{whyRisk}</span></div>
      <div className="f-impact__tile">
        <span className="f-impact__l">חזרה אחורה</span>
        <span className={cx("f-impact__rev", reversibility.kind === "none" && "f-impact__rev--none")}>
          <span aria-hidden>{reversibility.kind === "none" ? "!" : "↺"}</span> {reversibility.label}
        </span>
      </div>
    </div>
  );
}

/** Mobile summary rows (M3) — replaces the wide change table under 768px. */
export function MobileSummary({ rows }: { rows: { label: string; value: ReactNode; tone?: "ok" }[] }) {
  return (
    <dl className="f-msum">
      {rows.map((r) => (
        <div key={r.label} className="f-msum__row">
          <dt>{r.label}</dt>
          <dd className={r.tone === "ok" ? "f-msum__ok" : undefined}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function FactLines({ facts }: { facts: Fact[] }) {
  return (
    <div className="f-factlines">
      {facts.filter((f) => f.verification === "verified").slice(0, 1).map((f) => (
        <p key={f.id} className="f-factlines__ok"><b>{VERIFICATION.verified.glyph} אומת:</b> {f.text} · {f.basis.replace(/, עודכן ב־/, " ")}</p>
      ))}
      {facts.filter((f) => f.verification !== "verified").slice(0, 1).map((f) => (
        <p key={f.id} className="f-factlines__no"><b>{VERIFICATION.unverified.glyph} לא אומת:</b> {f.text}</p>
      ))}
    </div>
  );
}
