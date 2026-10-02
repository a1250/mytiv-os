"use client";

import Link from "next/link";
import type { Lead } from "@/lib/focus/contracts/sales";
import { personName } from "@/lib/focus/fixtures/people";
import { daysBetween, fmtDayMonth, fmtTime } from "@/lib/focus/format";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { VERIFICATION, VerificationTag } from "@/components/focus/ui/status";
import { isOpen, LeadValue, nextText, StageTag } from "./sales-parts";

/**
 * Leads list (handoff F1, mobile M7 phone 1): a real <table> on desktop/tablet (row header = the lead), cards under
 * 768px. A lead without a next action says so in red with an action to add one — never silently empty.
 */
export const lastContactText = (at: string | null, now: string) =>
  !at ? "טרם" : daysBetween(at, now) === 0 ? `היום ${fmtTime(at)}` : fmtDayMonth(at);

/** a lead with something today (a meeting / contact) is outlined on the phone list (M7) */
const isToday = (l: Lead, now: string) => !!l.lastContact && daysBetween(l.lastContact, now) === 0;

function LeadName({ lead, stretch }: { lead: Lead; stretch?: boolean }) {
  return lead.href
    ? <Link href={lead.href} className={cx("f-sl-lname", stretch && "f-sl-lname--stretch")}>{lead.name}</Link>
    : <b className="f-sl-lname">{lead.name}</b>;
}

function NextCell({ lead, onAddNext }: { lead: Lead; onAddNext: (l: Lead) => void }) {
  if (lead.next) return <span className="f-sl-next">{nextText(lead.next)}</span>;
  if (!isOpen(lead.stage)) return <span className="f-meta">{lead.stage === "won" ? "הפך ללקוח" : "סגור"}</span>;
  return (
    <span className="f-sl-next f-sl-next--none">
      <b>ללא פעולה הבאה</b>
      <Button variant="link" size="sm" className="f-sl-next__add" onClick={() => onAddNext(lead)} aria-label={`הוסף פעולה הבאה ל${lead.name}`}>הוסף</Button>
    </span>
  );
}

export function LeadTable({ leads, now, onAddNext }: { leads: Lead[]; now: string; onAddNext: (l: Lead) => void }) {
  return (
    <div className="f-sl-tablewrap f-sl-only-wide">
      <table className="f-sl-table f-sl-leads-table">
        <caption className="f-sr">לידים · {leads.length}</caption>
        <thead>
          <tr>
            <th scope="col">שם וחברה</th>
            <th scope="col" className="f-sl-col-wide">מקור</th>
            <th scope="col">שלב</th>
            <th scope="col">שווי משוער</th>
            <th scope="col" className="f-sl-col-mid">אחראי</th>
            <th scope="col">הפעולה הבאה</th>
            <th scope="col" className="f-sl-col-wide">קשר אחרון</th>
            <th scope="col" className="f-sl-col-wide">איכות מידע</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id}>
              <th scope="row" className="f-sl-cell-name">
                <span className="f-sl-who"><LeadName lead={l} /><span className="f-sl-sub">{l.company}</span></span>
              </th>
              <td className="f-sl-col-wide f-sl-soft">{l.source}</td>
              <td><StageTag stage={l.stage} /></td>
              <td><LeadValue reading={l.value} /></td>
              <td className="f-sl-col-mid">{personName(l.ownerId)}</td>
              <td><NextCell lead={l} onAddNext={onAddNext} /></td>
              <td className="f-sl-col-wide f-meta f-num">{lastContactText(l.lastContact, now)}</td>
              <td className="f-sl-col-wide"><VerificationTag state={l.quality.state} label={l.quality.label} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LeadCards({ leads, now, onAddNext }: { leads: Lead[]; now: string; onAddNext: (l: Lead) => void }) {
  return (
    <ul className="f-sl-cards f-sl-only-narrow" aria-label={`לידים · ${leads.length}`}>
      {leads.map((l) => {
        const hasValue = l.value.kind === "known" || l.value.kind === "estimated";
        const today = isToday(l, now);
        return (
          <li key={l.id} className={cx("f-sl-card", today && "f-sl-card--today")}>
            <div className="f-sl-card__top">
              <LeadName lead={l} stretch />
              <StageTag stage={l.stage} size="sm" />
            </div>
            <span className="f-sl-card__meta">
              {l.company} · {hasValue ? <LeadValue reading={l.value} showKnown={false} /> : <><span aria-hidden>{VERIFICATION[l.quality.state].glyph}</span> {l.quality.label}</>}
              {today && <span className="f-sr"> · יש קשר היום</span>}
            </span>
            {l.next ? (
              <span className="f-sl-card__next"><b>הבא:</b> {nextText(l.next)}</span>
            ) : isOpen(l.stage) ? (
              <span className="f-sl-card__next f-sl-card__next--none">
                ללא פעולה הבאה ·{" "}
                <button type="button" className="f-sl-card__add" onClick={() => onAddNext(l)} aria-label={`הוסף פעולה הבאה ל${l.name}`}>הוסף</button>
              </span>
            ) : (
              <span className="f-sl-card__next f-meta">{l.stage === "won" ? "הפך ללקוח" : "סגור"}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
