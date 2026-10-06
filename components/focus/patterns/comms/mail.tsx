"use client";

import Link from "@/components/focus/ui/link";
import { useId, useState, type ReactNode } from "react";
import type { DraftClaim, MailFilter, MailThread } from "@/lib/focus/contracts/comms";
import { daysBetween, fmtDayMonth, fmtTime } from "@/lib/focus/format";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { Dialog } from "@/components/focus/ui/dialog";
import { Checkbox } from "@/components/focus/ui/field";
import { Icon } from "@/components/focus/ui/icon";
import { Bdi } from "@/components/focus/ui/misc";
import { VerificationTag } from "@/components/focus/ui/status";
import { Chips } from "@/components/focus/ui/tabs";

/**
 * Mail patterns (handoff F6): thread list with search + filters, the message, an editable AI reply draft whose claims
 * stay highlighted while typing, the "what the draft relied on" list, and the send review (explicit confirmation —
 * there is no automatic sending).
 */

/** "08:41" today · "אתמול" · "29.9" */
export function fmtMailTime(at: string, now: string) {
  const d = daysBetween(at, now);
  if (d === 0) return fmtTime(at);
  if (d === 1) return "אתמול";
  return fmtDayMonth(at);
}

export function threadLinkLabel(t: MailThread) {
  return t.link.kind === "none" ? "לא משויך" : t.link.label;
}

/* ---------- thread list ---------- */

