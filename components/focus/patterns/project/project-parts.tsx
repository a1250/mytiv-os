import Link from "next/link";
import type { ReactNode } from "react";
import type { Metric } from "@/lib/focus/contracts/common";
import type { Loadable } from "@/lib/focus/contracts/loadable";
import type { Milestone, ProjectArea, ProjectBlocker, ProjectDecision, ProjectDetail } from "@/lib/focus/contracts/projects";
import { daysBetween, fmtAgo, fmtDate, fmtDayMonth } from "@/lib/focus/format";
import { personName } from "@/lib/focus/fixtures/people";
import { R } from "@/lib/focus/routes";
import { cx } from "@/components/focus/ui/cx";
import { LoadableView } from "@/components/focus/ui/feedback";
import { Icon } from "@/components/focus/ui/icon";
import { ReadingValue, riskText } from "@/components/focus/ui/status";
import { NavTabs } from "@/components/focus/ui/tabs";
import { metricNote } from "../metrics";
import { HealthPill } from "../project-card";

/**
 * Project environment (handoff D2, D3, M5): entity header + area tabs (≤4), milestones, the next action, hours vs
 * budget, blockers, decisions and results — each number with source and certainty.
 */
const AREAS: { key: ProjectArea; label: string; short: string; href: (id: string) => string; tone?: "risk" | "accent" }[] = [
  { key: "overview", label: "סקירה", short: "סקירה", href: R.project },
  { key: "execution", label: "ביצוע", short: "ביצוע", href: R.projectExecution, tone: "risk" },
  { key: "marketing", label: "שיווק ותוכן", short: "שיווק", href: () => R.campaign("thursday-sushi"), tone: "accent" },
  { key: "knowledge", label: "ידע ותוצאות", short: "ידע", href: (id) => R.clientBrain(id) },
];

export function ProjectHeader({ p, area, now, actions }: { p: ProjectDetail; area: ProjectArea; now: string; actions?: ReactNode }) {
  const items = AREAS.map((a) => ({
    key: a.key,
    href: a.href(p.id),
    label: <><span className="f-only-desktop">{a.label}</span><span className="f-only-mobile">{a.short}</span></>,
    ariaLabel: `${a.label}${p.areaCounts[a.key] ? ` · ${p.areaCounts[a.key]}` : ""}`,
    count: p.areaCounts[a.key] ? <b className={a.tone === "risk" ? "f-seg__count--risk" : "f-seg__count--accent"}>{p.areaCounts[a.key]}</b> : undefined,
  }));
  return (
    <header className="f-proj-head">
      <nav className="f-crumbs" aria-label="נתיב">
        <Link href={R.projects}>לקוחות ופרויקטים</Link> <span aria-hidden>›</span> <Link href={R.client(p.id)}>{p.client.name}</Link>
      </nav>
      <div className="f-proj-head__m">
        <Link href={R.projects} className="f-iconbtn" aria-label="חזרה לפרויקטים"><span aria-hidden>→</span></Link>
        <span className="f-proj-head__client">{p.client.name}</span>
        <Link href={R.client(p.id)} className="f-iconbtn" aria-label="עוד על הלקוח"><Icon name="more-horizontal" className="f-icon-dim" /></Link>
      </div>
      <div className="f-proj-head__row">
        <span className="f-proj-logo" aria-hidden>{p.logo}</span>
        <div className="f-proj-head__titles">
          <h1 className="f-proj-head__title">{p.name}</h1>
          <span className="f-proj-head__status">אחראית: {personName(p.ownerId)} · יעד {p.dueDate ? fmtDate(p.dueDate) : "—"} · עודכן {fmtAgo(p.updated.at, now)}</span>
        </div>
        <HealthPill health={p.health} withBlockers size="xl" />
        <span className="f-proj-head__mstatus">{personName(p.ownerId)} · יעד {p.dueDate ? fmtDayMonth(p.dueDate) : "—"}</span>
        <span className="f-grow" />
        {actions}
      </div>
      <NavTabs label="אזורי הפרויקט" value={area} items={items} className="f-proj-tabs" />
    </header>
  );
}

