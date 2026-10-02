"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { ContactSuggestion, Lead, LeadDetail, LeadStage, TimelineEvent, TimelineKind } from "@/lib/focus/contracts/sales";
import type { JobStatus } from "@/lib/focus/state/jobs";
import { personName } from "@/lib/focus/fixtures/people";
import { daysBetween, fmtDayMonth, fmtTime } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { Button, IconButton } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { LoadableView } from "@/components/focus/ui/feedback";
import { TextField } from "@/components/focus/ui/field";
import { Icon } from "@/components/focus/ui/icon";
import { Bdi } from "@/components/focus/ui/misc";
import { PlannedTag, SystemLine, VerificationTag } from "@/components/focus/ui/status";
import { Chips } from "@/components/focus/ui/tabs";
import { ConfidencePill, OPEN_STAGES, STAGE } from "./sales-parts";
import type { Loadable } from "@/lib/focus/contracts/loadable";

/**
 * Lead page parts (handoff F2, mobile M7 phone 2): the entity header (desktop band / phone header), the timeline with a
 * note composer and filters, contact details with verification, the need, proposals + tasks, and the background
 * contact search (results carry source + confidence and are added only on approval).
 */
export const when = (at: string, now: string) => (daysBetween(at, now) === 0 ? `היום ${fmtTime(at)}` : fmtDayMonth(at));

export function LeadHeader({ lead, detail, onStage, onOutreach, onMeeting, onCall, cta }: {
  lead: Lead; detail: LeadDetail; onStage: () => void; onOutreach: () => void; onMeeting: () => void; onCall: () => void; cta: ReactNode;
}) {
  const owner = personName(lead.ownerId);
  return (
    <header className="f-sl-lhead">
      <div className="f-sl-lhead__phone">
        <Link href={R.sales} className="f-iconbtn" aria-label="חזרה ללידים" title="חזרה ללידים"><span aria-hidden>→</span></Link>
        <span className="f-grow" />
        <IconButton icon="phone" label={`התקשר ל${lead.name}`} onClick={onCall} />
        <IconButton icon="mail" label={`שלח פנייה ל${lead.name}`} onClick={onOutreach} />
      </div>
      <nav aria-label="נתיב" className="f-crumbs f-sl-lhead__crumbs">
        <Link href={R.sales}>מכירות</Link> <span aria-hidden>›</span> <Link href={R.sales}>לידים</Link> <span aria-hidden>›</span> <span aria-current="page">{lead.name}</span>
      </nav>
      <div className="f-sl-lhead__row">
        <span className="f-sl-lhead__avatar" aria-hidden>{detail.initials}</span>
        <div className="f-sl-lhead__titles">
          <h1 className="f-sl-lhead__h">{lead.name}</h1>
          <span className="f-sl-lhead__meta f-sl-hide-narrow">{detail.headline} · מקור: {lead.source} · אחראית: {owner}</span>
          <span className="f-sl-lhead__meta f-sl-only-narrow">{detail.shortHeadline} · שלב: {STAGE[lead.stage]}</span>
        </div>
        <button type="button" className="f-sl-stage f-sl-stage--btn f-sl-hide-narrow" onClick={onStage} aria-haspopup="dialog">
          שלב: {STAGE[lead.stage]} <span aria-hidden>▾</span><span className="f-sr"> · שנה שלב</span>
        </button>
        <span className="f-grow" />
        <div className="f-sl-lhead__actions f-sl-hide-narrow">
          <Button variant="neutral" onClick={onOutreach} aria-haspopup="dialog">שלח פנייה <PlannedTag /></Button>
          <Button variant="neutral" onClick={onMeeting} aria-haspopup="dialog">קבע פגישה <PlannedTag /></Button>
          {cta}
        </div>
      </div>
    </header>
  );
}

const KIND_LABEL: Record<Exclude<TimelineKind, "system">, string> = { email: "מיילים", meeting: "פגישות", note: "הערות" };
type TlFilter = "all" | Exclude<TimelineKind, "system">;