export function ThreadList({
  threads, total, selectedId, onSelect, query, onQuery, filter, onFilter, counts, syncLabel, onLink, now,
}: {
  threads: (MailThread & { unread: boolean })[]; total: number; selectedId: string | null; onSelect: (id: string) => void;
  query: string; onQuery: (q: string) => void; filter: MailFilter | null; onFilter: (f: MailFilter | null) => void;
  counts: Record<MailFilter, number>; syncLabel: string; onLink: (id: string) => void; now: string;
}) {
  const searchId = useId();
  return (
    <section className="f-cm-list" aria-labelledby="cm-mail-title">
      <div className="f-cm-list__head">
        <div className="f-cm-list__titlerow">
          <h1 id="cm-mail-title" className="f-cm-list__title">דואר</h1>
          <span className="f-meta-sm">{syncLabel}</span>
        </div>
        <div className="f-cm-search">
          <Icon name="search" size={16} className="f-cm-search__icon" />
          <label htmlFor={searchId} className="f-sr">חיפוש בדואר</label>
          <input id={searchId} type="search" className="f-cm-search__input" placeholder="חיפוש בדואר" value={query} onChange={(e) => onQuery(e.target.value)} />
        </div>
        <Chips
          label="סינון שיחות"
          className="f-cm-list__chips"
          value={filter ?? ([] as MailFilter[])}
          onChange={(k) => onFilter(filter === k ? null : k)}
          items={[
            { key: "unread", label: "לא נקרא", count: counts.unread },
            { key: "client", label: "משויך ללקוח", count: filter === "client" ? counts.client : undefined },
            { key: "lead", label: "לידים", count: filter === "lead" ? counts.lead : undefined },
          ]}
        />
      </div>
      <p className="f-sr" role="status">{threads.length === total ? `${total} שיחות` : `מוצגות ${threads.length} מתוך ${total} שיחות`}</p>
      {threads.length === 0 ? (
        <div className="f-cm-list__empty">
          <b>אין שיחות שמתאימות</b>
          <span className="f-meta">נסה מילה אחרת או בטל את הסינון.</span>
          <Button variant="neutral" size="sm" onClick={() => { onQuery(""); onFilter(null); }}>נקה חיפוש וסינון</Button>
        </div>
      ) : (
        <ul className="f-cm-threads">
          {threads.map((t) => {
            const selected = t.id === selectedId;
            return (
              <li key={t.id} className={cx("f-cm-thread", selected && "f-cm-thread--selected", t.muted && "f-cm-thread--muted")}>
                <button type="button" className="f-cm-thread__open" aria-current={selected ? "true" : undefined} onClick={() => onSelect(t.id)}>
                  <span className="f-cm-thread__top">
                    <span className={cx("f-cm-thread__from", t.unread && "f-cm-thread__from--unread")}>
                      {t.unread && <span className="f-cm-thread__dot" aria-hidden>●</span>}
                      {t.from.name}
                      {t.unread && <span className="f-sr"> · לא נקרא</span>}
                    </span>
                    <span className="f-cm-thread__time">{fmtMailTime(t.receivedAt, now)}</span>
                  </span>
                  <span className={cx("f-cm-thread__subject", t.unread && "f-cm-thread__subject--unread")}>{t.subject}</span>
                </button>
                <span className="f-cm-thread__meta">
                  {threadLinkLabel(t)}
                  {t.link.kind === "none" && <> · <button type="button" className="f-cm-thread__link f-hit" onClick={() => onLink(t.id)}>שייך<span className="f-sr"> את &quot;{t.subject}&quot; ללקוח</span></button></>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ---------- message ---------- */

export function MessageHeader({ thread, to, now, back, id }: { thread: MailThread; to: string; now: string; back?: ReactNode; id?: string }) {
  return (
    <div className="f-cm-msghead">
      {back}
      <h2 id={id} className="f-cm-msghead__subject">{thread.subject}</h2>
      <span className="f-cm-msghead__meta">
        {thread.from.name} · <Bdi>{thread.from.address}</Bdi> · אל {to} · {daysBetween(thread.receivedAt, now) === 0 ? "היום " : ""}{fmtMailTime(thread.receivedAt, now)}
      </span>
    </div>
  );
}

export function MessageBody({ lines }: { lines: string[] }) {
  return (
    <div className="f-cm-msg">
      {lines.map((l, i) => <p key={i} className="f-cm-msg__line">{l}</p>)}
    </div>
  );
}

/* ---------- editable draft with live claim highlights ---------- */

type Seg = { text: string; claim?: DraftClaim };
export function claimSegments(text: string, claims: DraftClaim[]): Seg[] {
  const hits = claims.map((c) => ({ c, i: text.indexOf(c.phrase) })).filter((h) => h.i >= 0).sort((a, b) => a.i - b.i);
  const out: Seg[] = [];
  let pos = 0;
  for (const h of hits) {
    if (h.i < pos) continue;
    if (h.i > pos) out.push({ text: text.slice(pos, h.i) });
    out.push({ text: h.c.phrase, claim: h.c });
    pos = h.i + h.c.phrase.length;
  }
  out.push({ text: text.slice(pos) });
  return out;
}

/**
 * A real <textarea> over a mirror layer that paints the claim highlights, so the user types normally and a claim's
 * highlight disappears when its phrase is edited away. Meaning is never colour-only: the legend and the claim list
 * carry symbol + word.
 */
export function DraftEditor({ text, onChange, claims, labelledBy, describedBy, disabled }: {
  text: string; onChange: (t: string) => void; claims: DraftClaim[]; labelledBy: string; describedBy?: string; disabled?: boolean;
}) {
  const segs = claimSegments(text, claims);
  return (
    <div className={cx("f-cm-draft", disabled && "f-cm-draft--busy")}>
      <div className="f-cm-draft__mirror" aria-hidden>
        {segs.map((s, i) => s.claim
          ? <mark key={i} className={cx("f-cm-mark", `f-cm-mark--${s.claim.verification}`)}>{s.text}</mark>
          : <span key={i}>{s.text}</span>)}
        {"​"}
      </div>
      <textarea
        className="f-cm-draft__input"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        readOnly={disabled}
        spellCheck={false}
        dir="rtl"
      />
    </div>
  );
}

/** Legend under the draft: what the two highlight colours mean (symbol + word). */
export function DraftLegend({ id, claims, text }: { id: string; claims: DraftClaim[]; text: string }) {
  const present = claims.filter((c) => text.includes(c.phrase));
  const toCheck = present.filter((c) => c.verification !== "verified").length;
  return (
    <p id={id} className="f-cm-legend">
      <span className="f-cm-legend__item"><span className="f-cm-legend__sw f-cm-legend__sw--verified" aria-hidden />✓ אומת</span>
      <span className="f-cm-legend__item"><span className="f-cm-legend__sw f-cm-legend__sw--unverified" aria-hidden />◆ לבדיקה</span>
      <span className="f-meta-sm">{present.length === 0 ? "אין בטיוטה טענות מסומנות." : `${present.length} טענות מסומנות · ${toCheck === 0 ? "כולן אומתו" : `${toCheck} לבדיקה`}`}</span>
    </p>
  );
}

/** "על מה הטיוטה הסתמכה" — each claim with its verification and basis; a claim edited out of the text says so. */
export function ClaimList({ claims, text }: { claims: DraftClaim[]; text: string }) {
  if (claims.length === 0) return <p className="f-meta">הטיוטה לא כוללת נתונים שדורשים אימות.</p>;
  return (
    <ul className="f-cm-claims">
      {claims.map((c) => {
        const present = text.includes(c.phrase);
        return (
          <li key={c.id} className={cx("f-cm-claim", !present && "f-cm-claim--gone")}>
            <span className="f-cm-claim__top">
              <b className="f-cm-claim__label">{c.label}</b>
              <VerificationTag state={c.verification} label={c.verification === "verified" ? undefined : c.verification === "partial" ? "אומת חלקית" : "לבדיקה"} />
            </span>
            <span className="f-cm-claim__basis">
              {c.basis}
              {c.source?.href && <> · <Link href={c.source.href} className="f-link">{c.source.label}</Link></>}
            </span>
            {!present && <span className="f-cm-claim__gone">הוסר מהטיוטה</span>}
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- send review (explicit confirmation) ---------- */

export function SendReviewDialog({
  open, onClose, onConfirm, to, from, subject, text, claims, via,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void; to: { name: string; address: string }; from: { name: string; address: string };
  subject: string; text: string; claims: DraftClaim[]; via: string;
}) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="cm-send-title" className="f-cm-modal">
      {open && <SendReviewBody onClose={onClose} onConfirm={onConfirm} to={to} from={from} subject={subject} text={text} claims={claims} via={via} />}
    </Dialog>
  );
}

function SendReviewBody({ onClose, onConfirm, to, from, subject, text, claims, via }: Omit<Parameters<typeof SendReviewDialog>[0], "open">) {
  const [confirmed, setConfirmed] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const pending = claims.filter((c) => c.verification !== "verified" && text.includes(c.phrase));
  const empty = text.trim().length === 0;
  return (
    <div className="f-cm-dlg">
      <h2 id="cm-send-title" className="f-cm-dlg__title">לפני שליחה: בדיקה אחרונה</h2>
      <p className="f-cm-dlg__text">המייל יישלח רק אחרי האישור שלך, ויסומן כנשלח רק אחרי ש־{via} יאשר.</p>
      <dl className="f-cm-review">
        <div className="f-cm-review__row"><dt>אל</dt><dd>{to.name} · <Bdi>{to.address}</Bdi></dd></div>
        <div className="f-cm-review__row"><dt>מהחשבון</dt><dd>{from.name} · <Bdi>{from.address}</Bdi> · דרך {via}</dd></div>
        <div className="f-cm-review__row"><dt>נושא</dt><dd>Re: {subject}</dd></div>
        <div className="f-cm-review__row f-cm-review__row--body"><dt>מה יישלח</dt><dd><pre className="f-cm-review__text">{text}</pre></dd></div>
      </dl>
      {pending.length > 0 && (
        <ul className="f-cm-review__checks" aria-label="פרטים שלא אומתו">
          {pending.map((c) => <li key={c.id}><span aria-hidden>◆</span> {c.label}: {c.basis}</li>)}
        </ul>
      )}
      {empty ? (
        <p className="f-field__error" role="alert"><span aria-hidden>!</span>הטיוטה ריקה. אין מה לשלוח.</p>
      ) : (
        <Checkbox checked={confirmed} onChange={(v) => { setConfirmed(v); setAttempted(false); }} aria-describedby={attempted && !confirmed ? "cm-send-err" : undefined}>
          {pending.length > 0 ? "בדקתי את הפרטים המסומנים ואני מאשר/ת לשלוח את המייל הזה" : "בדקתי ואני מאשר/ת לשלוח את המייל הזה"}
        </Checkbox>
      )}
      {attempted && !confirmed && !empty && <span id="cm-send-err" className="f-field__error" role="alert"><span aria-hidden>!</span>יש לסמן את תיבת האישור לפני השליחה.</span>}
      <div className="f-cm-dlg__actions">
        <Button variant="danger" aria-disabled={!confirmed || empty ? true : undefined} onClick={() => { if (!confirmed || empty) { setAttempted(true); return; } onConfirm(); }}>שלח דרך {via}</Button>
        <Button variant="neutral" onClick={onClose}>חזור לעריכה</Button>
      </div>
    </div>
  );
}