export function Milestones({ milestones, now, launchDate }: { milestones: Loadable<Milestone[]>; now: string; launchDate: string | null }) {
  return (
    <section className="f-panel f-miles" aria-labelledby="miles-h">
      <div className="f-miles__head">
        <h2 id="miles-h" className="f-miles__h">אבני דרך</h2>
        {launchDate && <span className="f-meta">עוד {daysBetween(now, launchDate)} ימים להשקה</span>}
      </div>
      <LoadableView value={milestones} label="אבני דרך">
        {(ms) => {
          const done = ms.filter((m) => m.state === "done").length;
          const blocked = ms.find((m) => m.state === "blocked");
          return (
            <>
              <ol className="f-miles__track" style={{ ["--n" as string]: ms.length, ["--done" as string]: done }}>
                {ms.map((m) => (
                  <li key={m.id} className={cx("f-miles__item", `f-miles__item--${m.state}`)}>
                    <span className="f-miles__dot" aria-hidden />
                    <b className="f-miles__title">{m.title}</b>
                    <span className="f-miles__date">
                      {m.state === "done" ? <><span aria-hidden>✓</span> {fmtDayMonth(m.date)}<span className="f-sr"> · הושלם</span></> : m.state === "blocked" ? <><span aria-hidden>■</span> חסום · {fmtDayMonth(m.date)}</> : fmtDayMonth(m.date)}
                    </span>
                  </li>
                ))}
                <li className="f-miles__now" aria-hidden>היום ▾</li>
              </ol>
              <div className="f-miles__compact">
                <div className="f-miles__bars" aria-hidden>{ms.map((m) => <span key={m.id} className={cx("f-miles__bar", `f-miles__bar--${m.state}`)} />)}</div>
                <span className="f-miles__sum">{done} מתוך {ms.length}{blocked && <> · <b className="f-text-risk">{blocked.title} חסום</b></>} · {ms[ms.length - 1].title} {fmtDayMonth(ms[ms.length - 1].date)}</span>
              </div>
            </>
          );
        }}
      </LoadableView>
    </section>
  );
}

export function NextActionHero({ next }: { next: NonNullable<ProjectDetail["nextAction"]> }) {
  return (
    <section className="f-hero" aria-labelledby="next-h">
      <div className="f-hero__text">
        <span className="f-hero__label" id="next-h">{next.label}</span>
        <b className="f-hero__title">{next.title}</b>
        <span className="f-hero__detail">{next.detail}</span>
      </div>
      <Link href={next.action.href} className="f-btn f-btn--onaccent f-btn--lg f-hero__cta">{next.action.label}</Link>
    </section>
  );
}

export function HoursRing({ spent, budget, sourceLabel, updatedAt, now, extra }: { spent: number; budget: number; sourceLabel: string; updatedAt: string; now: string; extra?: ReactNode }) {
  const pct = Math.round((spent / budget) * 100);
  const tone = pct > 100 ? "over" : pct > 80 ? "warn" : "ok";
  return (
    <section className="f-panel f-hours" aria-label={`שעות: ${spent} מתוך ${budget}`}>
      <span className={cx("f-ring", `f-ring--${tone}`)} style={{ ["--pct" as string]: `${Math.min(100, pct)}%` }} role="img" aria-label={`${pct}% מהתקציב`}>
        <span className="f-ring__in">{pct}%</span>
      </span>
      <div className="f-hours__text">
        <b className="f-hours__main">{spent} מתוך {budget} שעות</b>
        <span className="f-meta">{sourceLabel} · {fmtAgo(updatedAt, now)}</span>
        {extra}
      </div>
      <div className="f-hours__compact">
        <div><b>שעות</b><span className="f-meta">{sourceLabel} · {fmtAgo(updatedAt, now)}</span></div>
        <b className="f-hours__num">{spent} / {budget}</b>
      </div>
    </section>
  );
}

