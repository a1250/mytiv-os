import Link from "@/components/focus/ui/link";
import type { DayAgenda, ResumeItem } from "@/lib/focus/contracts/today";
import type { Loadable } from "@/lib/focus/contracts/loadable";
import { fmtAgo, fmtTime } from "@/lib/focus/format";
import { cx } from "@/components/focus/ui/cx";
import { LoadableView, Skeleton } from "@/components/focus/ui/feedback";
import { APPROVAL } from "@/components/focus/ui/status";

/**
 * Day agenda with the "now" line (handoff §6.10 "יומן יום · קו עכשיו") + "continue where you left off".
 * Desktop: a time grid. Mobile: only the events, each with its one action (M1).
 */
export function AgendaPanel({ agenda, now, resume, title = "היום ביומן" }: { agenda: Loadable<DayAgenda>; now: string; resume?: ResumeItem[]; title?: string }) {
  return (
    <section className="f-agenda f-panel" aria-labelledby="agenda-title">
      <div className="f-agenda__head">
        <h2 id="agenda-title" className="f-agenda__title">{title}</h2>
        {agenda.state === "ready" && <span className="f-meta">{agenda.data.source.label} · סונכרן {fmtAgo(agenda.data.syncedAt, now)}</span>}
      </div>
      <LoadableView value={agenda} label="יומן" skeleton={<div className="f-agenda__skel"><Skeleton h={14} /><Skeleton h={40} /><Skeleton h={40} /></div>}>
        {(a) => (
          <>
            <ol className="f-agenda__grid" aria-label="אירועים היום">
              <li className="f-agenda__row f-agenda__row--now" aria-label={`עכשיו ${fmtTime(now)}`}>
                <span className="f-agenda__time f-agenda__time--now" dir="ltr">{fmtTime(now)}</span>
                <span className="f-agenda__nowline" aria-hidden><span className="f-agenda__nowdot" /></span>
              </li>
              {a.slots.map((slot) => {
                const ev = a.events.find((e) => fmtTime(e.start) === slot);
                return (
                  <li key={slot} className="f-agenda__row">
                    <span className="f-agenda__time" dir="ltr">{slot}</span>
                    {ev ? (
                      <div className="f-agenda__slot">
                        <div className={cx("f-agenda__ev", `f-agenda__ev--${ev.kind}`)}>
                          <div className="f-agenda__evtext">
                            <b>{ev.title}</b>
                            <span className={cx("f-agenda__evmeta", ev.status && "f-agenda__evmeta--pending")}>
                              {ev.status === "pending_approval" ? `${APPROVAL.pending.glyph} ${ev.meta}` : ev.meta}
                            </span>
                          </div>
                          {ev.join && <Link href={ev.join.href} className="f-btn f-btn--primary f-btn--sm f-agenda__join">{ev.join.label}</Link>}
                        </div>
                      </div>
                    ) : <span className="f-agenda__empty" />}
                  </li>
                );
              })}
            </ol>
            <ul className="f-agenda__mobile" aria-label="אירועים היום">
              {a.events.filter((e) => e.kind === "meeting").map((e) => (
                <li key={e.id} className="f-agenda__mitem">
                  <b className="f-agenda__mtime" dir="ltr">{fmtTime(e.start)}</b>
                  <span className="f-agenda__mtitle">{e.title}</span>
                  {e.join && <Link href={e.join.href} className="f-btn f-btn--secondary f-btn--sm">{e.join.label}</Link>}
                </li>
              ))}
            </ul>
          </>
        )}
      </LoadableView>
      {resume && resume.length > 0 && (
        <div className="f-agenda__resume">
          <h3 className="f-agenda__rtitle">המשך מאיפה שעצרת</h3>
          {resume.map((r) => (
            <Link key={r.id} href={r.href} className="f-agenda__ritem">{r.label} <span className="f-muted">· {fmtAgo(r.at, now)}</span></Link>
          ))}
        </div>
      )}
    </section>
  );
}