export function LeadTimeline({ events, now, composerOpen, focusSignal, onAddNote }: {
  events: Loadable<TimelineEvent[]>; now: string; composerOpen: boolean; focusSignal: number; onAddNote: (text: string) => boolean;
}) {
  const [filter, setFilter] = useState<TlFilter>("all");
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (focusSignal) form.current?.querySelector("input")?.focus(); }, [focusSignal]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const list = events.state === "ready" ? events.data : [];
  const n = (k: TimelineKind) => list.filter((e) => e.kind === k).length;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) { setError("כתוב את ההערה לפני השמירה."); return; }
    if (onAddNote(text.trim())) { setText(""); setError(null); }
  };
  return (
    <section className="f-sl-panel f-sl-tl" aria-labelledby="sl-tl-h">
      <div className="f-sl-tl__head">
        <h2 id="sl-tl-h" className="f-sl-panel__h">ציר זמן</h2>
        <Chips label="סינון ציר הזמן" value={filter} onChange={setFilter} className="f-sl-tl__chips"
          items={[{ key: "all", label: "הכול" }, ...(["email", "meeting", "note"] as const).map((k) => ({ key: k, label: KIND_LABEL[k], count: n(k) }))]} />
      </div>
      <form ref={form} className={cx("f-sl-tl__composer", composerOpen && "f-sl-tl__composer--open")} onSubmit={submit} noValidate>
        <TextField label="הערה חדשה" labelClassName="f-sl-tl__label" placeholder="הוסף הערה…" value={text} maxLength={400}
          onChange={(e) => { setText(e.target.value); setError(null); }} error={error} className="f-grow" />
        <Button type="submit" variant="secondary" className="f-sl-tl__save">שמור הערה</Button>
      </form>
      <LoadableView value={events} label="ציר זמן" compact>
        {(evs) => {
          const shown = evs.filter((e) => filter === "all" || e.kind === filter);
          if (!shown.length) return <p className="f-meta">אין {filter === "all" ? "אירועים" : KIND_LABEL[filter]} בליד הזה.</p>;
          return (
            <ol className="f-sl-tl__list">
              {shown.map((e, i) => (
                <li key={e.id} className={cx("f-sl-tl__item", i === 0 && filter === "all" && e.kind === "meeting" && "f-sl-tl__item--now")}>
                  <span className="f-sl-tl__dot" aria-hidden />
                  <div className="f-sl-tl__line">
                    <b className="f-sl-tl__title">{e.title}</b>
                    <span className="f-sl-tl__meta">{[when(e.at, now), e.source, e.meta].filter(Boolean).join(" · ")}</span>
                  </div>
                  {e.text && (
                    <span className={cx("f-sl-tl__text", e.quote && "f-sl-tl__text--quote")}>
                      {e.quote ? `"${e.text}"` : e.text}
                      {e.link && <> · <Link href={e.link.href} className="f-sl-tl__link">{e.link.label}</Link></>}
                    </span>
                  )}
                  <span className="f-sl-tl__m">
                    <span className="f-sl-tl__meta">{when(e.at, now)}{e.kind === "email" ? " · מייל" : ""}</span>
                    <span className="f-sl-tl__mtext">{e.short ?? (e.kind === "note" ? e.text : e.title)}{e.link && <> · <Link href={e.link.href} className="f-sl-tl__link">{e.link.label}</Link></>}</span>
                  </span>
                </li>
              ))}
            </ol>
          );
        }}
      </LoadableView>
    </section>
  );
}

export function ContactCard({ detail }: { detail: LeadDetail }) {
  const c = detail.contact;
  return (
    <section className="f-sl-panel f-sl-side" aria-labelledby="sl-contact-h">
      <h2 id="sl-contact-h" className="f-sl-panel__h f-sl-panel__h--sm">פרטי קשר</h2>
      <dl className="f-sl-dl">
        <dt>מייל</dt><dd><Bdi>{c.email}</Bdi></dd>
        <dt>טלפון</dt><dd><Bdi>{c.phone}</Bdi></dd>
        <dt>חברה</dt><dd>{c.company}</dd>
      </dl>
      <VerificationTag state={c.verification.state} label={c.verification.label} className="f-sl-side__tag" />
    </section>
  );
}