export function BlockersCard({ blockers }: { blockers: Loadable<ProjectBlocker[]> }) {
  const n = blockers.state === "ready" ? blockers.data.length : null;
  return (
    <section className="f-panel f-listcard" aria-labelledby="blk-h">
      <div className="f-listcard__head"><h2 id="blk-h" className="f-listcard__h">חסימות</h2>{n != null && <span className="f-count f-count--risk">{n}</span>}</div>
      <LoadableView value={blockers} label="חסימות" compact>
        {(bs) => <>{bs.map((b) => (
          <Link key={b.id} href={R.projectExecution("umino")} className="f-listcard__row">
            <span className="f-listcard__title">{b.title}</span>
            <span className="f-listcard__meta">{b.meta}</span>
          </Link>
        ))}</>}
      </LoadableView>
    </section>
  );
}

export function DecisionsCard({ decisions, title = "החלטות ואישורים", compactTitle }: { decisions: Loadable<ProjectDecision[]>; title?: string; compactTitle?: string }) {
  const n = decisions.state === "ready" ? decisions.data.length : null;
  return (
    <section className="f-panel f-listcard" aria-labelledby="dec-h">
      <div className="f-listcard__head">
        <h2 id="dec-h" className="f-listcard__h"><span className="f-only-desktop">{title}</span><span className="f-only-mobile">{compactTitle ?? title}{n != null ? ` · ${n}` : ""}</span></h2>
        {n != null && <span className="f-count f-only-desktop">{n}</span>}
      </div>
      <LoadableView value={decisions} label={title} compact>
        {(ds) => <>{ds.map((d) => (
          <Link key={d.id} href={d.href} className="f-listcard__row">
            <span className="f-listcard__title">{d.title}</span>
            <span className={cx("f-listcard__risk", `f-listcard__risk--${d.risk}`)}>{riskText(d.risk)} · {d.meta}</span>
          </Link>
        ))}</>}
      </LoadableView>
    </section>
  );
}

/** `footer`: a line that belongs to the card (e.g. the campaign's "first data expected" note). */
export function ResultsCard({ results, now, title = "תוצאות שיווק", footer }: { results: Loadable<Metric[]>; now: string; title?: string; footer?: ReactNode }) {
  return (
    <section className="f-panel f-listcard" aria-labelledby="res-h">
      <h2 id="res-h" className="f-listcard__h">{title}</h2>
      <LoadableView value={results} label={title} compact>
        {(ms) => <>{ms.map((m, i) => {
          const note = metricNote(m, now);
          const na = m.reading.kind === "unavailable" || m.reading.kind === "unknown";
          return (
            <div key={m.id} className={cx("f-result", i > 0 && "f-result--sep")}>
              <div className="f-result__row">
                <span className="f-result__label">{m.label}</span>
                <span>
                  <b className={cx("f-result__value", na && "f-value--unavailable")}><ReadingValue reading={m.reading} unit={m.unit} /></b>
                  {m.reading.kind === "estimated" && <> <span className="f-cert-word f-cert-word--estimated">מוערך</span></>}
                </span>
              </div>
              <span className={cx("f-result__note", na && "f-result__note--na")}>
                {na ? (m.reading.kind === "unavailable" ? `לא זמין עקב ${m.reading.reason} מ־${fmtDayMonth(m.reading.since)}` : note.text)
                  : <>{m.source.label}{m.freshness && m.freshness.state !== "unavailable" ? ` · ${fmtDayMonth(m.freshness.updatedAt)}` : ""}{m.reading.kind === "estimated" ? ` · ${m.reading.basis}` : ""}{m.source.href && <> · <Link href={m.source.href} className="f-result__src">מקור</Link></>}</>}
              </span>
            </div>
          );
        })}</>}
      </LoadableView>
      {footer}
    </section>
  );
}