export function NeedCard({ detail }: { detail: LeadDetail }) {
  return (
    <section className="f-sl-panel f-sl-side" aria-labelledby="sl-need-h">
      <h2 id="sl-need-h" className="f-sl-panel__h f-sl-panel__h--sm">הצורך</h2>
      <dl className="f-sl-dl f-sl-dl--wide">
        {detail.need.map((r) => (
          <div key={r.label} className="f-sl-dl__row">
            <dt>{r.label}</dt>
            <dd>{r.value.kind === "text" ? r.value.text : <span className="f-value--unavailable f-sl-na"><span aria-hidden>—</span> {r.value.reason}</span>}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function WorkCard({ proposal, tasks, onAddTask }: {
  proposal: ReactNode | null; tasks: { id: string; title: string; meta: string; href: string }[]; onAddTask: () => void;
}) {
  return (
    <section className="f-sl-panel f-sl-side" aria-labelledby="sl-work-h">
      <div className="f-sl-side__head">
        <h2 id="sl-work-h" className="f-sl-panel__h f-sl-panel__h--sm">הצעות ומשימות</h2>
        <Button variant="link" size="sm" onClick={onAddTask} aria-haspopup="dialog">+ משימה</Button>
      </div>
      {proposal ?? <span className="f-meta">עדיין אין הצעה לליד הזה.</span>}
      {tasks.length === 0 ? <span className="f-meta">אין משימות פתוחות.</span> : (
        <ul className="f-sl-side__list">
          {tasks.map((t) => (
            <li key={t.id} className="f-sl-side__row">
              <Link href={t.href} className="f-sl-side__link">{t.title}</Link>
              <span className="f-meta">{t.meta}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ExtraContactsCard({ status, approved, suggestions, onSearch, onCancel, onApprove, onDismiss }: {
  status: JobStatus | null; approved: ContactSuggestion[]; suggestions: ContactSuggestion[];
  onSearch: () => void; onCancel: () => void; onApprove: (s: ContactSuggestion) => void; onDismiss: (s: ContactSuggestion) => void;
}) {
  const running = status?.state === "running";
  return (
    <section className="f-sl-panel f-sl-side" aria-labelledby="sl-more-h" aria-busy={running || undefined}>
      <div className="f-sl-side__head">
        <h2 id="sl-more-h" className="f-sl-panel__h f-sl-panel__h--sm">אנשי קשר נוספים</h2>
        {!running && <Button variant="link" size="sm" onClick={onSearch}><span aria-hidden>✦</span> {status ? "חפש שוב" : "מצא איש קשר"}</Button>}
      </div>
      {approved.length > 0 && (
        <ul className="f-sl-side__list">
          {approved.map((s) => (
            <li key={s.id} className="f-sl-side__row">
              <span><b>{s.name}</b> · {s.role}</span>
              <span className="f-meta">{s.source}{s.contact.text ? <> · <Bdi>{s.contact.text}</Bdi> <VerificationTag state={s.contact.verification} label={s.contact.verification === "verified" ? "אומת" : "משוער · לא אומת"} /></> : " · בלי פרטי קשר"}</span>
            </li>
          ))}
        </ul>
      )}
      <div role="status" aria-live="polite" className="f-sl-side__status">
        {!status && <span className="f-sl-side__hint">חיפוש רץ ברקע ומציג מקור ורמת ביטחון. איש קשר לא יתווסף בלי אישור שלך.</span>}
        {running && (
          <span className="f-sl-side__running">
            <SystemLine status="processing">מחפש ברקע · אפשר לעזוב את המסך, תגיע התראה בסיום.</SystemLine>
            <Button variant="quiet" size="sm" onClick={onCancel}>עצור</Button>
          </span>
        )}
        {status?.state === "failed" && <SystemLine status="failed">החיפוש נכשל. לא נוסף דבר.</SystemLine>}
        {status?.state === "cancelled" && <span className="f-meta">החיפוש נעצר. לא נוסף דבר.</span>}
        {status?.state === "done" && suggestions.length === 0 && <SystemLine status="done">החיפוש הסתיים. אין הצעות נוספות.</SystemLine>}
      </div>
      {status?.state === "done" && suggestions.length > 0 && (
        <ul className="f-sl-side__list">
          {suggestions.map((s) => (
            <li key={s.id} className="f-sl-sugg">
              <span className="f-sl-sugg__top"><b>{s.name}</b><ConfidencePill level={s.confidence} /></span>
              <span className="f-meta">{s.role} · מקור: {s.source}</span>
              <span className="f-meta-sm">{s.contact.text ? <><Bdi>{s.contact.text}</Bdi> · <VerificationTag state={s.contact.verification} label="משוער · לא אומת" /> {s.contact.basis}</> : <>פרטי קשר: לא נמצאו · {s.contact.basis}</>}</span>
              <span className="f-sl-sugg__actions">
                <Button variant="secondary" size="sm" onClick={() => onApprove(s)}>הוסף כאיש קשר</Button>
                <Button variant="quiet" size="sm" onClick={() => onDismiss(s)}>לא רלוונטי</Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Stage picker (radio list). Closed stages are listed after the open ones. */
export function StagePicker({ value, onChange }: { value: LeadStage; onChange: (s: LeadStage) => void }) {
  const all: LeadStage[] = [...OPEN_STAGES, "won", "lost"];
  return (
    <fieldset className="f-sl-radios">
      <legend className="f-sr">שלב הליד</legend>
      {all.map((s) => (
        <label key={s} className="f-sl-radio">
          <input type="radio" name="sl-stage" value={s} checked={value === s} onChange={() => onChange(s)} />
          {STAGE[s]}
        </label>
      ))}
    </fieldset>
  );
}

/** Phone-only action row under the timeline (M7): add a note · change stage. */
export function LeadPhoneActions({ onNote, onStage }: { onNote: () => void; onStage: () => void }) {
  return (
    <div className="f-sl-lphone f-sl-only-narrow">
      <Button variant="outline" onClick={onNote}><Icon name="plus" size={16} /> הערה</Button>
      <Button variant="outline" onClick={onStage} aria-haspopup="dialog">שנה שלב</Button>
    </div>
  );
}
